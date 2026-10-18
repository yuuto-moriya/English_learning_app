import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Check, ChevronLeft } from 'lucide-react'
import { BRAND, Wordmark } from '@/components/Brand'
import { CharImage } from '@/components/Guide'
import { Button, SpeakButton, cx } from '@/components/ui'
import { ChoiceButton } from '@/components/Session'
import { formatMinutes, MAX_NEW_PER_DAY, MINUTE_CHOICES, newPerDay, PLAN_LABEL, useSettings, type PlanWhen } from '@/lib/settings'
import { CATEGORIES, LEVELS, type Category, type Word } from '@/lib/types'
import { loadCategory, quizGloss, shuffle } from '@/lib/vocab'
import { diagnosticTier, wordDistractors } from '@/lib/distractors'
import { stopSpeaking } from '@/lib/tts'

type Step = 'course' | 'level' | 'check' | 'plan'

const SAMPLES: Record<Category, string> = {
  general: 'Could I have the menu, please?',
  business: "Let's move on to the next item on the agenda.",
  it: 'Could you review my pull request?',
  rail: 'The possession has been granted.',
}

const LEVEL_PRESETS = [
  { label: '入門', desc: '中学英語の復習から', min: 1, max: 2 },
  { label: '初級', desc: 'TOEIC 〜450点・英検3級前後', min: 2, max: 3 },
  { label: '中級', desc: 'TOEIC 450〜650点・英検準2〜2級', min: 3, max: 4 },
  { label: '上級', desc: 'TOEIC 650点〜・英検2級以上', min: 4, max: 5 },
]

const WHEN: PlanWhen[] = ['morning', 'lunch', 'evening', 'night', 'free']

