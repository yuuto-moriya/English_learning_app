import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, ChevronRight, Copy, Check, HelpCircle, Loader2, Mic, Scale, Speech, Square, Star, Trash2, X } from 'lucide-react'
import { TRANSLATE_TOUR, Tour } from '@/components/Tour'
import { PageHeader, iconBtn } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Button, Card, Direction, Notice, Segmented, SpeakButton, SectionTitle, Tag, Toggle, cx } from '@/components/ui'
import { ApiError, transcribe, translate } from '@/lib/api'
import { db } from '@/lib/db'
import { findTerms, hasJapanese, modalTips, type GlossaryHit } from '@/lib/glossary'
import { useHealth } from '@/lib/hooks'
import { WavRecorder } from '@/lib/recorder'
import { liveEngine, startLive, type Engine, type LiveSession } from '@/lib/live'
import { play } from '@/lib/sounds'
import { useSettings } from '@/lib/settings'
import { accentInfo } from '@/lib/accents'
import { primeAudio, speak, speakJa } from '@/lib/tts'

/** 入力しながら翻訳する上限（長い文章はボタンで翻訳。翻訳 API の無料枠を使いすぎないように） */
const LIVE_MAX = 1000

function loadLive(): boolean {
  try {
    return localStorage.getItem('translate-live') !== '0'
  } catch {
    return true
  }
}

type Dir = 'auto' | 'ja-en' | 'en-ja'
type MicLang = 'ja-JP' | 'en-US'

const MIC_LANGS: { value: MicLang; label: string }[] = [
  { value: 'ja-JP', label: '日本語' },
  { value: 'en-US', label: 'English' },
]

