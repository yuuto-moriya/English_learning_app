import { useEffect, useMemo, useState } from 'react'
import { Check, Play, RotateCcw, X } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { BottomBar, Button, Card, List, ListRow, ProgressBar, cx } from '@/components/ui'
import { CONTRASTS, type Contrast } from '@/data/minimalPairs'
import { isNeuralActive, NEURAL_VOICES, speak, stopSpeaking, warmUpSpeech, type Accent } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'
import { shuffle } from '@/lib/vocab'
import { play as playCue } from '@/lib/sounds'

const ROUND = 12
const STORE = 'tetsu-sounds'

type Best = Record<string, { best: number; plays: number }>
function loadBest(): Best {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? '{}') as Best
  } catch {
    return {}
  }
}

interface Trial {
  contrast: Contrast
  pair: [string, string]
  /** 正解（0 か 1） */
  answer: 0 | 1
  accent: Accent
}

function makeRound(cs: Contrast[]): Trial[] {
  const out: Trial[] = []
  for (let k = 0; k < ROUND; k++) {
    const c = cs[k % cs.length]
    const pair = c.pairs[Math.floor(Math.random() * c.pairs.length)]
    out.push({ contrast: c, pair, answer: Math.random() < 0.5 ? 0 : 1, accent: c.accents[Math.floor(Math.random() * c.accents.length)] })
  }
  // 同じ語の組が続かないように並べ替える
  return shuffle(out)
}

/**
 * 聞き分けトレーニング（高変動音声訓練：HVPT）。
 * 最小対語（light / right など）のどちらが聞こえたかを答え、すぐに正誤を知らせる。
 * 毎回ちがう話者の声で再生し、特定の声に慣れるのではなく音の違いそのものを聞き取れるようにする。
 */
