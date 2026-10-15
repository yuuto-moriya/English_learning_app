import { useEffect, useState } from 'react'
import { Play, RotateCcw, Eye } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SourcePicker, SpeedPicker } from '@/components/PracticeControls'
import { Button, Card, ProgressBar, cx } from '@/components/ui'
import { diffWords, pickRound, sentencePool, type DiffToken, type Sentence, type Source } from '@/lib/sentences'
import { speak, stopSpeaking } from '@/lib/tts'
import { bumpDaily } from '@/lib/db'

export default function Dictation() {
  const [sources, setSources] = useState<Source[]>(['general'])
  const [level, setLevel] = useState(2)
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
    sentencePool(sources, level, Math.max(1, level - 2)).then(setPool)
  }, [sources, level])
  useEffect(() => () => stopSpeaking(), [])

  const cur = round[i]
  const done = started && i >= round.length

  const start = () => {
    const r = pickRound(
      pool.filter((s) => s.en.split(' ').length <= 12),
      5,
    )
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
            <Guide
              pose={done ? (avg >= 80 ? 'celebrate' : 'cheer') : 'think'}
              text={
                done
                  ? `平均${avg}点！聞き取れなかった語は、音がつながったり弱く発音される所が多いワン。`
                  : '書き取ると「聞こえたつもり」の音がはっきりするワン。何度再生してもOK！'
              }
            />
            <Card className="space-y-3">
              <SourcePicker sources={sources} onSources={setSources} level={level} onLevel={setLevel} />
              <SpeedPicker rate={rate} onRate={setRate} />
            </Card>
            <Button block onClick={start} disabled={pool.length < 5}>
              {done ? <RotateCcw className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {done ? 'もう一度' : 'スタート'}
            </Button>
          </>
        ) : (
          cur && (
            <>
              <ProgressBar value={i} max={round.length} />
              <Card className="flex items-center gap-3">
                <button
                  onClick={() => speak(cur.en, { accent: cur.accent, rate })}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white active:scale-95"
                  aria-label="再生"
                >
                  <Play className="h-7 w-7 translate-x-0.5" />
                </button>
                <div className="flex-1">
                  <p className="text-[13px] text-muted">{cur.ja}</p>
                  {hint && (
                    <p className="mt-1 font-mono text-[13px] text-brand-strong">
                      {cur.en
                        .split(' ')
                        .map((w) => w[0] + '_'.repeat(Math.max(0, w.replace(/[^A-Za-z']/g, '').length - 1)))
                        .join(' ')}
                    </p>
                  )}
                </div>
                <button onClick={() => speak(cur.en, { accent: cur.accent, rate: 0.6 })} className="text-xs font-semibold text-brand">
                  ゆっくり
                </button>
              </Card>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!!result}
                rows={3}
                autoCapitalize="sentences"
                autoCorrect="off"
                spellCheck={false}
                placeholder="聞こえた英文を入力…"
                className="w-full rounded-xl border border-line bg-surface p-3 text-[16px] outline-none focus:border-brand"
              />
              {!result ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setHint(true)} disabled={hint}>
                    <Eye className="h-4 w-4" />
                    ヒント
                  </Button>
                  <Button className="flex-1" onClick={check} disabled={!text.trim()}>
                    答え合わせ
                  </Button>
                </div>
              ) : (
                <Card className="animate-pop">
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="text-sm font-bold text-muted">結果</p>
                    <p className={cx('text-2xl font-extrabold', result.score >= 80 ? 'text-ok' : result.score >= 50 ? 'text-warn' : 'text-ng')}>
                      {result.score}点
                    </p>
                  </div>
                  <p className="text-[16px] leading-loose">
                    {result.tokens.map((t, k) => (
                      <span
                        key={k}
                        className={cx(
                          'mr-1 rounded px-0.5',
                          t.kind === 'match' && 'text-ok',
                          t.kind === 'missing' && 'bg-ng/15 font-bold text-ng underline decoration-dotted',
                          t.kind === 'extra' && 'text-muted line-through',
                        )}
                      >
                        {t.t}
                      </span>
                    ))}
                  </p>
                  <p className="mt-2 text-[12px] text-muted">赤：聞き取れなかった語　取り消し線：余分な語</p>
                  <p className="mt-2 text-[15px] font-semibold">{cur.en}</p>
                  <Button block className="mt-3" onClick={next}>
                    次へ
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