export default function Translate() {
  const health = useHealth()
  const [dir, setDir] = useState<Dir>('auto')
  const [src, setSrc] = useState('')
  const [out, setOut] = useState('')
  const [outLang, setOutLang] = useState<'en' | 'ja'>('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hits, setHits] = useState<GlossaryHit[]>([])
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [recording, setRecording] = useState(false)
  /** 音声入力の認識言語（自動判定時は日本語、英語→日本語では英語が既定） */
  const [micLang, setMicLang] = useState<MicLang>('ja-JP')
  const rec = useRef<WavRecorder | null>(null)
  const s = useSettings()
  const [help, setHelp] = useState(false)
  /** 入力しながら翻訳する */
  const [live, setLive] = useState(loadLive)
  /** リアルタイムの音声入力の方式（null = 録音して文字起こし） */
  const [engine, setEngine] = useState<Engine | null>(null)
  const session = useRef<LiveSession | null>(null)
  /** 音声入力を始めたときの入力欄の文字。認識結果はこの後ろに足していく */
  const base = useRef('')
  /** 音声入力が終わったら、届いた訳を読み上げる */
  const speakNext = useRef(false)
  /** 履歴に保存した最後の原文（入力しながらの翻訳で同じ文を何度も保存しない） */
  const lastSaved = useRef('')
  /** マイク起動中（権限ダイアログ待ちなど）の連打で2つ目の録音を始めないためのフラグ */
  const starting = useRef(false)
  const mounted = useRef(true)
  const history = useLiveQuery(() => db.translations.orderBy('at').reverse().limit(30).toArray(), [])

  // 画面を離れたら録音を破棄してマイクを解放
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      rec.current?.cancel()
      rec.current = null
      void session.current?.stop()
      session.current = null
    }
  }, [])

  const [engineChecked, setEngineChecked] = useState(false)
  useEffect(() => {
    void liveEngine().then((e) => {
      if (!mounted.current) return
      setEngine(e)
      setEngineChecked(true)
    })
  }, [health])

  // 入力しながら翻訳：打つ手（話す口）が止まって 0.6 秒で訳す
  useEffect(() => {
    if (!live || !health?.translator) return
    const text = src.trim()
    if (!text || text.length > LIVE_MAX) return
    const t = setTimeout(() => void run({ save: false }), 600)
    return () => clearTimeout(t)
  }, [src, dir, live, health?.translator]) // eslint-disable-line react-hooks/exhaustive-deps

  // 入力が4秒止まったら、入力しながらの訳を履歴に残す
  useEffect(() => {
    const text = src.trim()
    if (!live || !out || !text || recording) return
    const t = setTimeout(() => {
      if (lastSaved.current === text) return
      lastSaved.current = text
      const { from, to } = resolveDir()
      void db.translations.add({ at: Date.now(), from, to, src: text, out })
    }, 4000)
    return () => clearTimeout(t)
  }, [out, src, live, recording]) // eslint-disable-line react-hooks/exhaustive-deps

  // 音声入力のあとは、訳を読み上げる（設定でオン）
  useEffect(() => {
    if (!speakNext.current || !out || busy) return
    speakNext.current = false
    if (!useSettings.getState().speakTranslation) return
    primeAudio()
    void (outLang === 'en' ? speak(out) : speakJa(out))
  }, [out, busy, outLang])

  // 鉄道（保線）は付帯のコース：選んでいるときだけ、専門用語の検出（と規格英語のヒント）を出す
  const railOn = s.studyCats.rail
  // 原文の専門用語をリアルタイムに検出（オフラインでも動作）
  useEffect(() => {
    if (!railOn) return setHits([])
    const t = setTimeout(() => {
      findTerms(`${src}\n${out}`).then(setHits)
    }, 250)
    return () => clearTimeout(t)
  }, [src, out, railOn])

  const resolveDir = (): { from: 'ja' | 'en'; to: 'ja' | 'en' } => {
    if (dir === 'ja-en') return { from: 'ja', to: 'en' }
    if (dir === 'en-ja') return { from: 'en', to: 'ja' }
    return hasJapanese(src) ? { from: 'ja', to: 'en' } : { from: 'en', to: 'ja' }
  }

  /** 翻訳。入力しながらの翻訳（save: false）は、追い越されたら古い結果を捨てる */
  const runSeq = useRef(0)
  const run = async ({ save = true }: { save?: boolean } = {}) => {
    const text = src.trim()
    if (!text) return
    const my = ++runSeq.current
    setBusy(true)
    setError(null)
    const { from, to } = resolveDir()
    try {
      const r = await translate(text, to, from)
      if (my !== runSeq.current || !mounted.current) return
      setOut(r.text)
      setOutLang(to)
      if (save && lastSaved.current !== text) {
        lastSaved.current = text
        await db.translations.add({ at: Date.now(), from, to, src: text, out: r.text })
      }
    } catch (e) {
      if (my !== runSeq.current) return
      setError(
        e instanceof ApiError
          ? e.status === 503
            ? '翻訳APIが未設定です。下の用語チェックはオフラインでも使えます。'
            : e.message
          : 'オフラインのため翻訳できません。用語チェックは利用できます。',
      )
    } finally {
      if (my === runSeq.current && mounted.current) setBusy(false)
    }
  }

  const changeDir = (d: Dir) => {
    setDir(d)
    if (d === 'en-ja') setMicLang('en-US')
    else if (d === 'ja-en') setMicLang('ja-JP')
  }

  /** 音声入力を止める。リアルタイム方式はそのまま確定、録音方式はここで文字起こし */
  const stopMic = async () => {
    if (session.current) {
      const sess = session.current
      session.current = null
      setRecording(false)
      play('stop')
      speakNext.current = true
      await sess.stop()
      return
    }
    const r = rec.current
    if (!r) return
    rec.current = null
    setRecording(false)
    play('stop')
    setBusy(true)
    try {
      const result = await r.stop()
      URL.revokeObjectURL(result.url)
      const text = await transcribe(result.wav, micLang)
      if (mounted.current && text) {
        speakNext.current = true
        setSrc((x) => ((x ? x + ' ' : '') + text).slice(0, 5000))
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof ApiError ? e.message : '音声入力に失敗しました')
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  // 28秒の自動停止は、録音開始時点ではなく最新の stopMic を呼ぶ
  const stopRef = useRef(stopMic)
  useEffect(() => {
    stopRef.current = stopMic
  })

  const startMic = async () => {
    if (rec.current || session.current || starting.current) return
    starting.current = true
    setError(null)
    play('start')
    try {
      const eng = engineChecked ? engine : await liveEngine()
      if (eng) {
        // 話しているそばから入力欄に文字を出し、入力しながらの翻訳で訳も追いかける
        base.current = src ? src.replace(/\s*$/, ' ') : ''
        const sess = await startLive({
          lang: micLang,
          onPartial: (text) => mounted.current && setSrc((base.current + text).slice(0, 5000)),
          onFinal: (text) => {
            if (!mounted.current) return
            base.current = (base.current + text + (micLang === 'ja-JP' ? '' : ' ')).slice(0, 5000)
            setSrc(base.current)
          },
          onError: (msg) => mounted.current && setError(msg),
          onEnd: () => {
            if (session.current === sess) session.current = null
            if (mounted.current) setRecording(false)
          },
        })
        if (!mounted.current) {
          void sess.stop()
          return
        }
        session.current = sess
        setRecording(true)
        return
      }
      const r = new WavRecorder()
      r.onAutoStop = () => {
        void stopRef.current()
      }
      try {
        await r.start()
      } catch {
        r.cancel()
        throw new Error('マイクを使用できません')
      }
      if (!mounted.current) {
        r.cancel()
        return
      }
      rec.current = r
      setRecording(true)
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'マイクを使用できません')
    } finally {
      starting.current = false
    }
  }

  const toggleMic = () => (rec.current || session.current ? stopMic() : startMic())

  const copyOut = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(out)
      setCopyFailed(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 3000)
    }
  }

  const swap = () => {
    if (!out) return
    setSrc(out)
    setOut('')
    changeDir(outLang === 'en' ? 'en-ja' : 'ja-en')
  }

  const tips = !railOn ? [] : outLang === 'en' ? modalTips(out) : modalTips(src)
  const englishText = outLang === 'en' ? out : src

  return (
    <div>
      <PageHeader
        title="翻訳"
        subtitle="日本語と英語を、入力しても話しても訳せます。訳はそのまま読み上げて発音も確認できます"
        settings
        right={
          <button aria-label="翻訳画面の使い方" onClick={() => setHelp(true)} className={cx(iconBtn, 'text-muted')}>
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        }
      />
      {help && <Tour steps={railOn ? TRANSLATE_TOUR : TRANSLATE_TOUR.filter((x) => x.target !== 'glossary')} onDone={() => setHelp(false)} />}
      <div className="space-y-3 px-4 pb-8">
        <Segmented
          value={dir}
          onChange={changeDir}
          options={[
            { value: 'auto', label: '自動判定' },
            { value: 'ja-en', label: <Direction from="日本語" to="英語" /> },
            { value: 'en-ja', label: <Direction from="英語" to="日本語" /> },
          ]}
        />
        <Link
          to="/translate/live"
          viewTransition
          data-tour="interpreter"
          className="flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3 active:bg-surface-2"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Speech className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">同時通訳</span>
            <span className="block text-[12px] leading-snug text-muted">話しながら訳す・対面の会話モードあり</span>
          </span>
          <ChevronRight className="h-[18px] w-[18px] shrink-0 text-faint" />
        </Link>
        <Card className="p-0 focus-within:border-line-strong">
          <textarea
            value={src}
            onChange={(e) => setSrc(e.target.value.slice(0, 5000))}
            rows={5}
            placeholder="翻訳したい文章を入力（例：明日の会議は10時からです。資料を事前に送ってください。）"
            className="w-full resize-none rounded-t-[18px] bg-transparent p-4 text-[16px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-t">
            {(engine || health?.speech) && (
              <>
                <button
                  data-tour="mic"
                  onClick={toggleMic}
                  disabled={busy && !recording}
                  className={cx(
                    'flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40',
                    recording ? 'bg-ng text-white' : 'border border-line-strong text-ink',
                  )}
                  aria-label="音声入力"
                >
                  {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
                </button>
                <div className="flex rounded-full bg-surface-2 p-0.5" role="group" aria-label="音声入力の言語">
                  {MIC_LANGS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setMicLang(l.value)}
                      disabled={recording}
                      aria-pressed={micLang === l.value}
                      className={cx(
                        'h-8 rounded-full px-2 text-[11px] font-semibold transition disabled:opacity-60',
                        micLang === l.value ? 'bg-surface text-ink shadow-sm' : 'text-muted',
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {src && (
              <button onClick={() => { setSrc(''); setOut('') }} className="rounded-full p-2 text-muted" aria-label="クリア">
                <X className="h-5 w-5" />
              </button>
            )}
            <span className="ml-auto text-[11px] tabular-nums text-faint">{src.length}/5000</span>
            <Button variant="ink" size="sm" className="min-h-10 px-4" onClick={() => void run()} disabled={!src.trim() || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              翻訳
            </Button>
          </div>
        </Card>

        {health?.translator && (
          <div className="px-1">
            <Toggle
              label="入力しながら翻訳"
              desc={`手を止めると自動で訳します（${LIVE_MAX.toLocaleString()}文字まで）。音声入力のあとは訳を読み上げます`}
              checked={live}
              onChange={(v) => {
                setLive(v)
                try {
                  localStorage.setItem('translate-live', v ? '1' : '0')
                } catch {
                  /* noop */
                }
              }}
            />
          </div>
        )}

        {error && (
          <Notice>
            {error}{' '}
            {health && !health.translator && (
              <Link to="/settings" className="inline-flex items-center font-semibold text-brand">
                設定方法
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
              </Link>
            )}
          </Notice>
        )}

        {out && (
          <Card className="animate-rise">
            <div className="flex items-start gap-2">
              <p className={cx('flex-1 whitespace-pre-wrap leading-relaxed', outLang === 'en' ? 'en text-[19px]' : 'text-[17px]')}>{out}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {outLang === 'en' ? (
                <SpeakButton text={out} accent={s.accent} label="読み上げ" />
              ) : (
                <SpeakButton text={out} lang="ja" label="読み上げ" />
              )}
              <span className="text-[12px] text-muted">{outLang === 'en' ? accentInfo(s.accent).label : '日本語'}</span>
              <button
                onClick={copyOut}
                className="ml-auto flex min-h-8 items-center gap-1 rounded-full border border-line-strong px-3 text-[12px] font-semibold"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
                コピー
              </button>
              <button onClick={swap} className="flex min-h-8 items-center gap-1 rounded-full border border-line-strong px-3 text-[12px] font-semibold">
                <ArrowDownUp className="h-3.5 w-3.5" />
                入れ替え
              </button>
            </div>
            {copyFailed && (
              <p role="alert" className="mt-2 text-[12px] text-ng">
                コピーできませんでした。訳文を長押しして選択・コピーしてください。
              </p>
            )}
          </Card>
        )}

        {tips.length > 0 && englishText && (
          <Card className="space-y-1.5">
            {tips.map((t) => (
              <p key={t} className="flex gap-2 text-[12.5px] leading-relaxed">
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-rail" strokeWidth={1.8} />
                {t}
              </p>
            ))}
          </Card>
        )}

        {railOn && (
          <div data-tour="glossary">
            <SectionTitle>検出した保線用語（{hits.length}）</SectionTitle>
          </div>
        )}
        {!railOn ? null : hits.length === 0 ? (
          <Guide
            who="chocola"
            pose="greet"
            text="文章に保線用語があると、英国(EN)・米国の言い方とJISの日本語を並べて表示するよ。機械翻訳の訳語チェックに使ってね！"
          />
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
            {hits.map((h, k) => (
              <Link key={h.word.id} to={`/words/${h.word.id}`} className={cx('flex items-center gap-3 py-3 pl-4 pr-3 active:bg-surface-2', k > 0 && 'hairline-t')}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Tag>英</Tag>
                    <span className="en text-[17px] font-medium">{h.word.w}</span>
                    {h.word.us && (
                      <>
                        <Tag>米</Tag>
                        <span className="en text-[17px] text-muted">{h.word.us}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">{h.word.ja}</p>
                  {h.word.refs && <p className="mt-0.5 text-[11px] leading-snug text-faint">{h.word.refs.join(' / ')}</p>}
                </div>
                <span className="shrink-0 rounded-md bg-rail-soft px-1.5 py-0.5 text-[11px] font-semibold text-rail">「{h.matched}」</span>
              </Link>
            ))}
          </div>
        )}

        {history && history.length > 0 && (
          <>
            <SectionTitle>履歴</SectionTitle>
            <div className="space-y-2">
              {history.map((h) => (
                <Card
                  key={h.id}
                  className="p-3"
                  onClick={() => {
                    setSrc(h.src)
                    setOut(h.out)
                    setOutLang(h.to as 'en' | 'ja')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <p className="line-clamp-2 text-[13px] text-muted">{h.src}</p>
                  <p className="mt-0.5 line-clamp-2 text-[14px] font-medium">{h.out}</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        db.translations.update(h.id!, { fav: !h.fav })
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full active:bg-surface-2"
                      aria-label={h.fav ? '保存を取り消す' : '保存'}
                      aria-pressed={!!h.fav}
                    >
                      <Star className={cx('h-[18px] w-[18px]', h.fav ? 'fill-warn text-warn' : 'text-muted')} strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        db.translations.delete(h.id!)
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:bg-surface-2"
                      aria-label="削除"
                    >
                      <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
