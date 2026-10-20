import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeftRight, BadgeCheck, Brain, CalendarClock, Check, Eye, Gauge, Lightbulb, Shuffle, Star, Volume2, X } from 'lucide-react'
import { Guide } from '@/components/Guide'
import { BottomBar, Button, SpeakButton, Tag, cx } from '@/components/ui'
import { ChoiceButton, choiceState, FeedbackBar, ListenButton, ResultCard, SessionShell as Shell, SlowButton, SLOW_RATE, scoreCaption, TierBadge } from '@/components/Session'
import { WordBody, WordHead } from '@/components/WordInfo'
import { buildCheck, buildDrill, buildSession, checkSpelling, MAX_RETRIES, reinsert, type Item } from '@/lib/session'
import { markKnown, objectiveGrade, previewIntervals, Rating, recordReview, humanizeDiff, type Grade } from '@/lib/srs'
import { bumpDaily, db, toggleMark, type CardRow } from '@/lib/db'
import { accentFor, useSettings, getSettings } from '@/lib/settings'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech, type Accent } from '@/lib/tts'
import { correctMessage, sessionDoneMessage, wrongMessage, type GuideLine } from '@/lib/guide'
import { loadCategory, markedTarget, quizGloss, shuffle, plain } from '@/lib/vocab'
import { wordDistractors, wordTier, type Tier } from '@/lib/distractors'
import { formQuestion, orderMatches, orderTokens, quizExample, scrambled, usageQuestion, type UsageQuestion } from '@/lib/quiz'
import { useMarks } from '@/lib/hooks'
import type { Word } from '@/lib/types'
import { play } from '@/lib/sounds'

