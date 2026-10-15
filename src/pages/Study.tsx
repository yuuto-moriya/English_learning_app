import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Check, Eye, Headphones, Lightbulb, X } from 'lucide-react'
import { Guide } from '@/components/Guide'
import { Button, Card, ProgressBar, SpeakButton, cx } from '@/components/ui'
import { WordBody, WordHead } from '@/components/WordInfo'
import { buildSession, checkSpelling, reinsert, type Item } from '@/lib/session'
import { objectiveGrade, previewIntervals, Rating, recordReview, humanizeDiff, type Grade } from '@/lib/srs'
import { db, type CardRow } from '@/lib/db'
import { useSettings, getSettings } from '@/lib/settings'
import { speak, stopSpeaking } from '@/lib/tts'
import { correctMessage, sessionDoneMessage, wrongMessage, type GuideLine } from '@/lib/guide'
import { distractors, loadCategory, markedTarget, shuffle, plain } from '@/lib/vocab'
import type { Word } from '@/lib/types'

type Phase = 'loading' | 'start' | 'question' | 'feedback' | 'done' | 'empty'

export default function Study() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const settings = useSettings()
  const [queue, setQueue] = useState<Item[]>([])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [result, setResult] = useState<{ correct: boolean; grade?: Grade; next?: string; answer?: string } | null>(null)
  const [guide, setGuide] = useState<GuideLine | null>(null)
  const stats = useRef({ correct: 0, total: 0, streak: 0, started: Date.now() })

  useEffect(() => {
    buildSession(getSettings(), { extra: params.get('extra') === '1' }).then((q) => {
      setQueue(q)
      setPhase(q.length ? 'start' : 'empty')
    })
    return () => stopSpeaking()
  }, [params])

  const item = queue[idx]
  const counts = useMemo(() => {
    const n = queue.filter((i) => i.type === 'learn').length
    return { newCount: n, due: queue.filter((i) => !i.isNew).length }
  }, [queue])

  const next = () => {
    setResult(null)
    setGuide(null)
    if (idx + 1 >= queue.length) {
      setPhase('done')
      const m = Math.max(1, Math.round((Date.now() - stats.current.started) / 60000))
      setGuide(sessionDoneMessage(stats.current.correct, stats.current.total, m))
      return
    }
    setIdx(idx + 1)
    setPhase('question')
  }

  // 連打・ダブルタップで同じ問題の復習が二重に記録されないようにする
  const busy = useRef(false)
  const answer = async (correct: boolean, ms: number, opts: { grade?: Grade; answer?: string; typed?: boolean } = {}) => {
    if (!item || busy.current || phase !== 'question') return
    busy.current = true
    setPhase('feedback')
    try {
      const grade = opts.grade ?? objectiveGrade(correct, ms, opts.typed)
      let nextStr: string | undefined
      if (!item.retry) {
        stats.current.total++
        if (correct) stats.current.correct++
        try {
          const row = await recordReview(item.word, grade, item.type, ms, settings.retention)
          nextStr = humanizeDiff(row.due - Date.now())
        } catch (e) {
          // 保存に失敗しても学習は続けられるようにする（フィードバックは表示する）
          console.error(e)
        }
      }
      stats.current.streak = correct ? stats.current.streak + 1 : 0
      if (!correct) setQueue((q) => reinsert(q, idx, item))
      setGuide(correct ? correctMessage(stats.current.streak) : wrongMessage())
      setResult({ correct, grade, next: nextStr, answer: opts.answer })
      if (settings.autoPlay) speak(item.word.ex[0]?.en ?? item.word.w, { accent: item.word.cat === 'rail' ? 'en-GB' : 'en-US' })
    } finally {
      busy.current = false
    }
  }

  if (phase === 'loading') return <div className="p-8 text-center text-muted">準備中…</div>

  if (phase === 'empty')
    return (
      <Shell onClose={() => nav('/')}>
        <Guide pose="celebrate" text="今は復習も新出語もないワン！リスニングやシーン会話で「使う」練習をしよう。" />
        <div className="mt-6 grid gap-2">
          <Button onClick={() => nav('/study?extra=1')}>追加で新出語を5語学ぶ</Button>
          <Button variant="secondary" onClick={() => nav('/practice')}>練習メニューへ</Button>
        </div>
      </Shell>
    )

  if (phase === 'start')
    return (
      <Shell onClose={() => nav('/')}>
        <Guide pose="cheer" text={`今日は復習${counts.due}語・新出${counts.newCount}語だワン。思い出す努力が記憶を強くするよ！`} />
        <Card className="mt-4">
          <ul className="space-y-2 text-[14px]">
            <li>🧠 <b>思い出してから答えを見る</b>（検索練習）</li>
            <li>📅 <b>忘れかけた頃に復習</b>（FSRSが間隔を自動調整）</li>
            <li>🔀 <b>一般・ビジネス・保線を混ぜて出題</b>（インターリーブ）</li>
            <li>🔊 <b>例文と音声で覚える</b>（音と文脈で記憶を補強）</li>
          </ul>
        </Card>
        <Button
          block
          className="mt-6"
          onClick={() => {
            // iOSでは最初の読み上げをタップ操作内で行う必要がある
            const first = queue[0]
            speak(first.type === 'learn' || first.type === 'mc' ? first.word.w : ' ', {
              accent: first.word.cat === 'rail' ? 'en-GB' : 'en-US',
            })
            stats.current.started = Date.now()
            setPhase('question')
          }}
        >
          スタート
        </Button>
      </Shell>
    )

  if (phase === 'done')
    return (
      <Shell onClose={() => nav('/')}>
        {guide && <Guide pose={guide.pose} text={guide.text} size={110} />}
        <Card className="mt-4 text-center">
          <p className="text-sm text-muted">正答率</p>
          <p className="text-4xl font-extrabold">
            {stats.current.total ? Math.round((stats.current.correct / stats.current.total) * 100) : 0}%
          </p>
          <p className="mt-1 text-sm text-muted">
            {stats.current.correct} / {stats.current.total} 問
          </p>
        </Card>
        <div className="mt-6 grid gap-2">
          <Button onClick={() => nav('/')}>ホームへ</Button>
          <Button variant="secondary" onClick={() => nav('/practice/listening')}>
            リスニングで仕上げる
          </Button>
        </div>
      </Shell>
    )

  return (
    <Shell onClose={() => nav('/')} progress={{ value: idx, max: queue.length }}>
      {item && (
        <ItemView
          key={item.key}
          item={item}
          phase={phase}
          result={result}
          onLearned={() => next()}
          onAnswer={answer}
        />
      )}
      {phase === 'feedback' && result && item && (
        <div className="mt-4 animate-pop">
          {guide && <Guide pose={guide.pose} text={guide.text} size={72} compact />}
          <Card className={cx('mt-3 border-2', result.correct ? 'border-ok/50' : 'border-ng/50')}>
            <div className="mb-3 flex items-center gap-2">
              {result.correct ? <Check className="h-5 w-5 text-ok" /> : <X className="h-5 w-5 text-ng" />}
              <span className={cx('font-bold', result.correct ? 'text-ok' : 'text-ng')}>{result.correct ? '正解' : '不正解'}</span>
              {result.next && <span className="ml-auto text-xs text-muted">次回の復習：{result.next}後</span>}
            </div>
            <WordHead word={item.word} />
            <div className="mt-3">
              <WordBody word={item.word} />
            </div>
          </Card>
          <Button block className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] mt-4" onClick={next}>
            次へ
          </Button>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children, onClose, progress }: { children: React.ReactNode; onClose: () => void; progress?: { value: number; max: number } }) {
  return (
    <div className="px-4">
      {/* pt-safe はスクロールしても固定されるヘッダー側に付け、ステータスバー／Dynamic Island の下に潜らないようにする */}
      <div className="sticky top-0 z-10 -mx-4 bg-bg/90 px-4 pt-safe backdrop-blur">
        <div className="flex h-12 items-center gap-3">
          <button onClick={onClose} aria-label="閉じる" className="rounded-full p-1 text-muted">
            <X className="h-6 w-6" />
          </button>
          {progress && <ProgressBar value={progress.value} max={progress.max} className="flex-1" />}
          {progress && (
            <span className="text-xs font-semibold text-muted">
              {progress.value + 1}/{progress.max}
            </span>
          )}
        </div>
      </div>
      <div className="pb-8 pt-2">{children}</div>
    </div>
  )
}

