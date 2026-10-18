import { useEffect, useMemo, useState } from 'react'
import { Lightbulb, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { defaultLevel, defaultSources, SourcePicker, SpeedPicker } from '@/components/PracticeControls'
import { FeedbackBar, ListenButton, ResultCard, SessionShell, SlowButton, SLOW_RATE } from '@/components/Session'
import { Button, Card, cx } from '@/components/ui'
import { diffWords, learnedIds, pickRound, sentencePool, type DiffToken, type Sentence, type Source } from '@/lib/sentences'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'
import { play } from '@/lib/sounds'

export default function Dictation() {
  const [sources, setSources] = useState<Source[]>(() => defaultSources(false))
  const [level, setLevel] = useState(() => Math.min(3, defaultLevel()))
  const [rate, setRate] = useState(0.85)
  const [pool, setPool] = useState<Sentence[]>([])
  const [round, setRound] = useState<Sentence[]>([])
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ tokens: DiffToken[]; score: number } | null>(null)
  const [hint, setHint] = useState(false)
  const [total, setTotal] = useState(0)
  const [started, setStarted] = useState(false)

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
  useEffect(() => () => stopSpeaking(), [])

  const cur = round[i]
  const done = started && i >= round.length

  // 書き取りやすい長さ（12語以内）の文から出題する
  const shortPool = useMemo(() => pool.filter((s) => s.en.split(' ').length <= 12), [pool])

  useEffect(() => {
    prefetchSpeech(round.slice(i + 1, i + 2).map((s) => ({ text: s.en, accent: s.accent, rate })))
  }, [round, i, rate])

  const start = () => {
    warmUpSpeech()
    const r = pickRound(shortPool, 5, learned)
    setRound(r)
    setI(0)
    setTotal(0)
    setStarted(true)
    setText('')
    setResult(null)
    setHint(false)
    if (r[0]) speak(r[0].en, { accent: r[0].accent, rate })
  }

  const check = () => {
    if (!cur) return
    const r = diffWords(cur.en, text)
    play(r.score >= 80 ? 'correct' : 'wrong')
    setResult(r)
    setTotal((t) => t + r.score)
    bumpDaily({ listening: 1, seconds: 40 })
  }

  const next = () => {
    const n = i + 1
    setI(n)
    setText('')
    setResult(null)
    setHint(false)
    if (round[n]) speak(round[n].en, { accent: round[n].accent, rate })
  }

  const avg = round.length ? Math.round(total / round.length) : 0

  if (started && !done && cur)
    return (
      <SessionShell
        onClose={() => {
          stopSpeaking()
          setStarted(false)
        }}
        progress={{ value: i, max: round.length }}
      >
        <div className={cx('space-y-3', result ? 'pb-44' : 'pb-8')}>
          <p className="text-center text-[12.5px] font-medium text-muted">聞こえた英文を書き取ろう</p>
          <div className="flex flex-col items-center gap-3 py-5">
            <ListenButton onClick={() => speak(cur.en, { accent: cur.accent, rate })} />
            <SlowButton onClick={() => speak(cur.en, { accent: cur.accent, rate: SLOW_RATE })} />
          </div>
          <p className="text-center text-[13px] leading-snug text-muted">意味：{cur.ja}</p>
          {hint && !result && (
            <p className="font-mono text-[14px] leading-relaxed tracking-wide text-brand-strong">
              {cur.en
                .split(' ')
                .map((w) => w[0] + '_'.repeat(Math.max(0, w.replace(/[^A-Za-z']/g, '').length - 1)))
                .join(' ')}
            </p>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!!result}
            rows={3}
            autoCapitalize="sentences"
            autoCorrect="off"
            spellCheck={false}
            placeholder="聞こえた英文を入力…"
            aria-label="聞こえた英文"
            className="en w-full rounded-[14px] border border-line-strong bg-surface p-3.5 text-[18px] leading-snug outline-none focus:border-ink"
          />
          {!result ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setHint(true)} disabled={hint}>
                <Lightbulb className="h-[18px] w-[18px]" strokeWidth={1.8} />
                ヒント
              </Button>
              <Button variant="ink" className="flex-1" onClick={check} disabled={!text.trim()}>
                答え合わせ
              </Button>
            </div>
          ) : (
            <Card className="animate-rise">
              {/* 語と語の間で折り返せるよう flex-wrap にする（span を空白なしで並べると1行に収まらずはみ出す） */}
              <p className="en flex flex-wrap gap-x-1.5 gap-y-1 text-[18px] leading-relaxed">
                {result.tokens.map((t, k) => (
                  <span
                    key={k}
                    className={cx(
                      'rounded px-0.5',
                      t.kind === 'match' && 'text-ok',
                      t.kind === 'missing' && 'bg-ng-soft font-semibold text-ng',
                      t.kind === 'extra' && 'text-muted line-through',
                    )}
                  >
                    {t.t}
                  </span>
                ))}
              </p>
              <p className="mt-2 text-[12px] text-muted">赤：聞き逃した語　取り消し線：余分な語</p>
              <p className="en mt-3 border-t border-line pt-3 text-[18px]">{cur.en}</p>
            </Card>
          )}
        </div>
        {result && (
          <FeedbackBar
            ok={result.score >= 80}
            label={`${result.score}点`}
            aside={result.score >= 80 ? 'よく聞き取れています' : '赤い語を聞き直そう'}
            last={i + 1 >= round.length}
            onNext={next}
          />
        )}
      </SessionShell>
    )

  return (
    <div>
      <PageHeader title="ディクテーション" subtitle="聞こえた英文を書き取る（5問）" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        {done ? (
          <>
            <Guide pose={avg >= 80 ? 'celebrate' : 'cheer'} text="聞き逃した語は、前後の語とつながったり弱く発音されたりする所が多いワン。" />
            <ResultCard value={avg} unit="点" caption={`${round.length}問の平均点`} />
          </>
        ) : (
          <Guide who="moka" pose="think" text="書き取ると「聞こえたつもり」の音がはっきりするよ♪ 何度再生してもOK！" />
        )}
        <Card className="space-y-4">
          <SourcePicker sources={sources} onSources={setSources} level={level} onLevel={setLevel} />
          <SpeedPicker rate={rate} onRate={setRate} />
        </Card>
        {loaded && shortPool.length < 5 && (
          <p className="px-1 text-[12.5px] leading-relaxed text-muted">出題できる文が足りません。出題範囲を増やすか、レベルを上げてください。</p>
        )}
        <Button block size="lg" onClick={start} disabled={shortPool.length < 5}>
          {done && <RotateCcw className="h-[18px] w-[18px]" />}
          {done ? 'もう一度' : 'はじめる'}
        </Button>
      </div>
    </div>
  )
}
