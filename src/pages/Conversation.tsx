import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Check, ChevronDown, ChevronRight, Eye, Flag, Keyboard, Languages, Lightbulb, Loader2, Mic, PencilLine, RotateCcw, Send, Snail, Square, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SessionShell, SLOW_RATE } from '@/components/Session'
import { SpeakCheck } from '@/components/SpeakCheck'
import { MineExplain, ReplyExplain } from '@/components/ChatTutor'
import { Button, Card, List, ListRow, Notice, Segmented, SectionTitle, SpeakButton, Toggle, cx } from '@/components/ui'
import { chatScenes, scenePrompt, type ChatScene } from '@/data/chatScenes'
import { loadPhrases, removePhrase, savePhrase, type SavedPhrase } from '@/lib/chatPhrases'
import { ApiError, askTutor, chat, transcribe, translate, type ChatReply, type ChatTurn } from '@/lib/api'
import { bumpDaily } from '@/lib/db'
import { useHealth } from '@/lib/hooks'
import { liveEngine, startLive, warmLive, type Engine, type LiveSession } from '@/lib/live'
import { WavRecorder } from '@/lib/recorder'
import { useSettings } from '@/lib/settings'
import { play } from '@/lib/sounds'
import { prefetchSpeech, primeAudio, speak, stopSpeaking, warmUpSpeech } from '@/lib/tts'

/** 会話の CEFR レベル（設定のレベルから既定を決める。専門は B2 として話す） */
const CHAT_LEVELS = [
  { value: 'A1', label: 'A1', name: '入門' },
  { value: 'A2', label: 'A2', name: '初級' },
  { value: 'B1', label: 'B1', name: '中級' },
  { value: 'B2', label: 'B2', name: '中上級' },
  { value: 'C1', label: 'C1', name: '上級' },
] as const
type ChatLevel = (typeof CHAT_LEVELS)[number]['value']
const levelOf = (maxLevel: number): ChatLevel => CHAT_LEVELS[Math.min(Math.max(maxLevel, 1), 4) - 1].value

/** 話し終えてから自動で送るまでの無音（ミリ秒）。「ゆっくり話す」なら長めに待つ */
const AUTO_SEND_MS = 1400
const AUTO_SEND_SLOW_MS = 2600
/** 文の途中で考えている（and・but・um などで終わる）ときは、さらに待つ */
const MID_SENTENCE = /\b(and|but|so|because|or|um+|uh+|er+|like|the|a|an|to|of|with|my|i)[.,]?$/i
export const autoSendDelay = (said: string, slow: boolean) => (slow ? AUTO_SEND_SLOW_MS : AUTO_SEND_MS) + (MID_SENTENCE.test(said.trim()) ? 1200 : 0)
/** AI に送る会話の長さ（サーバーの上限は 16 発言。短いほど返事が速く、無料枠も減りにくい） */
const SEND_TURNS = 12
/**
 * 困ったときの決まり文句。押すとそのまま英語で送る（相手に聞き返す言い方そのものを練習できる。
 * 聞き返し・言い換えの頼み方は、やりとりの中で意味をすり合わせる力として学習効果がある）
 */
const QUICK_REPLIES = [
  { label: 'もう一度', en: 'Sorry, could you say that again?' },
  { label: 'やさしく', en: 'Could you say that more simply?' },
  { label: 'ゆっくり', en: 'Could you speak more slowly, please?' },
  { label: '話題を変える', en: "Can we talk about something else?" },
] as const

/** この回数話したら、振り返りをすすめる */
const SUGGEST_REVIEW_AFTER = 6
/** 1日に送れる回数（端末ごと。無料枠を使い切らないための目安） */
export const DAILY_LIMIT = 200

interface Turn {
  role: 'user' | 'assistant'
  text: string
  /** 自分の発言への直し（AI の返事が届いたら入る。null は直すところなし） */
  correction?: ChatReply['correction']
  /** AI の発言：次に言える返事の例・和訳 */
  hint?: string
  ja?: string
}

const todayKey = () => `chat-count-${new Date().toISOString().slice(0, 10)}`
function usedToday(): number {
  try {
    return Number(localStorage.getItem(todayKey()) ?? 0) || 0
  } catch {
    return 0
  }
}
function countUse() {
  try {
    localStorage.setItem(todayKey(), String(usedToday() + 1))
  } catch {
    /* noop */
  }
}
function loadPref(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? def : v === '1'
  } catch {
    return def
  }
}
function savePref(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? '1' : '0')
  } catch {
    /* noop */
  }
}

