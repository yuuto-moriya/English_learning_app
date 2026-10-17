import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Check, Copy, Loader2, Mic, Square, Trash2 } from 'lucide-react'
import { PageHeader, iconBtn } from '@/components/Layout'
import { Segmented, Toggle, cx } from '@/components/ui'
import { ApiError, transcribe, translate } from '@/lib/api'
import { useHealth, useWakeLock } from '@/lib/hooks'
import { liveEngine, startLive, warmLive, type Engine, type LiveSession, type SpeechLang, type TargetLang } from '@/lib/live'
import { play } from '@/lib/sounds'
import { useSettings } from '@/lib/settings'
import { accentInfo } from '@/lib/accents'
import { primeAudio, speak, speakJa, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { WavRecorder } from '@/lib/recorder'

type Mode = 'ja-en' | 'en-ja' | 'talk'

interface Segment {
  id: number
  lang: SpeechLang
  src: string
  tr?: string
}

const LABEL: Record<SpeechLang, string> = { 'ja-JP': '日本語', 'en-US': 'English' }
const targetOf = (lang: SpeechLang): TargetLang => (lang === 'ja-JP' ? 'en' : 'ja')

/**
 * 同時通訳。話しているそばから文字起こしと訳を表示する。
 * - 日本語→英語／英語→日本語：話し続けると、区切りごとに訳が流れていく（講演・打ち合わせ向け）
 * - 会話：日本語と英語のボタンを交互に押して話す。話し終えると訳を読み上げる（対面の会話向け）
 * Azure が使えれば音声翻訳でリアルタイムに、なければ端末の音声認識＋翻訳、それもなければ録音して訳す。
 */
export default function Interpreter() {
  const health = useHealth()
  const s = useSettings()
  const [mode, setMode] = useState<Mode>('ja-en')
  const [engine, setEngine] = useState<Engine | null | undefined>(undefined)
  const [listening, setListening] = useState<SpeechLang | null>(null)
  const [busy, setBusy] = useState(false)
  const [segments, setSegments] = useState<Segment[]>([])
  const [partial, setPartial] = useState<{ lang: SpeechLang; src: string; tr?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const session = useRef<LiveSession | null>(null)
  const rec = useRef<WavRecorder | null>(null)
  const nextId = useRef(1)
  const bottom = useRef<HTMLDivElement>(null)
  /** 読み上げ待ちの訳。会話モードでは話し終えてから読む */
  const queue = useRef<{ text: string; to: TargetLang }[]>([])
  const speaking = useRef(false)
  const listeningRef = useRef<SpeechLang | null>(null)
  const modeRef = useRef<Mode>(mode)
  modeRef.current = mode
  const mounted = useRef(true)
  useWakeLock(!!listening)

  useEffect(() => {
    void liveEngine().then((e) => {
      setEngine(e)
      warmLive(e)
    })
  }, [health])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      void session.current?.stop()
      session.current = null
      rec.current?.cancel()
      rec.current = null
      stopSpeaking()
    }
  }, [])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [segments, partial])

  const flushSpeech = async () => {
    if (speaking.current) return
    // 会話モードは、マイクが止まってから読む（読み上げをマイクが拾わないように）
    if (modeRef.current === 'talk' && listeningRef.current) return
    const item = queue.current.shift()
    if (!item) return
    speaking.current = true
    primeAudio()
    if (item.to === 'en') await speak(item.text, { accent: s.accent })
    else await speakJa(item.text)
    speaking.current = false
    if (mounted.current) void flushSpeech()
  }

  const addFinal = (lang: SpeechLang, src: string, tr?: string) => {
    if (!mounted.current) return
    setPartial(null)
    setSegments((xs) => [...xs, { id: nextId.current++, lang, src, tr }])
    if (tr && useSettings.getState().speakTranslation) {
      queue.current.push({ text: tr, to: targetOf(lang) })
      void flushSpeech()
    }
  }

  const stop = async () => {
    const was = listeningRef.current
    listeningRef.current = null
    setListening(null)
    if (session.current) {
      const sess = session.current
      session.current = null
      play('stop')
      await sess.stop()
    } else if (rec.current && was) {
      // 録音方式：止めてから文字起こし → 翻訳
      const r = rec.current
      rec.current = null
      play('stop')
      setBusy(true)
      try {
        const out = await r.stop()
        URL.revokeObjectURL(out.url)
        const text = await transcribe(out.wav, was)
        if (text) {
          let tr: string | undefined
          try {
            tr = (await translate(text, targetOf(was), was === 'ja-JP' ? 'ja' : 'en')).text
          } catch {
            tr = undefined
          }
          addFinal(was, text, tr)
        }
      } catch (e) {
        if (mounted.current) setError(e instanceof ApiError ? e.message : '音声を文字にできませんでした')
      } finally {
        if (mounted.current) setBusy(false)
      }
    }
    if (mounted.current) setPartial(null)
    void flushSpeech()
  }

  const start = async (lang: SpeechLang) => {
    if (listeningRef.current) await stop()
    setError(null)
    warmUpSpeech()
    stopSpeaking()
    queue.current = []
    listeningRef.current = lang
    setListening(lang)
    play('start')
    try {
      // 方式の確認が終わる前に押されたときは、ここで確かめる
      const eng = engine === undefined ? await liveEngine() : engine
      if (eng) {
        session.current = await startLive({
          lang,
          translateTo: targetOf(lang),
          // 途中の訳は、新しい訳が届くまで直前のものを出しておく（ちらつかないように）
          onPartial: (src, tr) => mounted.current && setPartial((p) => ({ lang, src, tr: tr ?? p?.tr })),
          onFinal: (src, tr) => addFinal(lang, src, tr),
          onError: (msg) => mounted.current && setError(msg),
          onEnd: () => {
            if (listeningRef.current === lang && mounted.current) {
              listeningRef.current = null
              setListening(null)
              setPartial(null)
            }
          },
        })
        if (!mounted.current) void session.current?.stop()
      } else {
        const r = new WavRecorder()
        r.onAutoStop = () => void stop()
        await r.start()
        rec.current = r
      }
    } catch (e) {
      listeningRef.current = null
      setListening(null)
      setError(e instanceof Error ? e.message : 'マイクを使用できません')
    }
  }

  const changeMode = async (m: Mode) => {
    if (listeningRef.current) await stop()
    setMode(m)
  }

  const copyAll = async () => {
    const text = segments.map((x) => `${x.src}\n${x.tr ?? ''}`).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('コピーできませんでした')
    }
  }

  const available = engine !== null || !!health?.speech
  const engineNote =
    engine === 'azure'
      ? 'Azure の音声翻訳で、話している途中から訳します'
      : engine === 'browser'
        ? '端末の音声認識で文字にし、区切りごとに訳します'
        : engine === null && health?.speech
          ? '話し終えてから文字にして訳します（リアルタイムにするには Azure Speech のリージョン設定が必要です）'
          : ''
  const continuousLang: SpeechLang = mode === 'en-ja' ? 'en-US' : 'ja-JP'

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="同時通訳"
        back="/translate"
        right={
          segments.length > 0 && (
            <>
              <button aria-label="すべてコピー" onClick={copyAll} className={iconBtn}>
                {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                aria-label="消去"
                onClick={() => {
                  setSegments([])
                  setPartial(null)
                }}
                className={iconBtn}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )
        }
      />
      <div className="flex flex-1 flex-col px-4">
        <Segmented
          value={mode}
          onChange={(m) => void changeMode(m)}
          options={[
            { value: 'ja-en', label: '日本語→英語' },
            { value: 'en-ja', label: '英語→日本語' },
            { value: 'talk', label: '会話' },
          ]}
        />

        <div className="mt-3 flex-1 space-y-3 pb-48" aria-live="polite">
          {segments.length === 0 && !partial && (
            <div className="rounded-[18px] border border-dashed border-line-strong p-5 text-[13.5px] leading-relaxed text-muted">
              {mode === 'talk'
                ? '話す人の言語のボタンを押して話してください。話し終えたらもう一度押すと、訳を読み上げます。'
                : `${mode === 'ja-en' ? '日本語' : '英語'}で話すと、話しているそばから訳が流れます。止めるまで聞き続けます。`}
              {engineNote && <span className="mt-2 block text-[12px] text-faint">{engineNote}</span>}
            </div>
          )}
          {segments.map((x) => (
            <Bubble key={x.id} seg={x} talk={mode === 'talk'} accentLabel={accentInfo(s.accent).label} />
          ))}
          {partial && <Bubble seg={{ id: 0, ...partial }} talk={mode === 'talk'} live accentLabel={accentInfo(s.accent).label} />}
          {busy && (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              文字にしています…
            </p>
          )}
          <div ref={bottom} />
        </div>
      </div>

      <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        <div className="mx-auto max-w-xl">
          {error && (
            <p className="mb-2 flex gap-2 rounded-[12px] bg-warn-soft p-2.5 text-[12.5px]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warn" />
              {error}
            </p>
          )}
          {!available && health !== undefined && engine !== undefined ? (
            <p className="py-2 text-center text-[13px] leading-relaxed text-muted">
              音声認識を使えません。Azure Speech を設定するか、Safari で開いてください。
              <Link to="/settings" className="ml-1 font-semibold text-brand">
                設定
              </Link>
            </p>
          ) : mode === 'talk' ? (
            <div className="grid grid-cols-2 gap-3">
              {(['ja-JP', 'en-US'] as SpeechLang[]).map((lang) => (
                <MicButton key={lang} lang={lang} active={listening === lang} disabled={busy} onPress={() => (listening === lang ? void stop() : void start(lang))} wide />
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <MicButton
                lang={continuousLang}
                active={listening === continuousLang}
                disabled={busy}
                onPress={() => (listening ? void stop() : void start(continuousLang))}
              />
            </div>
          )}
          <div className="mt-2" />
          <Toggle
            label="訳を読み上げる"
            desc={mode === 'talk' ? '話し終えたら、訳を相手に読み上げます' : 'スピーカーだと訳の音声をマイクが拾うことがあります。イヤホンがおすすめです'}
            checked={s.speakTranslation}
            onChange={(v) => s.set({ speakTranslation: v })}
          />
        </div>
      </div>
    </div>
  )
}

function MicButton({ lang, active, disabled, onPress, wide }: { lang: SpeechLang; active: boolean; disabled?: boolean; onPress: () => void; wide?: boolean }) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? `${LABEL[lang]}の聞き取りを止める` : lang === 'ja-JP' ? '日本語で話す' : 'Speak English'}
      className={cx(
        'relative flex items-center justify-center gap-2 font-semibold transition active:scale-[0.97] disabled:opacity-50',
        wide ? 'h-16 rounded-[20px] text-[16px]' : 'h-[72px] w-[72px] rounded-full',
        active ? 'bg-ng text-white' : 'bg-ink text-bg',
      )}
    >
      {active && <span className="absolute inset-0 animate-ping rounded-[inherit] bg-ng/30" aria-hidden />}
      {active ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
      {wide && <span>{active ? '止める' : lang === 'ja-JP' ? '日本語で話す' : 'Speak English'}</span>}
    </button>
  )
}

