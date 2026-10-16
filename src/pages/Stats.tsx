import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/Layout'
import { Card, Metric, ProgressBar, SectionTitle, cx } from '@/components/ui'
import { useCardsMap, useNow, useRecentDays, useStreak } from '@/lib/hooks'
import { db, isActiveDay, shiftDay, todayKey, type DailyRow } from '@/lib/db'
import { selectedCats, useSettings } from '@/lib/settings'
import { CATEGORIES } from '@/lib/types'
import VOCAB_COUNTS from '@/data/vocab/counts.json'

const WEEKS = 12
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

/** その日の学習量（問題・練習の回数の合計） */
const amount = (r?: DailyRow) => (r ? (r.reviews || 0) + (r.listening || 0) + (r.speaking || 0) : 0)

/** 学習量 → 濃さ（0〜4）。1色の濃淡だけで量を表す */
function level(n: number): number {
  if (n <= 0) return 0
  if (n < 10) return 1
  if (n < 30) return 2
  if (n < 60) return 3
  return 4
}
const LEVEL_BG = [
  'bg-surface-2',
  'bg-[color-mix(in_srgb,var(--brand)_28%,var(--surface))]',
  'bg-[color-mix(in_srgb,var(--brand)_52%,var(--surface))]',
  'bg-[color-mix(in_srgb,var(--brand)_76%,var(--surface))]',
  'bg-brand',
]

