import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Brain, CalendarClock, Check, Eye, Lightbulb, Shuffle, Star, Volume2, X } from 'lucide-react'
import { Guide } from '@/components/Guide'
import { BottomBar, Button, SpeakButton, Tag, cx } from '@/components/ui'
import { ChoiceButton, choiceState, FeedbackBar, ListenButton, ResultCard, SessionShell as Shell, SlowButton, SLOW_RATE, scoreCaption } from '@/components/Session'
import { WordBody, WordHead } from '@/components/WordInfo'
import { buildDrill, buildSession, checkSpelling, MAX_RETRIES, reinsert, type Item } from '@/lib/session'
import { objectiveGrade, previewIntervals, Rating, recordReview, humanizeDiff, type Grade } from '@/lib/srs'
import { bumpDaily, db, toggleMark, type CardRow } from '@/lib/db'
import { accentFor, useSettings, getSettings } from '@/lib/settings'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech, type Accent } from '@/lib/tts'
import { correctMessage, sessionDoneMessage, wrongMessage, type GuideLine } from '@/lib/guide'
import { distractors, loadCategory, markedTarget, shuffle, plain } from '@/lib/vocab'
import { useMarks } from '@/lib/hooks'
import type { Word } from '@/lib/types'
import { play } from '@/lib/sounds'

type Phase = 'loading' | 'start' | 'question' | 'feedback' | 'done' | 'empty'
type Mode = 'normal' | 'extra' | 'weak' | 'marked'

const accentOf = (w: Word): Accent => accentFor(w.cat)

interface Outcome {
  word: Word
  correct: boolean
  next?: string
}

