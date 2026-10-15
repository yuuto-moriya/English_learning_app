import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router'
import { Mic, RotateCcw, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Button, Card, Empty } from '@/components/ui'
import { WordBody, WordHead } from '@/components/WordInfo'
import { db } from '@/lib/db'
import { humanizeDiff, markKnown, retrievability } from '@/lib/srs'
import { useWord } from '@/lib/vocab'
import { plain } from '@/lib/vocab'

export default function WordDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const word = useWord(id)
  const card = useLiveQuery(() => (id ? db.cards.get(id) : undefined), [id])
  const logs = useLiveQuery(() => (id ? db.logs.where('wordId').equals(id).reverse().limit(5).toArray() : []), [id])

  if (word === null) return <Empty>単語が見つかりません</Empty>
  if (!word) return <div className="p-8 text-center text-muted">読み込み中…</div>

  const r = card && card.reps > 0 ? retrievability(card) : null
  return (
    <div>
      <PageHeader title="" back />
      <div className="space-y-3 px-4 pb-8">
        <Card>
          <WordHead word={word} big />
          <div className="mt-4">
            <WordBody word={word} />
          </div>
        </Card>

        <Card>
          <p className="text-[13px] font-bold text-muted">学習状況</p>
          {card && card.reps > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-extrabold">{Math.round((r ?? 0) * 100)}%</p>
                <p className="text-[11px] text-muted">いま思い出せる確率</p>
              </div>
              <div>
                <p className="text-lg font-extrabold">{card.due > Date.now() ? humanizeDiff(card.due - Date.now()) + '後' : '今すぐ'}</p>
                <p className="text-[11px] text-muted">次回の復習</p>
              </div>
              <div>
                <p className="text-lg font-extrabold">{card.reps}回</p>
                <p className="text-[11px] text-muted">復習回数（忘却{card.lapses}）</p>
              </div>
            </div>
          ) : card?.known ? (
            <p className="mt-2 text-sm">「知っている」に設定済み（出題されません）</p>
          ) : (
            <p className="mt-2 text-sm text-muted">まだ学習していません</p>
          )}
          {logs && logs.length > 0 && (
            <div className="mt-3 flex gap-1">
              {logs.map((l) => (
                <span
                  key={l.id}
                  className={`h-2 flex-1 rounded-full ${l.rating === 1 ? 'bg-ng' : l.rating === 2 ? 'bg-warn' : 'bg-ok'}`}
                  title={new Date(l.at).toLocaleString()}
                />
              ))}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => markKnown(word, !card?.known)}>
              {card?.known ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {card?.known ? '学習対象に戻す' : '知っている'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => nav(`/practice/speaking?text=${encodeURIComponent(plain(word.ex[0]?.en ?? word.w))}&accent=${word.cat === 'rail' ? 'en-GB' : 'en-US'}`)}
            >
              <Mic className="h-4 w-4" />
              発音練習
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
