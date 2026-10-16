import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router'
import { CheckCircle2, Mic, RotateCcw, Star } from 'lucide-react'
import { PageHeader, iconBtn } from '@/components/Layout'
import { Button, Card, Empty, Metric, SectionTitle, cx } from '@/components/ui'
import { WordBody, WordHead } from '@/components/WordInfo'
import { db, toggleMark } from '@/lib/db'
import { humanizeDiff, markKnown, retrievability } from '@/lib/srs'
import { useWord, plain } from '@/lib/vocab'
import { useMarks } from '@/lib/hooks'

export default function WordDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const word = useWord(id)
  const card = useLiveQuery(() => (id ? db.cards.get(id) : undefined), [id])
  const logs = useLiveQuery(() => (id ? db.logs.where('wordId').equals(id).reverse().limit(8).toArray() : []), [id])
  const marks = useMarks()
  const marked = !!(id && marks?.has(id))

  if (word === null)
    return (
      <div>
        <PageHeader title="単語帳" back="/words" />
        <div className="px-4">
          <Empty>単語が見つかりません</Empty>
        </div>
      </div>
    )
  if (!word) return <div className="p-8 text-center text-muted">読み込み中…</div>

  const r = card && card.reps > 0 ? retrievability(card) : null
  return (
    <div>
      <PageHeader
        title=""
        back
        right={
          <button aria-label={marked ? '保存を取り消す' : '単語を保存'} aria-pressed={marked} onClick={() => void toggleMark(word.id)} className={iconBtn}>
            <Star className={cx('h-[18px] w-[18px]', marked ? 'fill-warn text-warn' : 'text-muted')} strokeWidth={1.8} />
          </button>
        }
      />
      <div className="px-5 pb-10 pt-2">
        <WordHead word={word} big />
        <div className="mt-6">
          <WordBody word={word} />
        </div>

        <SectionTitle>学習状況</SectionTitle>
        <Card>
          {card && card.reps > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <Metric value={Math.round((r ?? 0) * 100)} unit="%" label="いま思い出せる確率" />
              <Metric value={card.due > Date.now() ? humanizeDiff(card.due - Date.now()) : '今'} unit={card.due > Date.now() ? '後' : ''} label="次の復習" />
              <Metric value={card.reps} unit="回" label={`復習（忘れた ${card.lapses}）`} />
            </div>
          ) : card?.known ? (
            <p className="text-[14px]">「知っている」に設定済み（出題されません）</p>
          ) : (
            <p className="text-[14px] text-muted">まだ学習していません</p>
          )}
          {logs && logs.length > 0 && (
            <div className="mt-4 flex gap-1" aria-label="最近の解答（左が新しい）">
              {logs.map((l) => (
                <span
                  key={l.id}
                  className={`h-1.5 flex-1 rounded-full ${l.rating === 1 ? 'bg-ng' : l.rating === 2 ? 'bg-warn' : 'bg-ok'}`}
                  title={new Date(l.at).toLocaleString()}
                />
              ))}
            </div>
          )}
        </Card>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => markKnown(word, !card?.known)}>
            {card?.known ? <RotateCcw className="h-4 w-4" strokeWidth={1.9} /> : <CheckCircle2 className="h-4 w-4" strokeWidth={1.9} />}
            {card?.known ? '学習対象に戻す' : '知っている'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => nav(`/practice/speaking?text=${encodeURIComponent(plain(word.ex[0]?.en ?? word.w))}&accent=${word.cat === 'rail' ? 'en-GB' : 'en-US'}`)}
          >
            <Mic className="h-4 w-4" strokeWidth={1.9} />
            発音練習
          </Button>
        </div>
      </div>
    </div>
  )
}
