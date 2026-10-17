import { getHealth, getSpeechToken, translate } from './api'
import { isStandalone } from './localSpeech'
import { beginCapture } from './audioSession'

/**
 * リアルタイムの音声認識・音声翻訳（同時通訳と、翻訳画面の音声入力）。
 *
 * 1. Azure（推奨）… サーバーから有効期限10分の一時トークンをもらい、ブラウザの Speech SDK で Azure に直接つなぐ。
 *    話している途中から文字起こしと訳が出る（音声翻訳）。キーは端末に渡さない。
 * 2. 端末の音声認識 … Azure が使えないとき。Safari（タブ）・Chrome の SpeechRecognition で文字起こしし、
 *    区切りごとに翻訳 API で訳す。iPhone のホーム画面アプリでは使えない。
 *
 * 送るのは話した音声と、その文字起こしだけ（学習の記録は送らない）。
 */
export type SpeechLang = 'ja-JP' | 'en-US'
export type TargetLang = 'en' | 'ja'
export type Engine = 'azure' | 'browser'

export interface LiveHandlers {
  /** 確定前の途中経過。訳は Azure なら途中でも、端末の認識なら少し遅れて届く */
  onPartial: (text: string, translation?: string) => void
  /** ひと区切りの確定（文の終わり・短い無音） */
  onFinal: (text: string, translation?: string) => void
  onError: (message: string) => void
  /** 認識が止まった（自分で止めた・エラー） */
  onEnd?: () => void
}

export interface LiveOptions extends LiveHandlers {
  lang: SpeechLang
  /** 訳す先。省略すると文字起こしだけ */
  translateTo?: TargetLang
}

export interface LiveSession {
  engine: Engine
  stop: () => Promise<void>
}

// ───────── 端末の音声認識（Web Speech API） ─────────

interface RecResult {
  isFinal: boolean
  0: { transcript: string }
}
type RecCtor = new () => {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecResult> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function recCtor(): RecCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/** 端末の音声認識が使えるか（iPhone のホーム画面アプリでは存在しても動かないので使わない） */
export function browserRecognitionUsable(): boolean {
  return !!recCtor() && !isStandalone()
}

/** 使える方式。どちらも使えなければ null（録音して文字起こしする方式にする） */
export async function liveEngine(): Promise<Engine | null> {
  const h = await getHealth()
  if (h?.realtime) return 'azure'
  if (browserRecognitionUsable()) return 'browser'
  return null
}

const fromOf = (lang: SpeechLang): TargetLang => (lang === 'ja-JP' ? 'ja' : 'en')

function startBrowser(o: LiveOptions): LiveSession {
  const C = recCtor()
  if (!C) throw new Error('この環境では音声認識を使えません')
  const rec = new C()
  rec.lang = o.lang
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  let stopped = false
  let ended = false
  const endCapture = beginCapture()
  let restarts = 0
  let restartWindow = Date.now()
  /** 確定した区切りの翻訳は順番どおりに返す */
  let chain: Promise<void> = Promise.resolve()
  /** 途中経過の翻訳（間引き）。確定したら古い途中訳は捨てる */
  let partialSeq = 0
  let lastPartialAt = 0
  let partialBusy = false

  const end = () => {
    if (ended) return
    ended = true
    endCapture()
    o.onEnd?.()
  }

  const finalize = (text: string) => {
    const t = text.trim()
    if (!t) return
    partialSeq++
    const to = o.translateTo
    chain = chain.then(async () => {
      if (!to) return o.onFinal(t)
      try {
        const r = await translate(t, to, fromOf(o.lang))
        o.onFinal(t, r.text)
      } catch {
        o.onFinal(t)
      }
    })
  }

  const partial = (text: string) => {
    o.onPartial(text)
    const to = o.translateTo
    if (!to || partialBusy || Date.now() - lastPartialAt < 1200 || text.length < 6) return
    partialBusy = true
    lastPartialAt = Date.now()
    const my = ++partialSeq
    translate(text, to, fromOf(o.lang))
      .then((r) => {
        if (my === partialSeq && !stopped) o.onPartial(text, r.text)
      })
      .catch(() => undefined)
      .finally(() => {
        partialBusy = false
      })
  }

  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalize(r[0].transcript)
      else interim += r[0].transcript
    }
    if (interim.trim()) partial(interim.trim())
  }
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return
    stopped = true
    o.onError(
      e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'マイクを使用できません（ブラウザの設定でマイクを許可してください）'
        : e.error === 'network'
          ? '音声認識に接続できません（通信状況を確認してください）'
          : `音声認識でエラーが発生しました（${e.error}）`,
    )
  }
  rec.onend = () => {
    // Safari・Chrome は無音が続くと自動で止まるので、止めていなければ続きを聞く（1分に10回まで）
    if (!stopped) {
      if (Date.now() - restartWindow > 60_000) {
        restartWindow = Date.now()
        restarts = 0
      }
      if (restarts++ < 10) {
        try {
          rec.start()
          return
        } catch {
          /* 開始できなければ終了 */
        }
      }
    }
    void chain.then(end)
  }
  try {
    rec.start()
  } catch (e) {
    endCapture()
    throw e
  }
  return {
    engine: 'browser',
    stop: async () => {
      stopped = true
      try {
        rec.stop()
      } catch {
        end()
      }
      await chain
    },
  }
}

