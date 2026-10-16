import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Play, Loader2, Info } from 'lucide-react'
import { assessPronunciation, type PronResult, type PronWord, ApiError } from '@/lib/api'
import { recorderAvailable, WavRecorder, type Recording } from '@/lib/recorder'
import {
  compareWords,
  isStandalone,
  localRecognitionAvailable,
  startLocalRecognition,
  type LocalSession,
} from '@/lib/localSpeech'
import { useHealth } from '@/lib/hooks'
import { bumpDaily, db } from '@/lib/db'
import { speak, type Accent } from '@/lib/tts'
import { plain } from '@/lib/vocab'
import { Button, Card, ProgressBar, cx } from './ui'

export type Engine = 'azure' | 'local' | 'none'

export function useSpeechEngine(): Engine | undefined {
  const h = useHealth()
  if (h === undefined) return undefined
  if (h?.speech) return 'azure'
  // iOSのホーム画面アプリでは webkitSpeechRecognition があっても動かない
  if (localRecognitionAvailable() && !isStandalone()) return 'local'
  return 'none'
}

const ENGINE_LABEL: Record<Engine, string> = {
  azure: 'Azure発音評価（単語・音素ごとに採点）',
  local: '端末の音声認識（簡易判定）',
  none: '録音して聞き比べ（自己評価）',
}

/** 端末の音声認識のエラーコード → 表示メッセージ */
function localErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
      return 'マイク・音声認識の使用が許可されていません（設定 > Safari > マイク / 音声認識）。録音して聞き比べるモードに切り替えました'
    case 'service-not-allowed':
      return 'この環境では端末の音声認識を利用できないため、録音して聞き比べるモードに切り替えました'
    case 'audio-capture':
      return 'マイクを使用できません。他のアプリがマイクを使っていないか確認してください'
    case 'network':
      return '音声認識に接続できませんでした。通信状況を確認してください'
    default:
      return `音声認識でエラーが発生しました（${code}）`
  }
}

function playUrl(url: string) {
  new Audio(url).play().catch(() => undefined)
}

type RecState = 'idle' | 'starting' | 'recording' | 'scoring'