export default function Sounds() {
  const [picked, setPicked] = useState<Contrast[] | null>(null)
  const [best, setBest] = useState<Best>(loadBest)
  useEffect(() => () => stopSpeaking(), [])

  if (picked)
    return (
      <Round
        contrasts={picked}
        onExit={(score) => {
          if (picked.length === 1 && score !== null) {
            const id = picked[0].id
            const prev = best[id] ?? { best: 0, plays: 0 }
            const next = { ...best, [id]: { best: Math.max(prev.best, score), plays: prev.plays + 1 } }
            setBest(next)
            try {
              localStorage.setItem(STORE, JSON.stringify(next))
            } catch {
              /* noop */
            }
          }
          setPicked(null)
        }}
      />
    )

  const voices = isNeuralActive() ? NEURAL_VOICES['en-US'].length + NEURAL_VOICES['en-GB'].length : null
  return (
    <div>
      <PageHeader title="聞き分け" subtitle="日本語にない音の違いを、いろいろな人の声で聞き分ける" back="/practice" />
      <div className="px-4 pb-8">
        <Guide
          who="moka"
          pose="think"
          text="1回12問。どちらの単語が聞こえたか選んでね。毎回ちがう人の声になるのがポイントだよ♪"
        />
        <List className="mt-5">
          {CONTRASTS.map((c) => {
            const b = best[c.id]
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
          ぜんぶ混ぜて練習する
        </Button>
        <p className="mt-4 px-1 text-[12px] leading-relaxed text-muted">
          {voices
            ? `高品質音声の${voices}人の声（米・英）で出題します。`
            : 'この端末の英語の声で出題します。iPhone の「設定 → アクセシビリティ → 読み上げコンテンツ → 声」で英語の声を追加すると、聞ける声が増えます。'}
          多くの人の声で練習すると、初めて聞く声でも聞き分けられるようになることが、研究で確かめられています。
        </p>
      </div>
    </div>
  )
}

function Round({ contrasts, onExit }: { contrasts: Contrast[]; onExit: (score: number | null) => void }) {
  const trials = useMemo(() => makeRound(contrasts), [contrasts])
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState<0 | 1 | null>(null)
  const [correct, setCorrect] = useState(0)
  const t = trials[i]
  const done = i >= trials.length

  /** この問題の声（再生のたびに変える。聞き比べでは同じ声を使う） */
  const play = (k: 0 | 1, voice: 'random' | 'main' = 'random') => speak(t.pair[k], { accent: t.accent, voice, rate: 0.9 })

  useEffect(() => {
    if (t) void play(t.answer)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (done) {
    const score = Math.round((correct / trials.length) * 100)
    return (
      <div>
        <PageHeader title="結果" back={false} />
        <div className="px-4">
          <Guide
            pose={score >= 90 ? 'celebrate' : score >= 70 ? 'happy' : 'cheer'}
            text={
              score >= 90
                ? 'すごい、ほとんど聞き分けられてるワン！'
                : score >= 70
                  ? 'いい調子！まちがえた組は、コツを読んでから聞き比べてみよう。'
                  : 'むずかしい音だから大丈夫。数日続けると、だんだん聞こえ方が変わってくるワン。'
            }
          />
          <Card className="mt-4">
            <p className="text-[44px] font-semibold leading-none tracking-tight tabular-nums">
              {score}
              <span className="text-[18px] font-medium text-muted">%</span>
            </p>
            <p className="mt-2 text-[13px] text-muted">
              {trials.length}問中 {correct}問正解
            </p>
            {contrasts.length === 1 && <p className="mt-4 border-t border-line pt-3 text-[13px] leading-relaxed">{contrasts[0].tip}</p>}
          </Card>
          <div className="mt-4 grid gap-2">
            <Button block size="lg" variant="ink" onClick={() => onExit(score)}>
              <RotateCcw className="h-[18px] w-[18px]" />
              ほかの音を選ぶ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const answered = choice !== null
  const ok = choice === t.answer
  return (
    <div>
      <PageHeader title={contrasts.length === 1 ? contrasts[0].title : 'ミックス'} back={false} right={<button onClick={() => onExit(null)} className="text-[14px] text-muted">やめる</button>} />
      <div className={cx('px-4', answered && 'pb-48')}>
        <ProgressBar value={i} max={trials.length} className="h-[5px]" />
        <div className="flex flex-col items-center gap-3 py-10">
          <button
            onClick={() => play(t.answer)}
            aria-label="もう一度聞く"
            className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-ink text-bg transition active:scale-95"
          >
            <Play className="h-9 w-9 translate-x-0.5 fill-current" strokeWidth={1.5} />
          </button>
          <p className="text-[13px] text-muted">どちらが聞こえた？</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([0, 1] as const).map((k) => (
            <button
              key={k}
              disabled={answered}
              onClick={() => {
                setChoice(k)
                const good = k === t.answer
                playCue(good ? 'correct' : 'wrong')
                if (good) setCorrect((c) => c + 1)
                bumpDaily({ listening: 1, correct: good ? 1 : 0, seconds: 6 })
              }}
              className={cx(
                'flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-[18px] border transition active:scale-[0.98]',
                answered && k === t.answer
                  ? 'border-ok bg-ok-soft'
                  : answered && k === choice
                    ? 'animate-shake border-ng bg-ng-soft'
                    : 'border-line bg-surface',
              )}
            >
              <span className="en text-[30px] font-medium">{t.pair[k]}</span>
              <span className="ipa text-[12px] text-muted">/{t.contrast.symbols[k]}/</span>
            </button>
          ))}
        </div>
      </div>
      {answered && (
        <BottomBar tone={ok ? 'ok' : 'ng'}>
          <div className="mb-3 flex items-center gap-2">
            <span className={cx('flex h-7 w-7 items-center justify-center rounded-full text-white', ok ? 'bg-ok' : 'bg-ng')}>
              {ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
            </span>
            <span className={cx('text-[16px] font-bold', ok ? 'text-ok' : 'text-ng')}>
              {ok ? '正解' : `正解は ${t.pair[t.answer]}`}
            </span>
          </div>
          <p className="mb-2 text-[12.5px] text-muted">聞き比べる（同じ声）</p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {([0, 1] as const).map((k) => (
              <Button key={k} variant="outline" size="sm" onClick={() => play(k, 'main')}>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span className="en text-[16px]">{t.pair[k]}</span>
              </Button>
            ))}
          </div>
          {!ok && <p className="mb-3 text-[12.5px] leading-relaxed">{t.contrast.tip}</p>}
          <Button
            block
            size="lg"
            variant="ink"
            onClick={() => {
              setChoice(null)
              setI(i + 1)
            }}
          >
            {i + 1 >= trials.length ? '結果を見る' : '次へ'}
          </Button>
        </BottomBar>
      )}
    </div>
  )
}
