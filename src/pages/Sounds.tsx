import { useEffect, useMemo, useState } from 'react'
import { Equal, EqualNot, RotateCcw, Shuffle } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { FeedbackBar, ListenButton, ResultCard, SessionShell, SlowButton, SLOW_RATE, scoreCaption } from '@/components/Session'
import { Button, List, ListRow, Marked, Segmented, SpeakButton, cx } from '@/components/ui'
import { CONTRASTS, type Contrast } from '@/data/minimalPairs'
import { PAIR_WORDS } from '@/data/pairWords'
import { isNeuralActive, NEURAL_VOICES, speak, stopSpeaking, warmUpSpeech, type Accent, type VoiceRole } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'
import { shuffle } from '@/lib/vocab'
import { play as playCue } from '@/lib/sounds'

const ROUND = 12
const STORE = 'tetsu-sounds'
const MODE_STORE = 'tetsu-sounds-mode'

/** 出題の形式。単語だけ／例文の中で／2つが同じかちがうか */
type SoundMode = 'word' | 'sentence' | 'same'

const MODES: { value: SoundMode; label: string; desc: string; prompt: string }[] = [
  { value: 'word', label: '単語', desc: '聞こえた単語を2つから選びます', prompt: 'どちらが聞こえた？' },
  { value: 'sentence', label: '例文', desc: '例文の中で聞こえた単語を選びます。文の流れの中でも聞き分けます', prompt: '例文の中で、どちらが聞こえた？' },
  { value: 'same', label: '同じ？ちがう？', desc: '続けて読む2つの単語が、同じかちがうかを答えます', prompt: '2つの単語は同じ？ちがう？' },
]

type Best = Record<string, { best: number; plays: number }>
function loadBest(): Best {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? '{}') as Best
  } catch {
    return {}
  }
}
/** 最高記録のキー（単語の形式は以前の記録と同じ） */
const bestKey = (id: string, mode: SoundMode) => (mode === 'word' ? id : `${id}:${mode}`)

function loadMode(): SoundMode {
  try {
    const m = localStorage.getItem(MODE_STORE)
    return m === 'sentence' || m === 'same' ? m : 'word'
  } catch {
    return 'word'
  }
}

interface Trial {
  contrast: Contrast
  pair: [string, string]
  /** 単語・例文：聞こえた語（0 か 1）。同じ？ちがう？：1つ目の語 */
  answer: 0 | 1
  /** 同じ？ちがう？の2つ目の語 */
  second: 0 | 1
  accent: Accent
  /** 同じ？ちがう？は2語を同じ声で読む */
  voice: VoiceRole
}

const coin = () => (Math.random() < 0.5 ? 0 : 1)

function makeRound(cs: Contrast[], n = ROUND): Trial[] {
  // コースを混ぜるときは、どの対立も同じくらい出るように順番を混ぜてから割り振る
  const order = shuffle(cs)
  const left = new Map(cs.map((c) => [c.id, shuffle(c.pairs)]))
  const out: Trial[] = []
  for (let k = 0; k < n; k++) {
    const c = order[k % order.length]
    let rest = left.get(c.id)!
    if (!rest.length) rest = shuffle(c.pairs)
    const pair = rest[0]
    left.set(c.id, rest.slice(1))
    const answer = coin()
    const same = Math.random() < 0.5
    out.push({
      contrast: c,
      pair,
      answer,
      second: same ? answer : answer === 0 ? 1 : 0,
      accent: c.accents[Math.floor(Math.random() * c.accents.length)],
      voice: k % 2 ? 'alt' : 'main',
    })
  }
  return shuffle(out)
}

/**
 * 聞き分けトレーニング（高変動音声訓練：HVPT）。
 * 最小対語（light / right など）のどちらが聞こえたかを答え、すぐに正誤を知らせる。
 * 毎回ちがう話者の声で再生し、特定の声に慣れるのではなく音の違いそのものを聞き取れるようにする。
 * 語の意味と例文も出し、聞き分けた語が実際にどう使われるかまで分かるようにする。
 */
