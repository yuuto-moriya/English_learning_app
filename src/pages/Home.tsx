import { useEffect, useMemo } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ArrowRight, BarChart3, ChevronRight, Ear, Mic, PencilLine, Radio, RotateCcw, Waves } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { CharImage } from '@/components/Guide'
import { Button, Card, List, ListRow, ProgressBar, RouteProgress, SectionTitle, cx } from '@/components/ui'
import { useCardsMap, useDueCount, useNow, useRecentDays, useStreak, useToday } from '@/lib/hooks'
import { dueMessage, greeting, randomTip, streakMessage } from '@/lib/guide'
import { PLAN_LABEL, selectedCats, useSettings } from '@/lib/settings'
import { isActiveDay } from '@/lib/db'
import VOCAB_COUNTS from '@/data/vocab/counts.json'
import { CATEGORIES } from '@/lib/types'
import { CHARACTERS } from '@/lib/characters'
import { loadCategory } from '@/lib/vocab'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function Home() {
  const nav = useNavigate()
  const now = useNow()
  const s = useSettings()
  const today = useToday()
  const due = useDueCount() ?? 0
  const streak = useStreak() ?? 0
  const cards = useCardsMap()
  const week = useRecentDays(7)
  const cats = selectedCats(s)
  const learnedToday = today?.newLearned ?? 0
  const newLeft = Math.max(0, s.dailyNew - learnedToday)
  const tip = useMemo(() => randomTip(s.studyCats), [s.studyCats])

  // 「学習をはじめる」をすぐ開けるよう、待ち時間のあるうちに画面と単語データを読み込んでおく
  useEffect(() => {
    if (!s.onboarded) return
    const ric = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    const idle = (cb: () => void) => (ric ? ric(cb, { timeout: 2500 }) : setTimeout(cb, 1200))
    idle(() => {
      void import('./Study')
      for (const c of selectedCats(useSettings.getState())) void loadCategory(c)
    })
  }, [s.onboarded])

  // 開きっぱなしでも時間帯・日付が変われば挨拶を更新する
  const hour = new Date(now).getHours()
  const hello = useMemo(() => greeting(new Date()), [hour]) // eslint-disable-line react-hooks/exhaustive-deps
  const msg = useMemo(() => {
    const st = streakMessage(streak)
    if (due > 0 || newLeft > 0) return dueMessage(due, newLeft)
    return st ?? dueMessage(due, newLeft)
  }, [due, newLeft, streak])

  const stats = useMemo(() => {
    // 語数は集計済みの counts.json を使い、ホームでは大きな単語データを読み込まない
    const byCat = {
      general: { total: VOCAB_COUNTS.general, learned: 0, mastered: 0 },
      business: { total: VOCAB_COUNTS.business, learned: 0, mastered: 0 },
      rail: { total: VOCAB_COUNTS.rail, learned: 0, mastered: 0 },
    }
    let mastered = 0
    if (cards)
      for (const c of cards.values()) {
        if (c.known || c.reps > 0) byCat[c.cat].learned++
        if (c.known || c.stability >= 21) {
          byCat[c.cat].mastered++
          mastered++
        }
      }
    return { byCat, mastered }
  }, [cards])

  if (!s.onboarded) return <Navigate to="/welcome" replace />

  const minutes = Math.round((today?.seconds ?? 0) / 60)
  const dateStr = new Date(now).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
  const done = due === 0 && newLeft === 0
  // 1語あたりの目安：復習 約8秒、新出（提示＋想起テスト）約30秒
  const estimate = Math.max(1, Math.round((Math.min(due, 50) * 8 + newLeft * 30) / 60))
  const goalValue = Math.min(s.dailyMinutes, minutes)

  return (
    <div>
      <PageHeader eyebrow={dateStr} title={hello.title} settings />
      <div className="px-4">
        {/* 今日の学習 */}
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-muted">今日の学習</p>
              <div className="mt-3 flex items-end gap-6">
                <Count value={due} label="復習" />
                <Count value={newLeft} label="新しい単語" />
                {!done && (
                  <p className="mb-[3px] text-[13px] text-muted">
                    約<span className="mx-0.5 font-semibold text-ink tabular-nums">{estimate}</span>分
                  </p>
                )}
              </div>
            </div>
            {s.guide && <CharImage pose={done ? 'celebrate' : hello.pose} size={84} className="-mr-2 -mt-3" />}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between text-[12px] text-muted">
              <span>
                {PLAN_LABEL[s.planWhen]}に{s.dailyMinutes}分
              </span>
              <span className="tabular-nums">
                <b className="font-semibold text-ink">{minutes}</b> / {s.dailyMinutes}分
              </span>
            </div>
            <RouteProgress value={goalValue} max={s.dailyMinutes} />
          </div>

          {s.guide && <p className="mt-5 text-[14px] leading-relaxed text-ink/90">{msg.text}</p>}

          <Button block size="lg" className="mt-5" variant={done ? 'outline' : 'primary'} onClick={() => nav(done ? '/study?extra=1' : '/study')}>
            {done ? '追加で新しい単語を5語学ぶ' : '学習をはじめる'}
            {!done && <ArrowRight className="h-[18px] w-[18px]" />}
          </Button>
        </Card>

        {/* 今週 */}
        <Link to="/stats" viewTransition className="mt-3 block">
          <Card className="flex items-center gap-4 py-3.5">
            <div className="shrink-0">
              <p className="text-[22px] font-semibold leading-none tabular-nums">
                {streak}
                <span className="ml-0.5 text-[12px] font-medium text-muted">日</span>
              </p>
              <p className="mt-1 text-[11.5px] text-muted">連続</p>
            </div>
            <div className="grid flex-1 grid-cols-7 gap-1">
              {(week ?? []).map(({ date, row }) => {
                const d = new Date(date.replace(/-/g, '/'))
                const active = isActiveDay(row)
                const isToday = date === week?.[week.length - 1]?.date
                return (
                  <div key={date} className="flex flex-col items-center gap-1.5">
                    <span className={cx('text-[10.5px]', isToday ? 'font-semibold text-ink' : 'text-faint')}>{WEEKDAYS[d.getDay()]}</span>
                    <span
                      className={cx(
                        'h-[22px] w-[22px] rounded-full border-[1.5px] transition-colors',
                        active ? 'border-brand bg-brand' : isToday ? 'border-ink/40 border-dashed' : 'border-line-strong',
                      )}
                    />
                  </div>
                )
              })}
            </div>
            <ChevronRight className="h-[18px] w-[18px] shrink-0 text-faint" />
          </Card>
        </Link>

        <SectionTitle action={<Link to="/practice" viewTransition className="text-[13px] font-medium text-brand">すべて</Link>}>
          聞く・話す
        </SectionTitle>
        <List>
          <ListRow to="/practice/listening" icon={<Ear />} title="リスニング" sub="例文・会話を聞いて意味を選ぶ" />
          <ListRow to="/practice/sounds" icon={<Waves />} title="聞き分け" sub="L と R など、日本語にない音の区別" />
          <ListRow to="/practice/compose" icon={<PencilLine />} title="瞬間英作文" sub="日本語を見て、すぐ英語で言う" />
          <ListRow to="/practice/speaking" icon={<Mic />} title="発音チェック" sub="話して採点・シャドーイング" />
          <ListRow to="/practice/audio" icon={<Radio />} title="耳で復習" sub="画面を見ずに、音だけで思い出す" />
        </List>

        <SectionTitle action={<Link to="/words" viewTransition className="text-[13px] font-medium text-brand">単語帳</Link>}>
          コースの進み具合
        </SectionTitle>
        <Card className="space-y-4">
          {CATEGORIES.filter((c) => cats.includes(c.key)).map((c) => {
            const st = stats.byCat[c.key]
            return (
              <Link key={c.key} to={`/words?cat=${c.key}`} viewTransition className="block">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <span className={cx('h-2 w-2 rounded-full', c.dot)} />
                    {c.label}
                  </span>
                  <span className="text-[12px] tabular-nums text-muted">
                    <b className="font-semibold text-ink">{st.learned.toLocaleString()}</b> / {st.total.toLocaleString()}語
                  </span>
                </div>
                <ProgressBar value={st.learned} max={st.total} color={c.dot} />
              </Link>
            )
          })}
          <div className="flex items-center justify-between border-t border-line pt-3 text-[12px] text-muted">
            <span>
              定着した語 <b className="font-semibold text-ink tabular-nums">{stats.mastered.toLocaleString()}</b>
            </span>
            <Link to="/settings#courses" className="font-medium text-brand">
              コースを変更
            </Link>
          </div>
        </Card>

        <SectionTitle>{CHARACTERS[tip.who].name}のひとこと</SectionTitle>
        <Card onClick={() => nav('/research', { viewTransition: true })} className="flex items-center gap-3 py-3">
          {s.guide && <CharImage who={tip.who} pose="cheer" size={56} className="-my-1 -ml-1" />}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] leading-relaxed">{tip.text}</p>
            <p className="mt-1 flex items-center gap-0.5 text-[12px] font-medium text-muted">
              学習法の根拠
              <ChevronRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/stats" viewTransition>
            <Card className="flex items-center gap-2.5 py-3">
              <BarChart3 className="h-5 w-5 text-muted" strokeWidth={1.7} />
              <span className="text-[14px] font-medium">学習記録</span>
            </Card>
          </Link>
          <Link to="/words?status=weak" viewTransition>
            <Card className="flex items-center gap-2.5 py-3">
              <RotateCcw className="h-5 w-5 text-muted" strokeWidth={1.7} />
              <span className="text-[14px] font-medium">苦手な単語</span>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-[34px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      <p className="mt-1.5 text-[12px] text-muted">{label}</p>
    </div>
  )
}
