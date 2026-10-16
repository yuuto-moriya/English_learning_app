import { useEffect, useState } from 'react'
import { Eye, Lightbulb, Mic, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SpeakCheck } from '@/components/SpeakCheck'
import { BottomBar, Button, Card, ProgressBar, SpeakButton, cx } from '@/components/ui'
import { defaultLevel, defaultSources } from '@/components/PracticeControls'
import { sentencePool, type Sentence } from '@/lib/sentences'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { bumpDaily, db } from '@/lib/db'
import { getWord, plain, shuffle } from '@/lib/vocab'

const ROUND = 10
const THINK_MS = 8000

/**
 * 学習済みの単語の例文を優先して出題する（覚えた語を「使う」練習＝産出の検索練習）。
 * 足りなければ、選んでいるコースの例文・シーン会話から補う。
 */
async function buildRound(): Promise<Sentence[]> {
  const learned = await db.cards.filter((c) => c.reps > 0).toArray().catch(() => [])
  const due = learned.filter((c) => !c.known).sort((a, b) => a.due - b.due).slice(0, 40)
  const out: Sentence[] = []
  for (const c of shuffle(due)) {
    const w = await getWord(c.id)
    const e = w?.ex[0]
    if (!w || !e) continue
    const en = plain(e.en)
    const n = en.split(/\s+/).length
    if (n < 4 || n > 14) continue
    out.push({ en, ja: e.ja, lv: w.lv, src: w.cat, accent: w.cat === 'rail' ? 'en-GB' : 'en-US', wordId: w.id })
    if (out.length >= ROUND) break
  }
  if (out.length < ROUND) {
    const pool = (await sentencePool(defaultSources(), defaultLevel(), 1)).filter((s) => s.en.split(/\s+/).length <= 14)
    const seen = new Set(out.map((s) => s.en))
    for (const s of shuffle(pool)) {
      if (seen.has(s.en)) continue
      out.push(s)
      if (out.length >= ROUND) break
    }
  }
  return out
}

type Rate = 'good' | 'close' | 'miss'