export default function Sounds() {
  const [picked, setPicked] = useState<Contrast[] | null>(null)
  /** 「もう一度」で同じ音を新しい問題でやり直す */
  const [run, setRun] = useState(0)
  const [mode, setModeState] = useState<SoundMode>(loadMode)
  const [best, setBest] = useState<Best>(loadBest)
  useEffect(() => () => stopSpeaking(), [])

  const setMode = (m: SoundMode) => {
    setModeState(m)
    try {
      localStorage.setItem(MODE_STORE, m)
    } catch {
      /* noop */
    }
  }

  if (picked)
    return (
      <Round
        key={picked.map((c) => c.id).join() + mode + run}
        contrasts={picked}
        mode={mode}
        onExit={(score, again) => {
          if (picked.length === 1 && score !== null) {
            const key = bestKey(picked[0].id, mode)
            const prev = best[key] ?? { best: 0, plays: 0 }
            const next = { ...best, [key]: { best: Math.max(prev.best, score), plays: prev.plays + 1 } }
            setBest(next)
            try {
              localStorage.setItem(STORE, JSON.stringify(next))
            } catch {
              /* noop */
            }
          }
          if (again) setRun((r) => r + 1)
          else setPicked(null)
        }}
      />
    )

  const voices = isNeuralActive() ? NEURAL_VOICES['en-US'].length + NEURAL_VOICES['en-GB'].length : null
  const m = MODES.find((x) => x.value === mode)!
  const pairs = CONTRASTS.reduce((n, c) => n + c.pairs.length, 0)
  return (
    <div>
      <PageHeader title="聞き分け" subtitle="日本語にない音の違いを、いろいろな人の声で聞き分ける" back="/practice" />
      <div className="px-4 pb-8">
        <Guide who="moka" pose="think" text="1回12問。毎回ちがう人の声になるのがポイントだよ♪ 意味と例文も確かめてね。" />
        <div className="mt-5">
          <Segmented value={mode} onChange={setMode} options={MODES.map((x) => ({ value: x.value, label: x.label }))} />
          <p className="mt-2 px-1 text-[12px] leading-relaxed text-muted">{m.desc}</p>
        </div>
        <List className="mt-4">
          {CONTRASTS.map((c) => {
            const b = best[bestKey(c.id, mode)]
            return (
              <ListRow
                key={c.id}
                onClick={() => {
                  warmUpSpeech()
                  setPicked([c])
                }}
                title={c.title}
                sub={
                  <span className="flex items-baseline gap-2">
                    <span className="ipa text-[12px]">
                      /{c.symbols[0]}/ – /{c.symbols[1]}/
                    </span>
                    <span className="en text-[14px] italic">
                      {c.pairs[0][0]} / {c.pairs[0][1]}
                    </span>
                  </span>
                }
                right={b ? <span className="tabular-nums">最高 {b.best}%</span> : undefined}
              />
            )
          })}
        </List>
        <Button
          block
          variant="outline"
          className="mt-3"
          onClick={() => {
            warmUpSpeech()
            setPicked(CONTRASTS)
          }}
        >
          <Shuffle className="h-[18px] w-[18px]" strokeWidth={1.8} />
          ぜんぶ混ぜて練習する
        </Button>
        <p className="mt-4 px-1 text-[12px] leading-relaxed text-muted">
          {CONTRASTS.length}種類の音・{pairs}組の単語。
          {voices
            ? `高品質音声の${voices}人の声（米・英）で出題します。`
            : 'この端末の英語の声で出題します。iPhone の「設定 → アクセシビリティ → 読み上げコンテンツ → 声」で英語の声を追加すると、聞ける声が増えます。'}
          多くの人の声で練習すると、初めて聞く声でも聞き分けられるようになることが、研究で確かめられています。
        </p>
      </div>
    </div>
  )
}