/** はじめての起動：コース → レベル → 学習プラン */
export default function Welcome() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const s = useSettings()
  const [step, setStep] = useState<Step>((params.get('step') as Step) || 'course')
  const [cats, setCats] = useState<Record<Category, boolean>>(() =>
    s.onboarded ? { ...s.studyCats } : { general: true, business: false, it: false, rail: false },
  )
  const [range, setRange] = useState<{ min: number; max: number } | null>(s.onboarded ? { min: s.minLevel, max: s.maxLevel } : null)
  const [when, setWhen] = useState<PlanWhen>(s.planWhen)
  const [minutes, setMinutes] = useState(s.dailyMinutes)
  const anyCat = Object.values(cats).some(Boolean)
  const steps: Step[] = ['course', 'level', 'plan']
  const idx = step === 'check' ? 1 : steps.indexOf(step)

  const finish = () => {
    s.set({
      studyCats: cats,
      minLevel: range?.min ?? 1,
      maxLevel: range?.max ?? 2,
      planWhen: when,
      dailyMinutes: minutes,
      // 診断し直したときは、1日の時間を変えていなければ、自分で決めた新しい単語の数をそのままにする
      dailyNew: s.onboarded && minutes === s.dailyMinutes ? s.dailyNew : newPerDay(minutes),
      onboarded: true,
    })
    nav('/', { replace: true, viewTransition: true })
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-safe">
      <div className="flex h-14 items-center gap-3">
        {idx > 0 ? (
          <button
            aria-label="戻る"
            onClick={() => setStep(step === 'check' ? 'level' : steps[idx - 1])}
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink active:bg-surface-2"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : (
          <span className="h-9 w-9" />
        )}
        <div className="flex flex-1 justify-center gap-1.5">
          {steps.map((st, i) => (
            <span key={st} className={cx('h-1 w-8 rounded-full transition-colors', i <= idx ? 'bg-ink' : 'bg-surface-3')} />
          ))}
        </div>
        <span className="h-9 w-9" />
      </div>

      {step === 'course' && (
        <div key="course" className="flex flex-1 flex-col animate-rise">
          <Wordmark className="mt-1 text-[22px] leading-tight" />
          <p className="mt-0.5 text-[12.5px] text-muted">{BRAND.tagline}</p>
          <div className="mt-3 flex items-end gap-2">
            {s.guide && <CharImage pose="greet" size={76} className="-ml-2" />}
            <p className="mb-2 text-[14px] leading-relaxed text-muted">はじめまして、テツだワン。いっしょに続けよう！</p>
          </div>
          <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight">何の英語を学びますか？</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">いくつでも選べます。選んだコースの単語・会話が出題されます（あとで変更できます）。</p>
          <div className="mt-6 space-y-2.5">
            {CATEGORIES.map((c) => {
              const on = cats[c.key]
              return (
                <button
                  key={c.key}
                  aria-pressed={on}
                  onClick={() => setCats({ ...cats, [c.key]: !on })}
                  className={cx(
                    'flex w-full items-start gap-3.5 rounded-[18px] border p-4 text-left transition active:scale-[0.99]',
                    on ? 'border-ink bg-surface shadow-[0_0_0_1px_var(--text)]' : 'border-line bg-surface',
                  )}
                >
                  <span
                    className={cx(
                      'mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition',
                      on ? 'border-ink bg-ink text-bg' : 'border-line-strong',
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[17px] font-semibold">
                      {c.label}
                      <span className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-muted">{c.desc}</span>
                    <span className="en mt-2 block text-[15px] italic text-ink/80">“{SAMPLES[c.key]}”</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-auto pb-[max(env(safe-area-inset-bottom),20px)] pt-6">
            <Button block size="lg" variant="ink" disabled={!anyCat} onClick={() => setStep('level')}>
              次へ
            </Button>
          </div>
        </div>
      )}

      {step === 'level' && (
        <div key="level" className="flex flex-1 flex-col animate-rise">
          <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight">いまの英語力は？</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">新しく出る単語の難しさを合わせます。迷ったら、2分の診断で決められます。</p>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {LEVEL_PRESETS.map((p) => {
              const on = range?.min === p.min && range?.max === p.max
              return (
                <button
                  key={p.label}
                  aria-pressed={on}
                  onClick={() => setRange({ min: p.min, max: p.max })}
                  className={cx(
                    'rounded-[16px] border bg-surface p-3.5 text-left transition active:scale-[0.98]',
                    on ? 'border-ink shadow-[0_0_0_1px_var(--text)]' : 'border-line',
                  )}
                >
                  <p className="text-[16px] font-semibold">{p.label}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{p.desc}</p>
                </button>
              )
            })}
          </div>
          <Button variant="outline" block className="mt-3" onClick={() => setStep('check')}>
            2分でレベルを診断する
          </Button>
          {(cats.rail || cats.it) && (
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              {cats.it && cats.rail ? 'IT と鉄道（保線）' : cats.it ? 'IT' : '鉄道（保線）'}の専門用語は、このレベルとは別に、基本の用語から順に出題します。
            </p>
          )}
          <div className="mt-auto pb-[max(env(safe-area-inset-bottom),20px)] pt-6">
            <Button block size="lg" variant="ink" disabled={!range} onClick={() => setStep('plan')}>
              次へ
            </Button>
          </div>
        </div>
      )}

      {step === 'check' && (
        <LevelCheck
          onDone={(r) => {
            setRange(r)
            setStep('plan')
          }}
        />
      )}

      {step === 'plan' && (
        <div key="plan" className="flex flex-1 flex-col animate-rise">
          <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight">いつ学びますか？</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            「いつ・どこで」を先に決めておくと、習慣になりやすいことが分かっています。ホームに毎日表示します。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {WHEN.map((w) => (
              <button
                key={w}
                aria-pressed={when === w}
                onClick={() => setWhen(w)}
                className={cx(
                  'min-h-11 rounded-full border px-4 text-[14px] font-medium transition active:scale-95',
                  when === w ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-surface text-ink',
                )}
              >
                {PLAN_LABEL[w]}
              </button>
            ))}
          </div>
          <p className="mt-7 text-[13px] font-semibold text-muted">1日の目安</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {MINUTE_CHOICES.map((m) => (
              <button
                key={m}
                aria-pressed={minutes === m}
                onClick={() => setMinutes(m)}
                className={cx(
                  'rounded-[14px] border bg-surface py-3 text-center transition active:scale-95',
                  minutes === m ? 'border-ink shadow-[0_0_0_1px_var(--text)]' : 'border-line',
                )}
              >
                <span className="text-[17px] font-semibold tabular-nums">{formatMinutes(m)}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            {newPerDay(minutes) >= MAX_NEW_PER_DAY
              ? `新しい単語は1日${MAX_NEW_PER_DAY}語まで（それ以上は翌日以降の復習が増えすぎるため）。残りの時間は、復習・リスニング・会話の練習にあてます。`
              : `新しい単語は1日${newPerDay(minutes)}語（翌日以降の復習を合わせて約${formatMinutes(minutes)}になる量）。`}
            あとで設定から変えられます。
          </p>
          <div className="mt-auto pb-[max(env(safe-area-inset-bottom),20px)] pt-6">
            <Button block size="lg" onClick={finish}>
              はじめる
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * レベル診断（語彙サイズテストの考え方を簡略化）。
 * 一般語のレベル（入門〜中上級。データにあるレベルだけ）から4語ずつ、意味を4択で答える。
 * 3問以上正解したレベルまでを「習得済み」とみなし、その次のレベルから新出語を始める。基準に届かなかった時点で打ち切る。
 */
function LevelCheck({ onDone }: { onDone: (r: { min: number; max: number }) => void }) {
  const [items, setItems] = useState<{ word: Word; options: Word[] }[] | null>(null)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  /** 診断するレベル（一般語のデータにあるレベルだけ。C1 の一般語はないので出さない） */
  const [levels, setLevels] = useState<number[]>([1, 2, 3, 4])
  const PER = 4

  useEffect(() => {
    let alive = true
    loadCategory('general').then((all) => {
      const content = all.filter((w) => ['n', 'v', 'adj', 'adv'].includes(w.pos) && !w.w.includes(' '))
      const out: { word: Word; options: Word[] }[] = []
      const lvs = [...new Set(content.map((w) => w.lv))].sort((a, b) => a - b).filter((lv) => content.filter((w) => w.lv === lv).length >= PER)
      for (const lv of lvs) {
        const pool = content.filter((w) => w.lv === lv)
        for (const w of shuffle(pool).slice(0, PER)) out.push({ word: w, options: shuffle([w, ...wordDistractors(w, pool, diagnosticTier(w.lv)).map((d) => d.word)]) })
      }
      if (!alive) return
      setLevels(lvs)
      setItems(out)
    })
    return () => {
      alive = false
      stopSpeaking()
    }
  }, [])

  const result = useMemo(() => {
    // 各レベルの正解数
    const byLv = levels.map(() => 0)
    answers.forEach((ok, k) => ok && byLv[Math.floor(k / PER)]++)
    let mastered = 0
    for (let lv = 0; lv < levels.length; lv++) {
      const answered = Math.min(PER, Math.max(0, answers.length - lv * PER))
      if (answered < PER) break
      if (byLv[lv] >= 3) mastered = lv + 1
      else break
    }
    return { byLv, mastered }
  }, [answers, levels])

  if (!items) return <p className="mt-10 text-center text-muted">読み込み中…</p>

  const levelIdx = Math.floor(i / PER)
  const levelDone = i > 0 && i % PER === 0
  // 直前のレベルで基準に届かなかったら終了
  const failedLevel = levelDone && result.byLv[levelIdx - 1] < 3
  const finished = i >= items.length || failedLevel

  if (finished) {
    const m = result.mastered
    // 一般語のいちばん上のレベルより上にはしない（全問正解でも新しい単語がなくならないように）
    const top = levels[levels.length - 1] ?? 4
    const min = Math.min(top, m + 1)
    const max = Math.min(top, m + 2)
    const L = LEVELS.find((l) => l.lv === min)!
    return (
      <div className="flex flex-1 flex-col animate-rise">
        <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight">診断の結果</h1>
        <div className="mt-6 rounded-[18px] border border-line bg-surface p-5">
          <p className="text-[13px] text-muted">はじめるレベル</p>
          <p className="mt-1 text-[30px] font-semibold tracking-tight">
            {L.label}
            <span className="ml-2 text-[16px] font-medium text-muted">{L.cefr}</span>
          </p>
          <div className="mt-4 flex items-end gap-1.5">
            {result.byLv.map((n, k) => (
              <div key={k} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-surface-2">
                  <div className={cx('w-full rounded-md', n >= 3 ? 'bg-ok' : 'bg-surface-3')} style={{ height: `${(n / PER) * 100}%` }} />
                </div>
                <span className="text-[11px] text-muted">{LEVELS[k].cefr}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            {m === 0
              ? 'まずは基本の単語から始めましょう。'
              : `${LEVELS[m - 1].cefr} までの単語はおおむね身についています。その次のレベルから新しい単語を出します。`}
            短い診断なので目安です。合わなければ設定から変更できます。
          </p>
        </div>
        <div className="mt-auto pb-[max(env(safe-area-inset-bottom),20px)] pt-6">
          <Button block size="lg" onClick={() => onDone({ min, max })}>
            このレベルではじめる
          </Button>
        </div>
      </div>
    )
  }

  const it = items[i]
  const choose = (id: string | null) => {
    if (picked) return
    setPicked(id ?? '-')
    setTimeout(() => {
      setAnswers((a) => [...a, id === it.word.id])
      setPicked(null)
      setI((x) => x + 1)
    }, 450)
  }
  return (
    <div key={i} className="flex flex-1 flex-col animate-fade">
      <p className="mt-4 text-[13px] text-muted">
        レベル診断 {i + 1} / {items.length}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <p className="en text-[40px] font-medium leading-none">{it.word.w}</p>
        <SpeakButton text={it.word.w} />
      </div>
      <p className="mt-2 text-[13px] text-muted">いちばん近い意味は？</p>
      <div className="mt-5 space-y-2">
        {it.options.map((o, k) => (
          <ChoiceButton key={o.id} index={k + 1} state={picked === o.id ? 'selected' : 'idle'} onClick={() => choose(o.id)}>
            {quizGloss(o.ja)}
          </ChoiceButton>
        ))}
        <button onClick={() => choose(null)} className="min-h-11 w-full text-[14px] text-muted">
          分からない
        </button>
      </div>
      <p className="mt-auto pb-[max(env(safe-area-inset-bottom),20px)] pt-6 text-center text-[12px] text-faint">
        正解は表示しません。知らない語は「分からない」でOK
      </p>
    </div>
  )
}