type Phase = 'loading' | 'start' | 'question' | 'feedback' | 'done' | 'empty'
type Mode = 'normal' | 'extra' | 'weak' | 'marked' | 'check'

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
  // 集中練習・定着チェックは、正解しても復習の予定を動かさない（期日前に解いた結果で間隔を延ばさない）
  const drill = mode === 'weak' || mode === 'marked' || mode === 'check'
  const settings = useSettings()
  const [queue, setQueue] = useState<Item[]>([])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [result, setResult] = useState<{ correct: boolean; grade?: Grade; next?: string; answer?: string } | null>(null)
  const [guide, setGuide] = useState<GuideLine | null>(null)
  const stats = useRef({ correct: 0, total: 0, streak: 0, started: Date.now() })
  /** 1回目の解答結果（まとめ画面用。再出題の結果では上書きしない） */
  const outcomes = useRef(new Map<string, Outcome>())
  /** 定着チェック：語ごとの、残りの問題数とまちがえたか（2問とも1回で正解したら「確かめた」） */
  const checks = useRef(new Map<string, { left: number; missed: boolean }>())

  useEffect(() => {
    const p = mode === 'check' ? buildCheck() : drill ? buildDrill(mode as 'weak' | 'marked') : buildSession(getSettings(), { extra: mode === 'extra' })
    p.then((q) => {
      setQueue(q)
      if (mode === 'check') {
        checks.current = new Map()
        for (const i of q)
          checks.current.set(i.word.id, {
            left: (checks.current.get(i.word.id)?.left ?? 0) + 1,
            missed: false,
          })
      }
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

  /** いまの問題を出した時刻（新しい単語の提示にかかった時間を学習時間に入れる） */
  const shownAt = useRef(Date.now())
  useEffect(() => {
    shownAt.current = Date.now()
  }, [idx])

  const next = () => {
    if (item?.type === 'learn') void bumpDaily({ seconds: Math.min(60, Math.round((Date.now() - shownAt.current) / 1000)) }).catch(console.error)
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
      // 出し直しの問題も、かかった時間は学習時間に入れる（FSRS には記録しない）
      if (item.retry) await bumpDaily({ seconds: Math.min(60, Math.round(ms / 1000)) }).catch(console.error)
      if (!item.retry) {
        stats.current.total++
        if (correct) stats.current.correct++
        if (mode === 'check') {
          await checkAnswer(item.word, correct, ms).catch(console.error)
        } else if (drill) {
          await bumpDaily({
            reviews: 1,
            correct: correct ? 1 : 0,
            seconds: Math.min(60, Math.round(ms / 1000)),
          }).catch(console.error)
        } else {
          try {
            const row = await recordReview(item.word, grade, item.type, ms, settings.retention)
            nextStr = humanizeDiff(row.due - Date.now())
          } catch (e) {
            // 保存に失敗しても学習は続けられるようにする（フィードバックは表示する）
            console.error(e)
          }
        }
        const prev = outcomes.current.get(item.word.id)
        // 定着チェックは語ごとに2問。1問でもまちがえたら「覚え直し」
        if (!prev)
          outcomes.current.set(item.word.id, {
            word: item.word,
            correct,
            next: nextStr,
          })
        else if (mode === 'check' && !correct) outcomes.current.set(item.word.id, { ...prev, correct: false })
      }
      stats.current.streak = correct ? stats.current.streak + 1 : 0
      if (!correct) setQueue((q) => reinsert(q, idx, item))
      setGuide(correct ? correctMessage(stats.current.streak, item.word.cat === 'rail') : wrongMessage((item.retry ?? 0) < MAX_RETRIES))
      setResult({ correct, grade, next: nextStr, answer: opts.answer })
      if (settings.autoPlay) speak(item.word.ex[0]?.en ?? item.word.w, { accent: accentOf(item.word) })
    } finally {
      busy.current = false
    }
  }

  /**
   * 定着チェックの記録。まちがえたら、その語は「定着していなかった」ので FSRS に「もう一度」を記録して覚え直しに戻す（1語に1回だけ）。
   * 2問とも1回で正解したら、確かめた日時を残す（正解しても復習の間隔は延ばさない）
   */
  const checkAnswer = async (word: Word, correct: boolean, ms: number) => {
    const c = checks.current.get(word.id)
    if (!c) return
    c.left--
    if (!correct && !c.missed) {
      c.missed = true
      await recordReview(word, Rating.Again, 'check', ms, settings.retention)
      return
    }
    await bumpDaily({
      reviews: 1,
      correct: correct ? 1 : 0,
      seconds: Math.min(60, Math.round(ms / 1000)),
    })
    if (c.left <= 0 && !c.missed) await db.cards.update(word.id, { checkedAt: Date.now() })
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
                  : mode === 'check'
                    ? 'まだ確かめられる単語がないワン。何日か復習を続けて、覚えた単語が増えたら挑戦しよう。'
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
        <div className="mt-4 animate-rise pb-36">
          <p className="text-[13px] font-medium text-muted">
            {mode === 'weak' ? '苦手な単語の練習' : mode === 'marked' ? '保存した単語の練習' : mode === 'check' ? '定着チェック' : '今日の単語'}
          </p>
          <div className="mt-3 flex items-end gap-7">
            {mode === 'check' ? (
              <>
                <Num value={checks.current.size} label="語" />
                <Num value={queue.length} label="問" />
              </>
            ) : drill ? (
              <Num value={queue.length} label="問" />
            ) : (
              <>
                <Num value={counts.due} label="復習" />
                <Num value={counts.newCount} label="新しい単語" />
              </>
            )}
          </div>
          {mode === 'check' ? (
            <ul className="mt-8 space-y-4">
              <Point icon={<BadgeCheck />} title="覚えたはずの単語を確かめる" desc="長く覚えている単語ほど、選ぶだけの問題では当てずっぽうでも正解できてしまいます" />
              <Point icon={<ArrowLeftRight />} title="意味の近い語から選ぶ" desc="はじめて見る例文の空所に、意味の近い語の中から1語を選びます。和訳から英語を選ぶ・書く問題も" />
              <Point icon={<CalendarClock />} title="まちがえた語は覚え直しへ" desc="1語に2問。どちらかをまちがえたら、復習を早めます。両方正解した語は「確かめた」として記録します" />
            </ul>
          ) : (
            <ul className="mt-8 space-y-4">
              <Point icon={<Brain />} title="思い出してから答えを見る" desc="見直すより、思い出す方が記憶に残ります（テスト効果）" />
              {drill ? (
                <Point icon={<CalendarClock />} title="復習の予定は変わりません" desc="集中練習の結果は、FSRS の復習間隔には反映しません" />
              ) : (
                <Point icon={<CalendarClock />} title="忘れかけた頃にまた出題" desc="FSRS が単語ごとに次の復習日を決めます（分散学習）" />
              )}
              <Point icon={<Shuffle />} title="形式とコースを混ぜて出題" desc="意味・英語を選ぶ、聞く、書く、使い分け、並べかえを混ぜます（インターリーブ）" />
              <Point icon={<Gauge />} title="選択肢の難しさはレベルと覚え具合で" desc="覚えた語ほど、意味の近い語やはじめて見る例文で確かめます（望ましい困難）" />
              <Point icon={<Volume2 />} title="例文を声に出して読む" desc="音と文脈がそろうと思い出しやすくなります（産出効果）" />
            </ul>
          )}
        </div>
        <BottomBar>
          <Button
            block
            size="lg"
            onClick={() => {
              // iOSでは最初の読み上げをタップ操作内で行う必要がある
              warmUpSpeech()
              const first = queue[0]
              // 単語を見せる問題（提示・選択・カード）だけ読み上げる。書く問題で答えを言ってしまわないように
              if (settings.autoPlay && (first.type === 'learn' || first.type === 'mc' || first.type === 'flip')) speak(first.word.w, { accent: accentOf(first.word) })
              stats.current.started = Date.now()
              setPhase('question')
            }}
          >
            はじめる
          </Button>
        </BottomBar>
      </Shell>
    )

  if (phase === 'done') return <Summary guide={guide} stats={stats.current} outcomes={[...outcomes.current.values()]} drill={drill} check={mode === 'check'} />

  const learn = item?.type === 'learn'
  return (
    <Shell onClose={() => nav('/')} progress={{ value: idx, max: queue.length }}>
      <div className={cx(learn || phase === 'feedback' ? 'pb-44' : 'pb-8')}>
        {item && <ItemView key={item.key} item={item} phase={phase} result={result} onAnswer={answer} drill={drill} />}
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
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                // もう知っている語は出題しない（この回のテストも外す）
                if (!item) return
                void markKnown(item.word, true)
                setQueue((q) => q.filter((x, k) => k <= idx || x.word.id !== item.word.id))
                next()
              }}
            >
              知っている
            </Button>
            <Button block size="lg" variant="ink" className="flex-1" onClick={next}>
              覚えた・次へ
            </Button>
          </div>
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
  check,
}: {
  guide: GuideLine | null
  stats: { correct: number; total: number }
  outcomes: Outcome[]
  drill: boolean
  check?: boolean
}) {
  const nav = useNavigate()
  const rate = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
  const verified = outcomes.filter((o) => o.correct).length
  const sorted = [...outcomes].sort((a, b) => Number(a.correct) - Number(b.correct))
  return (
    <Shell onClose={() => nav('/')}>
      <div className="animate-rise pb-44">
        {guide && <Guide pose={guide.pose} text={guide.text} size={84} className="mt-2" />}
        <div className="mt-6">
          {check ? (
            <ResultCard value={verified} unit="語" caption={`定着を確かめた語（${outcomes.length}語中）・覚え直し ${outcomes.length - verified}語`} />
          ) : (
            <ResultCard value={rate} caption={`正答率・${scoreCaption(stats.correct, stats.total)}`} />
          )}
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

function ItemView({
  item,
  phase,
  result,
  onAnswer,
  drill,
}: {
  item: Item
  phase: Phase
  result: { correct: boolean; answer?: string } | null
  onAnswer: AnswerFn
  drill: boolean
}) {
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
          <WordBody word={w} examples={1} />
        </div>
      </div>
    )

  if (item.type === 'mc' || item.type === 'listen' || item.type === 'rev') return <ChoiceQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  if (item.type === 'usage') return <UsageQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  if (item.type === 'form') return <FormQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  if (item.type === 'order') return <OrderQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  // 集中練習と出し直しの答えは FSRS に記録しないので、次の復習までの間隔は出さない
  if (item.type === 'flip') return <FlipQ item={item} phase={phase} elapsed={elapsed} onAnswer={onAnswer} showIntervals={!drill && !item.retry} />
  return <TypeQ item={item} phase={phase} result={result} elapsed={elapsed} onAnswer={onAnswer} />
}

function Prompt({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <p className="min-w-0 flex-1 text-[13px] font-medium text-muted">{children}</p>
      {aside}
    </div>
  )
}

function ChoiceQ({ item, phase, elapsed, onAnswer }: { item: Item; phase: Phase; elapsed: () => number; onAnswer: AnswerFn }) {
  const w = item.word
  const [options, setOptions] = useState<Word[] | null>(null)
  const [tier, setTier] = useState<Tier | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const vary = useSettings((s) => s.varyVoices)
  // 学習者のレベルは「はじめるレベル」（下限）で見る。上限で見ると、初級（2〜3）が中級あつかいになる
  const learnerLevel = useSettings((s) => s.minLevel)
  const listen = item.type === 'listen'
  const rev = item.type === 'rev'
  useEffect(() => {
    // 選択肢の難しさ：学習者のレベルと、この語の覚え具合（記憶の安定度）で決める
    Promise.all([loadCategory(w.cat), db.cards.get(w.id)]).then(([pool, row]) => {
      const t = wordTier({ learnerLevel, stability: row?.stability, retry: item.retry })
      setTier(t)
      // 英語を選ぶ問題は、品詞が同じ語だけから選ぶ（品詞の形で見当がつかないように）
      const from = rev ? pool.filter((x) => x.pos === w.pos) : pool
      setOptions(shuffle([w, ...wordDistractors(w, from, t, { listen }).map((d) => d.word)]))
    })
  }, [w]) // eslint-disable-line react-hooks/exhaustive-deps
  const accent = accentOf(w)
  const showWord = !listen || phase !== 'question'
  const ex = useMemo(() => (rev ? quizExample(w, item.seed) : undefined), [w, rev, item.seed])
  return (
    <div className="animate-rise">
      <Prompt aside={tier && <TierBadge tier={tier} />}>
        {listen ? '聞こえた単語の意味は？' : rev ? '意味に合う英語を選ぼう' : item.retry ? 'もう一度。意味を選ぼう' : '意味を選ぼう'}
      </Prompt>
      <div className="flex min-h-[132px] flex-col items-center justify-center gap-3 text-center">
        {rev ? (
          <>
            <p className="text-[26px] font-semibold leading-snug">{quizGloss(w.ja)}</p>
            {ex && <p className="text-[13px] leading-relaxed text-muted">{ex.ja}</p>}
            {phase !== 'question' && <SpeakButton text={w.w} accent={accent} size="sm" />}
          </>
        ) : showWord ? (
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
            {rev ? <span className="en text-[18px]">{o.w}</span> : quizGloss(o.ja)}
            {/* 答え合わせのあと、選ばなかった語の意味も見せる（似た意味の語との違いを確かめる） */}
            {rev && phase === 'feedback' && <span className="ml-2 text-[12px] text-muted">{quizGloss(o.ja)}</span>}
          </ChoiceButton>
        ))}
        {phase === 'question' && <DontKnow onClick={() => onAnswer(false, elapsed())} />}
      </div>
    </div>
  )
}

