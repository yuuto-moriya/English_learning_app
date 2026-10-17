import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { defaultLevel, defaultSources, SourcePicker, SpeedPicker, VoiceVarietyToggles } from '@/components/PracticeControls'
import { ChoiceButton, choiceState, FeedbackBar, ListenButton, ResultCard, SessionShell, SlowButton, SLOW_RATE, scoreCaption, TierBadge } from '@/components/Session'
import { Button, Card } from '@/components/ui'
import { learnedIds, pickRound, sentencePool, type Sentence, type Source } from '@/lib/sentences'
import { listeningTier, sentenceDistractors } from '@/lib/distractors'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'
import { correctMessage, listenWrongMessage, type GuideLine } from '@/lib/guide'
import { shuffle } from '@/lib/vocab'
import { useSettings } from '@/lib/settings'
import { ACCENTS, accentInfo } from '@/lib/accents'
import { play as playCue } from '@/lib/sounds'

export default function Listening() {
  const [sources, setSources] = useState<Source[]>(() => defaultSources())
  const [level, setLevel] = useState(defaultLevel)
  const [rate, setRate] = useState(0.85)
  const vary = useSettings((s) => s.varyVoices)
  // 選択肢の難しさは学習者のレベル（はじめるレベル）から。出題範囲のレベルを上げても選択肢まで難しくはしない
  const learnerLevel = useSettings((s) => s.minLevel)
  const mix = useSettings((s) => s.mixAccents)
  const [pool, setPool] = useState<Sentence[]>([])
  const [round, setRound] = useState<Sentence[]>([])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [started, setStarted] = useState(false)
  const [guide, setGuide] = useState<GuideLine | null>(null)
  const [plays, setPlays] = useState(0)
  /** 選択肢の難しさの調整：正解が3問続くと上げ、まちがえると下げる（−1〜+1） */
  const adjust = useRef({ value: 0, streak: 0 })

  /** 学習した語（覚えた語の例文から先に出す） */
  const [learned, setLearned] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all([sentencePool(sources, level, Math.max(1, level - 2)), learnedIds()]).then(([p, l]) => {
      if (!alive) return
      setPool(p)
      setLearned(l)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [sources, level])
  const mine = useMemo(() => pool.filter((s) => s.wordId && learned.has(s.wordId)).length, [pool, learned])
  useEffect(() => () => stopSpeaking(), [])

  const cur = round[i]
  // 選択肢の難しさは選んだレベルと回の中の正解の続き具合で決める（回答後に選択肢が変わらないよう、問題が変わったときだけ作る）
  const { options, tier } = useMemo(() => {
    const t = listeningTier(learnerLevel, adjust.current.value)
    return { tier: t, options: cur ? shuffle([cur.ja, ...sentenceDistractors(cur, pool, t).map((d) => d.ja)]) : [] }
  }, [cur, pool]) // eslint-disable-line react-hooks/exhaustive-deps
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
    const r = pickRound(pool, 10, learned).map((x) => (mix ? { ...x, accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)].id } : x))
    setRound(r)
    setI(0)
    setScore(0)
    setPicked(null)
    setGuide(null)
    setStarted(true)
    setPlays(1)
    adjust.current = { value: 0, streak: 0 }
    if (r[0]) speak(r[0].en, { accent: r[0].accent, rate, voice })
  }

  const choose = (ja: string) => {
    if (picked || !cur) return
    setPicked(ja)
    const ok = ja === cur.ja
    playCue(ok ? 'correct' : 'wrong')
    if (ok) setScore((s) => s + 1)
    const a = adjust.current
    if (!ok) adjust.current = { value: Math.max(-1, a.value - 1), streak: 0 }
    else if (a.streak + 1 >= 3) adjust.current = { value: Math.min(1, a.value + 1), streak: 0 }
    else adjust.current = { ...a, streak: a.streak + 1 }
    setGuide(ok ? correctMessage(0) : listenWrongMessage())
    // 学習記録の正答率は単語の復習の数え方なので、リスニングの正解は入れない（回数だけ）
    bumpDaily({ listening: 1, seconds: 15 })
  }

  const next = () => {
    const n = i + 1
    setI(n)
    setPicked(null)
    setGuide(null)
    setPlays(1)
    if (round[n]) speak(round[n].en, { accent: round[n].accent, rate, voice })
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
        <div className={picked ? 'pb-40' : 'pb-8'}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-medium text-muted">聞こえた英文の意味は？</p>
            <TierBadge tier={tier} />
          </div>
          <div className="flex flex-col items-center gap-3 py-7">
            <ListenButton onClick={() => play()} />
            <div className="flex items-center gap-3">
              <SlowButton onClick={() => play(SLOW_RATE)} />
              <span className="text-[12px] tabular-nums text-muted">再生 {plays}回</span>
            </div>
            {picked && (
              <div className="mt-1 w-full animate-rise text-center">
                <p className="en text-[22px] leading-snug">{cur.en}</p>
                <p className="mt-1 text-[12px] text-muted">{accentInfo(cur.accent).label}の発音</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {options.map((o) => (
              <ChoiceButton key={o} state={choiceState(!!picked, o === cur.ja, picked === o)} disabled={!!picked} onClick={() => choose(o)}>
                {o}
              </ChoiceButton>
            ))}
          </div>
        </div>
        {picked && (
          <FeedbackBar ok={picked === cur.ja} last={i + 1 >= round.length} onNext={next}>
            {guide && <p className="mb-3 text-[14px] leading-relaxed">{guide.text}</p>}
          </FeedbackBar>
        )}
      </SessionShell>
    )

  return (
    <div>
      <PageHeader title="リスニング" subtitle="文字を見ずに聞いて、意味を選ぶ（10問）" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        {done ? (
          <>
            <Guide
              pose={score >= 8 ? 'celebrate' : score >= 5 ? 'happy' : 'cheer'}
              text={score >= 8 ? '耳が育ってるワン！' : '聞き取れなかった文は、ディクテーションで確かめよう。'}
            />
            <ResultCard value={Math.round((score / round.length) * 100)} caption={scoreCaption(score, round.length)} />
          </>
        ) : (
          <Guide who="moka" pose="think" text="まず文字を見ずに聞いて、意味をつかもう♪ 聞き取れなければ速度を下げてね。" />
        )}
        <Card className="space-y-4">
          <SourcePicker sources={sources} onSources={setSources} level={level} onLevel={setLevel} />
          <SpeedPicker rate={rate} onRate={setRate} />
          <VoiceVarietyToggles />
          <p className="text-[12px] leading-relaxed text-muted">
            対象の文：{pool.length.toLocaleString()}文（うち学習した単語の例文 {mine.toLocaleString()}文。学習した単語の例文から先に出します）。選択肢には、聞こえた英文と同じ単語・同じ場面の文がまぎれます。数はレベルに合わせて決まり、正解が続くと増えます
          </p>
        </Card>
        {loaded && pool.length < 4 && (
          <p className="px-1 text-[12.5px] leading-relaxed text-muted">出題できる文が足りません。出題範囲を増やすか、レベルを上げてください。</p>
        )}
        <Button block size="lg" onClick={start} disabled={pool.length < 4}>
          {done && <RotateCcw className="h-[18px] w-[18px]" />}
          {done ? 'もう一度' : 'はじめる'}
        </Button>
      </div>
    </div>
  )
}