function Round({ contrasts, mode, onExit }: { contrasts: Contrast[]; mode: SoundMode; onExit: (score: number | null, again?: boolean) => void }) {
  const trials = useMemo(() => makeRound(contrasts), [contrasts])
  const [i, setI] = useState(0)
  /** 単語・例文：選んだ語。同じ？ちがう？：0=同じ 1=ちがう */
  const [choice, setChoice] = useState<0 | 1 | null>(null)
  const [correct, setCorrect] = useState(0)
  const [missed, setMissed] = useState<Trial[]>([])
  const t = trials[i]
  const done = i >= trials.length
  const m = MODES.find((x) => x.value === mode)!

  /** 問題を聞く。単語・例文は再生のたびに声を変え、同じ？ちがう？は2語を同じ声で続けて読む */
  const play = async (rate = 0.9) => {
    if (!t) return
    if (mode === 'sentence') return void speak(PAIR_WORDS[t.pair[t.answer]].en, { accent: t.accent, voice: 'random', rate })
    if (mode === 'word') return void speak(t.pair[t.answer], { accent: t.accent, voice: 'random', rate })
    const first = await speak(t.pair[t.answer], { accent: t.accent, voice: t.voice, rate })
    if (!first) return
    await new Promise((r) => setTimeout(r, 450))
    void speak(t.pair[t.second], { accent: t.accent, voice: t.voice, rate })
  }

  useEffect(() => {
    if (t) void play()
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (done) {
    const score = Math.round((correct / trials.length) * 100)
    return (
      <SessionShell onClose={() => onExit(score)}>
        <div className="animate-rise space-y-4 pb-8">
          <Guide
            pose={score >= 90 ? 'celebrate' : score >= 70 ? 'happy' : 'cheer'}
            text={
              score >= 90
                ? 'すごい、ほとんど聞き分けられてるワン！'
                : score >= 70
                  ? 'いい調子！まちがえた組は、聞き比べてから例文でも確かめてみよう。'
                  : 'むずかしい音だから大丈夫。数日続けると、だんだん聞こえ方が変わってくるワン。'
            }
          />
          <ResultCard value={score} caption={`${m.label}・${scoreCaption(correct, trials.length)}`}>
            {contrasts.length === 1 ? <p className="text-[13px] leading-relaxed">{contrasts[0].tip}</p> : undefined}
          </ResultCard>
          {missed.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-[13px] font-semibold text-muted">まちがえた組</p>
              <List>
                {missed.map((x, k) => (
                  <div key={k} className={cx('grid grid-cols-2 gap-3 px-4 py-2.5', k > 0 && 'hairline-t')}>
                    {x.pair.map((w) => (
                      <div key={w} className="flex min-w-0 items-center gap-2">
                        <SpeakButton text={w} accent={x.accent} size="sm" />
                        <div className="min-w-0">
                          <p className="en truncate text-[16px] font-medium">{w}</p>
                          <p className="text-[11.5px] leading-snug text-muted">{PAIR_WORDS[w].ja}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </List>
            </div>
          )}
          <div className="grid gap-2">
            <Button block size="lg" onClick={() => onExit(score, true)}>
              <RotateCcw className="h-[18px] w-[18px]" />
              もう一度
            </Button>
            <Button block variant="secondary" onClick={() => onExit(score)}>
              ほかの音を選ぶ
            </Button>
          </div>
        </div>
      </SessionShell>
    )
  }

  const answered = choice !== null
  const target = mode === 'same' ? (t.answer === t.second ? 0 : 1) : t.answer
  const ok = choice === target
  const answer = (k: 0 | 1) => {
    setChoice(k)
    const good = k === target
    playCue(good ? 'correct' : 'wrong')
    if (good) setCorrect((c) => c + 1)
    else setMissed((ms) => [...ms, t])
    bumpDaily({ listening: 1, correct: good ? 1 : 0, seconds: mode === 'sentence' ? 10 : 6 })
  }
  const heard = mode === 'same' ? `${t.pair[t.answer]} → ${t.pair[t.second]}` : null

  return (
    <SessionShell onClose={() => onExit(null)} progress={{ value: i, max: trials.length }}>
      <div className={cx(answered ? 'pb-44' : 'pb-8')}>
        <p className="text-center text-[12.5px] font-medium text-muted">
          {contrasts.length === 1 ? contrasts[0].title : t.contrast.title}・{m.label}
        </p>
        <div className="flex flex-col items-center gap-3 py-7">
          <ListenButton onClick={() => void play()} />
          <SlowButton onClick={() => void play(SLOW_RATE)} />
          <p className="text-[13px] text-muted">{m.prompt}</p>
        </div>

        {mode === 'same' ? (
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                [0, '同じ', Equal],
                [1, 'ちがう', EqualNot],
              ] as const
            ).map(([k, label, Icon]) => (
              <button
                key={k}
                disabled={answered}
                onClick={() => answer(k)}
                className={cx(
                  'flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-[18px] border transition active:scale-[0.98]',
                  answered && k === target
                    ? 'border-ok bg-ok-soft'
                    : answered && k === choice
                      ? 'animate-shake border-ng bg-ng-soft'
                      : answered
                        ? 'border-line bg-surface opacity-50'
                        : 'border-line bg-surface',
                )}
              >
                <Icon className="h-7 w-7" strokeWidth={1.8} />
                <span className="text-[16px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {([0, 1] as const).map((k) => (
              <button
                key={k}
                disabled={answered}
                onClick={() => answer(k)}
                className={cx(
                  'flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-[18px] border px-2 py-3 transition active:scale-[0.98]',
                  answered && k === t.answer
                    ? 'border-ok bg-ok-soft'
                    : answered && k === choice
                      ? 'animate-shake border-ng bg-ng-soft'
                      : answered
                        ? 'border-line bg-surface opacity-50'
                        : 'border-line bg-surface',
                )}
              >
                <span className="en text-[28px] font-medium leading-tight">{t.pair[k]}</span>
                <span className="text-center text-[12px] leading-snug text-muted">{PAIR_WORDS[t.pair[k]].ja}</span>
              </button>
            ))}
          </div>
        )}

        {answered && (
          <div className="mt-6 animate-rise">
            <p className="mb-2 px-1 text-[13px] font-semibold text-muted">聞き比べる（同じ声）</p>
            <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
              {([0, 1] as const).map((k) => {
                const w = t.pair[k]
                const g = PAIR_WORDS[w]
                return (
                  <div key={w} className={cx('p-4', k > 0 && 'hairline-t')}>
                    <div className="flex items-center gap-3">
                      <SpeakButton text={w} accent={t.accent} voice="main" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline gap-2">
                          <span className="en text-[22px] font-medium leading-tight">{w}</span>
                          <span className="ipa text-[12px] text-muted">/{t.contrast.symbols[k]}/</span>
                        </p>
                        <p className="text-[13px] leading-snug">{g.ja}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-start gap-2 border-l-2 border-line-strong pl-3">
                      <div className="min-w-0 flex-1">
                        <p className="en text-[17px] leading-[1.45]">
                          <Marked text={g.en} />
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{g.exJa}</p>
                      </div>
                      <SpeakButton text={g.en} accent={t.accent} voice="main" size="sm" />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-muted">{t.contrast.tip}</p>
          </div>
        )}
      </div>
      {answered && (
        <FeedbackBar
          ok={ok}
          label={
            ok
              ? '正解'
              : mode === 'same'
                ? `不正解（${target === 0 ? '同じ' : 'ちがう'}）`
                : `不正解（正解は ${t.pair[t.answer]}）`
          }
          aside={heard && <span className="en text-[14px]">{heard}</span>}
          last={i + 1 >= trials.length}
          onNext={() => {
            setChoice(null)
            setI(i + 1)
          }}
        />
      )}
    </SessionShell>
  )
}