function DontKnow({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="min-h-11 w-full text-[14px] text-muted">
      分からない
    </button>
  )
}

/** 使い分け：例文の空所に入る語を、意味の近い語の中から選ぶ。答え合わせのあと、ほかの選択肢の意味も見せる */
function UsageQ({ item, phase, elapsed, onAnswer }: { item: Item; phase: Phase; elapsed: () => number; onAnswer: AnswerFn }) {
  const w = item.word
  const [q, setQ] = useState<UsageQuestion | null | undefined>(undefined)
  const [tier, setTier] = useState<Tier | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const learnerLevel = useSettings((s) => s.minLevel)
  useEffect(() => {
    Promise.all([loadCategory(w.cat), db.cards.get(w.id)]).then(([pool, row]) => {
      const t = wordTier({ learnerLevel, stability: row?.stability, retry: item.retry })
      setTier(t)
      // 新しい文脈（2つ目の例文）を優先。作れない文なら、ほかの例文で
      const first = quizExample(w, item.seed)
      setQ(usageQuestion(w, pool, t, first) ?? w.ex.map((e) => usageQuestion(w, pool, t, e)).find(Boolean) ?? null)
    })
  }, [w]) // eslint-disable-line react-hooks/exhaustive-deps
  // 作れないとき（まれ）は、意味を選ぶ問題にする
  if (q === null) return <ChoiceQ item={{ ...item, type: 'mc' }} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  if (!q) return null
  return (
    <div className="animate-rise">
      <Prompt aside={tier && <TierBadge tier={tier} />}>和訳に合うように、空所に入る語を選ぼう</Prompt>
      <p className="en text-[22px] leading-snug">{q.blanked}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{q.ja}</p>
      <div className="mt-6 space-y-2">
        {q.options.map((o, k) => (
          <ChoiceButton
            key={o.word.id}
            index={k + 1}
            state={choiceState(phase === 'feedback', o.word.id === w.id, picked === o.word.id)}
            disabled={phase !== 'question'}
            onClick={() => {
              setPicked(o.word.id)
              onAnswer(o.word.id === w.id, elapsed(), { answer: o.text })
            }}
          >
            <span className="en text-[18px]">{o.text}</span>
            {phase === 'feedback' && <span className="ml-2 text-[12px] text-muted">{quizGloss(o.word.ja)}</span>}
          </ChoiceButton>
        ))}
        {phase === 'question' && <DontKnow onClick={() => onAnswer(false, elapsed())} />}
      </div>
      {phase === 'feedback' && (
        <div className="mt-3 flex items-center gap-2">
          <p className="en min-w-0 flex-1 text-[15px] leading-snug">{q.en}</p>
          <SpeakButton text={q.en} accent={accentOf(w)} size="sm" />
        </div>
      )}
    </div>
  )
}