/** AI に送る会話：最後が自分の発言になるよう、古い発言から落とす */
export function turnsToSend(turns: { role: 'user' | 'assistant'; text: string }[]): ChatTurn[] {
  return turns.slice(-SEND_TURNS).map((t) => ({ role: t.role, content: t.text }))
}

export default function Conversation() {
  const health = useHealth()
  const studyCats = useSettings((s) => s.studyCats)
  const maxLevel = useSettings((s) => s.maxLevel)
  const accent = useSettings((s) => s.accent)
  const scenes = useMemo(() => chatScenes(studyCats), [studyCats])
  const [level, setLevel] = useState<ChatLevel>(() => levelOf(maxLevel))
  const [scene, setScene] = useState<ChatScene | null>(null)
  const [done, setDone] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(() => loadPref('chat-speak', true))
  /** 会話中に直しを出す（オフにすると振り返りでまとめて見る） */
  const [showFix, setShowFix] = useState(() => loadPref('chat-fix', true))
  /** 生成中の返事（届いたところまで） */
  const [pending, setPending] = useState('')
  /** 送れなかったとき、同じ会話でもう一度送れるようにする */
  const [canRetry, setCanRetry] = useState(false)
  const [goalsOpen, setGoalsOpen] = useState(true)
  /** ヒントの「日本語で言いたいこと」 */
  const [jaText, setJaText] = useState('')
  const [jaOut, setJaOut] = useState<string | null>(null)
  const [jaBusy, setJaBusy] = useState(false)
  /** ヒントの中のタブ：返事の例・日本語から英語・先生に質問 */
  const [hintTab, setHintTab] = useState<'example' | 'ja' | 'ask'>('example')
  const [askText, setAskText] = useState('')
  const [askOut, setAskOut] = useState<string | null>(null)
  const [askBusy, setAskBusy] = useState(false)
  const [phrases, setPhrases] = useState<SavedPhrase[]>(loadPhrases)
  const [showAllPhrases, setShowAllPhrases] = useState(false)
  /** 振り返りで「言ってみる」を開いている直し */
  const [tryAt, setTryAt] = useState<number | null>(null)
  /** 振り返りで答え（より自然な言い方）を見た直し。先に自分で言い直してから見る */
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  /** 会話中に開いた直し（ふだんは小さなボタンだけにして、会話の流れを止めない） */
  const [openFix, setOpenFix] = useState<Set<number>>(new Set())
  /** ゆっくり話す人向けに、自動で送るまで長めに待つ */
  const [slowSpeaker, setSlowSpeaker] = useState(() => loadPref('chat-slow', false))
  /** 会話ごとの ID */
  const cid = useRef('')
  const session = useRef<LiveSession | null>(null)
  const rec = useRef<WavRecorder | null>(null)
  const micText = useRef('')
  /** 音声入力の回。送ったあとに遅れて届いた認識結果を捨てるのに使う */
  const micGen = useRef(0)
  const lastFinal = useRef('')
  const silence = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [starting, setStarting] = useState(false)
  /** 使える音声入力の方式（undefined = まだ調べていない） */
  const [engine, setEngine] = useState<Engine | null | undefined>(undefined)
  const mounted = useRef(true)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stopSpeaking()
      rec.current?.cancel()
      void session.current?.stop()
      clearTimeout(silence.current)
    }
  }, [])

  // マイクを押してから聞き始めるまでを短くするため、音声認識の方式・SDK・一時トークンを先に用意しておく
  useEffect(() => {
    if (!health?.speech && !health?.realtime) return
    let alive = true
    void liveEngine().then((e) => {
      if (!alive) return
      setEngine(e)
      warmLive(e)
    })
    return () => {
      alive = false
    }
  }, [health])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, busy, showHint, pending, jaOut])

  const canMic = !!health?.speech || !!health?.realtime

  /** AI に会話を送り、返事・直し・ヒントを受け取る。返事は届いたところから表示し、文を書き終えたら読み上げを始める */
  const ask = async (history: Turn[], sc: ChatScene) => {
    if (usedToday() >= DAILY_LIMIT) {
      setError(`今日は ${DAILY_LIMIT} 回話しました。続きはまた明日（無料枠を使い切らないための上限です）`)
      return
    }
    setBusy(true)
    setError(null)
    setCanRetry(false)
    setShowHint(false)
    setPending('')
    let spoken = false
    const say = (text: string) => {
      if (spoken || !autoSpeak || !mounted.current) return
      spoken = true
      primeAudio()
      void speak(text, { accent })
    }
    try {
      const r = await chat(
        scenePrompt(sc),
        level,
        turnsToSend(history),
        (text, complete) => {
          if (!mounted.current) return
          setPending(text)
          if (complete) say(text)
        },
        cid.current,
      )
      countUse()
      if (!mounted.current) return
      setTurns((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'user') next[next.length - 1] = { ...last, correction: r.correction }
        next.push({ role: 'assistant', text: r.reply, hint: r.hint })
        return next
      })
      say(r.reply)
      // 押すとすぐ聞けるように、返事の例と直しの音声を先に用意しておく
      prefetchSpeech([r.hint, r.correction?.better].filter((x): x is string => !!x).map((text) => ({ text, accent })))
      void bumpDaily({ seconds: 20 }).catch(console.error)
    } catch (e) {
      if (!mounted.current) return
      setError(e instanceof ApiError ? e.message : 'オフラインのため話せません。通信を確かめてください')
      setCanRetry(true)
    } finally {
      if (mounted.current) {
        setBusy(false)
        setPending('')
      }
    }
  }

  /** 日本語で言いたいことを英語にする（翻訳 API。言い方の手がかりにして、自分の声で言ってもらう） */
  const helpJa = async () => {
    const t = jaText.trim()
    if (!t || jaBusy) return
    setJaBusy(true)
    try {
      const r = await translate(t, 'en', 'ja')
      if (mounted.current) setJaOut(r.text)
    } catch (e) {
      if (mounted.current) setError(e instanceof ApiError ? e.message : '英語にできませんでした')
    } finally {
      if (mounted.current) setJaBusy(false)
    }
  }

  const toggleSave = (t: Turn) => {
    if (!t.correction) return
    const saved = phrases.some((p) => p.better === t.correction!.better)
    setPhrases(saved ? removePhrase(t.correction.better) : savePhrase({ said: t.text, better: t.correction.better, note: t.correction.note }))
  }

  const start = (sc: ChatScene) => {
    warmUpSpeech()
    primeAudio()
    warmLive(engine)
    setScene(sc)
    setTurns([])
    setDone(false)
    setDraft('')
    setError(null)
    setCanRetry(false)
    setGoalsOpen(true)
    setJaText('')
    setJaOut(null)
    setTryAt(null)
    setRevealed(new Set())
    setOpenFix(new Set())
    cid.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `c${Date.now()}${Math.random().toString(36).slice(2, 10)}`
    void ask([], sc)
  }

  const send = (text: string) => {
    const t = text.trim()
    if (!t || !scene || busy) return
    stopSpeaking()
    const next: Turn[] = [...turns, { role: 'user', text: t }]
    setTurns(next)
    setDraft('')
    void ask(next, scene)
  }

  /** 話す：リアルタイムの認識なら話しながら文字を出し、話し終えて少し黙ると自動で送る（止めて送るボタンでもすぐ送れる）。なければ録音して文字起こし */
  const startMic = async () => {
    if (session.current || rec.current || busy || starting) return
    stopSpeaking()
    setError(null)
    setStarting(true)
    play('start')
    const gen = ++micGen.current
    micText.current = ''
    lastFinal.current = ''
    setDraft('')
    try {
      const eng = engine === undefined ? await liveEngine() : engine
      if (eng) {
        const sess = await startLive({
          lang: 'en-US',
          onPartial: (t) => {
            // 送ったあとに遅れて届いた結果は捨てる（前の発言が二重に出ないように）
            if (gen !== micGen.current || !mounted.current) return
            clearTimeout(silence.current)
            setDraft((micText.current + ' ' + t).trim())
          },
          onFinal: (t) => {
            if (gen !== micGen.current) return
            const text = t.trim()
            // 同じ区切りが続けて届いたとき（端末の認識で起きる）は1回だけ使う
            if (!text || text.toLowerCase() === lastFinal.current.toLowerCase()) return
            lastFinal.current = text
            micText.current = (micText.current + ' ' + text).trim()
            if (!mounted.current) return
            setDraft(micText.current)
            // 話し終えて黙ったら自動で送る
            clearTimeout(silence.current)
            silence.current = setTimeout(() => void stopRef.current(), autoSendDelay(text, slowSpeaker))
          },
          onError: (m) => gen === micGen.current && mounted.current && setError(m),
          onEnd: () => {
            if (session.current === sess) session.current = null
            if (gen === micGen.current && mounted.current) setRecording(false)
          },
        })
        if (!mounted.current || gen !== micGen.current) {
          void sess.stop()
          return
        }
        session.current = sess
        setRecording(true)
        return
      }
      const r = new WavRecorder()
      r.onAutoStop = () => void stopRef.current()
      await r.start()
      rec.current = r
      setRecording(true)
    } catch {
      if (mounted.current) setError('マイクを使用できません。下のキーボードから入力することもできます')
    } finally {
      if (mounted.current) setStarting(false)
    }
  }

  const stopMic = async () => {
    clearTimeout(silence.current)
    if (session.current) {
      const s = session.current
      session.current = null
      play('stop')
      setRecording(false)
      // 止めた直前の区切りが届くのを待ってから送る（止める処理が終わると最後の確定が届く）
      await s.stop()
      const t = micText.current.trim()
      // ここから先に届く結果は、この発言のものでも使わない
      micGen.current++
      micText.current = ''
      if (!mounted.current) return
      if (t) send(t)
      else {
        setDraft('')
        setError('聞き取れませんでした。もう一度話してください')
      }
      return
    }
    const r = rec.current
    rec.current = null
    if (!r) return
    play('stop')
    setRecording(false)
    setBusy(true)
    try {
      const out = await r.stop()
      URL.revokeObjectURL(out.url)
      const text = await transcribe(out.wav, 'en-US')
      setBusy(false)
      if (text) send(text)
      else setError('聞き取れませんでした。もう一度話してください')
    } catch (e) {
      setBusy(false)
      if (mounted.current) setError(e instanceof ApiError ? e.message : '音声を文字にできませんでした')
    }
  }
  // 自動で送るとき（無音・録音の時間切れ）は、そのときの最新の stopMic を呼ぶ
  const stopRef = useRef(stopMic)
  useEffect(() => {
    stopRef.current = stopMic
  })

  /** 先生役に渡す、場面と、その発言までの会話 */
  const tutorBase = (k: number) => ({ level, scene: scene ? scenePrompt(scene) : '', context: turnsToSend(turns.slice(0, k + 1)) })

  /** 先生に日本語で質問する（会話の相手役とは別。会話の流れには入れない） */
  const ask2 = async () => {
    const q = askText.trim()
    if (!q || askBusy) return
    setAskBusy(true)
    setAskOut(null)
    try {
      const a = await askTutor(q, tutorBase(turns.length - 1))
      if (mounted.current) setAskOut(a)
    } catch (e) {
      if (mounted.current) setError(e instanceof ApiError ? e.message : '先生に接続できませんでした')
    } finally {
      if (mounted.current) setAskBusy(false)
    }
  }

  const showJa = async (k: number) => {
    const t = turns[k]
    if (!t || t.ja) return
    try {
      const r = await translate(t.text, 'ja', 'en')
      if (mounted.current) setTurns((prev) => prev.map((x, i) => (i === k ? { ...x, ja: r.text } : x)))
    } catch (e) {
      if (mounted.current) setError(e instanceof ApiError ? e.message : '訳を出せませんでした')
    }
  }

  const lastAi = [...turns].reverse().find((t) => t.role === 'assistant')
  const corrections = turns.filter((t) => t.role === 'user' && t.correction)
  const userTurns = turns.filter((t) => t.role === 'user').length
  const isSaved = (t: Turn) => !!t.correction && phrases.some((p) => p.better === t.correction!.better)

  // ───────── 会話中 ─────────
  if (scene && !done)
    return (
      <SessionShell
        onClose={() => {
          stopSpeaking()
          clearTimeout(silence.current)
          void session.current?.stop()
          rec.current?.cancel()
          rec.current = null
          setRecording(false)
          if (userTurns > 0) setDone(true)
          else setScene(null)
        }}
      >
        {/* 場面とやること（ゴール）。AI もこの順に話を進める */}
        <div className="mb-3 rounded-[14px] border border-line bg-surface">
          <button onClick={() => setGoalsOpen((v) => !v)} aria-expanded={goalsOpen} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
            <Flag className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.9} />
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
              {scene.title}
              <span className="ml-1.5 font-medium text-muted">{level}</span>
            </span>
            <span className="text-[12px] tabular-nums text-muted">{userTurns}回話した</span>
            <ChevronDown className={cx('h-4 w-4 shrink-0 text-faint transition-transform', goalsOpen && 'rotate-180')} />
          </button>
          {goalsOpen && (
            <ol className="space-y-1 px-3.5 pb-3 text-[13px] leading-snug">
              {scene.goals.map(([ja], k) => (
                <li key={k} className="flex gap-2">
                  <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-strong">{k + 1}</span>
                  {ja}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="space-y-3 pb-56" aria-live="polite">
          {turns.map((t, k) =>
            t.role === 'assistant' ? (
              <div key={k} className="max-w-[88%] rounded-[18px] rounded-tl-[6px] border border-line bg-surface p-3.5">
                <p className="en text-[17px] leading-snug">{t.text}</p>
                {t.ja && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t.ja}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <SpeakButton text={t.text} accent={accent} size="sm" />
                  <button
                    onClick={() => {
                      primeAudio()
                      void speak(t.text, { accent, rate: SLOW_RATE })
                    }}
                    aria-label="ゆっくり"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-ink active:scale-90"
                  >
                    <Snail className="h-[15px] w-[15px]" strokeWidth={1.9} />
                  </button>
                  {!t.ja && (
                    <button onClick={() => void showJa(k)} className="flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] font-semibold text-muted active:bg-surface-2">
                      <Languages className="h-4 w-4" strokeWidth={1.8} />
                      和訳
                    </button>
                  )}
                  <ReplyExplain text={t.text} base={tutorBase(k)} accent={accent} />
                </div>
              </div>
            ) : (
              <div key={k} className="ml-auto max-w-[88%]">
                <div className="rounded-[18px] rounded-tr-[6px] bg-brand-soft p-3.5">
                  <p className="en text-[17px] leading-snug">{t.text}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-end gap-x-1">
                  {t.correction === null && (
                    <span className="flex min-h-8 items-center gap-1 px-1 text-[12px] font-medium text-ok">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                      自然に伝わります
                    </span>
                  )}
                  {showFix && t.correction && !openFix.has(k) && (
                    <button
                      onClick={() => setOpenFix((v) => new Set(v).add(k))}
                      className="flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] font-semibold text-brand-strong active:bg-surface-2"
                    >
                      <PencilLine className="h-3.5 w-3.5" strokeWidth={2} />
                      より自然な言い方
                    </button>
                  )}
                  {t.correction !== undefined && <MineExplain text={t.text} base={tutorBase(k)} accent={accent} />}
                </div>
                {showFix && t.correction && openFix.has(k) && (
                  <div className="mt-1.5 rounded-[14px] border border-line bg-surface p-3">
                    <p className="text-[11.5px] font-semibold text-brand-strong">より自然な言い方</p>
                    <div className="mt-0.5 flex items-start gap-2">
                      <p className="en min-w-0 flex-1 text-[16px] leading-snug">{t.correction.better}</p>
                      <SpeakButton text={t.correction.better} accent={accent} size="sm" />
                    </div>
                    {t.correction.note && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{t.correction.note}</p>}
                  </div>
                )}
              </div>
            ),
          )}
          {/* 返事を生成中：届いたところから出す。まだ何も届いていなければ点の動きで待っていることを示す */}
          {busy && (
            <div className="max-w-[88%] rounded-[18px] rounded-tl-[6px] border border-line bg-surface p-3.5" aria-label="返事を待っています">
              {pending ? (
                <p className="en text-[17px] leading-snug">{pending}</p>
              ) : (
                <span className="flex h-6 items-center gap-1" aria-hidden>
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              )}
            </div>
          )}
          {showHint && (
            <div className="space-y-3 rounded-[14px] bg-warn-soft p-3">
              <Segmented
                size="sm"
                value={hintTab}
                onChange={setHintTab}
                options={[
                  { value: 'example', label: '返事の例' },
                  ...(health?.translator ? [{ value: 'ja' as const, label: '日本語→英語' }] : []),
                  { value: 'ask', label: '先生に質問' },
                ]}
              />
              {hintTab === 'example' &&
                (lastAi?.hint ? (
                  <div className="flex items-start gap-2">
                    <p className="en min-w-0 flex-1 text-[16px] leading-snug">{lastAi.hint}</p>
                    <SpeakButton text={lastAi.hint} accent={accent} size="sm" />
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">相手の返事が届くと、返事の例が出ます。</p>
                ))}
              {hintTab === 'ja' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void helpJa()
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      value={jaText}
                      onChange={(e) => {
                        setJaText(e.target.value.slice(0, 200))
                        setJaOut(null)
                      }}
                      placeholder="例：Mサイズでお願いします"
                      aria-label="言いたいことを日本語で"
                      className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[16px] outline-none focus:border-line-strong"
                    />
                    <Button type="submit" variant="ink" size="sm" className="min-h-11 shrink-0 px-3" disabled={!jaText.trim() || jaBusy}>
                      {jaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : '英語に'}
                    </Button>
                  </div>
                  {jaOut && (
                    <div className="mt-2 flex items-start gap-2">
                      <p className="en min-w-0 flex-1 text-[16px] leading-snug">{jaOut}</p>
                      <SpeakButton text={jaOut} accent={accent} size="sm" />
                    </div>
                  )}
                  {jaOut && <p className="mt-1 text-[12px] text-muted">聞いてから、自分の声で言ってみよう</p>}
                </form>
              )}
              {hintTab === 'ask' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void ask2()
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      value={askText}
                      onChange={(e) => {
                        setAskText(e.target.value.slice(0, 300))
                        setAskOut(null)
                      }}
                      placeholder="例：for here ってどういう意味？"
                      aria-label="先生に質問"
                      className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[16px] outline-none focus:border-line-strong"
                    />
                    <Button type="submit" variant="ink" size="sm" className="min-h-11 shrink-0 px-3" disabled={!askText.trim() || askBusy}>
                      {askBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : '質問'}
                    </Button>
                  </div>
                  {askOut && <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed">{askOut}</p>}
                  <p className="mt-1 text-[11.5px] text-muted">会話の相手とは別の先生が、日本語で答えます（会話には入りません）</p>
                </form>
              )}
            </div>
          )}
          {error && (
            <Notice>
              {error}
              {canRetry && !busy && (
                <button onClick={() => scene && void ask(turns, scene)} className="mt-1 flex items-center gap-1 font-semibold text-brand">
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
                  もう一度送る
                </button>
              )}
            </Notice>
          )}
          {userTurns >= SUGGEST_REVIEW_AFTER && !busy && (
            <button
              onClick={() => {
                stopSpeaking()
                setDone(true)
              }}
              className="flex w-full items-center justify-center gap-1 rounded-[14px] border border-dashed border-line-strong p-3 text-[13px] font-semibold text-muted"
            >
              よく話せました。振り返りで直しを見直す
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {/* 下の操作バーに隠れないよう、余白をとってスクロールする */}
          <div ref={bottom} className="scroll-mb-52" />
        </div>

        {/* 下の操作：話す（または入力）・ヒント */}
        <div className="glass fixed inset-x-0 bottom-0 z-10 px-4 pb-safe hairline-t">
          <div className="mx-auto max-w-[640px] py-3">
            {!recording && !draft && turns.length > 0 && (
              <div className="-mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]" aria-label="困ったときの言い方">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q.en}
                    onClick={() => send(q.en)}
                    disabled={busy}
                    title={q.en}
                    className="flex h-8 shrink-0 items-center rounded-full border border-line bg-surface px-3 text-[12px] font-semibold text-muted disabled:opacity-40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            {(recording || draft) && !typing && <p className="mb-2 line-clamp-3 min-h-6 text-[15px] leading-snug text-muted">{draft ? <span className="en">{draft}</span> : '聞き取っています。話し終えると自動で送ります'}</p>}
            {typing || !canMic ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(draft)
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  aria-label="ヒント"
                  aria-pressed={showHint}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line"
                >
                  <Lightbulb className="h-5 w-5" strokeWidth={1.9} />
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 600))}
                  placeholder="英語で返事を入力"
                  aria-label="英語で返事を入力"
                  autoCapitalize="sentences"
                  className="h-12 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[16px] outline-none focus:border-line-strong"
                />
                <button type="submit" disabled={!draft.trim() || busy} aria-label="送る" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-bg disabled:opacity-40">
                  <Send className="h-5 w-5" />
                </button>
                {canMic && (
                  <button type="button" onClick={() => setTyping(false)} aria-label="声で話す" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-ink">
                    <Mic className="h-5 w-5" />
                  </button>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowHint((v) => !v)}
                  disabled={recording}
                  aria-pressed={showHint}
                  className="flex h-12 min-w-[76px] items-center justify-center gap-1 rounded-full border border-line px-3 text-[13px] font-semibold disabled:opacity-40"
                >
                  <Lightbulb className="h-4 w-4" strokeWidth={1.9} />
                  ヒント
                </button>
                <button
                  onClick={() => void (recording ? stopMic() : startMic())}
                  disabled={(busy && !recording) || starting}
                  aria-label={recording ? '止めて送る' : '話す'}
                  className={cx(
                    'flex h-16 flex-1 items-center justify-center gap-2 rounded-full text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-40',
                    recording ? 'bg-ng text-white' : 'bg-brand text-on-brand',
                  )}
                >
                  {starting ? <Loader2 className="h-6 w-6 animate-spin" /> : recording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
                  {starting ? '準備中…' : recording ? '止めて送る' : '話す'}
                </button>
                <button
                  onClick={() => setTyping(true)}
                  disabled={recording}
                  aria-label="キーボードで入力"
                  className="flex h-12 min-w-[52px] items-center justify-center rounded-full border border-line disabled:opacity-40"
                >
                  <Keyboard className="h-5 w-5" strokeWidth={1.8} />
                </button>
              </div>
            )}
          </div>
        </div>
      </SessionShell>
    )

  // ───────── 振り返り ─────────
  if (scene && done)
    return (
      <div>
        <PageHeader title="会話の振り返り" back="/practice" />
        <div className="space-y-3 px-4 pb-8">
          <Guide
            pose={corrections.length === 0 ? 'celebrate' : 'happy'}
            text={
              corrections.length === 0
                ? `${userTurns}回話して、直すところはなかったワン！`
                : `${userTurns}回話したワン。まず自分で言い直してから答えを見よう。覚えたいものは★で保存できるよ。`
            }
          />
          {corrections.length > 0 && (
            <>
              <SectionTitle>より自然な言い方（{corrections.length}）</SectionTitle>
              {corrections.map((t, k) =>
                revealed.has(k) ? (
                  <Card key={k} className="space-y-1.5">
                    <p className="en text-[14px] text-muted line-through decoration-ng/60">{t.text}</p>
                    <div className="flex items-start gap-2">
                      <p className="en min-w-0 flex-1 text-[17px] leading-snug">{t.correction!.better}</p>
                      <SpeakButton text={t.correction!.better} accent={accent} size="sm" />
                      <button
                        onClick={() => toggleSave(t)}
                        aria-label={isSaved(t) ? '保存を取り消す' : '保存'}
                        aria-pressed={isSaved(t)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-surface-2"
                      >
                        <Star className={cx('h-[18px] w-[18px]', isSaved(t) ? 'fill-warn text-warn' : 'text-muted')} strokeWidth={1.8} />
                      </button>
                    </div>
                    {t.correction!.note && <p className="text-[12.5px] leading-relaxed text-muted">{t.correction!.note}</p>}
                    {tryAt === k ? (
                      <div className="pt-1">
                        <SpeakCheck text={t.correction!.better} accent={accent} source="chat" compact />
                      </div>
                    ) : (
                      <button onClick={() => setTryAt(k)} className="flex min-h-9 items-center gap-1 text-[13px] font-semibold text-brand">
                        <Mic className="h-4 w-4" strokeWidth={1.9} />
                        言ってみる
                      </button>
                    )}
                  </Card>
                ) : (
                  // 答えを見る前に、自分で言い直してもらう（言い直しを促すほうが、言い換えを見せるだけより身につきやすい）
                  <Card key={k} className="space-y-1.5">
                    <p className="text-[11.5px] font-semibold text-muted">あなたの英語</p>
                    <p className="en text-[17px] leading-snug">{t.text}</p>
                    {t.correction!.note && <p className="text-[12.5px] leading-relaxed text-muted">ヒント：{t.correction!.note}</p>}
                    <p className="text-[12.5px] text-muted">もっと自然に言うと？声に出して言い直してから、答えを見よう</p>
                    <Button variant="secondary" size="sm" onClick={() => setRevealed((v) => new Set(v).add(k))}>
                      <Eye className="h-4 w-4" strokeWidth={1.8} />
                      答えを見る
                    </Button>
                  </Card>
                ),
              )}
            </>
          )}
          <Button block size="lg" onClick={() => start(scene)}>
            <RotateCcw className="h-[18px] w-[18px]" />
            もう一度
          </Button>
          <Button block variant="secondary" onClick={() => setScene(null)}>
            ほかの場面を選ぶ
          </Button>
        </div>
      </div>
    )

  // ───────── はじめの画面：場面とレベルを選ぶ ─────────
  const ready = !!health?.chat
  const shownPhrases = showAllPhrases ? phrases : phrases.slice(0, 3)
  return (
    <div>
      <PageHeader title="AIと会話" subtitle="場面を選んで、AI と英語で話す。言い間違いは、より自然な言い方を教えてくれます" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        {health && !health.chat && (
          <Notice>
            AI 会話はサーバーの設定（Cloudflare か Groq のキー）がまだです。設定すると、無料の範囲で使えます。
            <Link to="/settings#cloud" className="ml-1 inline-flex items-center font-semibold text-brand">
              設定を見る
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Link>
          </Notice>
        )}
        {health === null && <Notice>サーバーに接続できません（オフライン、またはローカル開発サーバーで起動中）。</Notice>}
        <div>
          <p className="mb-1.5 px-1 text-[13px] font-semibold text-muted">相手が話す英語のレベル</p>
          <Segmented value={level} onChange={setLevel} options={CHAT_LEVELS.map((l) => ({ value: l.value, label: l.label }))} />
          <p className="mt-1 px-1 text-[12px] text-muted">{CHAT_LEVELS.find((l) => l.value === level)!.name}。迷ったら、少しやさしめから</p>
        </div>
        <SectionTitle>場面を選ぶ</SectionTitle>
        <List>
          {scenes.map((sc) => (
            <ListRow key={sc.id} title={sc.title} sub={sc.sub} onClick={ready ? () => start(sc) : undefined} className={ready ? undefined : 'opacity-50'} />
          ))}
        </List>

        {phrases.length > 0 && (
          <>
            <SectionTitle
              action={
                phrases.length > 3 && (
                  <button onClick={() => setShowAllPhrases((v) => !v)} className="text-[12.5px] font-semibold text-brand">
                    {showAllPhrases ? '閉じる' : 'すべて'}
                  </button>
                )
              }
            >
              保存した言い方（{phrases.length}）
            </SectionTitle>
            <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
              {shownPhrases.map((p, k) => (
                <div key={p.better} className={cx('flex items-start gap-2 py-3 pl-4 pr-2', k > 0 && 'hairline-t')}>
                  <div className="min-w-0 flex-1">
                    <p className="en text-[16px] leading-snug">{p.better}</p>
                    {p.note && <p className="mt-0.5 text-[12px] leading-snug text-muted">{p.note}</p>}
                  </div>
                  <SpeakButton text={p.better} accent={accent} size="sm" />
                  <button onClick={() => setPhrases(removePhrase(p.better))} aria-label="削除" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint active:bg-surface-2">
                    <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <Card className="space-y-1 py-2">
          <Toggle
            label="相手の返事を読み上げる"
            desc="聞き取りの練習に。オフにすると文字だけ"
            checked={autoSpeak}
            onChange={(v) => {
              setAutoSpeak(v)
              savePref('chat-speak', v)
            }}
          />
          <Toggle
            label="ゆっくり話す"
            desc="話し終えてから自動で送るまで、長めに待ちます（考えながら話すとき）"
            checked={slowSpeaker}
            onChange={(v) => {
              setSlowSpeaker(v)
              savePref('chat-slow', v)
            }}
          />
          <Toggle
            label="会話の途中で直しを出す"
            desc="小さなボタンで出し、押すと開きます。オフにすると、直しは最後の振り返りでまとめて見られます"
            checked={showFix}
            onChange={(v) => {
              setShowFix(v)
              savePref('chat-fix', v)
            }}
          />
        </Card>
        <p className="px-1 text-[12px] leading-relaxed text-muted">
          話した英語は文字にして、AI（Cloudflare Workers AI または Groq）に送ります。会話の中身はサーバーに保存しません。★で保存した言い方だけ、この端末に残ります。AI の直しはときどき外れることがあります。1日 {DAILY_LIMIT} 回までです。
        </p>
      </div>
    </div>
  )
}