const fmtDay = (key: string) => {
  const d = new Date(key.replace(/-/g, '/'))
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`
}

export default function Stats() {
  const now = useNow()
  const s = useSettings()
  const streak = useStreak() ?? 0
  const cards = useCardsMap()
  const today = todayKey(new Date(now))
  // 12週間ぶん（最後の列が今週。左上が日曜）
  const startOffset = new Date(now).getDay() + (WEEKS - 1) * 7
  const days = useRecentDays(startOffset + 1)
  const [sel, setSel] = useState<string>(today)
  const [selDue, setSelDue] = useState(0)

  // 今日から7日間の復習予定（今日は期限切れを含む）
  const forecast = useLiveQuery(async () => {
    const end = new Date(now)
    end.setHours(0, 0, 0, 0)
    const out: { key: string; n: number }[] = []
    const rows = await db.cards
      .where('due')
      .below(end.getTime() + 7 * 86_400_000)
      .filter((r) => !r.known && !!s.studyCats[r.cat])
      .toArray()
    for (let k = 0; k < 7; k++) {
      const from = end.getTime() + k * 86_400_000
      const to = from + 86_400_000
      out.push({ key: shiftDay(today, k), n: rows.filter((r) => (k === 0 ? r.due < to : r.due >= from && r.due < to)).length })
    }
    return out
  }, [now, s.studyCats, today])

  const speaking = useLiveQuery(() => db.speaking.where('at').above(now - 30 * 86_400_000).toArray(), [now])

  const summary = useMemo(() => {
    const list = days ?? []
    const last7 = list.slice(-7)
    const last30 = list.slice(-30)
    const minutes7 = Math.round(last7.reduce((a, d) => a + (d.row?.seconds || 0), 0) / 60)
    const rev30 = last30.reduce((a, d) => a + (d.row?.reviews || 0), 0)
    const cor30 = last30.reduce((a, d) => a + (d.row?.correct || 0), 0)
    const active30 = last30.filter((d) => isActiveDay(d.row)).length
    return { minutes7, accuracy: rev30 ? Math.round((cor30 / rev30) * 100) : null, active30, rev30 }
  }, [days])

  const byCat = useMemo(() => {
    const o = {
      general: { learned: 0, mastered: 0, total: VOCAB_COUNTS.general },
      business: { learned: 0, mastered: 0, total: VOCAB_COUNTS.business },
      rail: { learned: 0, mastered: 0, total: VOCAB_COUNTS.rail },
    }
    for (const c of cards?.values() ?? []) {
      if (c.known || c.reps > 0) o[c.cat].learned++
      if (c.known || c.stability >= 21) o[c.cat].mastered++
    }
    return o
  }, [cards])

  const selRow = days?.find((d) => d.date === sel)?.row
  const maxDue = Math.max(1, ...(forecast ?? []).map((f) => f.n))
  const pron = speaking?.length ? Math.round(speaking.reduce((a, r) => a + r.pron, 0) / speaking.length) : null
  const cats = selectedCats(s)

  return (
    <div>
      <PageHeader title="学習記録" back />
      <div className="px-4 pb-10">
        <Card className="grid grid-cols-3 gap-3">
          <Metric value={streak} unit="日" label="連続学習" />
          <Metric value={summary.minutes7} unit="分" label="この7日間" />
          <Metric value={summary.active30} unit="日" label="直近30日の学習日" />
        </Card>

        <SectionTitle>12週間の学習</SectionTitle>
        <Card>
          <div className="flex gap-[3px]" role="grid" aria-label="12週間の学習量">
            <div className="mr-1 grid grid-rows-7 gap-[3px] text-[9.5px] leading-none text-faint">
              {WEEKDAYS.map((d, k) => (
                <span key={d} className="flex items-center">
                  {k % 2 === 1 ? d : ''}
                </span>
              ))}
            </div>
            <div className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px]">
              {(days ?? []).map(({ date, row }) => {
                const n = amount(row)
                return (
                  <button
                    key={date}
                    role="gridcell"
                    aria-label={`${fmtDay(date)} ${n}回`}
                    onClick={() => setSel(date)}
                    className={cx(
                      'aspect-square rounded-[3px]',
                      LEVEL_BG[level(n)],
                      sel === date && 'outline outline-2 outline-offset-1 outline-ink',
                      date === today && sel !== date && 'outline outline-1 outline-offset-1 outline-line-strong',
                    )}
                  />
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="min-w-0 text-[12.5px] leading-snug">
              <span className="font-medium">{fmtDay(sel)}</span>
              <span className="text-muted">
                {selRow && amount(selRow) > 0
                  ? `　単語 ${selRow.reviews || 0}・聞く ${selRow.listening || 0}・話す ${selRow.speaking || 0}・${Math.round((selRow.seconds || 0) / 60)}分`
                  : '　学習なし'}
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-1 text-[10px] text-faint" aria-hidden>
              少
              {LEVEL_BG.map((c) => (
                <span key={c} className={cx('h-2.5 w-2.5 rounded-[2px]', c)} />
              ))}
              多
            </div>
          </div>
        </Card>

        <SectionTitle>これから7日間の復習予定</SectionTitle>
        <Card>
          <div className="flex h-28 items-end gap-2" role="list" aria-label="日ごとの復習予定の枚数">
            {(forecast ?? []).map((f, k) => (
              <button
                key={f.key}
                role="listitem"
                aria-label={`${fmtDay(f.key)} ${f.n}語`}
                onClick={() => setSelDue(k)}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                {k === selDue && <span className="text-[11px] font-semibold tabular-nums">{f.n}</span>}
                <span
                  className={cx('w-full max-w-6 rounded-t-[4px] transition-[height] duration-500', k === selDue ? 'bg-ink' : 'bg-surface-3')}
                  style={{ height: `${Math.max(f.n ? 6 : 2, (f.n / maxDue) * 80)}%` }}
                />
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {(forecast ?? []).map((f, k) => (
              <span key={f.key} className={cx('flex-1 text-center text-[10.5px]', k === selDue ? 'font-semibold text-ink' : 'text-muted')}>
                {k === 0 ? '今日' : WEEKDAYS[new Date(f.key.replace(/-/g, '/')).getDay()]}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">
            {forecast ? `${fmtDay(forecast[selDue].key)}：${forecast[selDue].n}語` : ''}
            {selDue === 0 && '（期限が過ぎた語を含む）'}
          </p>
        </Card>

        <SectionTitle>正答率と発音</SectionTitle>
        <Card className="grid grid-cols-2 gap-3">
          <div>
            <Metric value={summary.accuracy ?? '—'} unit={summary.accuracy === null ? '' : '%'} label={`単語の正答率（直近30日・${summary.rev30}問）`} />
            <p className="mt-2 text-[11.5px] leading-snug text-muted">目標の記憶保持率は {Math.round(s.retention * 100)}%。大きく下回るときは新しい語を減らすと安定します。</p>
          </div>
          <Metric value={pron ?? '—'} label={`発音の平均点（直近30日・${speaking?.length ?? 0}回）`} />
        </Card>

        <SectionTitle>コース別</SectionTitle>
        <Card className="space-y-4">
          {CATEGORIES.filter((c) => cats.includes(c.key)).map((c) => {
            const st = byCat[c.key]
            return (
              <div key={c.key}>
                <div className="mb-2 flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="flex items-center gap-2 font-medium">
                    <span className={cx('h-2 w-2 rounded-full', c.dot)} />
                    {c.label}
                  </span>
                  <span className="tabular-nums text-muted">
                    学習 <b className="font-semibold text-ink">{st.learned.toLocaleString()}</b>・定着 <b className="font-semibold text-ink">{st.mastered.toLocaleString()}</b> / {st.total.toLocaleString()}
                  </span>
                </div>
                <ProgressBar value={st.learned} max={st.total} color={c.dot} />
              </div>
            )
          })}
          <p className="text-[11.5px] text-muted">定着＝次の復習まで21日以上あいた語</p>
        </Card>
      </div>
    </div>
  )
}
