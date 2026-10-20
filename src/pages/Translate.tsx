import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeftRight, Check, ChevronRight, Copy, HelpCircle, Loader2, Maximize2, Mic, Scale, Speech, Square, Star, Trash2, Undo2, X } from 'lucide-react'
import { TRANSLATE_TOUR, Tour } from '@/components/Tour'
import { PageHeader, iconBtn } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Button, Card, Notice, Segmented, SpeakButton, SectionTitle, Tag, Toggle, cx } from '@/components/ui'
import { ApiError, transcribe, translate } from '@/lib/api'
import { db, type TranslationRow } from '@/lib/db'
import { detectLang, findTerms, modalTips, type GlossaryHit } from '@/lib/glossary'
import { useHealth } from '@/lib/hooks'
import { WavRecorder } from '@/lib/recorder'
import { liveEngine, startLive, type Engine, type LiveSession } from '@/lib/live'
import { play } from '@/lib/sounds'
import { useSettings } from '@/lib/settings'
import { primeAudio, speak, speakJa } from '@/lib/tts'
import { loadAll } from '@/lib/vocab'
import type { Word } from '@/lib/types'

/** 入力しながら翻訳する上限（長い文章はボタンで翻訳。翻訳 API の無料枠を使いすぎないように） */
const LIVE_MAX = 1000
const MAX_CHARS = 5000

type Lang = 'ja' | 'en'
const LANG_LABEL: Record<Lang, string> = { ja: '日本語', en: '英語' }

function loadLive(): boolean {
  try {
    return localStorage.getItem('translate-live') !== '0'
  } catch {
    return true
  }
}

const other = (l: Lang): Lang => (l === 'ja' ? 'en' : 'ja')

