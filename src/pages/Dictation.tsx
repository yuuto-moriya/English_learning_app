import { useEffect, useMemo, useState } from 'react'
import { Eye, Play, RotateCcw, Snail } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { defaultLevel, defaultSources, SourcePicker, SpeedPicker } from '@/components/PracticeControls'
import { Button, Card, ProgressBar, cx } from '@/components/ui'
import { diffWords, pickRound, sentencePool, type DiffToken, type Sentence, type Source } from '@/lib/sentences'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'

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

  useEffect(() => {
    let alive = true
    sentencePool(sources, level, Math.max(1, level - 2)).then((p) => alive && setPool(p))
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
    const r = pickRound(shortPool, 5)
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

  return (
    <div>
      <PageHeader title="ディクテーション" subtitle="聞こえた英文を書き取る（5問）" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        {!started || done ? (
          <>
            {done ? (
              <Guide
                pose={avg >= 80 ? 'celebrate' : 'cheer'}
                text={`平均${avg}点！聞き逃した語は、前後の語とつながったり弱く発音されたりする所が多いワン。`}
              />
            ) : (
              <Guide who="moka" pose="think" text="書き取ると「聞こえたつもり」の音がはっきりするよ♪ 何度再生してもOK！" />
            )}
            <Card className="space-y-4">
              <SourcePicker sources={sources} onSources={setSources} level={level} onLevel={setLevel} />
              <SpeedPicker rate={rate} onRate={setRate} />
            </Card>
            <Button block size="lg" onClick={start} disabled={shortPool.length < 5}>
              {done ? <RotateCcw className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px]" />}
              {done ? 'もう一度' : 'スタート'}
            </Button>
          </>
        ) : (
          cur && (
            <>
              <ProgressBar value={i} max={round.length} className="h-[5px]" />
              <div className="flex items-center gap-3 py-4">
                <button
                  onClick={() => speak(cur.en, { accent: cur.accent, rate })}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-bg transition active:scale-95"
                  aria-label="再生"
                >
                  <Play className="h-6 w-6 translate-x-0.5 fill-current" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => speak(cur.en, { accent: cur.accent, rate: 0.6 })}
                  aria-label="ゆっくり再生"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-muted active:scale-95"
                >
                  <Snail className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-muted">{cur.ja}</p>
                </div>
              </div>
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
                    <Eye className="h-4 w-4" strokeWidth={1.8} />
                    ヒント
                  </Button>
                  <Button variant="ink" className="flex-1" onClick={check} disabled={!text.trim()}>
                    答え合わせ
                  </Button>
                </div>
              ) : (
                <Card className="animate-rise">
                  <div className="mb-3 flex items-baseline justify-between">
                    <p className="text-[13px] font-medium text-muted">結果</p>
                    <p className={cx('text-[28px] font-semibold tabular-nums', result.score >= 80 ? 'text-ok' : result.score >= 50 ? 'text-warn' : 'text-ng')}>
                      {result.score}
                      <span className="text-[14px] font-medium">点</span>
                    </p>
                  </div>
                  {/* 語と語の間で折り返せるよう flex-wrap にする（span を空白なしで並べると1行に収まらずはみ出す） */}
                  <p className="en flex flex-wrap gap-x-1.5 gap-y-1 text-[19px] leading-relaxed">
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
                  <Button block variant="ink" className="mt-4" onClick={next}>
                    {i + 1 >= round.length ? '結果を見る' : '次へ'}
                  </Button>
                </Card>
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}