function useStartTime(dep: unknown) {
  const t = useRef(Date.now())
  useEffect(() => {
    t.current = Date.now()
  }, [dep])
  return () => Date.now() - t.current
}

function ItemView({
  item,
  phase,
  result,
  onLearned,
  onAnswer,
}: {
  item: Item
  phase: Phase
  result: { correct: boolean; answer?: string } | null
  onLearned: () => void
  onAnswer: (correct: boolean, ms: number, opts?: { grade?: Grade; answer?: string; typed?: boolean }) => void
}) {
  const elapsed = useStartTime(item.key)
  const w = item.word
  const accent = w.cat === 'rail' ? 'en-GB' : 'en-US'
  const autoPlay = useSettings((s) => s.autoPlay)

  useEffect(() => {
    if (!autoPlay) return
    if (item.type === 'learn' || item.type === 'mc' || item.type === 'flip') speak(w.w, { accent })
    if (item.type === 'listen') speak(w.w, { accent })
  }, [item.key]) // eslint-disable-line react-hooks/exhaustive-deps

  if (item.type === 'learn')
    return (
      <div>
        <p className="mb-2 text-xs font-bold text-brand">NEW　新しい単語</p>
        <Card>
          <WordHead word={w} big />
          <div className="mt-4">
            <WordBody word={w} />
          </div>
        </Card>
        <p className="mt-3 text-center text-xs text-muted">例文を声に出して読んでから進もう（産出効果）</p>
        <Button block className="mt-3" onClick={onLearned}>
          覚えた！次へ
        </Button>
      </div>
    )

  if (item.type === 'mc' || item.type === 'listen') return <ChoiceQ item={item} phase={phase} result={result} elapsed={elapsed} onAnswer={onAnswer} />
  if (item.type === 'flip') return <FlipQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  return <TypeQ item={item} phase={phase} result={result} elapsed={elapsed} onAnswer={onAnswer} />
}

