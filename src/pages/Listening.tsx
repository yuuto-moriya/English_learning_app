import { useEffect, useMemo, useState } from 'react'
import { Check, Play, RotateCcw, Snail } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { defaultLevel, defaultSources, SourcePicker, SpeedPicker } from '@/components/PracticeControls'
import { BottomBar, Button, Card, ProgressBar, Toggle, cx } from '@/components/ui'
import { jaDistractors, pickRound, sentencePool, type Sentence, type Source } from '@/lib/sentences'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'
import { correctMessage, wrongMessage, type GuideLine } from '@/lib/guide'
import { shuffle } from '@/lib/vocab'
import { useSettings } from '@/lib/settings'
import { ACCENTS, accentInfo } from '@/lib/accents'
import { play as playCue } from '@/lib/sounds'

export default function Listening() {
  const [sources, setSources] = useState<Source[]>(() => defaultSources())
  const [level, setLevel] = useState(defaultLevel)
  const [rate, setRate] = useState(0.85)
  const vary = useSettings((s) => s.varyVoices)
  const mix = useSettings((s) => s.mixAccents)
  const setSettings = useSettings((s) => s.set)
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
  const voice = vary ? 'random' : 'main'

  useEffect(() => {
    prefetchSpeech(round.slice(i + 1, i + 3).map((s) => ({ text: s.en, accent: s.accent, rate })))
  }, [round, i, rate])

  const play = (r = rate) => {
    if (!cur) return
    setPlays((p) => p + 1)
    speak(cur.en, { accent: cur.accent, rate: r, voice })
  }

  const start = () => {
    warmUpSpeech()
    // いろいろな国の英語を混ぜるときは、1問ごとに発音（国・地域）を選び直す
    const r = pickRound(pool, 10).map((x) => (mix ? { ...x, accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)].id } : x))
    setRound(r)
    setI(0)
    setScore(0)
    setPicked(null)
    setGuide(null)
    setStarted(true)
    setPlays(1)
    if (r[0]) speak(r[0].en, { accent: r[0].accent, rate, voice })
  }

  const choose = (ja: string) => {
    if (picked || !cur) return
    setPicked(ja)
    const ok = ja === cur.ja
    playCue(ok ? 'correct' : 'wrong')
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
    if (round[n]) speak(round[n].en, { accent: round[n].accent, rate, voice })
  }

  return (
    <div>
      <PageHeader title="リスニング" subtitle="文字を見ずに聞いて、意味を選ぶ（10問）" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        {!started || done ? (
          <>
            {done ? (
              <Guide
                pose={score >= 8 ? 'celebrate' : score >= 5 ? 'happy' : 'cheer'}
                text={`${round.length}問中${score}問正解！${score >= 8 ? '耳が育ってるワン！' : '聞き取れなかった文はディクテーションで確かめよう。'}`}
              />
            ) : (
              <Guide who="moka" pose="think" text="まず文字を見ずに聞いて、意味をつかもう♪ 聞き取れなければ速度を下げてね。" />
            )}
            <Card className="space-y-4">
              <SourcePicker sources={sources} onSources={setSources} level={level} onLevel={setLevel} />
              <SpeedPicker rate={rate} onRate={setRate} />
              <Toggle
                label="いろいろな声で聞く"
                desc="毎回ちがう話者の声で再生します。初めて聞く声でも聞き取れる力につながります"
                checked={vary}
                onChange={(v) => setSettings({ varyVoices: v })}
              />
              <Toggle
                label="いろいろな国の英語で聞く"
                desc="アメリカ・イギリス・オーストラリア・インドなど、1問ごとに国の発音を変えます"
                checked={mix}
                onChange={(v) => setSettings({ mixAccents: v })}
              />
              <p className="text-[12px] text-muted">対象の文：{pool.length.toLocaleString()}文</p>
            </Card>
            <Button block size="lg" onClick={start} disabled={pool.length < 4}>
              {done ? <RotateCcw className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px]" />}
              {done ? 'もう一度' : 'スタート'}
            </Button>
          </>
        ) : (
          cur && (
            <div className={cx(picked && 'pb-40')}>
              <ProgressBar value={i} max={round.length} className="h-[5px]" />
              <div className="flex flex-col items-center gap-4 py-9">
                <button
                  onClick={() => play()}
                  className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-ink text-bg transition active:scale-95"
                  aria-label="再生"
                >
                  <Play className="h-9 w-9 translate-x-0.5 fill-current" strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => play(0.65)}>
                    <Snail className="h-4 w-4" strokeWidth={1.8} />
                    ゆっくり
                  </Button>
                  <span className="text-[12px] tabular-nums text-muted">再生 {plays}回</span>
                </div>
                {picked && (
                  <div className="mt-1 w-full animate-rise text-center">
                    <p className="en text-[20px] leading-snug">{cur.en}</p>
                    <p className="mt-1 text-[12px] text-muted">{accentInfo(cur.accent).label}の発音</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {options.map((o) => {
                  const isAns = o === cur.ja
                  return (
                    <button
                      key={o}
                      onClick={() => choose(o)}
                      disabled={!!picked}
                      className={cx(
                        'flex min-h-[54px] w-full items-center gap-2 rounded-[14px] border px-4 py-3 text-left text-[14.5px] leading-snug transition active:scale-[0.99]',
                        picked && isAns
                          ? 'border-ok bg-ok-soft'
                          : picked === o
                            ? 'animate-shake border-ng bg-ng-soft'
                            : picked
                              ? 'border-line bg-surface opacity-50'
                              : 'border-line bg-surface',
                      )}
                    >
                      <span className="flex-1">{o}</span>
                      {picked && isAns && <Check className="h-4 w-4 shrink-0 text-ok" strokeWidth={2.6} />}
                    </button>
                  )
                })}
              </div>
              {picked && (
                <BottomBar tone={picked === cur.ja ? 'ok' : 'ng'}>
                  {guide && <p className="mb-3 text-[14px] leading-relaxed">{guide.text}</p>}
                  <Button block size="lg" variant="ink" onClick={next}>
                    {i + 1 >= round.length ? '結果を見る' : '次へ'}
                  </Button>
                </BottomBar>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