export default function Study() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const mode: Mode = params.get('extra') === '1' ? 'extra' : ((params.get('mode') as Mode) ?? 'normal')
  const drill = mode === 'weak' || mode === 'marked'
  const settings = useSettings()
  const [queue, setQueue] = useState<Item[]>([])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [result, setResult] = useState<{ correct: boolean; grade?: Grade; next?: string; answer?: string } | null>(null)
  const [guide, setGuide] = useState<GuideLine | null>(null)
  const stats = useRef({ correct: 0, total: 0, streak: 0, started: Date.now() })
  /** 1回目の解答結果（まとめ画面用。再出題の結果では上書きしない） */
  const outcomes = useRef(new Map<string, Outcome>())

  useEffect(() => {
    const p = drill ? buildDrill(mode as 'weak' | 'marked') : buildSession(getSettings(), { extra: mode === 'extra' })
    p.then((q) => {
      setQueue(q)
      setPhase(q.length ? 'start' : 'empty')
    })
    return () => stopSpeaking()
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  const item = queue[idx]
  const counts = useMemo(() => {
    const n = queue.filter((i) => i.type === 'learn').length
    return { newCount: n, due: queue.filter((i) => !i.isNew).length }
  }, [queue])

  // 次の2問ぶんの音声を先に取得しておく（高品質音声のときだけ）
  useEffect(() => {
    const ahead = queue.slice(idx, idx + 3)
    prefetchSpeech(ahead.flatMap((i) => [{ text: i.word.w, accent: accentOf(i.word) }, { text: i.word.ex[0]?.en ?? '', accent: accentOf(i.word) }]))
  }, [idx, queue])

  const next = () => {
    setResult(null)
    setGuide(null)
    if (idx + 1 >= queue.length) {
      stopSpeaking()
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
    play(correct ? 'correct' : 'wrong')
    try {
      const grade = opts.grade ?? objectiveGrade(correct, ms, opts.typed)
      let nextStr: string | undefined
      if (!item.retry) {
        stats.current.total++
        if (correct) stats.current.correct++
        if (drill) {
          await bumpDaily({ reviews: 1, correct: correct ? 1 : 0, seconds: Math.min(60, Math.round(ms / 1000)) }).catch(console.error)
        } else {
          try {
            const row = await recordReview(item.word, grade, item.type, ms, settings.retention)
            nextStr = humanizeDiff(row.due - Date.now())
          } catch (e) {
            // 保存に失敗しても学習は続けられるようにする（フィードバックは表示する）
            console.error(e)
          }
        }
        if (!outcomes.current.has(item.word.id)) outcomes.current.set(item.word.id, { word: item.word, correct, next: nextStr })
      }
      stats.current.streak = correct ? stats.current.streak + 1 : 0
      if (!correct) setQueue((q) => reinsert(q, idx, item))
      setGuide(correct ? correctMessage(stats.current.streak, item.word.cat === 'rail') : wrongMessage())
      setResult({ correct, grade, next: nextStr, answer: opts.answer })
      if (settings.autoPlay) speak(item.word.ex[0]?.en ?? item.word.w, { accent: accentOf(item.word) })
    } finally {
      busy.current = false
    }
  }

  if (phase === 'loading') return <div className="p-8 text-center text-muted">読み込み中…</div>

  if (phase === 'empty')
    return (
      <Shell onClose={() => nav('/')}>
        <div className="mt-6">
          <Guide
            pose="celebrate"
            text={
              mode === 'weak'
                ? '苦手な単語はまだないワン。間違えた語がここに集まるよ。'
                : mode === 'marked'
                  ? '保存した単語はまだないワン。単語の画面の「保存」（星のボタン）で集められるよ。'
                  : '今は復習も新しい単語もないワン。リスニングやシーン会話で「使う」練習をしよう。'
            }
          />
        </div>
        <div className="mt-8 grid gap-2">
          {!drill && <Button onClick={() => nav('/study?extra=1')}>追加で新しい単語を5語学ぶ</Button>}
          <Button variant="secondary" onClick={() => nav('/practice')}>
            練習メニューへ
          </Button>
        </div>
      </Shell>
    )

  if (phase === 'start')
    return (
      <Shell onClose={() => nav('/')}>
        <div className="mt-4 animate-rise">
          <p className="text-[13px] font-medium text-muted">
            {mode === 'weak' ? '苦手な単語の練習' : mode === 'marked' ? '保存した単語の練習' : '今日の単語'}
          </p>
          <div className="mt-3 flex items-end gap-7">
            {drill ? (
              <Num value={queue.length} label="問" />
            ) : (
              <>
                <Num value={counts.due} label="復習" />
                <Num value={counts.newCount} label="新しい単語" />
              </>
            )}
          </div>
          <ul className="mt-8 space-y-4">
            <Point icon={<Brain />} title="思い出してから答えを見る" desc="見直すより、思い出す方が記憶に残ります（テスト効果）" />
            {drill ? (
              <Point icon={<CalendarClock />} title="復習の予定は変わりません" desc="集中練習の結果は、FSRS の復習間隔には反映しません" />
            ) : (
              <Point icon={<CalendarClock />} title="忘れかけた頃にまた出題" desc="FSRS が単語ごとに次の復習日を決めます（分散学習）" />
            )}
            <Point icon={<Shuffle />} title="形式とコースを混ぜて出題" desc="選択・リスニング・スペルを混ぜます（インターリーブ）" />
            <Point icon={<Volume2 />} title="例文を声に出して読む" desc="音と文脈がそろうと思い出しやすくなります（産出効果）" />
          </ul>
        </div>
        <BottomBar>
          <Button
            block
            size="lg"
            onClick={() => {
              // iOSでは最初の読み上げをタップ操作内で行う必要がある
              warmUpSpeech()
              const first = queue[0]
              if (settings.autoPlay && first.type !== 'listen') speak(first.word.w, { accent: accentOf(first.word) })
              stats.current.started = Date.now()
              setPhase('question')
            }}
          >
            はじめる
          </Button>
        </BottomBar>
      </Shell>
    )

  if (phase === 'done') return <Summary guide={guide} stats={stats.current} outcomes={[...outcomes.current.values()]} drill={drill} />

  const learn = item?.type === 'learn'
  return (
    <Shell onClose={() => nav('/')} progress={{ value: idx, max: queue.length }}>
      <div className={cx(learn || phase === 'feedback' ? 'pb-44' : 'pb-8')}>
        {item && <ItemView key={item.key} item={item} phase={phase} result={result} onAnswer={answer} />}
        {phase === 'feedback' && result && item && (
          <div className="mt-6 animate-rise">
            {guide && <Guide pose={guide.pose} text={guide.text} size={52} compact />}
            <div className="mt-4 rounded-[18px] border border-line bg-surface p-4">
              <WordHead word={item.word} />
              <div className="mt-4">
                <WordBody word={item.word} />
              </div>
            </div>
          </div>
        )}
      </div>
      {learn && phase === 'question' && (
        <BottomBar>
          <p className="mb-2.5 text-center text-[12px] text-muted">例文を一度、声に出して読んでから進もう</p>
          <Button block size="lg" variant="ink" onClick={next}>
            覚えた・次へ
          </Button>
        </BottomBar>
      )}
      {phase === 'feedback' && result && item && (
        <FeedbackBar
          ok={result.correct}
          aside={
            <>
              {result.correct && result.next && <span>次の復習 {result.next}後</span>}
              {!result.correct && (item.retry ?? 0) < MAX_RETRIES && <span>数問後にもう一度</span>}
              <MarkButton id={item.word.id} />
            </>
          }
          onNext={next}
        />
      )}
    </Shell>
  )
}

function Num({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-[40px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      <p className="mt-1.5 text-[12px] text-muted">{label}</p>
    </div>
  )
}

function Point({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex gap-3.5">
      <span className="mt-0.5 text-muted [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[1.7]">{icon}</span>
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{desc}</span>
      </span>
    </li>
  )
}

function MarkButton({ id }: { id: string }) {
  const marks = useMarks()
  const on = !!marks?.has(id)
  return (
    <button
      aria-label={on ? '保存を取り消す' : '単語を保存'}
      aria-pressed={on}
      onClick={() => void toggleMark(id)}
      className="flex h-8 w-8 items-center justify-center rounded-full active:scale-90"
    >
      <Star className={cx('h-[19px] w-[19px]', on ? 'fill-warn text-warn' : 'text-muted')} strokeWidth={1.8} />
    </button>
  )
}

function Summary({
  guide,
  stats,
  outcomes,
  drill,
}: {
  guide: GuideLine | null
  stats: { correct: number; total: number }
  outcomes: Outcome[]
  drill: boolean
}) {
  const nav = useNavigate()
  const rate = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
  const sorted = [...outcomes].sort((a, b) => Number(a.correct) - Number(b.correct))
  return (
    <Shell onClose={() => nav('/')}>
      <div className="animate-rise pb-44">
        {guide && <Guide pose={guide.pose} text={guide.text} size={84} className="mt-2" />}
        <div className="mt-6">
          <ResultCard value={rate} caption={`正答率・${scoreCaption(stats.correct, stats.total)}`} />
        </div>
        {sorted.length > 0 && (
          <>
            <p className="mb-2 mt-8 px-1 text-[13px] font-semibold text-muted">この回の単語</p>
            <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
              {sorted.map((o, k) => (
                <div key={o.word.id} className={cx('flex items-center gap-3 py-2.5 pl-4 pr-2', k > 0 && 'hairline-t')}>
                  <span className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full', o.correct ? 'bg-ok-soft text-ok' : 'bg-ng-soft text-ng')}>
                    {o.correct ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => nav(`/words/${o.word.id}`)}>
                    <p className="en truncate text-[17px] font-medium">{o.word.w}</p>
                    <p className="line-clamp-2 text-[12px] text-muted">{o.word.ja}</p>
                  </button>
                  {!drill && o.next && <span className="shrink-0 text-[11.5px] tabular-nums text-muted">{o.next}後</span>}
                  <MarkButton id={o.word.id} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomBar>
        <div className="grid gap-2">
          <Button block size="lg" variant="ink" onClick={() => nav('/')}>
            ホームへ
          </Button>
          <Button block variant="ghost" onClick={() => nav('/practice/listening')}>
            リスニングで仕上げる
          </Button>
        </div>
      </BottomBar>
    </Shell>
  )
}

function useStartTime(dep: unknown) {
  const t = useRef(Date.now())
  useEffect(() => {
    t.current = Date.now()
  }, [dep])
  return () => Date.now() - t.current
}

type AnswerFn = (correct: boolean, ms: number, opts?: { grade?: Grade; answer?: string; typed?: boolean }) => void

function ItemView({ item, phase, result, onAnswer }: { item: Item; phase: Phase; result: { correct: boolean; answer?: string } | null; onAnswer: AnswerFn }) {
  const elapsed = useStartTime(item.key)
  const w = item.word
  const autoPlay = useSettings((s) => s.autoPlay)
  const vary = useSettings((s) => s.varyVoices)

  useEffect(() => {
    if (!autoPlay && item.type !== 'listen') return
    if (item.type === 'learn' || item.type === 'mc' || item.type === 'flip') speak(w.w, { accent: accentOf(w) })
    // 音声だけで答える問題は、毎回ちがう声で聞く（話者の多様性）
    if (item.type === 'listen') speak(w.w, { accent: accentOf(w), voice: vary ? 'random' : 'main' })
  }, [item.key]) // eslint-disable-line react-hooks/exhaustive-deps

  if (item.type === 'learn')
    return (
      <div className="animate-rise">
        <p className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-strong">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          新しい単語
        </p>
        <WordHead word={w} big />
        <div className="mt-6">
          <WordBody word={w} />
        </div>
      </div>
    )

  if (item.type === 'mc' || item.type === 'listen') return <ChoiceQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  if (item.type === 'flip') return <FlipQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  return <TypeQ item={item} phase={phase} result={result} elapsed={elapsed} onAnswer={onAnswer} />
}

function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-[13px] font-medium text-muted">{children}</p>
}

function ChoiceQ({ item, phase, elapsed, onAnswer }: { item: Item; phase: Phase; elapsed: () => number; onAnswer: AnswerFn }) {
  const w = item.word
  const [options, setOptions] = useState<Word[] | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const vary = useSettings((s) => s.varyVoices)
  useEffect(() => {
    loadCategory(w.cat).then((pool) => setOptions(shuffle([w, ...distractors(w, pool, 3)])))
  }, [w])
  const listen = item.type === 'listen'
  const accent = accentOf(w)
  const showWord = !listen || phase !== 'question'
  return (
    <div className="animate-rise">
      <Prompt>{listen ? '聞こえた単語の意味は？' : item.retry ? 'もう一度。意味を選ぼう' : '意味を選ぼう'}</Prompt>
      <div className="flex min-h-[132px] flex-col items-center justify-center gap-3 text-center">
        {showWord ? (
          <>
            <p className="en text-[44px] font-medium leading-[1.05] tracking-tight">{w.w}</p>
            <div className="flex items-center gap-2">
              {w.ipa && <p className="ipa text-[15px] text-muted">/{w.cat === 'rail' && w.ipaUk ? w.ipaUk : w.ipa}/</p>}
              <SpeakButton text={w.w} accent={accent} size="sm" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ListenButton onClick={() => speak(w.w, { accent, voice: vary ? 'random' : 'main' })} />
            <SlowButton onClick={() => speak(w.w, { accent, rate: SLOW_RATE })} />
          </div>
        )}
      </div>
      <div className="mt-6 space-y-2">
        {(options ?? []).map((o, k) => (
          <ChoiceButton
            key={o.id}
            index={k + 1}
            state={choiceState(phase === 'feedback', o.id === w.id, picked === o.id)}
            disabled={phase !== 'question'}
            onClick={() => {
              setPicked(o.id)
              onAnswer(o.id === w.id, elapsed())
            }}
          >
            {o.ja}
          </ChoiceButton>
        ))}
        {phase === 'question' && (
          <button onClick={() => onAnswer(false, elapsed())} className="min-h-11 w-full text-[14px] text-muted">
            分からない
          </button>
        )}
      </div>
    </div>
  )
}

function FlipQ({ item, phase, elapsed, onAnswer }: { item: Item; phase: Phase; elapsed: () => number; onAnswer: AnswerFn }) {
  const w = item.word
  const [shown, setShown] = useState(false)
  const [row, setRow] = useState<CardRow | undefined>()
  const retention = useSettings((s) => s.retention)
  useEffect(() => {
    db.cards.get(w.id).then(setRow)
  }, [w.id])
  const preview = useMemo(() => previewIntervals(row, retention), [row, retention])
  const accent = accentOf(w)
  const grades: [Grade, string, string][] = [
    [Rating.Again, 'もう一度', 'text-ng'],
    [Rating.Hard, '難しい', 'text-warn'],
    [Rating.Good, '思い出せた', 'text-ok'],
    [Rating.Easy, '簡単', 'text-gen'],
  ]
  return (
    <div className="animate-rise">
      <Prompt>意味を思い浮かべてから、答えを見よう</Prompt>
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">
        <p className="en text-[44px] font-medium leading-[1.05] tracking-tight">{w.w}</p>
        {w.us && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <Tag>米</Tag>
            <span className="en">{w.us}</span>
          </p>
        )}
        <SpeakButton text={w.w} accent={accent} size="sm" />
        {shown && <p className="mt-2 animate-rise text-[20px] font-semibold">{w.ja}</p>}
      </div>
      {phase === 'question' &&
        (!shown ? (
          <Button block size="lg" variant="ink" className="mt-8" onClick={() => setShown(true)}>
            <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />
            答えを見る
          </Button>
        ) : (
          <div className="mt-8 grid grid-cols-4 gap-2">
            {grades.map(([g, label, color]) => (
              <button
                key={g}
                onClick={() => onAnswer(g !== Rating.Again, elapsed(), { grade: g })}
                className="flex flex-col items-center gap-0.5 rounded-[14px] border border-line bg-surface py-3 transition active:scale-95"
              >
                <span className={cx('text-[13px] font-semibold', color)}>{label}</span>
                <span className="text-[11px] tabular-nums text-muted">{preview[g]}</span>
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
  onAnswer: AnswerFn
}) {
  const w = item.word
  const [value, setValue] = useState('')
  const [hint, setHint] = useState(0)
  const ex = w.ex.find((e) => e.en.includes('*')) ?? w.ex[0]
  const cloze = item.type === 'cloze'
  const target = cloze ? (markedTarget(ex.en) ?? w.w) : w.w
  const blanked = ex.en.replace(/\*[^*]+\*/, '＿＿＿')
  const submit = () => {
    const ok = checkSpelling(value, w, cloze ? target : undefined)
    // ヒントを見て正解した場合は「難しい」扱いにして、次回の間隔を短めにする
    onAnswer(ok, elapsed(), { answer: value, typed: true, grade: ok && hint > 0 ? Rating.Hard : undefined })
  }
  return (
    <div className="animate-rise">
      <Prompt>{cloze ? '空所に入る語を書こう' : '英語で書いてみよう'}</Prompt>
      {cloze ? (
        <>
          <p className="en text-[22px] leading-snug">{blanked}</p>
          <p className="mt-2 text-[13px] text-muted">{ex.ja}</p>
          <p className="mt-3 text-[13px]">
            <span className="text-muted">意味：</span>
            {w.ja}
          </p>
        </>
      ) : (
        <>
          <p className="text-[24px] font-semibold leading-snug">{w.ja}</p>
          <p className="mt-2 text-[13px] text-muted">{ex.ja}</p>
        </>
      )}
      {hint > 0 && (
        <p className="mt-3 font-mono text-[15px] tracking-wider text-brand-strong">
          {target.slice(0, hint)}
          {'_'.repeat(Math.max(0, target.length - hint))}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (phase === 'question') submit()
        }}
        className="mt-6"
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={phase !== 'question'}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="done"
          placeholder="英語を入力"
          aria-label="英語を入力"
          className={cx(
            'en w-full rounded-[14px] border bg-surface px-4 py-3.5 text-[20px] outline-none transition',
            result ? (result.correct ? 'border-ok' : 'border-ng') : 'border-line-strong focus:border-ink',
          )}
        />
        {phase === 'question' && (
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setHint((h) => Math.min(target.length, h + 1))}>
              <Lightbulb className="h-[18px] w-[18px]" strokeWidth={1.8} />
              ヒント
            </Button>
            <Button type="button" variant="secondary" aria-label="例文を聞く" onClick={() => speak(plain(ex.en), { accent: accentOf(w) })}>
              <Volume2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </Button>
            <Button type="submit" variant="ink" className="flex-1" disabled={!value.trim()}>
              答え合わせ
            </Button>
          </div>
        )}
        {phase === 'feedback' && result && !result.correct && (
          <p className="mt-3 text-[15px]">
            正解：<b className="en text-[18px] font-semibold text-ok">{target}</b>
          </p>
        )}
      </form>
    </div>
  )
}
