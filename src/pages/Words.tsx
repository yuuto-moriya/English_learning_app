import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Search, X } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Chip, Empty, Segmented, SpeakButton, cx } from '@/components/ui'
import { useCardsMap } from '@/lib/hooks'
import { useCategory } from '@/lib/vocab'
import { LEVELS, RAIL_SUBS, type Category } from '@/lib/types'
import type { CardRow } from '@/lib/db'

const PAGE = 60

export default function Words() {
  const [params, setParams] = useSearchParams()
  const cat = (params.get('cat') as Category) || 'general'
  const [q, setQ] = useState('')
  const [lv, setLv] = useState<number | null>(null)
  const [sub, setSub] = useState<string | null>(null)
  const [status, setStatus] = useState<'all' | 'new' | 'learning' | 'mastered'>('all')
  const [limit, setLimit] = useState(PAGE)
  const words = useCategory(cat)
  const cards = useCardsMap()

  useEffect(() => {
    setLimit(PAGE)
  }, [cat, q, lv, sub, status])
  useEffect(() => {
    setLv(null)
    setSub(null)
  }, [cat])

  const levels = useMemo(() => [...new Set((words ?? []).map((w) => w.lv))].sort(), [words])

  const filtered = useMemo(() => {
    if (!words) return []
    const query = q.trim().toLowerCase()
    return words.filter((w) => {
      if (lv && w.lv !== lv) return false
      if (sub && w.sub !== sub) return false
      if (status !== 'all') {
        const st = statusOf(cards?.get(w.id))
        if (st !== status) return false
      }
      if (!query) return true
      return (
        w.w.toLowerCase().includes(query) ||
        w.ja.includes(query) ||
        (w.us?.toLowerCase().includes(query) ?? false) ||
        (w.jis?.includes(query) ?? false)
      )
    })
  }, [words, q, lv, sub, status, cards])

  // 無限スクロール：番兵要素の付け外し（絞り込みで limit が戻ったときの再マウントを含む）に追従するため callback ref で監視する。
  // limit が変わるたびに監視し直し、読み足したあとも番兵が見えたままなら続けて読み込む。
  const sentinel = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE)
      })
      io.observe(el)
      return () => io.disconnect()
    },
    [limit], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <div>
      <PageHeader title="単語帳" subtitle={words ? `${filtered.length.toLocaleString()}語` : '読み込み中…'} settings />
      <div className="space-y-3 px-4">
        <Segmented
          value={cat}
          onChange={(v) => setParams({ cat: v })}
          options={[
            { value: 'general', label: '一般' },
            { value: 'business', label: 'ビジネス' },
            { value: 'rail', label: '鉄道・保線' },
          ]}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="英語・日本語で検索"
            className="w-full rounded-2xl bg-surface py-3 pl-10 pr-10 text-[16px] shadow-card outline-none ring-1 ring-ring focus:ring-2 focus:ring-brand"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="クリア" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted active:bg-surface-2">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
          <Chip active={lv === null} onClick={() => setLv(null)}>全レベル</Chip>
          {levels.map((l) => {
            const L = LEVELS.find((x) => x.lv === l)!
            return (
              <Chip key={l} active={lv === l} onClick={() => setLv(lv === l ? null : l)}>
                Lv{l} {L.label}
              </Chip>
            )
          })}
        </div>
        {cat === 'rail' && (
          <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
            <Chip active={sub === null} onClick={() => setSub(null)}>全分野</Chip>
            {Object.entries(RAIL_SUBS).map(([k, v]) => (
              <Chip key={k} active={sub === k} onClick={() => setSub(sub === k ? null : k)}>
                {v}
              </Chip>
            ))}
          </div>
        )}
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
          {(
            [
              ['all', 'すべて'],
              ['new', '未学習'],
              ['learning', '学習中'],
              ['mastered', '定着'],
            ] as const
          ).map(([k, v]) => (
            <Chip key={k} active={status === k} onClick={() => setStatus(k)}>
              {v}
            </Chip>
          ))}
        </div>

        {words && filtered.length === 0 && <Empty>該当する単語がありません</Empty>}
        <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-surface shadow-card ring-1 ring-ring">
          {filtered.slice(0, limit).map((w) => {
            const st = statusOf(cards?.get(w.id))
            return (
              <li key={w.id} className="flex items-center gap-2 pr-2">
                <Link to={`/words/${w.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 active:bg-surface-2">
                  <span
                    className={cx(
                      'h-2 w-2 shrink-0 rounded-full',
                      st === 'mastered' ? 'bg-ok' : st === 'learning' ? 'bg-warn' : 'bg-surface-3',
                    )}
                    title={STATUS_LABEL[st]}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold">
                      {w.w}
                      {w.us && <span className="ml-1.5 text-xs font-medium text-muted">🇺🇸 {w.us}</span>}
                    </p>
                    <p className="truncate text-[13px] text-muted">{w.ja}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-muted">Lv{w.lv}</span>
                </Link>
                <SpeakButton text={w.w} accent={w.cat === 'rail' ? 'en-GB' : 'en-US'} size="sm" />
              </li>
            )
          })}
        </ul>
        {filtered.length > limit && <div ref={sentinel} className="h-10" />}
      </div>
    </div>
  )
}

const STATUS_LABEL = { new: '未学習', learning: '学習中', mastered: '定着' } as const

function statusOf(c: CardRow | undefined): 'new' | 'learning' | 'mastered' {
  if (!c) return 'new'
  if (c.known) return 'mastered'
  if (c.stability >= 21) return 'mastered'
  return c.reps > 0 ? 'learning' : 'new'
}
