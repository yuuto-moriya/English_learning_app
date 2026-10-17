import { useEffect, useRef, useState } from 'react'
import { EyeOff, Pause, Play, SkipBack, SkipForward, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Button, Card, ProgressBar, Segmented, Toggle, cx } from '@/components/ui'
import { bumpDaily, db } from '@/lib/db'
import { retrievability } from '@/lib/srs'
import { newWordPool } from '@/lib/session'
import { accentFor, getSettings, selectedCats } from '@/lib/settings'
import { prefetchSpeech, speak, speakJa, stopSpeaking, warmUpSpeech } from '@/lib/tts'
import { getWord, jaForSpeech, loadCategory, plain } from '@/lib/vocab'
import { interleave } from '@/lib/srs'
import type { Word } from '@/lib/types'

type Dir = 'ja-en' | 'en-ja'
type Phase = 'idle' | 'prompt' | 'think' | 'answer' | 'example'

/**
 * 忘れかけている語（想起確率の低い順）を優先。学習した語が少ないときは、これから学ぶ語を聞く。
 */
async function buildList(n = 20): Promise<{ words: Word[]; preview: boolean }> {
  const rows = (await db.cards.toArray()).filter((r) => r.reps > 0 && !r.known)
  const now = new Date()
  const ranked = rows
    .map((r) => ({ r, p: retrievability(r, now) }))
    .sort((a, b) => a.p - b.p)
    .slice(0, n)
  const words = (await Promise.all(ranked.map((x) => getWord(x.r.id)))).filter(Boolean) as Word[]
  if (words.length >= 5) return { words, preview: false }
  const s = getSettings()
  const lists = await Promise.all(selectedCats(s).map((c) => loadCategory(c)))
  const ids = new Set(rows.map((r) => r.id))
  const fresh = interleave(newWordPool(lists.flat(), ids, s)).slice(0, n)
  return { words: [...words, ...fresh].slice(0, n), preview: true }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function AudioReview() {
  const [list, setList] = useState<{ words: Word[]; preview: boolean } | null>(null)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [playing, setPlaying] = useState(false)
  const [dir, setDir] = useState<Dir>('ja-en')
  const [gap, setGap] = useState(4)
  const [withExample, setWithExample] = useState(true)
  const [hide, setHide] = useState(false)
  const runId = useRef(0)
  /** 再生中に変えた設定（考える時間・例文）を次の語から反映する */
  const opts = useRef({ gap, withExample })
  opts.current = { gap, withExample }
  const wake = useRef<{ release: () => Promise<void> } | null>(null)

  useEffect(() => {
    buildList().then((l) => {
      setList(l)
      // まだ覚えていない語は日本語から英語を思い出せないので、英語 → 日本語で聞く
      if (l.preview) setDir('en-ja')
    })
    return () => {
      runId.current++
      stopSpeaking()
      void wake.current?.release().catch(() => undefined)
    }
  }, [])

  // 再生中は画面を消さない（対応ブラウザのみ）。アプリに戻ったら取り直す
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    const acquire = () => {
      if (!playing || !nav.wakeLock || document.visibilityState !== 'visible') return
      nav.wakeLock
        .request('screen')
        .then((l) => (wake.current = l))
        .catch(() => undefined)
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      void wake.current?.release().catch(() => undefined)
      wake.current = null
    }
  }, [playing])

  const words = list?.words ?? []
  const w = words[idx]
  const accent = (x: Word) => accentFor(x.cat)

  const run = async (from: number) => {
    const my = ++runId.current
    const alive = () => runId.current === my
    setPlaying(true)
    for (let k = from; k < words.length; k++) {
      if (!alive()) return
      const cur = words[k]
      setIdx(k)
      prefetchSpeech([{ text: cur.w, accent: accent(cur) }, { text: cur.ex[0]?.en ?? '', accent: accent(cur) }])
      const en = () => speak(cur.w, { accent: accent(cur) })
      const ja = () => speakJa(jaForSpeech(cur.ja))
      setPhase('prompt')
      await (dir === 'ja-en' ? ja() : en())
      if (!alive()) return
      setPhase('think')
      await sleep(opts.current.gap * 1000)
      if (!alive()) return
      setPhase('answer')
      await (dir === 'ja-en' ? en() : ja())
      if (!alive()) return
      if (opts.current.withExample && cur.ex[0]) {
        await sleep(500)
        if (!alive()) return
        setPhase('example')
        await speak(plain(cur.ex[0].en), { accent: accent(cur) })
        if (!alive()) return
      }
      void bumpDaily({ listening: 1, seconds: opts.current.gap + 6 }).catch(() => undefined)
      await sleep(1200)
    }
    if (alive()) {
      setPlaying(false)
      setPhase('idle')
      setIdx(words.length)
    }
  }

  const pause = () => {
    runId.current++
    stopSpeaking()
    setPlaying(false)
    setPhase('idle')
  }

  const jump = (k: number) => {
    const to = Math.max(0, Math.min(words.length - 1, k))
    if (playing) {
      stopSpeaking()
      void run(to)
    } else setIdx(to)
  }

  if (!list) return <div className="p-8 text-center text-muted">準備中…</div>

  const finished = idx >= words.length && words.length > 0
  const showEn = !hide && (dir === 'en-ja' || phase === 'answer' || phase === 'example' || !playing)
  const showJa = !hide && (dir === 'ja-en' || phase === 'answer' || phase === 'example' || !playing)

  return (
    <div>
      <PageHeader title="耳で復習" subtitle="音声だけで思い出す。画面を見なくても進みます" back="/practice" />
      <div className="space-y-4 px-4 pb-8">
        {!playing && idx === 0 && (
          <Guide
            who="moka"
            pose="cheer"
            text={
              list.preview
                ? 'まだ学習した単語が少ないから、これから学ぶ単語を先に聞いてみよう♪'
                : '忘れかけている単語から順に流すよ。音が鳴ったら、答えが出る前に心の中で言ってみてね♪'
            }
          />
        )}

        {words.length === 0 ? (
          <Card className="text-center text-[14px] text-muted">聞ける単語がありません</Card>
        ) : finished ? (
          <Card className="text-center">
            <p className="text-[15px] font-medium">{words.length}語を聞き終えました</p>
            <Button className="mt-4" variant="ink" onClick={() => void run(0)}>
              <Play className="h-4 w-4 fill-current" />
              最初から
            </Button>
          </Card>
        ) : (
          w && (
            <Card className="px-5 py-7">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span className="tabular-nums">
                  {idx + 1} / {words.length}
                </span>
                <span>
                  {phase === 'think' ? '思い出してみよう…' : phase === 'prompt' ? '聞いて' : phase === 'answer' || phase === 'example' ? '答え' : ''}
                </span>
              </div>
              <div className="mt-6 min-h-[118px] text-center">
                {hide ? (
                  <EyeOff className="mx-auto mt-6 h-8 w-8 text-faint" strokeWidth={1.5} />
                ) : (
                  <>
                    <p className={cx('en text-[38px] font-medium leading-tight transition-opacity duration-300', showEn ? 'opacity-100' : 'opacity-0')}>{w.w}</p>
                    <p className={cx('mt-2 text-[17px] transition-opacity duration-300', showJa ? 'opacity-100' : 'opacity-0')}>{w.ja}</p>
                    {phase === 'example' && w.ex[0] && <p className="en mt-4 animate-fade text-[16px] text-muted">{plain(w.ex[0].en)}</p>}
                  </>
                )}
              </div>
              <ProgressBar value={idx} max={words.length} className="mt-6 h-[4px]" />
              <div className="mt-6 flex items-center justify-center gap-6">
                <button aria-label="前の単語" onClick={() => jump(idx - 1)} className="flex h-12 w-12 items-center justify-center rounded-full text-ink active:bg-surface-2">
                  <SkipBack className="h-6 w-6" strokeWidth={1.7} />
                </button>
                <button
                  aria-label={playing ? '一時停止' : '再生'}
                  onClick={() => {
                    if (playing) pause()
                    else {
                      warmUpSpeech()
                      void run(idx)
                    }
                  }}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-ink text-bg transition active:scale-95"
                >
                  {playing ? <Pause className="h-8 w-8 fill-current" strokeWidth={1.5} /> : <Play className="h-8 w-8 translate-x-0.5 fill-current" strokeWidth={1.5} />}
                </button>
                <button aria-label="次の単語" onClick={() => jump(idx + 1)} className="flex h-12 w-12 items-center justify-center rounded-full text-ink active:bg-surface-2">
                  <SkipForward className="h-6 w-6" strokeWidth={1.7} />
                </button>
              </div>
            </Card>
          )
        )}

        <Card className="space-y-4">
          <div>
            <p className="mb-2 text-[12px] font-medium text-muted">出題の向き</p>
            <Segmented
              size="sm"
              value={dir}
              onChange={(d) => {
                pause()
                setDir(d)
              }}
              options={[
                { value: 'ja-en', label: '日本語 → 英語' },
                { value: 'en-ja', label: '英語 → 日本語' },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-[12px] font-medium text-muted">考える時間</p>
            <Segmented
              size="sm"
              value={String(gap)}
              onChange={(v) => setGap(Number(v))}
              options={[
                { value: '2', label: '2秒' },
                { value: '4', label: '4秒' },
                { value: '6', label: '6秒' },
              ]}
            />
          </div>
          <Toggle label="例文も読む" checked={withExample} onChange={setWithExample} />
          <Toggle label="文字を隠す" desc="耳だけで思い出すモード" checked={hide} onChange={setHide} />
        </Card>

        <p className="flex gap-2 px-1 text-[12px] leading-relaxed text-muted">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={1.8} />
          線路内での作業中や、車・自転車の運転中は使わないでください。周りの音が聞こえる音量で使いましょう。
        </p>
      </div>
    </div>
  )
}
