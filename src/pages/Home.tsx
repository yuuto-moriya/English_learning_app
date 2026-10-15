import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { BookOpenCheck, ChevronRight, Ear, Flame, GraduationCap, Keyboard, Languages, Lightbulb, Mic, MessagesSquare, Timer } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Button, Card, ProgressBar, ProgressRing, SectionTitle } from '@/components/ui'
import { useCardsMap, useDueCount, useNow, useStreak, useToday } from '@/lib/hooks'
import { dueMessage, greeting, randomTip, streakMessage } from '@/lib/guide'
import { useSettings } from '@/lib/settings'
import { useCategory } from '@/lib/vocab'
import { CATEGORIES } from '@/lib/types'

export default function Home() {
  const nav = useNavigate()
  const now = useNow()
  const dailyNew = useSettings((s) => s.dailyNew)
  const today = useToday()
  const due = useDueCount() ?? 0
  const streak = useStreak() ?? 0
  const cards = useCardsMap()
  const all = useCategory('all')
  const learnedToday = today?.newLearned ?? 0
  const newLeft = Math.max(0, dailyNew - learnedToday)
  const tip = useMemo(() => randomTip(), [])

  // 開きっぱなしでも時間帯・日付が変われば挨拶を更新する
  const hour = new Date(now).getHours()
  const hello = useMemo(() => greeting(new Date()), [hour]) // eslint-disable-line react-hooks/exhaustive-deps
  const msg = useMemo(() => {
    const s = streakMessage(streak)
    if (due > 0 || newLeft > 0) return dueMessage(due, newLeft)
    return s ?? dueMessage(due, newLeft)
  }, [due, newLeft, streak])

  const stats = useMemo(() => {
    const byCat = { general: { total: 0, learned: 0, mastered: 0 }, business: { total: 0, learned: 0, mastered: 0 }, rail: { total: 0, learned: 0, mastered: 0 } }
    if (all) for (const w of all) byCat[w.cat].total++
    let mastered = 0
    if (cards)
      for (const c of cards.values()) {
        if (c.known || c.reps > 0) byCat[c.cat].learned++
        if (c.known || c.stability >= 21) {
          byCat[c.cat].mastered++
          mastered++
        }
      }
    return { byCat, mastered, total: all?.length ?? 0 }
  }, [all, cards])

  const minutes = Math.round((today?.seconds ?? 0) / 60)
  const dateStr = new Date(now).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div>
      <PageHeader title="Tetsu English" subtitle={dateStr} settings />
      <div className="px-4">
        <Onboarding />
        <Guide pose={due > 0 || newLeft > 0 ? hello.pose : msg.pose} text={due > 0 || newLeft > 0 ? `${hello.text} ${msg.text}` : msg.text} />

        <Card className="mt-3">
          <div className="flex items-center gap-4">
            <ProgressRing value={learnedToday} max={dailyNew}>
              <span className="text-lg font-extrabold">{learnedToday}</span>
              <span className="text-[10px] text-muted">/ {dailyNew}語</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-muted">今日の学習</p>
              <div className="mt-1 flex gap-4">
                <div>
                  <p className="text-2xl font-extrabold text-brand">{due}</p>
                  <p className="text-[11px] text-muted">復習</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold">{newLeft}</p>
                  <p className="text-[11px] text-muted">新出</p>
                </div>
              </div>
            </div>
          </div>
          <Button block className="mt-4" onClick={() => nav('/study')} disabled={due === 0 && newLeft === 0}>
            <GraduationCap className="h-5 w-5" />
            {due === 0 && newLeft === 0 ? '今日の単語学習は完了！' : '学習をはじめる'}
          </Button>
          {due === 0 && newLeft === 0 && (
            <button onClick={() => nav('/study?extra=1')} className="mt-2 w-full text-center text-sm font-semibold text-brand">
              追加で新出語を学ぶ
            </button>
          )}
        </Card>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat icon={<Flame className="h-4 w-4 text-warn" />} value={`${streak}日`} label="連続学習" />
          <Stat icon={<Timer className="h-4 w-4 text-gen" />} value={`${minutes}分`} label="今日の学習" />
          <Stat icon={<BookOpenCheck className="h-4 w-4 text-ok" />} value={`${stats.mastered}`} label="定着した語" />
        </div>

        <SectionTitle>練習メニュー</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <Quick to="/practice/listening" icon={<Ear />} title="リスニング" desc="聞いて意味を選ぶ" color="text-gen" />
          <Quick to="/practice/dictation" icon={<Keyboard />} title="ディクテーション" desc="聞いて書き取る" color="text-biz" />
          <Quick to="/practice/speaking" icon={<Mic />} title="発音チェック" desc="話して採点" color="text-brand" />
          <Quick to="/scenes" icon={<MessagesSquare />} title="シーン会話" desc="日常・ビジネス・保線" color="text-rail" />
          <Quick to="/translate" icon={<Languages />} title="翻訳" desc="専門用語チェック付き" color="text-ink" wide />
        </div>

        <SectionTitle action={<Link to="/words" className="text-sm font-semibold text-brand">単語帳</Link>}>カテゴリ別の進み具合</SectionTitle>
        <Card>
          <div className="space-y-3">
            {CATEGORIES.map((c) => {
              const s = stats.byCat[c.key]
              return (
                <div key={c.key}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{c.label}</span>
                    <span className="text-xs text-muted">
                      {s.learned} / {s.total}語（定着 {s.mastered}）
                    </span>
                  </div>
                  <ProgressBar value={s.learned} max={s.total} color={c.key === 'rail' ? 'bg-rail' : c.key === 'business' ? 'bg-biz' : 'bg-gen'} />
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted">全{stats.total.toLocaleString()}語・定着＝次回復習まで21日以上の語</p>
        </Card>

        <SectionTitle>テツのワンポイント</SectionTitle>
        <Card onClick={() => nav('/research')}>
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
            <p className="flex-1 text-[14px] leading-relaxed">{tip}</p>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
          </div>
          <p className="mt-2 pl-8 text-xs font-semibold text-brand">このアプリの学習法の根拠を見る</p>
        </Card>
      </div>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5">{icon}<span className="text-[11px] text-muted">{label}</span></div>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </Card>
  )
}

function Quick({ to, icon, title, desc, color, wide }: { to: string; icon: React.ReactNode; title: string; desc: string; color: string; wide?: boolean }) {
  return (
    <Link to={to} className={wide ? 'col-span-2' : ''}>
      <Card className="flex h-full items-center gap-3 p-3 active:scale-[0.98] transition-transform">
        <div className={`rounded-xl bg-surface-2 p-2 ${color} [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold">{title}</p>
          <p className="truncate text-[11px] text-muted">{desc}</p>
        </div>
      </Card>
    </Link>
  )
}

const LEVEL_PRESETS = [
  { label: '入門', desc: '中学英語の復習から', min: 1, max: 2 },
  { label: '初級', desc: 'TOEIC 〜450点', min: 2, max: 3 },
  { label: '中級', desc: 'TOEIC 450〜650点', min: 3, max: 4 },
  { label: '上級', desc: 'TOEIC 650点〜', min: 4, max: 5 },
]

function Onboarding() {
  const s = useSettings()
  if (s.onboarded) return null
  return (
    <Card className="mb-3 border-2 border-brand/40">
      <p className="text-[15px] font-extrabold">はじめまして、案内役のテツだワン！</p>
      <p className="mt-1 text-[13px] text-muted">いまの英語レベルを選んでね。新しく出る単語の範囲を合わせるよ（あとで設定から変更できます）。</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {LEVEL_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => s.set({ minLevel: p.min, maxLevel: p.max, onboarded: true })}
            className="rounded-xl border border-line bg-surface-2 px-3 py-3 text-left active:scale-[0.98]"
          >
            <p className="text-[15px] font-bold">{p.label}</p>
            <p className="text-[11px] text-muted">{p.desc}</p>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">保線（鉄道）用語は、レベルに関係なく毎日少しずつ出題されます。</p>
    </Card>
  )
}