// ───────── Azure（Speech SDK） ─────────

function azureMessage(details: string): string {
  if (/NotAllowed|Permission|microphone|getUserMedia/i.test(details)) return 'マイクを使用できません（設定でマイクを許可してください）'
  if (/\b(401|403)\b|Authentication|Unauthorized/i.test(details)) return '音声サービスの認証に失敗しました。しばらくしてからもう一度お試しください'
  if (/quota|429|throttl/i.test(details)) return '音声サービスの無料枠または回数制限に達しました'
  if (/1006|WebSocket|network|connect/i.test(details)) return '音声サービスに接続できません（通信状況を確認してください）'
  return '音声認識でエラーが発生しました'
}

async function startAzure(o: LiveOptions): Promise<LiveSession> {
  const [sdk, tok] = await Promise.all([import('microsoft-cognitiveservices-speech-sdk'), getSpeechToken()])
  let ended = false
  let timer: ReturnType<typeof setInterval> | undefined
  const endCapture = beginCapture()
  const end = () => {
    if (ended) return
    ended = true
    clearInterval(timer)
    endCapture()
    o.onEnd?.()
  }

  const audio = sdk.AudioConfig.fromDefaultMicrophoneInput()
  const target = o.translateTo
  let rec: InstanceType<typeof sdk.TranslationRecognizer> | InstanceType<typeof sdk.SpeechRecognizer>

  if (target) {
    const cfg = sdk.SpeechTranslationConfig.fromAuthorizationToken(tok.token, tok.region)
    cfg.speechRecognitionLanguage = o.lang
    cfg.addTargetLanguage(target)
    // 区切りの無音を短めにして、訳が早く確定するように
    cfg.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, '600')
    const r = new sdk.TranslationRecognizer(cfg, audio)
    r.recognizing = (_s, e) => o.onPartial(e.result.text, e.result.translations?.get(target))
    r.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.TranslatedSpeech && e.result.text) o.onFinal(e.result.text, e.result.translations?.get(target))
    }
    r.canceled = (_s, e) => {
      if (e.reason === sdk.CancellationReason.Error) o.onError(azureMessage(e.errorDetails ?? ''))
      end()
    }
    r.sessionStopped = () => end()
    rec = r
  } else {
    const cfg = sdk.SpeechConfig.fromAuthorizationToken(tok.token, tok.region)
    cfg.speechRecognitionLanguage = o.lang
    cfg.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, '600')
    const r = new sdk.SpeechRecognizer(cfg, audio)
    r.recognizing = (_s, e) => o.onPartial(e.result.text)
    r.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) o.onFinal(e.result.text)
    }
    r.canceled = (_s, e) => {
      if (e.reason === sdk.CancellationReason.Error) o.onError(azureMessage(e.errorDetails ?? ''))
      end()
    }
    r.sessionStopped = () => end()
    rec = r
  }

  // 一時トークンは10分で切れるので、長く話し続けるときは途中で差し替える
  timer = setInterval(() => {
    getSpeechToken(true)
      .then((t) => {
        rec.authorizationToken = t.token
      })
      .catch(() => undefined)
  }, 8 * 60_000)

  await new Promise<void>((resolve, reject) =>
    rec.startContinuousRecognitionAsync(resolve, (err) => {
      rec.close()
      clearInterval(timer)
      endCapture()
      reject(new Error(azureMessage(String(err))))
    }),
  )

  const close = () => {
    try {
      rec.close()
      audio.close()
    } catch {
      /* 既に閉じている */
    }
    end()
  }
  return {
    engine: 'azure',
    stop: () =>
      new Promise<void>((resolve) => {
        if (ended) {
          close()
          return resolve()
        }
        rec.stopContinuousRecognitionAsync(
          () => {
            close()
            resolve()
          },
          () => {
            close()
            resolve()
          },
        )
      }),
  }
}

/** Azure を使うときは、SDK と一時トークンを先に用意しておく（ボタンを押してからの待ち時間を減らす） */
export function warmLive(engine: Engine | null | undefined) {
  if (engine !== 'azure') return
  void import('microsoft-cognitiveservices-speech-sdk').catch(() => undefined)
  void getSpeechToken().catch(() => undefined)
}

/** 認識（と翻訳）を始める。どちらの方式も使えなければ例外 */
export async function startLive(o: LiveOptions): Promise<LiveSession> {
  const engine = await liveEngine()
  if (engine === 'azure') return startAzure(o)
  if (engine === 'browser') return startBrowser(o)
  throw new Error('リアルタイムの音声認識を使えません')
}