/** 録音 → 発音評価 */
export function SpeakCheck({
  text,
  accent = 'en-US',
  source = 'practice',
  onScored,
  compact,
}: {
  text: string
  accent?: Accent
  source?: string
  onScored?: (r: PronResult) => void
  compact?: boolean
}) {
  const detected = useSpeechEngine()
  // 端末の音声認識が使えないと分かった場合は、以後「録音して聞き比べ」に切り替える
  const [engineOverride, setEngineOverride] = useState<Engine | null>(null)
  const engine = detected === undefined ? undefined : (engineOverride ?? detected)
  const [state, setState] = useState<RecState>('idle')
  const [rec, setRec] = useState<Recording | null>(null)
  const [result, setResult] = useState<PronResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const recorder = useRef<WavRecorder | null>(null)
  /** getUserMedia 待ちの録音（連打・アンマウント・文の切替でのリーク防止） */
  const pending = useRef<WavRecorder | null>(null)
  const local = useRef<LocalSession | null>(null)
  const raf = useRef(0)
  const alive = useRef(true)
  /** 文（text）が変わるたびに増える。古い録音・採点の結果を捨てるために使う */
  const session = useRef(0)
  const stopRef = useRef<() => Promise<void>>(async () => undefined)
  const target = plain(text)

  const isCurrent = (sid: number) => alive.current && session.current === sid

  /** 進行中の録音・認識をすべて破棄する */
  const abortAll = () => {
    cancelAnimationFrame(raf.current)
    pending.current?.cancel()
    pending.current = null
    recorder.current?.cancel()
    recorder.current = null
    local.current?.abort()
    local.current = null
  }

  // 文が変わったら（RolePlayの「次へ」、「別の文にする」など）録音中でも破棄して初期状態へ
  useEffect(() => {
    session.current++
    abortAll()
    setState('idle')
    setLevel(0)
    setResult(null)
    setRec(null)
    setError(null)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      session.current++
      abortAll()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 録音URLは差し替え時・アンマウント時に解放する
  useEffect(() => {
    if (!rec) return
    return () => URL.revokeObjectURL(rec.url)
  }, [rec])

  const lang = accent === 'en-GB' ? 'en-GB' : 'en-US'

  const handleLocalError = (e: unknown) => {
    const code = e instanceof Error ? e.message : String(e)
    if (code === 'aborted') return
    setError(localErrorMessage(code))
    if (code === 'service-not-allowed' || code === 'not-allowed') setEngineOverride('none')
  }

  const start = async () => {
    if (state !== 'idle' || pending.current || recorder.current || local.current) return
    setError(null)
    setResult(null)
    const sid = session.current
    if (engine === 'local') {
      try {
        const sess = startLocalRecognition(lang)
        local.current = sess
        setState('recording')
        // 開始直後の失敗（権限なし・ホーム画面アプリ等）はすぐ表示して待機状態へ戻す
        sess.result.catch((e: unknown) => {
          if (local.current !== sess || !isCurrent(sid)) return
          local.current = null
          handleLocalError(e)
          setState('idle')
        })
      } catch (e) {
        local.current = null
        setError(String((e as Error).message ?? e))
        setState('idle')
      }
      return
    }
    if (!recorderAvailable) {
      setError('この端末では録音できません')
      return
    }
    const r = new WavRecorder()
    pending.current = r
    r.onAutoStop = () => void stopRef.current()
    setState('starting')
    try {
      // r.start() はこのタップ処理の中で同期的に AudioContext を作る（iOS対策）
      await r.start()
    } catch (e) {
      if (pending.current === r) pending.current = null
      if (!isCurrent(sid)) return
      setError(
        e instanceof Error && e.name === 'NotAllowedError'
          ? 'マイクの使用を許可してください（設定 > Safari > マイク）'
          : String((e as Error).message ?? e),
      )
      setState('idle')
      return
    }
    if (pending.current === r) pending.current = null
    if (!isCurrent(sid)) {
      // 待っている間にアンマウント／文の切替があった
      r.cancel()
      return
    }
    recorder.current = r
    setState('recording')
    const tick = () => {
      setLevel(r.level())
      raf.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const finish = async (r: PronResult, sid: number) => {
    if (isCurrent(sid)) {
      setResult(r)
      onScored?.(r)
    }
    await db.speaking.add({ at: Date.now(), text: target, source, pron: r.pron, accuracy: r.accuracy, fluency: r.fluency, completeness: r.completeness })
    await bumpDaily({ speaking: 1, seconds: 30 })
  }

  const stop = async () => {
    cancelAnimationFrame(raf.current)
    const sid = session.current
    const sess = local.current
    if (sess) {
      local.current = null
      setState('scoring')
      sess.stop()
      try {
        const heard = await sess.result
        if (!isCurrent(sid)) return
        await finish(compareWords(target, heard), sid)
      } catch (e) {
        if (!isCurrent(sid)) return
        handleLocalError(e)
      }
      if (isCurrent(sid)) setState('idle')
      return
    }
    const r = recorder.current
    if (!r) return
    recorder.current = null
    setLevel(0)
    const recording = await r.stop()
    if (!isCurrent(sid)) {
      URL.revokeObjectURL(recording.url)
      return
    }
    setRec(recording)
    if (recording.seconds < 0.4) {
      setError('声が聞き取れませんでした。もう少し大きな声で話してみてください')
      setState('idle')
      return
    }
    if (engine === 'azure') {
      setState('scoring')
      try {
        await finish(await assessPronunciation(recording.wav, target, lang), sid)
      } catch (e) {
        if (isCurrent(sid)) setError(e instanceof ApiError ? e.message : '採点に失敗しました。通信状況を確認してください')
      }
    } else {
      await bumpDaily({ speaking: 1, seconds: 20 })
    }
    if (isCurrent(sid)) setState('idle')
  }

  // 28秒の自動停止タイマーからは常に最新の stop を呼ぶ
  useEffect(() => {
    stopRef.current = stop
  })

  if (engine === undefined) return <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        {state === 'recording' ? (
          <button
            onClick={stop}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-ng text-white shadow-lg active:scale-95"
            aria-label="録音停止"
          >
            {/* 入力音量に合わせて広がる輪（animate-ping は transform を上書きするので、音量表示とは別の要素にする） */}
            <span
              className="absolute inset-0 rounded-full bg-ng/30 transition-transform duration-100"
              style={{ transform: `scale(${1 + Math.min(1, level) * 0.5})` }}
            />
            <span className="absolute inset-0 animate-ping rounded-full bg-ng/25" />
            <Square className="relative h-8 w-8 fill-current" />
          </button>
        ) : (
          <button
            onClick={start}
            disabled={state !== 'idle'}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-grad text-white shadow-glow transition active:scale-95 disabled:opacity-60"
            aria-label="録音開始"
          >
            {state === 'idle' ? <Mic className="h-9 w-9" /> : <Loader2 className="h-8 w-8 animate-spin" />}
          </button>
        )}
        {rec && state === 'idle' && (
          <button
            onClick={() => playUrl(rec.url)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink"
            aria-label="自分の録音を再生"
          >
            <Play className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="text-center text-xs text-muted">
        {state === 'recording'
          ? '話し終わったら停止ボタン'
          : state === 'scoring'
            ? '採点中…'
            : state === 'starting'
              ? 'マイクを準備中…'
              : 'マイクを押して英文を読み上げよう'}
      </p>
      {!compact && (
        <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted">
          <Info className="h-3 w-3" />
          {ENGINE_LABEL[engine]}
        </p>
      )}
      {error && <p className="rounded-2xl bg-ng/10 p-3 text-sm text-ng">{error}</p>}
      {engine === 'none' && rec && !result && (
        <Card className="text-sm">
          <p>録音を再生して、お手本と比べてみよう。リズム・強く読む語・語尾の音に注目！</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => speak(target, { accent })}>お手本</Button>
            <Button variant="secondary" onClick={() => playUrl(rec.url)}>自分の声</Button>
          </div>
          <p className="mt-2 text-[11px] text-muted">設定画面でAzure Speechを有効にすると自動採点できます。</p>
        </Card>
      )}
      {result && <PronResultView result={result} accent={accent} />}
    </div>
  )
}

export function PronResultView({ result, accent }: { result: PronResult; accent: Accent }) {
  const [sel, setSel] = useState<PronWord | null>(null)
  const color = (s: number) => (s >= 80 ? 'text-ok' : s >= 60 ? 'text-warn' : 'text-ng')
  const bar = (s: number) => (s >= 80 ? 'bg-ok' : s >= 60 ? 'bg-warn' : 'bg-ng')
  const rows: [string, number | undefined][] = [
    ['正確さ', result.accuracy],
    ['流暢さ', result.fluency],
    ['完全さ', result.completeness],
    ['抑揚・リズム', result.prosody],
  ]
  return (
    <Card className="animate-pop">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className={cx('text-4xl font-extrabold', color(result.pron))}>{Math.round(result.pron)}</p>
          <p className="text-[11px] text-muted">総合</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {rows
            .filter(([k, v]) => v !== undefined && (result.engine === 'azure' || k === '正確さ' || k === '完全さ'))
            .map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-20 text-[11px] text-muted">{k}</span>
                <ProgressBar value={v ?? 0} max={100} className="flex-1" color={bar(v ?? 0)} />
                <span className="w-7 text-right text-[11px] font-bold">{Math.round(v ?? 0)}</span>
              </div>
            ))}
        </div>
      </div>
      {result.text && <p className="mt-3 text-[12px] text-muted">認識結果：{result.text}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {result.words.map((w, i) => (
          <button
            key={i}
            onClick={() => {
              setSel(w)
              speak(w.word, { accent })
            }}
            className={cx(
              'rounded-xl border px-2 py-1 text-[14px] font-semibold',
              w.error === 'Omission' ? 'border-line text-muted line-through' : w.error === 'Insertion' ? 'border-dashed border-line text-muted' : 'border-line',
              w.error !== 'Omission' && color(w.accuracy),
            )}
          >
            {w.word}
          </button>
        ))}
      </div>
      {sel && sel.phonemes.length > 0 && (
        <div className="mt-3 rounded-2xl bg-surface-2 p-3">
          <p className="text-[12px] font-bold text-muted">「{sel.word}」の音素ごとの評価</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sel.phonemes.map((p, i) => (
              <span key={i} className={cx('ipa rounded-md bg-surface px-1.5 py-0.5 text-[13px] font-bold', color(p.score))}>
                {p.p} <span className="text-[10px] opacity-70">{Math.round(p.score)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted">単語をタップすると音声と音素ごとの評価を確認できます。緑≧80、黄≧60、赤＜60。</p>
    </Card>
  )
}
