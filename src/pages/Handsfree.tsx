import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, Pause, Play, Plus, SkipForward, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { ResultCard, SessionShell } from '@/components/Session'
import { Button, Card, Chip, Segmented, Toggle, cx } from '@/components/ui'
import { bumpDaily } from '@/lib/db'
import {
  BLOCK_SIZE,
  HF_KINDS,
  HF_MINUTES,
  HF_PACES,
  buildPools,
  composeMs,
  formatClock,
  playableKinds,
  repeatMs,
  takeBlock,
  thinkMs,
  userRole,
  type HfCursors,
  type HfItem,
  type HfKind,
  type HfPools,
} from '@/lib/handsfree'
import { useToday } from '@/lib/hooks'
import { accentFor, formatMinutes, useSettings } from '@/lib/settings'
import { play } from '@/lib/sounds'
import { prefetchSpeech, speak, speakJa, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { jaForSpeech, plain } from '@/lib/vocab'
import { sceneAccent } from '@/data/scenes/helpers'
import { useWakeLock, wakeLockSupported } from '@/lib/wakeLock'

type Phase = 'cue' | 'prompt' | 'think' | 'answer' | 'example' | 'listen' | 'yourturn' | 'model'

interface View {
  kind: HfKind
  phase: Phase
  en?: string
  ja?: string
  /** 会話の話し手・場面 */
  speaker?: string
  scene?: string
  big?: boolean
  /** 答えが出るまで隠す側（単語を思い出す問題） */
  hide?: 'en' | 'ja'
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const kindTitle = (k: HfKind) => HF_KINDS.find((x) => x.key === k)!.title

/** いまの段階の指示（離れていても読めるよう大きく出す） */
function phaseLabel(v: View): string {
  if (v.phase === 'cue') return kindTitle(v.kind)
  if (v.phase === 'think') return '思い出して…'
  if (v.phase === 'answer') return '答え'
  if (v.phase === 'example') return '例文'
  if (v.phase === 'model') return 'もう一度、まねして'
  if (v.phase === 'yourturn') return v.kind === 'compose' ? '英語で言って' : 'まねして言って'
  return '聞いて'
}

/**
 * ながら練習。家事や身支度をしながら、画面を見ずに耳と声で練習する。
 * はじめに時間・内容・間の長さを決め、あとは流しっぱなし。時間になったら区切りのよいところで終わる。
 */
export default function Handsfree() {
  const nav = useNavigate()
  const s = useSettings()
  const today = useToday()
  const [stage, setStage] = useState<'setup' | 'loading' | 'run' | 'done'>('setup')
  const [running, setRunning] = useState(false)
  const [view, setView] = useState<View | null>(null)
  const [, setTick] = useState(0)
  const [autoPaused, setAutoPaused] = useState(false)
  const [summary, setSummary] = useState({ words: 0, sentences: 0, scenes: 0 })
  const [empty, setEmpty] = useState(false)

  const pools = useRef<HfPools | null>(null)
  const runId = useRef(0)
  const target = useRef(s.hfMinutes * 60_000)
  /** 練習した時間（一時停止中は数えない） */
  const acc = useRef(0)
  const startedAt = useRef(0)
  const lastBump = useRef(0)
  const blockNo = useRef(0)
  const block = useRef<{ kind: HfKind; items: HfItem[]; i: number; cued: boolean } | null>(null)
  const cursors = useRef<HfCursors>({ words: 0, repeat: 0, compose: 0, dialogue: 0 })
  const announced = useRef(new Set<HfKind>())
  const counts = useRef({ words: 0, sentences: 0, scenes: 0 })
  /** いまの問題の答え（お手本）まで聞いたか。そこで「次へ」を押したら、1問やったことにする */
  const heard = useRef(false)

  useWakeLock(running)

  const elapsed = () => acc.current + (startedAt.current ? performance.now() - startedAt.current : 0)
  const startClock = () => {
    if (!startedAt.current) startedAt.current = performance.now()
  }
  const stopClock = () => {
    if (startedAt.current) acc.current += performance.now() - startedAt.current
    startedAt.current = 0
  }
  /** 学習時間を日々の記録に足す（途中でやめても失われないよう、1問ごとに） */
  const flush = () => {
    const sec = Math.floor((elapsed() - lastBump.current) / 1000)
    if (sec <= 0) return
    lastBump.current += sec * 1000
    void bumpDaily({ seconds: sec }).catch(() => undefined)
  }

  // 残り時間の表示を更新する
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTick((x) => x + 1), 500)
    return () => clearInterval(t)
  }, [running])

  // ほかのアプリに切り替えると読み上げが止まるので、一時停止にしておく
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden' && runId.current && startedAt.current) {
        pause()
        setAutoPaused(true)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  })

  // 画面を離れたら止める
  useEffect(
    () => () => {
      runId.current++
      stopSpeaking()
      flush()
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // イヤホン・ロック画面のボタン（対応している端末のみ）
  useEffect(() => {
    const ms = navigator.mediaSession
    if (!ms || stage !== 'run') return
    try {
      ms.metadata = new MediaMetadata({ title: view ? kindTitle(view.kind) : 'ながら練習', artist: 'Eliza Patina' })
      ms.setActionHandler('play', () => resume())
      ms.setActionHandler('pause', () => pause())
      ms.setActionHandler('nexttrack', () => skip())
    } catch {
      /* 対応していない操作は無視 */
    }
    return () => {
      try {
        for (const a of ['play', 'pause', 'nexttrack'] as const) ms.setActionHandler(a, null)
      } catch {
        /* noop */
      }
    }
  })

  const announce = async (kind: HfKind, alive: () => boolean) => {
    setView({ kind, phase: 'cue' })
    play('tap')
    if (s.hfCues) {
      const k = HF_KINDS.find((x) => x.key === kind)!
      await speakJa(announced.current.has(kind) ? k.again : k.cue)
      announced.current.add(kind)
    } else await sleep(800)
    if (alive()) await sleep(500)
  }

  const playItem = async (item: HfItem, alive: () => boolean) => {
    const pace = s.hfPace
    heard.current = false
    if (item.kind === 'words') {
      const w = item.word
      const accent = accentFor(w.cat)
      const ex = w.ex[0] ? plain(w.ex[0].en) : ''
      prefetchSpeech([{ text: w.w, accent }, ...(ex ? [{ text: ex, accent }] : [])])
      const en = () => speak(w.w, { accent })
      const ja = () => speakJa(jaForSpeech(w.ja))
      const base = { kind: item.kind, en: w.w, ja: w.ja, big: true } as const
      const hide = item.dir === 'ja-en' ? 'en' : 'ja'
      setView({ ...base, phase: 'prompt', hide })
      await (item.dir === 'ja-en' ? ja() : en())
      if (!alive()) return
      setView({ ...base, phase: 'think', hide })
      await sleep(thinkMs(pace))
      if (!alive()) return
      setView({ ...base, phase: 'answer' })
      heard.current = true
      await (item.dir === 'ja-en' ? en() : ja())
      if (!alive()) return
      if (ex) {
        await sleep(400)
        if (!alive()) return
        setView({ kind: item.kind, phase: 'example', en: ex, ja: w.ex[0].ja })
        await speak(ex, { accent })
      }
      if (alive()) await sleep(900)
      return
    }
    if (item.kind === 'repeat') {
      const { en, ja, accent } = item.s
      prefetchSpeech([{ text: en, accent }])
      setView({ kind: item.kind, phase: 'listen', en, ja })
      await speak(en, { accent })
      if (!alive()) return
      setView({ kind: item.kind, phase: 'yourturn', en, ja })
      await sleep(repeatMs(en, pace))
      if (!alive()) return
      // もう一度お手本を聞いて、重ねて言う
      setView({ kind: item.kind, phase: 'model', en, ja })
      heard.current = true
      await speak(en, { accent })
      if (alive()) await sleep(900)
      return
    }
    if (item.kind === 'compose') {
      const { en, ja, accent } = item.s
      prefetchSpeech([{ text: en, accent }])
      setView({ kind: item.kind, phase: 'prompt', ja })
      await speakJa(ja)
      if (!alive()) return
      setView({ kind: item.kind, phase: 'yourturn', ja })
      await sleep(composeMs(en, pace))
      if (!alive()) return
      setView({ kind: item.kind, phase: 'answer', en, ja })
      heard.current = true
      await speak(en, { accent })
      if (!alive()) return
      // 答えの文もまねして言う
      setView({ kind: item.kind, phase: 'model', en, ja })
      await sleep(repeatMs(en, pace))
      if (alive()) await sleep(400)
      return
    }
    const sc = item.scene
    const accent = sceneAccent(sc)
    const me = userRole(sc)
    const first = sc.lines[0]?.sp
    const name = (id: string) => sc.roles.find((r) => r.id === id)?.name ?? id
    prefetchSpeech(sc.lines.slice(0, 4).map((l) => ({ text: l.en, accent, voice: l.sp === first ? ('main' as const) : ('alt' as const) })))
    if (s.hfCues) {
      setView({ kind: item.kind, phase: 'cue', scene: sc.title })
      await speakJa(sc.title)
      if (!alive()) return
      await sleep(400)
    }
    for (const l of sc.lines) {
      if (!alive()) return
      const v = { kind: item.kind, en: l.en, ja: l.ja, speaker: name(l.sp) === 'You' ? 'あなた' : name(l.sp), scene: sc.title }
      setView({ ...v, phase: 'listen' })
      heard.current = true
      await speak(l.en, { accent, voice: l.sp === first ? 'main' : 'alt' })
      if (!alive()) return
      if (l.sp === me) {
        setView({ ...v, phase: 'yourturn' })
        await sleep(repeatMs(l.en, pace))
        if (!alive()) return
      }
      await sleep(500)
    }
  }

  const count = (item: HfItem) => {
    if (item.kind === 'words') counts.current.words++
    else if (item.kind === 'dialogue') counts.current.scenes++
    else counts.current.sentences++
    void bumpDaily({ listening: 1 }).catch(() => undefined)
  }

  const finish = () => {
    runId.current++
    stopClock()
    flush()
    setRunning(false)
    setSummary({ ...counts.current })
    setStage('done')
    if (s.hfCues) void speakJa(`おつかれさまでした。${Math.max(1, Math.round(elapsed() / 60000))}分の練習が終わりました。`)
  }

  const run = async () => {
    const p = pools.current
    if (!p) return
    const kinds = playableKinds(s.hfKinds, p)
    if (!kinds.length) return
    const my = ++runId.current
    const alive = () => runId.current === my
    setAutoPaused(false)
    setRunning(true)
    startClock()
    while (alive()) {
      let b = block.current
      if (!b || b.i >= b.items.length) {
        if (elapsed() >= target.current) break
        const kind = kinds[blockNo.current % kinds.length]
        blockNo.current++
        const t = takeBlock(kind, p, cursors.current)
        cursors.current = t.cursors
        b = block.current = { kind, items: t.items, i: 0, cued: false }
      }
      if (!b.cued) {
        await announce(b.kind, alive)
        if (!alive()) return
        b.cued = true
      }
      const item = b.items[b.i]
      await playItem(item, alive)
      if (!alive()) return
      b.i++
      count(item)
      flush()
      // 時間になったら、まとまりの途中でも1問の区切りで終える
      if (elapsed() >= target.current) break
    }
    if (alive()) finish()
  }

  function pause() {
    runId.current++
    stopSpeaking()
    stopClock()
    flush()
    setRunning(false)
  }
  function resume() {
    warmUpSpeech()
    void run()
  }
  function skip() {
    const b = block.current
    stopSpeaking()
    if (b) {
      if (!b.cued) b.cued = true
      else {
        if (heard.current && b.items[b.i]) count(b.items[b.i])
        heard.current = false
        b.i++
      }
    }
    void run()
  }

  const start = async () => {
    warmUpSpeech()
    setStage('loading')
    if (!pools.current) pools.current = await buildPools()
    if (!playableKinds(s.hfKinds, pools.current).length) {
      setEmpty(true)
      setStage('setup')
      return
    }
    setEmpty(false)
    target.current = s.hfMinutes * 60_000
    acc.current = 0
    lastBump.current = 0
    startedAt.current = 0
    blockNo.current = 0
    block.current = null
    counts.current = { words: 0, sentences: 0, scenes: 0 }
    setView(null)
    setStage('run')
    void run()
  }

  const extend = (min: number) => {
    target.current = elapsed() + min * 60_000
    setStage('run')
    resume()
  }

  // ───────── 練習中 ─────────
  if (stage === 'run' || stage === 'loading') {
    const left = target.current - elapsed()
    const v = view
    const showEn = !!v?.en && v.hide !== 'en'
    const showJa = !!v?.ja && v.hide !== 'ja'
    return (
      <SessionShell
        onClose={() => {
          // 答えまで聞いた問題は、やったことにする
          const b = block.current
          if (heard.current && b?.items[b.i]) {
            count(b.items[b.i])
            heard.current = false
            b.i++
          }
          // 少しでも練習していれば結果を出す（すぐにやめたときは設定に戻る）
          if (counts.current.words + counts.current.sentences + counts.current.scenes > 0 || elapsed() >= 15_000) finish()
          else {
            pause()
            setStage('setup')
          }
        }}
        progress={{ value: Math.min(elapsed(), target.current), max: target.current }}
        label={formatClock(left)}
      >
        <div className="flex min-h-[calc(100dvh-8rem)] flex-col pb-8">
          {stage === 'loading' || !v ? (
            <p className="mt-16 text-center text-muted">準備しています…</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 text-[12.5px] font-medium text-muted">
                <span>{kindTitle(v.kind)}</span>
                {v.scene && <span className="min-w-0 truncate">{v.scene}</span>}
              </div>
              <p className={cx('mt-6 text-center text-[22px] font-semibold', v.phase === 'yourturn' || v.phase === 'think' ? 'text-brand' : 'text-ink')} aria-live="polite">
                {running ? phaseLabel(v) : autoPaused ? 'ほかのアプリに切り替えたので止めました' : '一時停止中'}
              </p>
              <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
                {v.speaker && <p className="mb-2 text-[13px] font-medium text-muted">{v.speaker}</p>}
                <p className={cx('en font-medium leading-tight transition-opacity duration-300', v.big ? 'text-[42px]' : 'text-[26px] leading-snug', showEn ? 'opacity-100' : 'opacity-0')}>
                  {v.en ?? ' '}
                </p>
                <p
                  className={cx(
                    'leading-relaxed transition-opacity duration-300',
                    // 日本語が問題のとき（英語がまだ出ていないとき）は、日本語を大きく
                    showEn ? 'mt-3 text-[17px] text-muted' : 'order-first mb-3 text-[26px] font-medium text-ink',
                    showJa ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {v.ja ?? ' '}
                </p>
              </div>
            </>
          )}
          <div className="mt-8 flex items-center justify-center gap-8">
            <span className="h-14 w-14" />
            <button
              aria-label={running ? '一時停止' : '再開'}
              onClick={() => (running ? pause() : resume())}
              disabled={stage === 'loading'}
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-ink text-bg transition active:scale-95 disabled:opacity-40"
            >
              {running ? <Pause className="h-9 w-9 fill-current" strokeWidth={1.5} /> : <Play className="h-9 w-9 translate-x-0.5 fill-current" strokeWidth={1.5} />}
            </button>
            <button
              aria-label="次へ"
              onClick={skip}
              disabled={stage === 'loading'}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-line-strong text-ink active:bg-surface-2 disabled:opacity-40"
            >
              <SkipForward className="h-6 w-6" strokeWidth={1.7} />
            </button>
          </div>
          {!wakeLockSupported() && (
            <p className="mt-5 text-center text-[12px] leading-relaxed text-muted">
              この端末では画面が自動で消えると止まります。iPhone の「設定 → 画面表示と明るさ → 自動ロック」を長めにしてください。
            </p>
          )}
        </div>
      </SessionShell>
    )
  }

  // ───────── 終わり ─────────
  if (stage === 'done') {
    const min = Math.max(1, Math.round(acc.current / 60000))
    const parts = [
      summary.words && `単語 ${summary.words}語`,
      summary.sentences && `文 ${summary.sentences}文`,
      summary.scenes && `会話 ${summary.scenes}場面`,
    ].filter(Boolean)
    return (
      <SessionShell onClose={() => nav('/practice')}>
        <div className="space-y-3 pb-8">
          <ResultCard value={min} unit="分" caption={`ながら練習 ・ ${parts.join('・') || 'おつかれさまでした'}`}>
            <p className="text-[13px] leading-relaxed text-muted">今日の学習時間に記録しました。声に出した英語は、使うほど自分のものになります。</p>
          </ResultCard>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => extend(5)}>
              <Plus className="h-[18px] w-[18px]" />
              あと5分
            </Button>
            <Button onClick={() => nav('/practice')}>終える</Button>
          </div>
        </div>
      </SessionShell>
    )
  }

  // ───────── はじめる前の設定 ─────────
  const todayMin = Math.round((today?.seconds ?? 0) / 60)
  const kinds = s.hfKinds
  const toggleKind = (k: HfKind) => {
    const next = kinds.includes(k) ? kinds.filter((x) => x !== k) : HF_KINDS.map((x) => x.key).filter((x) => x === k || kinds.includes(x))
    if (next.length) s.set({ hfKinds: next })
  }
  return (
    <div>
      <PageHeader title="ながら練習" subtitle="家事や身支度をしながら、耳と声で" back="/practice" />
      <div className="space-y-4 px-4 pb-8">
        <Guide who="moka" pose="cheer" text="料理や着替えのあいだも練習になるよ♪ 画面は見なくて大丈夫。声に出すと覚えやすいんだ！" />

        <Card>
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-medium">何分やる？</p>
            <p className="text-[12px] tabular-nums text-muted">
              今日 {formatMinutes(todayMin)} / 目標 {formatMinutes(s.dailyMinutes)}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {HF_MINUTES.map((m) => (
              <Chip key={m} active={s.hfMinutes === m} onClick={() => s.set({ hfMinutes: m })} className="min-w-[60px] justify-center">
                {formatMinutes(m)}
              </Chip>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-muted">時間になったら、区切りのよいところで終わります。途中で「あと5分」ものばせます。</p>
        </Card>

        <Card>
          <p className="text-[15px] font-medium">内容</p>
          <p className="mt-0.5 text-[12px] text-muted">選んだものを順番にくり返します（{kinds.length}種類）</p>
          <div className="mt-3 space-y-2">
            {HF_KINDS.map((k) => {
              const on = kinds.includes(k.key)
              return (
                <button
                  key={k.key}
                  aria-pressed={on}
                  onClick={() => toggleKind(k.key)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition active:scale-[0.99]',
                    on ? 'border-ink bg-surface' : 'border-line bg-surface',
                  )}
                >
                  <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px]', on ? 'border-ink bg-ink text-bg' : 'border-line-strong')}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[14.5px] font-medium">{k.title}</span>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-faint">{k.key === 'dialogue' ? '1場面ずつ' : `${BLOCK_SIZE[k.key]}問ずつ`}</span>
                    </span>
                    <span className="block text-[12px] leading-snug text-muted">{k.sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="mb-2 text-[15px] font-medium">考える・言う間</p>
            <Segmented size="sm" value={s.hfPace} onChange={(v) => s.set({ hfPace: v })} options={HF_PACES.map((p) => ({ value: p.key, label: p.label }))} />
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">手が離せない作業のときは「ゆっくり」がおすすめ。間の長さは文の長さに合わせて変わります。</p>
          </div>
          <Toggle label="日本語の案内" desc="まとまりの始めに、何の練習かを日本語で伝えます" checked={s.hfCues} onChange={(v) => s.set({ hfCues: v })} />
        </Card>

        {empty && <p className="text-[13px] text-ng">選んだ内容で出せる問題がありません。ほかの内容も選んでください。</p>}
        <Button block size="lg" onClick={() => void start()}>
          {formatMinutes(s.hfMinutes)}はじめる
        </Button>

        <ul className="space-y-1.5 px-1 text-[12px] leading-relaxed text-muted">
          <li>・スマホは立てかけて置いてください。練習中は画面が消えないようにします</li>
          <li>・答え合わせはしないので、復習の予定は変わりません。練習した時間は今日の学習に入ります</li>
        </ul>
        <p className="flex gap-2 px-1 text-[12px] leading-relaxed text-muted">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={1.8} />
          火や刃物を使うときは、手元に集中してください。周りの音が聞こえる音量で使いましょう。
        </p>
      </div>
    </div>
  )
}