function Bubble({ seg, talk, live, accentLabel }: { seg: Segment; talk: boolean; live?: boolean; accentLabel: string }) {
  const toEn = seg.lang === 'ja-JP'
  return (
    <div className={cx('flex', talk && !toEn ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[92%] rounded-[18px] border px-4 py-3',
          talk && !toEn ? 'border-brand/25 bg-brand-soft' : 'border-line bg-surface',
          live && 'opacity-70',
        )}
      >
        <p className="text-[12.5px] leading-relaxed text-muted">
          <span className="mr-1.5 font-semibold">{LABEL[seg.lang]}</span>
          {seg.src}
          {live && <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-muted align-middle" />}
        </p>
        {seg.tr ? (
          <p className={cx('mt-1.5 leading-snug', toEn ? 'en text-[20px]' : 'text-[17px] font-medium')}>{seg.tr}</p>
        ) : (
          !live && <p className="mt-1.5 text-[12px] text-faint">（訳を取得できませんでした）</p>
        )}
        {!live && seg.tr && (
          <button
            onClick={() => {
              primeAudio()
              void (toEn ? speak(seg.tr!) : speakJa(seg.tr!))
            }}
            className="mt-1.5 text-[12px] font-medium text-brand"
          >
            {toEn ? `読み上げ（${accentLabel}）` : '読み上げ'}
          </button>
        )}
      </div>
    </div>
  )
}