export default function Compose() {
  const [round, setRound] = useState<Sentence[] | null>(null)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const [hint, setHint] = useState(false)
  const [check, setCheck] = useState(false)
  const [tally, setTally] = useState<Record<Rate, number>>({ good: 0, close: 0, miss: 0 })
  const [started, setStarted] = useState(false)
  const [shownAt, setShownAt] = useState(Date.now())

  useEffect(() => {
    buildRound().then(setRound)
    return () => stopSpeaking()
  }, [])

  const cur = round?.[i]
  const done = started && !!round && i >= round.length

  useEffect(() => {
    setShownAt(Date.now())
    if (round) prefetchSpeech(round.slice(i, i + 2).map((s) => ({ text: s.en, accent: s.accent })))
  }, [i, round])

  const reveal = () => {
    setShown(true)
    if (cur) speak(cur.en, { accent: cur.accent })
  }

  const rate = (r: Rate) => {
    if (!cur || !round) return
    setTally((t) => ({ ...t, [r]: t[r] + 1 }))
    bumpDaily({ speaking: 1, seconds: Math.min(60, Math.round((Date.now() - shownAt) / 1000)) })
    // 言えなかった文は、この回の最後にもう一度出す（その場で正しく言えるまで繰り返す＝連続再学習）
    if (r === 'miss' && round.filter((s) => s.en === cur.en).length < 2) setRound([...round, cur])
    setShown(false)
    setHint(false)
    setCheck(false)
    setI(i + 1)
  }

  if (!round) return <div className="p-8 text-center text-muted">準備中…</div>

  if (!started || done)
    return (
      <div>
        <PageHeader title="瞬間英作文" subtitle="日本語を見て、すぐ英語で言う" back="/practice" />
        <div className="space-y-4 px-4 pb-8">
          {done ? (
            <>
              <Guide
                pose={tally.good >= tally.miss ? 'celebrate' : 'cheer'}
                text="おつかれさま！声に出した分だけ、使える英語になっていくワン。言えなかった文は、お手本をもう一度まねしておこう。"
              />
              <Card className="grid grid-cols-3 gap-2 text-center">
                {(
                  [
                    ['good', '言えた', 'text-ok'],
                    ['close', 'おしい', 'text-warn'],
                    ['miss', '言えなかった', 'text-ng'],
                  ] as const
                ).map(([k, label, color]) => (
                  <div key={k}>
                    <p className={cx('text-[28px] font-semibold tabular-nums', color)}>{tally[k]}</p>
                    <p className="text-[12px] text-muted">{label}</p>
                  </div>
                ))}
              </Card>
            </>
          ) : (
            <>
              <Guide
                who="sumi"
                pose="greet"
                text="日本語を見たら、考えすぎずに声に出して英語にしてみましょう。完璧でなくて大丈夫です。"
              />
              <Card>
                <ol className="space-y-3 text-[14px] leading-relaxed">
                  <li className="flex gap-3">
                    <span className="w-4 shrink-0 font-semibold tabular-nums text-muted">1</span>日本語を見て、8秒以内を目安に英語で言う
                  </li>
                  <li className="flex gap-3">
                    <span className="w-4 shrink-0 font-semibold tabular-nums text-muted">2</span>答えを見て、お手本の音声を聞く
                  </li>
                  <li className="flex gap-3">
                    <span className="w-4 shrink-0 font-semibold tabular-nums text-muted">3</span>言えたかどうかを自分で選ぶ。言えなかった文は最後にもう一度
                  </li>
                </ol>
                <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
                  学習した単語の例文を優先して出題します（まだ少ないときは、選んでいるコースの例文から）。
                </p>
              </Card>
            </>
          )}
          <Button
            block
            size="lg"
            onClick={() => {
              warmUpSpeech()
              if (done) {
                setRound(null)
                buildRound().then(setRound)
                setTally({ good: 0, close: 0, miss: 0 })
              }
              setI(0)
              setShown(false)
              setStarted(true)
            }}
          >
            {done ? <RotateCcw className="h-[18px] w-[18px]" /> : null}
            {done ? 'もう一度' : 'はじめる'}
          </Button>
        </div>
      </div>
    )

  if (!cur) return null
  return (
    <div>
      <PageHeader title="瞬間英作文" back="/practice" />
      <div className={cx('px-4', shown ? 'pb-56' : 'pb-40')}>
        <ProgressBar value={i} max={round.length} className="h-[5px]" />
        <div key={i} className="animate-rise pt-8">
          <p className="text-[13px] text-muted">英語で言ってみよう</p>
          <p className="mt-3 text-[24px] font-semibold leading-snug">{cur.ja}</p>
          {!shown && <ThinkBar key={`t${i}`} />}
          {hint && !shown && (
            <p className="mt-4 font-mono text-[14px] leading-relaxed tracking-wide text-brand-strong">
              {cur.en
                .split(' ')
                .map((w) => w[0] + '_'.repeat(Math.max(0, w.replace(/[^A-Za-z']/g, '').length - 1)))
                .join(' ')}
            </p>
          )}
          {shown && (
            <div className="mt-6 animate-rise border-l-2 border-brand pl-3.5">
              <div className="flex items-start gap-2">
                <p className="en flex-1 text-[22px] leading-snug">{cur.en}</p>
                <SpeakButton text={cur.en} accent={cur.accent} size="sm" />
              </div>
            </div>
          )}
          {shown && check && (
            <Card className="mt-5">
              <SpeakCheck text={cur.en} accent={cur.accent} source="compose" compact />
            </Card>
          )}
        </div>
      </div>
      <BottomBar>
        {!shown ? (
          <div className="flex gap-2">
            <Button variant="secondary" aria-label="ヒント" onClick={() => setHint(true)} disabled={hint}>
              <Lightbulb className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </Button>
            <Button block size="lg" variant="ink" onClick={reveal}>
              <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />
              答えを見る
            </Button>
          </div>
        ) : (
          <>
            {!check && (
              <button onClick={() => setCheck(true)} className="mb-3 flex w-full items-center justify-center gap-1.5 text-[13px] font-medium text-muted">
                <Mic className="h-4 w-4" strokeWidth={1.8} />
                発音もチェックする
              </button>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="text-ng" onClick={() => rate('miss')}>
                言えなかった
              </Button>
              <Button variant="outline" className="text-warn" onClick={() => rate('close')}>
                おしい
              </Button>
              <Button variant="outline" className="text-ok" onClick={() => rate('good')}>
                言えた
              </Button>
            </div>
          </>
        )}
      </BottomBar>
    </div>
  )
}

/** 考える時間の目安（8秒で満ちる細い線。時間切れでも何も起きない） */
function ThinkBar() {
  const [go, setGo] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setGo(true))
    return () => cancelAnimationFrame(t)
  }, [])
  return (
    <div className="mt-6 h-[3px] overflow-hidden rounded-full bg-surface-3" aria-hidden>
      <div className="h-full rounded-full bg-faint" style={{ width: go ? '100%' : '0%', transition: `width ${THINK_MS}ms linear` }} />
    </div>
  )
}
