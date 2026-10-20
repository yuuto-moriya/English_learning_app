import { useEffect, useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { ChoiceButton, choiceState, FeedbackBar, ResultCard, SessionShell, scoreCaption } from '@/components/Session'
import { Button, Card, SpeakButton } from '@/components/ui'
import { CONFUSABLES, type ConfusableItem, type ConfusableSet } from '@/data/confusables'
import { bumpDaily } from '@/lib/db'
import { correctMessage, type GuideLine } from '@/lib/guide'
import { useSettings } from '@/lib/settings'
import { shuffle } from '@/lib/vocab'
import { neutralArticle } from '@/lib/quiz'
import { stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { play as playCue } from '@/lib/sounds'

const ROUND = 10

interface Q {
  set: ConfusableSet
  item: ConfusableItem
  options: string[]
}

/** 学ぶコースとレベルに合う組（レベルは選んだ上限の1つ上まで。ビジネスの組はビジネスを選んでいるときだけ） */
export function usageSets(studyCats: Record<string, boolean>, maxLevel: number): ConfusableSet[] {
  return CONFUSABLES.filter((s) => (s.cat === 'general' || studyCats[s.cat]) && s.lv <= Math.max(2, maxLevel + 1))
}

/** 1回分：組をなるべく重ねずに、1組から1問ずつ選ぶ */
export function pickUsageRound(sets: ConfusableSet[], n = ROUND): Q[] {
  const out: Q[] = []
  const order = shuffle(sets)
  for (let k = 0; out.length < n && k < order.length * 4; k++) {
    const set = order[k % order.length]
    const rest = set.items.filter((it) => !out.some((q) => q.item === it))
    if (!rest.length) continue
    const item = rest[Math.floor(Math.random() * rest.length)]
    out.push({ set, item, options: shuffle(item.opts) })
  }
  return out
}

/** 文の空所に答えを入れた全文（読み上げ・答えの表示用） */
const filled = (it: ConfusableItem) => it.en.replace('___', it.ans)

export default function Usage() {
  const studyCats = useSettings((s) => s.studyCats)
  const maxLevel = useSettings((s) => s.maxLevel)
  const sets = useMemo(() => usageSets(studyCats, maxLevel), [studyCats, maxLevel])
  const [round, setRound] = useState<Q[]>([])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [started, setStarted] = useState(false)
  const [missed, setMissed] = useState<ConfusableSet[]>([])
  const [guide, setGuide] = useState<GuideLine | null>(null)
  useEffect(() => () => stopSpeaking(), [])

  const cur = round[i]
  const done = started && i >= round.length

  const start = () => {
    warmUpSpeech()
    setRound(pickUsageRound(sets))
    setI(0)
    setScore(0)
    setPicked(null)
    setMissed([])
    setGuide(null)
    setStarted(true)
  }

  const choose = (o: string) => {
    if (picked || !cur) return
    setPicked(o)
    const ok = o === cur.item.ans
    playCue(ok ? 'correct' : 'wrong')
    if (ok) setScore((s) => s + 1)
    else setMissed((m) => (m.includes(cur.set) ? m : [...m, cur.set]))
    setGuide(ok ? correctMessage(0) : null)
    void bumpDaily({ seconds: 20 }).catch(console.error)
  }

  const next = () => {
    setI(i + 1)
    setPicked(null)
    setGuide(null)
  }

  if (started && !done && cur)
    return (
      <SessionShell
        onClose={() => {
          stopSpeaking()
          setStarted(false)
        }}
        progress={{ value: i, max: round.length }}
      >
        <div className={picked ? 'pb-56' : 'pb-8'}>
          <p className="mb-5 text-[13px] font-medium text-muted">和訳に合うように、空所に入る語を選ぼう</p>
          <p className="en text-[22px] leading-snug">{neutralArticle(cur.item.en.replace('___', '＿＿＿'), cur.options)}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{cur.item.ja}</p>
          <div className="mt-6 space-y-2">
            {cur.options.map((o, k) => (
              <ChoiceButton key={o} index={k + 1} state={choiceState(!!picked, o === cur.item.ans, picked === o)} disabled={!!picked} onClick={() => choose(o)}>
                <span className="en text-[18px]">{o}</span>
              </ChoiceButton>
            ))}
          </div>
          {picked && (
            <div className="mt-5 animate-rise space-y-3">
              <div className="flex items-center gap-2">
                <p className="en min-w-0 flex-1 text-[16px] leading-snug">{filled(cur.item)}</p>
                <SpeakButton text={filled(cur.item)} size="sm" />
              </div>
              <div className="rounded-[14px] border border-line bg-surface p-3.5">
                <p className="en text-[15px] font-semibold">{cur.set.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed">{cur.set.note}</p>
              </div>
            </div>
          )}
        </div>
        {picked && (
          <FeedbackBar ok={picked === cur.item.ans} last={i + 1 >= round.length} onNext={next}>
            {guide && <p className="mb-3 text-[14px] leading-relaxed">{guide.text}</p>}
          </FeedbackBar>
        )}
      </SessionShell>
    )

  return (
    <div>
      <PageHeader title="使い分け" subtitle="日本語では同じ言葉になる英語の違い（10問）" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        {done ? (
          <>
            <Guide
              pose={score >= 8 ? 'celebrate' : score >= 5 ? 'happy' : 'cheer'}
              text={score >= 8 ? '違いがよく分かってるワン！' : 'まちがえた組の違いを、下の解説で見直そう。'}
            />
            <ResultCard value={Math.round((score / round.length) * 100)} caption={scoreCaption(score, round.length)} />
            {missed.length > 0 && (
              <Card className="space-y-3">
                <p className="text-[13px] font-semibold text-muted">見直す組</p>
                {missed.map((s) => (
                  <div key={s.id}>
                    <p className="en text-[15px] font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed">{s.note}</p>
                  </div>
                ))}
              </Card>
            )}
          </>
        ) : (
          <Guide
            pose="think"
            text="borrow と lend、say と tell…。日本語にすると同じでも、英語では使い分けるワン。和訳に合う1語を選んでね。"
          />
        )}
        <Card>
          <p className="text-[12.5px] leading-relaxed text-muted">
            日本人がまちがえやすい語の組 {sets.length}組（{sets.reduce((n, s) => n + s.items.length, 0)}問）から出題します。どの問題も、文の形か和訳で答えが1つに決まります。答え合わせのあとに、違いの解説が出ます。
          </p>
        </Card>
        <Button block size="lg" onClick={start} disabled={sets.length === 0}>
          {done && <RotateCcw className="h-[18px] w-[18px]" />}
          {done ? 'もう一度' : 'はじめる'}
        </Button>
      </div>
    </div>
  )
}
