import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { BookOpenCheck, ChevronRight, Ear, Flame, GraduationCap, Keyboard, Languages, Mic, MessagesSquare, Timer } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { CharImage } from '@/components/Guide'
import { Card, ProgressBar, ProgressRing, SectionTitle } from '@/components/ui'
import { useCardsMap, useDueCount, useNow, useStreak, useToday } from '@/lib/hooks'
import { dueMessage, greeting, randomTip, streakMessage } from '@/lib/guide'
import { useSettings } from '@/lib/settings'
import VOCAB_COUNTS from '@/data/vocab/counts.json'
import { CATEGORIES } from '@/lib/types'

export default function Home() {
  const nav = useNavigate()
  const now = useNow()
  const dailyNew = useSettings((s) => s.dailyNew)
  const guideOn = useSettings((s) => s.guide)
  const today = useToday()
  const due = useDueCount() ?? 0
  const streak = useStreak() ?? 0
  const cards = useCardsMap()
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
    return { byCat, mastered, total: VOCAB_COUNTS.general + VOCAB_COUNTS.business + VOCAB_COUNTS.rail }
  }, [cards])

  const minutes = Math.round((today?.seconds ?? 0) / 60)
  const dateStr = new Date(now).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })

  const done = due === 0 && newLeft === 0
  const bubble = done ? msg : { pose: hello.pose, text: `${hello.text} ${msg.text}` }

  return (
    <div>
      <PageHeader title="Tetsu English" subtitle={dateStr} settings />
      <div className="px-4">
        <Onboarding />

        {/* 今日の学習（ヒーロー） */}
        <section className="relative mt-10 overflow-visible rounded-[28px] bg-brand-grad p-5 pt-4 text-white shadow-glow">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
            <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-[#ffd27a]/25 blur-2xl" />
          </div>
          {guideOn && <CharImage pose={bubble.pose} size={124} float className="absolute -top-14 right-1" />}
          <div className="relative">
            <p className="text-[13px] font-bold text-white/85">今日の学習</p>
            <div className="mt-2 flex items-center gap-4">
              <ProgressRing value={learnedToday} max={dailyNew} size={84} track="rgb(255 255 255 / 0.25)" stroke="#fff" width={9}>
                <span className="text-xl font-extrabold tabular-nums leading-none">{learnedToday}</span>
                <span className="mt-0.5 text-[10px] font-semibold text-white/80">/ {dailyNew}語</span>
              </ProgressRing>
              <div className="flex gap-5">
                <div>
                  <p className="text-[30px] font-extrabold leading-none tabular-nums">{due}</p>
                  <p className="mt-1 text-[11px] font-semibold text-white/80">復習</p>
                </div>
                <div>
                  <p className="text-[30px] font-extrabold leading-none tabular-nums">{newLeft}</p>
                  <p className="mt-1 text-[11px] font-semibold text-white/80">新出</p>
                </div>
              </div>
            </div>
            {guideOn && (
              <p className="mt-4 rounded-2xl bg-white/15 px-3.5 py-2.5 text-[13.5px] leading-relaxed backdrop-blur-sm">
                <b className="mr-1">テツ</b>
                {bubble.text}
              </p>
            )}
            <button
              onClick={() => nav(done ? '/study?extra=1' : '/study')}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-extrabold text-brand-strong shadow-[0_8px_20px_-10px_rgb(0_0_0/0.35)] transition active:scale-[0.97] dark:bg-[#1c1206] dark:text-white"
            >
              <GraduationCap className="h-5 w-5" />
              {done ? '今日の目標は達成！追加で新出語を学ぶ' : '学習をはじめる'}
            </button>
          </div>
        </section>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat icon={<Flame className="h-4 w-4" />} tint="bg-[#fff3e0] text-[#e8700a] dark:bg-[#3a2410] dark:text-[#ffb15c]" value={`${streak}`} unit="日" label="連続学習" />
          <Stat icon={<Timer className="h-4 w-4" />} tint="bg-gen-soft text-gen" value={`${minutes}`} unit="分" label="今日の学習" />
          <Stat icon={<BookOpenCheck className="h-4 w-4" />} tint="bg-rail-soft text-rail" value={stats.mastered.toLocaleString()} unit="語" label="定着した語" />
        </div>

        <SectionTitle>練習メニュー</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <Quick to="/practice/listening" icon={<Ear />} title="リスニング" desc="聞いて意味を選ぶ" tint="bg-gen-soft text-gen" />
          <Quick to="/practice/dictation" icon={<Keyboard />} title="ディクテーション" desc="聞いて書き取る" tint="bg-biz-soft text-biz" />
          <Quick to="/practice/speaking" icon={<Mic />} title="発音チェック" desc="話して採点" tint="bg-brand-soft text-brand-strong" />
          <Quick to="/scenes" icon={<MessagesSquare />} title="シーン会話" desc="日常・ビジネス・保線" tint="bg-rail-soft text-rail" />
          <Quick to="/translate" icon={<Languages />} title="翻訳" desc="保線用語チェック付き" tint="bg-surface-2 text-ink" wide />
        </div>

        <SectionTitle action={<Link to="/words" className="flex items-center text-[13px] font-bold text-brand">単語帳<ChevronRight className="h-4 w-4" /></Link>}>
          カテゴリ別の進み具合
        </SectionTitle>
        <Card>
          <div className="space-y-4">
            {CATEGORIES.map((c) => {
              const s = stats.byCat[c.key]
              const pct = s.total ? Math.round((s.learned / s.total) * 100) : 0
              return (
                <div key={c.key}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[14px] font-bold">{c.label}</span>
                    <span className="text-[12px] tabular-nums text-muted">
                      <b className="text-ink">{s.learned.toLocaleString()}</b> / {s.total.toLocaleString()}語・定着 {s.mastered.toLocaleString()}
                      <span className="ml-1.5 font-bold text-ink">{pct}%</span>
                    </span>
                  </div>
                  <ProgressBar value={s.learned} max={s.total} color={c.key === 'rail' ? 'bg-rail' : c.key === 'business' ? 'bg-biz' : 'bg-gen'} />
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-[11px] text-muted">全{stats.total.toLocaleString()}語・定着＝次回の復習まで21日以上空いた語</p>
        </Card>

        <SectionTitle>ホー先生のワンポイント</SectionTitle>
        <Card onClick={() => nav('/research')} className="relative overflow-hidden">
          <div className="flex items-center gap-3">
            {guideOn && <CharImage who="hoo" pose="cheer" size={76} className="-my-1 -ml-1" />}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-relaxed">{tip}</p>
              <p className="mt-1.5 flex items-center text-[12px] font-bold text-brand">
                学習法の根拠を見る
                <ChevronRight className="h-4 w-4" />
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Stat({ icon, tint, value, unit, label }: { icon: React.ReactNode; tint: string; value: string; unit: string; label: string }) {
  return (
    <Card className="p-3">
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${tint}`}>{icon}</span>
      <p className="mt-2 text-[22px] font-extrabold leading-none tabular-nums">
        {value}
        <span className="ml-0.5 text-[12px] font-bold text-muted">{unit}</span>
      </p>
      <p className="mt-1 text-[11px] font-semibold text-muted">{label}</p>
    </Card>
  )
}

function Quick({ to, icon, title, desc, tint, wide }: { to: string; icon: React.ReactNode; title: string; desc: string; tint: string; wide?: boolean }) {
  return (
    <Link to={to} className={wide ? 'col-span-2' : ''}>
      <Card className={`flex h-full gap-3 p-3.5 transition-transform active:scale-[0.97] ${wide ? 'items-center' : 'flex-col'}`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tint} [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold">{title}</p>
          <p className="truncate text-[12px] text-muted">{desc}</p>
        </div>
        {wide && <ChevronRight className="h-5 w-5 text-muted" />}
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
    <Card className="mb-3 ring-2 ring-brand/30">
      <div className="flex items-center gap-2">
        <CharImage pose="greet" size={72} className="-my-2 -ml-1" />
        <div>
          <p className="text-[16px] font-extrabold">はじめまして、テツだワン！</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">いまの英語レベルを選んでね。新しく出る単語の範囲を合わせるよ（あとで設定から変更できます）。</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {LEVEL_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => s.set({ minLevel: p.min, maxLevel: p.max, onboarded: true })}
            className="rounded-2xl bg-surface-2 px-3.5 py-3 text-left transition active:scale-[0.97]"
          >
            <p className="text-[15px] font-extrabold">{p.label}</p>
            <p className="text-[11px] font-medium text-muted">{p.desc}</p>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">保線（鉄道）用語は、レベルに関係なく毎日少しずつ出題されます。</p>
    </Card>
  )
}
