import { useEffect, useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SourcePicker, SpeedPicker } from '@/components/PracticeControls'
import { Button, Card, ProgressBar, cx } from '@/components/ui'
import { jaDistractors, pickRound, sentencePool, type Sentence, type Source } from '@/lib/sentences'
import { speak, stopSpeaking } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'
import { correctMessage, wrongMessage, type GuideLine } from '@/lib/guide'
import { shuffle } from '@/lib/vocab'

export default function Listening() {
  const [sources, setSources] = useState<Source[]>(['general', 'scene'])
  const [level, setLevel] = useState(3)
  const [rate, setRate] = useState(0.85)
  const [pool, setPool] = useState<Sentence[]>([])
  const [round, setRound] = useState<Sentence[]>([])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [started, setStarted] = useState(false)
  const [guide, setGuide] = useState<GuideLine | null>(null)
  const [plays, setPlays] = useState(0)

  useEffect(() => {
    let alive = true
    sentencePool(sources, level, Math.max(1, level - 2)).then((p) => alive && setPool(p))
    return () => {
      alive = false
    }
  }, [sources, level])
  useEffect(() => () => stopSpeaking(), [])

  const cur = round[i]
  const options = useMemo(() => (cur ? shuffle([cur.ja, ...jaDistractors(cur, pool)]) : []), [cur, pool])
  const done = started && i >= round.length

  const play = (r = rate) => {
    if (!cur) return
    setPlays((p) => p + 1)
    speak(cur.en, { accent: cur.accent, rate: r })
  }

  const start = () => {
    const r = pickRound(pool, 10)
    setRound(r)
    setI(0)
    setScore(0)
    setPicked(null)
    setGuide(null)
    setStarted(true)
    setPlays(1)
    if (r[0]) speak(r[0].en, { accent: r[0].accent, rate })
  }

  const choose = (ja: string) => {
    if (picked || !cur) return
    setPicked(ja)
    const ok = ja === cur.ja
    if (ok) setScore((s) => s + 1)
    setGuide(ok ? correctMessage(0) : wrongMessage())
    bumpDaily({ listening: 1, correct: ok ? 1 : 0, seconds: 15 })
  }

  const next = () => {
    const n = i + 1
    setI(n)
    setPicked(null)
    setGuide(null)
    setPlays(1)
    if (round[n]) speak(round[n].en, { accent: round[n].accent, rate })
  }

  return (
    <div>
      <PageHeader title="リスニング" subtitle="聞いて意味を選ぶ（10問）" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        {!started || done ? (
          <>
            {done ? (
              <Guide
                pose={score >= 8 ? 'celebrate' : score >= 5 ? 'happy' : 'cheer'}
                text={`${round.length}問中${score}問正解！${score >= 8 ? '耳が育ってるワン！' : '聞き取れなかった文はディクテーションで確認しよう。'}`}
              />
            ) : (
              <Guide who="pico" pose="think" text="まず文字を見ずに聞いて、意味をつかむ練習だピ。聞き取れなければ速度を下げてね。" />
            )}
            <Card className="space-y-4">
              <SourcePicker sources={sources} onSources={setSources} level={level} onLevel={setLevel} />
              <SpeedPicker rate={rate} onRate={setRate} />
              <p className="text-xs text-muted">対象の文：{pool.length.toLocaleString()}文</p>
            </Card>
            <Button block onClick={start} disabled={pool.length < 4}>
              {done ? <RotateCcw className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {done ? 'もう一度' : 'スタート'}
            </Button>
          </>
        ) : (
          cur && (
            <>
              <ProgressBar value={i} max={round.length} />
              <Card className="flex flex-col items-center gap-3 py-6">
                <button
                  onClick={() => play()}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-grad text-white shadow-glow transition active:scale-95"
                  aria-label="再生"
                >
                  <Play className="h-9 w-9 translate-x-0.5" />
                </button>
                <div className="flex gap-2">
                  <Button variant="secondary" className="min-h-9 py-1 text-xs" onClick={() => play(0.65)}>
                    ゆっくり
                  </Button>
                  <span className="self-center text-xs text-muted">再生 {plays}回</span>
                </div>
                {picked && (
                  <div className="mt-2 w-full animate-pop rounded-xl bg-surface-2 p-3 text-center">
                    <p className="text-[16px] font-semibold">{cur.en}</p>
                  </div>
                )}
              </Card>
              <div className="grid gap-2">
                {options.map((o) => (
                  <button
                    key={o}
                    onClick={() => choose(o)}
                    disabled={!!picked}
                    className={cx(
                      'min-h-13 rounded-2xl bg-surface px-4 py-3 text-left text-[14px] font-semibold leading-snug shadow-card ring-1 transition active:scale-[0.98]',
                      picked && o === cur.ja ? 'bg-ok/10 ring-2 ring-ok' : picked === o ? 'bg-ng/10 ring-2 ring-ng' : 'ring-ring',
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {picked && (
                <>
                  {guide && <Guide pose={guide.pose} text={guide.text} size={64} compact />}
                  <Button block onClick={next}>
                    次へ
                  </Button>
                </>
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}
