import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Check, ChevronRight, Keyboard, Languages, Lightbulb, Loader2, Mic, RotateCcw, Send, Square } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SessionShell } from '@/components/Session'
import { Button, Card, List, ListRow, Notice, Segmented, SectionTitle, SpeakButton, Toggle, cx } from '@/components/ui'
import { chatScenes, type ChatScene } from '@/data/chatScenes'
import { ApiError, chat, transcribe, translate, type ChatReply, type ChatTurn } from '@/lib/api'
import { bumpDaily } from '@/lib/db'
import { useHealth } from '@/lib/hooks'
import { liveEngine, startLive, type LiveSession } from '@/lib/live'
import { WavRecorder } from '@/lib/recorder'
import { useSettings } from '@/lib/settings'
import { play } from '@/lib/sounds'
import { primeAudio, speak, stopSpeaking, warmUpSpeech } from '@/lib/tts'

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

/** AI に送る会話の長さ（サーバーの上限 16 発言。古い発言から落とす） */
const SEND_TURNS = 16
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
  const session = useRef<LiveSession | null>(null)
  const rec = useRef<WavRecorder | null>(null)
  const micText = useRef('')
  const mounted = useRef(true)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stopSpeaking()
      rec.current?.cancel()
      void session.current?.stop()
    }
  }, [])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, busy, showHint])

  const canMic = !!health?.speech || !!health?.realtime

  /** AI に会話を送り、返事・直し・ヒントを受け取る */
  const ask = async (history: Turn[], sc: ChatScene) => {
    if (usedToday() >= DAILY_LIMIT) {
      setError(`今日は ${DAILY_LIMIT} 回話しました。続きはまた明日（無料枠を使い切らないための上限です）`)
      return
    }
    setBusy(true)
    setError(null)
    setShowHint(false)
    try {
      const r = await chat(sc.role, level, turnsToSend(history))
      countUse()
      if (!mounted.current) return
      setTurns((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'user') next[next.length - 1] = { ...last, correction: r.correction }
        next.push({ role: 'assistant', text: r.reply, hint: r.hint })
        return next
      })
      void bumpDaily({ seconds: 20 }).catch(console.error)
      if (autoSpeak) {
        primeAudio()
        void speak(r.reply, { accent })
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof ApiError ? e.message : 'オフラインのため話せません。通信を確かめてください')
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  const start = (sc: ChatScene) => {
    warmUpSpeech()
    primeAudio()
    setScene(sc)
    setTurns([])
    setDone(false)
    setDraft('')
    setError(null)
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

  /** 話す：リアルタイムの認識なら話しながら文字を出し、止めたら送る。なければ録音して文字起こし */
  const startMic = async () => {
    if (session.current || rec.current || busy) return
    stopSpeaking()
    setError(null)
    play('start')
    micText.current = ''
    setDraft('')
    try {
      const eng = await liveEngine()
      if (eng) {
        const sess = await startLive({
          lang: 'en-US',
          onPartial: (t) => mounted.current && setDraft((micText.current + ' ' + t).trim()),
          onFinal: (t) => {
            micText.current = (micText.current + ' ' + t).trim()
            if (mounted.current) setDraft(micText.current)
          },
          onError: (m) => mounted.current && setError(m),
          onEnd: () => {
            if (session.current === sess) session.current = null
            if (mounted.current) setRecording(false)
          },
        })
        session.current = sess
        setRecording(true)
        return
      }
      const r = new WavRecorder()
      r.onAutoStop = () => void stopMic()
      await r.start()
      rec.current = r
      setRecording(true)
    } catch {
      if (mounted.current) setError('マイクを使用できません。下のキーボードから入力することもできます')
    }
  }

  const stopMic = async () => {
    play('stop')
    setRecording(false)
    if (session.current) {
      const s = session.current
      session.current = null
      await s.stop()
      // 最後の確定を待ってから送る（止めた直前の言葉が落ちないように）
      setTimeout(() => {
        if (!mounted.current) return
        const t = micText.current.trim()
        if (t) send(t)
        else setError('聞き取れませんでした。もう一度話してください')
      }, 300)
      return
    }
    const r = rec.current
    rec.current = null
    if (!r) return
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

  // ───────── 会話中 ─────────
  if (scene && !done)
    return (
      <SessionShell
        onClose={() => {
          stopSpeaking()
          void session.current?.stop()
          rec.current?.cancel()
          rec.current = null
          setRecording(false)
          if (userTurns > 0) setDone(true)
          else setScene(null)
        }}
      >
        <p className="mb-3 text-[13px] font-medium text-muted">
          {scene.title}（{level}）
        </p>
        <div className="space-y-3 pb-56" aria-live="polite">
          {turns.map((t, k) =>
            t.role === 'assistant' ? (
              <div key={k} className="max-w-[88%] rounded-[18px] rounded-tl-[6px] border border-line bg-surface p-3.5">
                <p className="en text-[17px] leading-snug">{t.text}</p>
                {t.ja && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t.ja}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <SpeakButton text={t.text} accent={accent} size="sm" />
                  {!t.ja && (
                    <button onClick={() => void showJa(k)} className="flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] font-semibold text-muted active:bg-surface-2">
                      <Languages className="h-4 w-4" strokeWidth={1.8} />
                      和訳
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div key={k} className="ml-auto max-w-[88%]">
                <div className="rounded-[18px] rounded-tr-[6px] bg-brand-soft p-3.5">
                  <p className="en text-[17px] leading-snug">{t.text}</p>
                </div>
                {t.correction ? (
                  <div className="mt-1.5 rounded-[14px] border border-line bg-surface p-3">
                    <p className="text-[11.5px] font-semibold text-brand-strong">より自然な言い方</p>
                    <div className="mt-0.5 flex items-start gap-2">
                      <p className="en min-w-0 flex-1 text-[16px] leading-snug">{t.correction.better}</p>
                      <SpeakButton text={t.correction.better} accent={accent} size="sm" />
                    </div>
                    {t.correction.note && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{t.correction.note}</p>}
                  </div>
                ) : (
                  t.correction === null && (
                    <p className="mt-1 flex items-center justify-end gap-1 text-[12px] font-medium text-ok">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                      自然に伝わります
                    </p>
                  )
                )}
              </div>
            ),
          )}
          {busy && (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              考え中…
            </p>
          )}
          {showHint && lastAi?.hint && (
            <div className="rounded-[14px] bg-warn-soft p-3">
              <p className="text-[11.5px] font-semibold text-muted">返事の例</p>
              <div className="mt-0.5 flex items-start gap-2">
                <p className="en min-w-0 flex-1 text-[16px] leading-snug">{lastAi.hint}</p>
                <SpeakButton text={lastAi.hint} accent={accent} size="sm" />
              </div>
            </div>
          )}
          {error && <Notice>{error}</Notice>}
          <div ref={bottom} />
        </div>

        {/* 下の操作：話す（または入力）・ヒント */}
        <div className="glass fixed inset-x-0 bottom-0 z-10 px-4 pb-safe hairline-t">
          <div className="mx-auto max-w-[640px] py-3">
            {(recording || draft) && !typing && <p className="en mb-2 line-clamp-3 min-h-6 text-[15px] leading-snug text-muted">{draft || 'Listening…'}</p>}
            {typing || !canMic ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(draft)
                }}
              >
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
                  disabled={!lastAi?.hint || recording}
                  aria-pressed={showHint}
                  className="flex h-12 min-w-[76px] items-center justify-center gap-1 rounded-full border border-line px-3 text-[13px] font-semibold disabled:opacity-40"
                >
                  <Lightbulb className="h-4 w-4" strokeWidth={1.9} />
                  ヒント
                </button>
                <button
                  onClick={() => void (recording ? stopMic() : startMic())}
                  disabled={busy && !recording}
                  aria-label={recording ? '止めて送る' : '話す'}
                  className={cx(
                    'flex h-16 flex-1 items-center justify-center gap-2 rounded-full text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-40',
                    recording ? 'bg-ng text-white' : 'bg-brand text-on-brand',
                  )}
                >
                  {recording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
                  {recording ? '止めて送る' : '話す'}
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
                : `${userTurns}回話したワン。下の「より自然な言い方」を声に出して覚えよう。`
            }
          />
          {corrections.length > 0 && (
            <>
              <SectionTitle>より自然な言い方（{corrections.length}）</SectionTitle>
              {corrections.map((t, k) => (
                <Card key={k} className="space-y-1.5">
                  <p className="en text-[14px] text-muted line-through decoration-ng/60">{t.text}</p>
                  <div className="flex items-start gap-2">
                    <p className="en min-w-0 flex-1 text-[17px] leading-snug">{t.correction!.better}</p>
                    <SpeakButton text={t.correction!.better} accent={accent} size="sm" />
                  </div>
                  {t.correction!.note && <p className="text-[12.5px] leading-relaxed text-muted">{t.correction!.note}</p>}
                </Card>
              ))}
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
        </Card>
        <p className="px-1 text-[12px] leading-relaxed text-muted">
          話した英語は文字にして、AI（Cloudflare Workers AI または Groq）に送ります。会話はサーバーにも端末にも保存しません。AI の直しはときどき外れることがあります。1日 {DAILY_LIMIT} 回までです。
        </p>
      </div>
    </div>
  )
}
