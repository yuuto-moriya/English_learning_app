import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, Search, Star, X } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Button, Chip, Empty, Segmented, SpeakButton, Tag, cx } from '@/components/ui'
import { useCardsMap, useMarks } from '@/lib/hooks'
import { useCategory } from '@/lib/vocab'
import { CATEGORIES, LEVELS, RAIL_SUBS, type Category } from '@/lib/types'
import { accentFor, selectedCats, useSettings } from '@/lib/settings'
import { isWeak } from '@/lib/session'
import type { CardRow } from '@/lib/db'

const PAGE = 60
type Status = 'all' | 'new' | 'learning' | 'mastered' | 'weak' | 'marked'

const STATUS: [Status, string][] = [
  ['all', 'すべて'],
  ['new', '未学習'],
  ['learning', '学習中'],
  ['mastered', '定着'],
  ['weak', '苦手'],
  ['marked', '保存'],
]

export default function Words() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const studyCats = useSettings((s) => s.studyCats)
  const cat = (params.get('cat') as Category) || selectedCats({ studyCats })[0] || 'general'
  const status = (params.get('status') as Status) || 'all'
  const [q, setQ] = useState('')
  const [lv, setLv] = useState<number | null>(null)
  const [sub, setSub] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const words = useCategory(cat)
  const cards = useCardsMap()
  const marks = useMarks()

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v === null) p.delete(k)
    else p.set(k, v)
    setParams(p, { replace: true })
  }

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
      if (status === 'marked') {
        if (!marks?.has(w.id)) return false
      } else if (status === 'weak') {
        if (!isWeak(cards?.get(w.id))) return false
      } else if (status !== 'all' && statusOf(cards?.get(w.id)) !== status) return false
      if (!query) return true
      return (
        w.w.toLowerCase().includes(query) ||
        w.ja.includes(query) ||
        (w.us?.toLowerCase().includes(query) ?? false) ||
        (w.jis?.includes(query) ?? false)
      )
    })
  }, [words, q, lv, sub, status, cards, marks])

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

  const drill = status === 'weak' || status === 'marked'

  return (
    <div>
      <PageHeader title="単語帳" subtitle={words ? `${filtered.length.toLocaleString()}語` : '読み込み中…'} settings />
      <div className="space-y-3 px-4">
        <Segmented
          value={cat}
          onChange={(v) => setParam('cat', v)}
          options={CATEGORIES.map((c) => ({ value: c.key, label: c.short }))}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-faint" strokeWidth={1.9} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="英語・日本語で検索"
            enterKeyHint="search"
            className="w-full rounded-[12px] bg-surface-2 py-2.5 pl-10 pr-10 text-[16px] outline-none placeholder:text-faint focus:ring-2 focus:ring-ink/15"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="クリア" className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
          {STATUS.map(([k, v]) => (
            <Chip key={k} active={status === k} onClick={() => setParam('status', k === 'all' ? null : k)}>
              {k === 'marked' && <Star className="h-3.5 w-3.5" strokeWidth={2} />}
              {/* 一覧の左の点（パティーナ）の凡例を兼ねる */}
              {(k === 'learning' || k === 'mastered') && <span className={cx('h-2 w-2 rounded-full', k === 'mastered' ? 'bg-verdigris' : 'bg-copper')} />}
              {v}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
          <Chip active={lv === null} onClick={() => setLv(null)}>
            全レベル
          </Chip>
          {levels.map((l) => {
            const L = LEVELS.find((x) => x.lv === l)!
            return (
              <Chip key={l} active={lv === l} onClick={() => setLv(lv === l ? null : l)}>
                {L.label}
                <span className="opacity-60">{L.cefr === 'ESP' ? '' : L.cefr}</span>
              </Chip>
            )
          })}
        </div>
        {cat === 'rail' && (
          <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
            <Chip active={sub === null} onClick={() => setSub(null)}>
              全分野
            </Chip>
            {Object.entries(RAIL_SUBS).map(([k, v]) => (
              <Chip key={k} active={sub === k} onClick={() => setSub(sub === k ? null : k)}>
                {v}
              </Chip>
            ))}
          </div>
        )}

        {drill && filtered.length > 0 && (
          <Button block variant="outline" onClick={() => nav(`/study?mode=${status}`)}>
            {status === 'weak' ? '苦手な単語を練習する' : '保存した単語を練習する'}
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} />
          </Button>
        )}

        {words && filtered.length === 0 && (
          <Empty>
            {status === 'weak'
              ? '苦手な単語はまだありません。学習で間違えた語がここに集まります。'
              : status === 'marked'
                ? '保存した単語はまだありません。単語の画面の「保存」（星のボタン）で集められます。'
                : '該当する単語がありません'}
          </Empty>
        )}
        {filtered.length > 0 && (
          <ul className="overflow-hidden rounded-[18px] border border-line bg-surface">
            {filtered.slice(0, limit).map((w, k) => {
              const st = statusOf(cards?.get(w.id))
              return (
                <li key={w.id} className={cx('flex items-center gap-2 pr-2.5', k > 0 && 'hairline-t')}>
                  <Link to={`/words/${w.id}`} viewTransition className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 active:opacity-60">
                    <span
                      className={cx(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        st === 'mastered' ? 'bg-verdigris' : st === 'learning' ? 'bg-copper' : 'bg-surface-3',
                      )}
                      title={STATUS_LABEL[st]}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="break-words">
                        <span className="en text-[18px] font-medium">{w.w}</span>
                        {w.us && (
                          <span className="ml-2 inline-flex items-center gap-1 align-middle text-[12px] text-muted">
                            <Tag>米</Tag>
                            <span className="en">{w.us}</span>
                          </span>
                        )}
                      </p>
                      <p className="line-clamp-2 text-[13px] leading-snug text-muted">{w.ja}</p>
                    </div>
                    {marks?.has(w.id) && <Star className="h-3.5 w-3.5 shrink-0 fill-warn text-warn" />}
                  </Link>
                  <SpeakButton text={w.w} accent={accentFor(w.cat)} size="sm" />
                </li>
              )
            })}
          </ul>
        )}
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