/** 不規則動詞の過去形・過去分詞を選ぶ */
function FormQ({ item, phase, elapsed, onAnswer }: { item: Item; phase: Phase; elapsed: () => number; onAnswer: AnswerFn }) {
  const w = item.word
  const q = useMemo(() => formQuestion(w, item.seed), [w, item.seed])
  const [picked, setPicked] = useState<string | null>(null)
  if (!q) return <ChoiceQ item={{ ...item, type: 'mc' }} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  return (
    <div className="animate-rise">
      <Prompt>
        変化形を選ぼう（<b className="font-semibold text-ink">{q.label}</b>）
      </Prompt>
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center">
        <p className="en text-[44px] font-medium leading-[1.05] tracking-tight">{w.w}</p>
        <p className="text-[14px] text-muted">{quizGloss(w.ja)}</p>
      </div>
      <div className="mt-6 space-y-2">
        {q.options.map((o, k) => (
          <ChoiceButton
            key={o}
            index={k + 1}
            state={choiceState(phase === 'feedback', o === q.answer, picked === o)}
            disabled={phase !== 'question'}
            onClick={() => {
              setPicked(o)
              onAnswer(o === q.answer, elapsed(), { answer: o })
            }}
          >
            <span className="en text-[18px]">{o}</span>
          </ChoiceButton>
        ))}
        {phase === 'question' && <DontKnow onClick={() => onAnswer(false, elapsed())} />}
      </div>
    </div>
  )
}