export default function Translate() {
  const health = useHealth()
  /** 入力が空のときの向き（音声入力の言語にもなる）。入力があれば、その言語に合わせて自動で切り替わる */
  const [base, setBase] = useState<Lang>('ja')
  const [src, setSrc] = useState('')
  const [out, setOut] = useState('')
  /** いまの訳文がどの原文の訳か（入力を変えている間は、古い訳を薄く出す） */
  const [outFor, setOutFor] = useState('')
  const [outLang, setOutLang] = useState<Lang>('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hits, setHits] = useState<GlossaryHit[]>([])
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [recording, setRecording] = useState(false)
  const [back, setBack] = useState<{ for: string; text: string } | null>(null)
  const [backBusy, setBackBusy] = useState(false)
  const [big, setBig] = useState(false)
  const [word, setWord] = useState<Word | null>(null)
  const [tab, setTab] = useState<'all' | 'fav'>('all')
  const rec = useRef<WavRecorder | null>(null)
  const s = useSettings()
  const [help, setHelp] = useState(false)
  /** 入力しながら翻訳する */
  const [live, setLive] = useState(loadLive)
  /** リアルタイムの音声入力の方式（null = 録音して文字起こし） */
  const [engine, setEngine] = useState<Engine | null>(null)
  const session = useRef<LiveSession | null>(null)
  /** 音声入力を始めたときの入力欄の文字。認識結果はこの後ろに足していく */
  const micBase = useRef('')
  /** 音声入力が終わったら、届いた訳を読み上げる */
  const speakNext = useRef(false)
  /** 履歴に保存した最後の原文（入力しながらの翻訳で同じ文を何度も保存しない） */
  const lastSaved = useRef('')
  /** マイク起動中（権限ダイアログ待ちなど）の連打で2つ目の録音を始めないためのフラグ */
  const starting = useRef(false)
  const mounted = useRef(true)
  const area = useRef<HTMLTextAreaElement>(null)
  const recent = useLiveQuery(() => db.translations.orderBy('at').reverse().limit(200).toArray(), [])

  const text = src.trim()
  const from: Lang = (text && detectLang(text)) || base
  const to = other(from)
  const micLang = from === 'ja' ? 'ja-JP' : 'en-US'
  const stale = !!out && outFor !== text
  const current = recent?.find((h) => h.src === text && h.out === out)

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

  // 入力欄は文の長さに合わせて伸ばす（訳が下に隠れないよう、画面の4割まで）
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 112), Math.round(window.innerHeight * 0.4))}px`
  }, [src])

  // 入力を消したら訳も消す
  useEffect(() => {
    if (!text) {
      setOut('')
      setOutFor('')
      setError(null)
    }
  }, [text])

  // 入力しながら翻訳：打つ手（話す口）が止まって 0.6 秒で訳す
  useEffect(() => {
    if (!live || !health?.translator) return
    // 入れ替え・履歴から開いたときは、もう訳があるので訳し直さない
    if (!text || text.length > LIVE_MAX || outFor === text) return
    const t = setTimeout(() => void run({ save: false }), 600)
    return () => clearTimeout(t)
  }, [text, live, health?.translator, outFor]) // eslint-disable-line react-hooks/exhaustive-deps

  // 入力が4秒止まったら、入力しながらの訳を履歴に残す
  useEffect(() => {
    if (!live || !out || !text || stale || recording) return
    const t = setTimeout(() => {
      if (lastSaved.current === text) return
      lastSaved.current = text
      void db.translations.add({ at: Date.now(), from: other(outLang), to: outLang, src: text, out })
    }, 4000)
    return () => clearTimeout(t)
  }, [out, text, live, stale, recording, outLang])

  // 音声入力のあとは、訳を読み上げる（設定でオン）
  useEffect(() => {
    if (!speakNext.current || !out || busy || stale) return
    speakNext.current = false
    if (!useSettings.getState().speakTranslation) return
    primeAudio()
    void (outLang === 'en' ? speak(out) : speakJa(out))
  }, [out, busy, outLang, stale])

  // 訳か原文が1〜3語の英語なら、単語帳の語を探して出す（意味・例文・発音を見て覚えられるように）
  useEffect(() => {
    const en = (outLang === 'en' ? out : text).trim().replace(/[.!?。]$/, '')
    if (stale || !en || en.split(/\s+/).length > 3 || /[^A-Za-z\s'-]/.test(en)) return setWord(null)
    let alive = true
    void loadAll().then((all) => {
      if (!alive) return
      const key = en.toLowerCase()
      setWord(all.find((w) => w.w.toLowerCase() === key || w.us?.toLowerCase() === key) ?? null)
    })
    return () => {
      alive = false
    }
  }, [out, text, outLang, stale])

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

  /** 翻訳。入力しながらの翻訳（save: false）は、追い越されたら古い結果を捨てる */
  const runSeq = useRef(0)
  const run = async ({ save = true }: { save?: boolean } = {}) => {
    if (!text) return
    const my = ++runSeq.current
    const f = from
    const t = to
    setBusy(true)
    setError(null)
    try {
      const r = await translate(text, t, f)
      if (my !== runSeq.current || !mounted.current) return
      setOut(r.text)
      setOutFor(text)
      setOutLang(t)
      setBase(f)
      if (save && lastSaved.current !== text) {
        lastSaved.current = text
        await db.translations.add({ at: Date.now(), from: f, to: t, src: text, out: r.text })
      }
    } catch (e) {
      if (my !== runSeq.current) return
      setError(
        e instanceof ApiError
          ? e.status === 503
            ? '翻訳APIが未設定です。'
            : e.message
          : 'オフラインのため翻訳できません。',
      )
    } finally {
      if (my === runSeq.current && mounted.current) setBusy(false)
    }
  }

  /** 逆翻訳：訳文を原文の言語に戻して、意味がずれていないかを確かめる（押したときだけ API を使う） */
  const backTranslate = async () => {
    if (!out || backBusy) return
    setBackBusy(true)
    try {
      const r = await translate(out, other(outLang), outLang)
      if (mounted.current) setBack({ for: out, text: r.text })
    } catch (e) {
      if (mounted.current) setError(e instanceof ApiError ? e.message : 'オフラインのため確かめられません。')
    } finally {
      if (mounted.current) setBackBusy(false)
    }
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
      const heard = await transcribe(result.wav, micLang)
      if (mounted.current && heard) {
        speakNext.current = true
        setSrc((x) => ((x ? x + ' ' : '') + heard).slice(0, MAX_CHARS))
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
    // 話す言語は、いまの向きの「訳す前」の言語
    const lang = micLang
    setBase(from)
    try {
      const eng = engineChecked ? engine : await liveEngine()
      if (eng) {
        // 話しているそばから入力欄に文字を出し、入力しながらの翻訳で訳も追いかける
        micBase.current = src ? src.replace(/\s*$/, ' ') : ''
        const sess = await startLive({
          lang,
          onPartial: (t) => mounted.current && setSrc((micBase.current + t).slice(0, MAX_CHARS)),
          onFinal: (t) => {
            if (!mounted.current) return
            micBase.current = (micBase.current + t + (lang === 'ja-JP' ? '' : ' ')).slice(0, MAX_CHARS)
            setSrc(micBase.current)
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

  /** 向きを入れ替える。訳があれば、訳を入力欄に移して逆向きに訳す */
  const swap = () => {
    if (recording) return
    if (out && !stale) {
      lastSaved.current = out.trim()
      setSrc(out)
      setOut(src.trim())
      setOutFor(out.trim())
      setOutLang(from)
      setBase(to)
      setBack(null)
      return
    }
    setBase(other(from))
    if (text) {
      // 入力した文の言語は変えられないので、向きは自動で戻る。そのことを伝える
      setError(`入力した文は${LANG_LABEL[from]}なので、${LANG_LABEL[from]}→${LANG_LABEL[to]}で訳します。`)
    }
  }

  const clear = () => {
    setSrc('')
    setBack(null)
    area.current?.focus()
  }

  const toggleFav = async () => {
    if (!out || stale) return
    if (current?.id) {
      await db.translations.update(current.id, { fav: !current.fav })
      return
    }
    lastSaved.current = text
    await db.translations.add({ at: Date.now(), from: other(outLang), to: outLang, src: text, out, fav: true })
  }

  const openRow = (h: TranslationRow) => {
    lastSaved.current = h.src
    setSrc(h.src)
    setOut(h.out)
    setOutFor(h.src.trim())
    setOutLang(h.to as Lang)
    setBase(h.from as Lang)
    setBack(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setLivePref = (v: boolean) => {
    setLive(v)
    try {
      localStorage.setItem('translate-live', v ? '1' : '0')
    } catch {
      /* noop */
    }
  }

  const tips = !railOn ? [] : outLang === 'en' ? modalTips(out) : modalTips(src)
  const englishText = outLang === 'en' ? out : src
  const canMic = !!(engine || health?.speech)
  /** 「翻訳」ボタンが要るのは、入力しながら翻訳しないとき・長い文のときだけ */
  const needButton = !live || !health?.translator || text.length > LIVE_MAX
  const rows = (recent ?? []).filter((h) => tab === 'all' || h.fav).slice(0, tab === 'all' ? 30 : 200)
  const favCount = (recent ?? []).filter((h) => h.fav).length
  const showBack = !!back && back.for === out

  return (
    <div>
      <PageHeader
        title="翻訳"
        settings
        right={
          <button aria-label="翻訳画面の使い方" onClick={() => setHelp(true)} className={cx(iconBtn, 'text-muted')}>
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        }
      />
      {help && <Tour steps={railOn ? TRANSLATE_TOUR : TRANSLATE_TOUR.filter((x) => x.target !== 'glossary')} onDone={() => setHelp(false)} />}
      <div className="space-y-3 px-4 pb-8">
        {/* 訳す向き：日本語 ⇄ 英語。入力すると、その言語に合わせて自動で切り替わる */}
        <div data-tour="langbar" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[16px] bg-surface-2 p-1.5">
          <div className="flex h-11 flex-col items-center justify-center rounded-[12px] border border-line bg-surface shadow-sm">
            <span className="text-[15px] font-semibold leading-tight">{LANG_LABEL[from]}</span>
            {text && <span className="text-[10.5px] leading-tight text-muted">自動で判定</span>}
          </div>
          <button
            onClick={swap}
            disabled={recording}
            aria-label="訳す向きを入れ替える"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition active:scale-90 active:bg-surface disabled:opacity-40"
          >
            <ArrowLeftRight className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="flex h-11 items-center justify-center rounded-[12px] border border-line bg-surface shadow-sm">
            <span className="text-[15px] font-semibold">{LANG_LABEL[to]}</span>
          </div>
        </div>

        {/* 入力 */}
        <div className="relative rounded-[18px] border border-line bg-surface focus-within:border-line-strong">
          <textarea
            ref={area}
            value={src}
            onChange={(e) => {
              setSrc(e.target.value.slice(0, MAX_CHARS))
              setError(null)
            }}
            placeholder={from === 'ja' ? '翻訳したい文章を入力（日本語でも英語でも）' : '翻訳したい文章を入力（英語でも日本語でも）'}
            aria-label="翻訳する文"
            className="block w-full resize-none rounded-t-[18px] bg-transparent px-4 pb-2 pr-12 pt-4 text-[17px] leading-relaxed outline-none placeholder:text-faint"
          />
          {src && (
            <button onClick={clear} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-muted active:bg-surface-2" aria-label="入力を消す">
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            {canMic && (
              <button
                data-tour="mic"
                onClick={toggleMic}
                disabled={busy && !recording}
                className={cx(
                  'flex h-11 shrink-0 items-center gap-1.5 rounded-full pl-3 pr-4 text-[13px] font-semibold transition active:scale-95 disabled:opacity-40',
                  recording ? 'bg-ng text-white' : 'bg-surface-2 text-ink',
                )}
                aria-label={recording ? '音声入力を止める' : `${LANG_LABEL[from]}で話す`}
              >
                {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" strokeWidth={1.9} />}
                {recording ? '停止' : `${LANG_LABEL[from]}で話す`}
              </button>
            )}
            <Link
              to="/translate/live"
              viewTransition
              data-tour="interpreter"
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-semibold text-ink active:bg-surface-2"
            >
              <Speech className="h-[18px] w-[18px] text-brand" strokeWidth={1.9} />
              同時通訳
            </Link>
            <div className="ml-auto flex items-center gap-2">
              {text.length > LIVE_MAX * 0.8 && (
                <span className={cx('text-[11px] tabular-nums', src.length >= MAX_CHARS ? 'text-ng' : 'text-faint')}>
                  {src.length}/{MAX_CHARS}
                </span>
              )}
              {needButton && (
                <Button variant="ink" size="sm" className="min-h-11 px-4" onClick={() => void run()} disabled={!text || busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  翻訳
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Notice>
            {error}{' '}
            {health && !health.translator && (
              <Link to="/settings#cloud" className="inline-flex items-center font-semibold text-brand">
                設定を見る
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
              </Link>
            )}
          </Notice>
        )}

        {/* 訳 */}
        {text && (out || busy) && (
          <section aria-label="訳" aria-busy={busy} className="animate-rise rounded-[18px] bg-brand-soft p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-strong">
              {LANG_LABEL[out ? outLang : to]}
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="翻訳中" />}
            </p>
            {out ? (
              <p
                className={cx(
                  'mt-1 whitespace-pre-wrap leading-relaxed transition-opacity',
                  outLang === 'en' ? 'en text-[21px]' : 'text-[19px]',
                  stale && 'opacity-50',
                )}
              >
                {out}
              </p>
            ) : (
              <div className="mt-2 space-y-2" aria-hidden>
                <div className="h-4 w-4/5 animate-pulse rounded bg-surface/70" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-surface/70" />
              </div>
            )}
            {out && (
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <SpeakButton
                  text={out}
                  lang={outLang}
                  accent={outLang === 'en' ? s.accent : undefined}
                  label="聞く"
                  className="min-h-11 w-full justify-center whitespace-nowrap border-transparent"
                />
                <ActionButton onClick={copyOut} label={copied ? 'コピー済み' : 'コピー'}>
                  {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
                </ActionButton>
                <ActionButton onClick={() => void toggleFav()} label={current?.fav ? '保存済み' : '保存'} pressed={!!current?.fav} disabled={stale}>
                  <Star className={cx('h-4 w-4', current?.fav && 'fill-warn text-warn')} />
                </ActionButton>
                <ActionButton onClick={() => setBig(true)} label="拡大">
                  <Maximize2 className="h-4 w-4" />
                </ActionButton>
              </div>
            )}
            {copyFailed && (
              <p role="alert" className="mt-2 text-[12px] text-ng">
                コピーできませんでした。訳文を長押しして選択・コピーしてください。
              </p>
            )}
            {out && !stale && (
              <div className="mt-3 border-t border-brand/15 pt-2">
                {showBack ? (
                  <p className="text-[13px] leading-relaxed">
                    <span className="mr-1.5 text-[11.5px] font-semibold text-brand-strong">{LANG_LABEL[other(outLang)]}に戻すと</span>
                    {back.text}
                  </p>
                ) : (
                  <button
                    onClick={() => void backTranslate()}
                    disabled={backBusy}
                    className="flex min-h-9 items-center gap-1.5 text-[12.5px] font-semibold text-brand-strong disabled:opacity-60"
                  >
                    {backBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" strokeWidth={2} />}
                    {LANG_LABEL[other(outLang)]}に戻して確かめる
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {word && (
          <Link
            to={`/words/${word.id}`}
            viewTransition
            className="flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3 active:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-semibold text-muted">単語帳にある語</span>
              <span className="en block text-[17px] font-medium">{word.w}</span>
              <span className="block truncate text-[13px] text-muted">{word.ja}</span>
            </span>
            <span className="shrink-0 text-[12.5px] font-semibold text-brand">意味と例文</span>
            <ChevronRight className="h-[18px] w-[18px] shrink-0 text-faint" />
          </Link>
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

        {/* 履歴と保存した訳 */}
        {recent && recent.length > 0 && (
          <>
            <SectionTitle>履歴</SectionTitle>
            <Segmented
              size="sm"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'all', label: 'すべて' },
                { value: 'fav', label: `保存した訳（${favCount}）` },
              ]}
            />
            {rows.length === 0 ? (
              <p className="px-1 py-3 text-[13px] text-muted">訳の下の「保存」を押すと、ここにまとまります。</p>
            ) : (
              <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
                {rows.map((h, k) => (
                  <div key={h.id} className={cx('flex items-center gap-1 pr-1.5', k > 0 && 'hairline-t')}>
                    <button onClick={() => openRow(h)} className="min-w-0 flex-1 py-2.5 pl-4 text-left active:bg-surface-2">
                      <span className="block truncate text-[12.5px] text-muted">{h.src}</span>
                      <span className={cx('mt-0.5 line-clamp-2 text-[14.5px] leading-snug', h.to === 'en' && 'en')}>{h.out}</span>
                    </button>
                    <button
                      onClick={() => db.translations.update(h.id!, { fav: !h.fav })}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-surface-2"
                      aria-label={h.fav ? '保存を取り消す' : '保存'}
                      aria-pressed={!!h.fav}
                    >
                      <Star className={cx('h-[18px] w-[18px]', h.fav ? 'fill-warn text-warn' : 'text-faint')} strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={() => db.translations.delete(h.id!)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-faint active:bg-surface-2"
                      aria-label="削除"
                    >
                      <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <SectionTitle>翻訳の設定</SectionTitle>
        <Card className="space-y-1 py-2">
          <Toggle
            label="入力しながら翻訳"
            desc={`手を止めると自動で訳します（${LIVE_MAX.toLocaleString()}文字まで。長い文は「翻訳」ボタンで）`}
            checked={live}
            onChange={setLivePref}
          />
          <Toggle label="話したあと訳を読み上げる" desc="音声入力を止めると、訳を声で読み上げます" checked={s.speakTranslation} onChange={(v) => s.set({ speakTranslation: v })} />
        </Card>
      </div>

      {big && out && (
        <div role="dialog" aria-modal="true" aria-label="訳を大きく表示" className="fixed inset-0 z-50 flex flex-col bg-bg px-6 pb-safe pt-safe animate-rise">
          <div className="flex h-14 items-center justify-between">
            <button onClick={() => setBig(false)} className={iconBtn} aria-label="閉じる">
              <X className="h-5 w-5" />
            </button>
            <SpeakButton text={out} lang={outLang} accent={outLang === 'en' ? s.accent : undefined} size="lg" />
          </div>
          <div className="flex flex-1 items-center overflow-y-auto py-6">
            <p className={cx('w-full whitespace-pre-wrap font-semibold leading-snug', outLang === 'en' ? 'en text-[34px]' : 'text-[30px]')}>{out}</p>
          </div>
          <p className="pb-4 text-center text-[12px] text-muted">相手に画面を見せて伝えられます</p>
        </div>
      )}
    </div>
  )
}

/** 訳の下に並べる操作ボタン（アイコン＋短い言葉。折り返さない） */
function ActionButton({
  onClick,
  label,
  children,
  pressed,
  disabled,
}: {
  onClick: () => void
  label: string
  children: ReactNode
  pressed?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className="flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-surface px-1 text-[12px] font-semibold text-ink transition active:scale-95 disabled:opacity-40"
    >
      {children}
      {label}
    </button>
  )
}