function ChoiceQ({
  item,
  phase,
  elapsed,
  onAnswer,
}: {
  item: Item
  phase: Phase
  result: { correct: boolean } | null
  elapsed: () => number
  onAnswer: (correct: boolean, ms: number) => void
}) {
  const w = item.word
  const [options, setOptions] = useState<Word[] | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  useEffect(() => {
    loadCategory(w.cat).then((pool) => setOptions(shuffle([w, ...distractors(w, pool, 3)])))
  }, [w])
  const listen = item.type === 'listen'
  const accent = w.cat === 'rail' ? 'en-GB' : 'en-US'
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted">
        {listen ? '🎧 聞こえた単語の意味は？' : item.retry ? 'もう一度！意味を選ぼう' : '意味を選ぼう'}
      </p>
      <Card className="flex min-h-36 flex-col items-center justify-center gap-3">
        {listen && phase === 'question' ? (
          <div className="flex items-center gap-3">
            <SpeakButton text={w.w} accent={accent} size="lg" />
            <SpeakButton text={w.w} accent={accent} rate={0.6} label="ゆっくり" />
          </div>
        ) : (
          <>
            <p className="text-center text-[30px] font-extrabold leading-tight">{w.w}</p>
            {w.ipa && <p className="ipa text-muted">/{w.cat === 'rail' && w.ipaUk ? w.ipaUk : w.ipa}/</p>}
            <SpeakButton text={w.w} accent={accent} />
          </>
        )}
      </Card>
      <div className="mt-3 grid gap-2">
        {(options ?? []).map((o) => {
          const isAns = o.id === w.id
          const show = phase === 'feedback'
          return (
            <button
              key={o.id}
              disabled={phase !== 'question'}
              onClick={() => {
                setPicked(o.id)
                onAnswer(isAns, elapsed())
              }}
              className={cx(
                'min-h-12 rounded-xl border bg-surface px-4 py-3 text-left text-[15px] font-semibold transition active:scale-[0.99]',
                show && isAns && 'border-ok bg-ok/10',
                show && picked === o.id && !isAns && 'border-ng bg-ng/10',
                !show && 'border-line',
              )}
            >
              {o.ja}
            </button>
          )
        })}
        {phase === 'question' && (
          <button onClick={() => onAnswer(false, elapsed())} className="mt-1 text-sm font-semibold text-muted">
            分からない
          </button>
        )}
      </div>
    </div>
  )
}