/** 並べかえ：例文の語をタップして正しい順に並べる（並べた語をタップすると戻せる） */
function OrderQ({ item, phase, elapsed, onAnswer }: { item: Item; phase: Phase; elapsed: () => number; onAnswer: AnswerFn }) {
  const w = item.word
  const ex = useMemo(() => {
    const cands = w.ex.filter((e) => orderTokens(e.en))
    return cands[(item.seed ?? 0) % Math.max(1, cands.length)]
  }, [w, item.seed])
  const tokens = useMemo(() => (ex ? orderTokens(ex.en) : null), [ex])
  const bank = useMemo(() => (tokens ? scrambled(tokens) : []), [tokens])
  const [used, setUsed] = useState<number[]>([])
  if (!ex || !tokens) return <ChoiceQ item={{ ...item, type: 'mc' }} phase={phase} elapsed={elapsed} onAnswer={onAnswer} />
  const picked = used.map((k) => bank[k])
  const done = used.length === bank.length
  const answered = phase !== 'question'
  return (
    <div className="animate-rise">
      <Prompt>和訳に合うように、英語を並べかえよう</Prompt>
      <p className="text-[17px] font-semibold leading-snug">{ex.ja}</p>
      <div
        className={cx(
          'mt-4 flex min-h-[96px] flex-wrap content-start gap-1.5 rounded-[14px] border p-2.5',
          answered ? (orderMatches(picked, tokens) ? 'border-ok' : 'border-ng') : 'border-line-strong',
        )}
        aria-label="並べた英文"
      >
        {used.map((k, i) => (
          <button
            key={`${k}-${i}`}
            disabled={answered}
            onClick={() => setUsed((u) => u.filter((x) => x !== k))}
            className="en min-h-10 rounded-[10px] bg-surface-2 px-3 text-[17px] active:scale-95"
          >
            {bank[k]}
          </button>
        ))}
      </div>
      {!answered && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {bank.map((t, k) => (
            <button
              key={k}
              disabled={used.includes(k)}
              onClick={() => setUsed((u) => [...u, k])}
              className={cx(
                'en min-h-10 rounded-[10px] border border-line bg-surface px-3 text-[17px] transition active:scale-95',
                used.includes(k) && 'invisible',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {answered && !orderMatches(picked, tokens) && (
        <p className="mt-3 text-[15px]">
          正解：
          <span className="en text-[17px] text-ok">{tokens.join(' ')}</span>
        </p>
      )}
      {phase === 'question' && (
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => onAnswer(false, elapsed())}>
            分からない
          </Button>
          <Button variant="ink" className="flex-1" disabled={!done} onClick={() => onAnswer(orderMatches(picked, tokens), elapsed(), { typed: true })}>
            答え合わせ
          </Button>
        </div>
      )}
    </div>
  )
}

function FlipQ({
  item,
  phase,
  elapsed,
  onAnswer,
  showIntervals,
}: {
  item: Item
  phase: Phase
  elapsed: () => number
  onAnswer: AnswerFn
  showIntervals: boolean
}) {
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
                {showIntervals && <span className="text-[11px] tabular-nums text-muted">{preview[g]}</span>}
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
            {quizGloss(w.ja)}
          </p>
        </>
      ) : (
        <>
          <p className="text-[24px] font-semibold leading-snug">{quizGloss(w.ja)}</p>
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