function FlipQ({
  item,
  phase,
  elapsed,
  onAnswer,
}: {
  item: Item
  phase: Phase
  elapsed: () => number
  onAnswer: (correct: boolean, ms: number, opts?: { grade?: Grade }) => void
}) {
  const w = item.word
  const [shown, setShown] = useState(false)
  const [row, setRow] = useState<CardRow | undefined>()
  const retention = useSettings((s) => s.retention)
  useEffect(() => {
    db.cards.get(w.id).then(setRow)
  }, [w.id])
  const preview = useMemo(() => previewIntervals(row, retention), [row, retention])
  const accent = w.cat === 'rail' ? 'en-GB' : 'en-US'
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted">意味を思い浮かべてから答えを見よう</p>
      <Card className="flex min-h-40 flex-col items-center justify-center gap-2">
        <p className="text-center text-[30px] font-extrabold">{w.w}</p>
        {w.us && <p className="text-sm text-muted">🇺🇸 {w.us}</p>}
        <SpeakButton text={w.w} accent={accent} />
        {shown && <p className="mt-2 text-center text-[18px] font-bold text-brand-strong">{w.ja}</p>}
      </Card>
      {phase === 'question' &&
        (!shown ? (
          <Button block className="mt-4" onClick={() => setShown(true)}>
            <Eye className="h-5 w-5" />
            答えを見る
          </Button>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {(
              [
                [Rating.Again, 'もう一度', 'bg-ng'],
                [Rating.Hard, '難しい', 'bg-warn'],
                [Rating.Good, '正解', 'bg-ok'],
                [Rating.Easy, '簡単', 'bg-gen'],
              ] as [Grade, string, string][]
            ).map(([g, label, color]) => (
              <button
                key={g}
                onClick={() => onAnswer(g !== Rating.Again, elapsed(), { grade: g })}
                className={cx('flex flex-col items-center rounded-xl py-2.5 text-white active:scale-95', color)}
              >
                <span className="text-[13px] font-bold">{label}</span>
                <span className="text-[10px] opacity-90">{preview[g]}</span>
              </button>
            ))}
          </div>
        ))}
    </div>
  )
}

function TypeQ({
  item,
  phase,
  result,
  elapsed,
  onAnswer,
}: {
  item: Item
  phase: Phase
  result: { correct: boolean; answer?: string } | null
  elapsed: () => number
  onAnswer: (correct: boolean, ms: number, opts?: { answer?: string; typed?: boolean }) => void
}) {
  const w = item.word
  const [value, setValue] = useState('')
  const [hint, setHint] = useState(0)
  const ex = w.ex.find((e) => e.en.includes('*')) ?? w.ex[0]
  const cloze = item.type === 'cloze'
  const target = cloze ? (markedTarget(ex.en) ?? w.w) : w.w
  const blanked = ex.en.replace(/\*[^*]+\*/, '_____')
  const submit = () => {
    const ok = checkSpelling(value, w, cloze ? target : undefined)
    onAnswer(ok, elapsed(), { answer: value, typed: true })
  }
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted">{cloze ? '空所に入る語を入力しよう' : '英語で書いてみよう（産出練習）'}</p>
      <Card>
        {cloze ? (
          <>
            <p className="text-[17px] leading-relaxed">{blanked}</p>
            <p className="mt-2 text-[13px] text-muted">{ex.ja}</p>
            <p className="mt-2 text-xs text-muted">ヒント：{w.ja}</p>
          </>
        ) : (
          <>
            <p className="text-[20px] font-bold">{w.ja}</p>
            <p className="mt-2 text-[13px] text-muted">{ex.ja}</p>
          </>
        )}
        {hint > 0 && (
          <p className="mt-2 font-mono text-sm text-brand-strong">
            {target.slice(0, hint)}
            {'・'.repeat(Math.max(0, target.length - hint))}
          </p>
        )}
      </Card>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (phase === 'question') submit()
        }}
        className="mt-3"
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={phase !== 'question'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="英語を入力"
          className={cx(
            'w-full rounded-xl border bg-surface px-4 py-3 text-[18px] outline-none focus:border-brand',
            result ? (result.correct ? 'border-ok' : 'border-ng') : 'border-line',
          )}
        />
        {phase === 'question' && (
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setHint((h) => Math.min(target.length, h + 1))}>
              <Lightbulb className="h-4 w-4" />
              ヒント
            </Button>
            <Button type="button" variant="secondary" onClick={() => speak(plain(ex.en), { accent: w.cat === 'rail' ? 'en-GB' : 'en-US' })}>
              <Headphones className="h-4 w-4" />
            </Button>
            <Button type="submit" className="flex-1" disabled={!value.trim()}>
              答え合わせ
            </Button>
          </div>
        )}
        {phase === 'feedback' && result && !result.correct && (
          <p className="mt-2 text-sm">
            正解：<b className="text-ok">{target}</b>
          </p>
        )}
      </form>
    </div>
  )
}
