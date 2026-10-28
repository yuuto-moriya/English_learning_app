import { useState } from 'react'
import { Link } from 'react-router'
import {
  Building2,
  ChevronRight,
  ClipboardList,
  Cloud,
  Code,
  Globe,
  HardHat,
  Handshake,
  Headset,
  Hotel,
  House,
  MessagesSquare,
  Network,
  Phone,
  Presentation,
  Ruler,
  Scale,
  ShieldCheck,
  Siren,
  Stethoscope,
  TrainFront,
  TriangleAlert,
  UtensilsCrossed,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide, type CharId, type Pose } from '@/components/Guide'
import { LevelBadge, Segmented, cx } from '@/components/ui'
import { scenesByGroup } from '@/data/scenes'
import { SCENE_GROUP_LABEL as GROUP_LABEL, subsOf } from '@/data/scenes/subs'
import { CATEGORIES, type SceneGroup } from '@/lib/types'
import { getSettings, selectedCats } from '@/lib/settings'

/** 小分類のアイコン（絵文字ではなく、アプリの他の画面と同じ線画） */
const SUB_ICONS: Record<string, LucideIcon> = {
  users: Users,
  train: TrainFront,
  hotel: Hotel,
  utensils: UtensilsCrossed,
  house: House,
  stethoscope: Stethoscope,
  messages: MessagesSquare,
  phone: Phone,
  handshake: Handshake,
  scale: Scale,
  building: Building2,
  presentation: Presentation,
  code: Code,
  siren: Siren,
  shield: ShieldCheck,
  headset: Headset,
  clipboard: ClipboardList,
  cloud: Cloud,
  hardhat: HardHat,
  ruler: Ruler,
  wrench: Wrench,
  alert: TriangleAlert,
  network: Network,
  globe: Globe,
}
const SubIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = SUB_ICONS[name] ?? Users
  return <Icon className={className} strokeWidth={1.8} aria-hidden />
}

const INTRO: Record<SceneGroup, { who: CharId; pose: Pose; text: string }> = {
  daily: { who: 'tetsu', pose: 'greet', text: '旅行や毎日の暮らしで「すぐ使える」会話だワン。場面の種類を選んで、まず聞いて、次にロールプレイ！' },
  business: { who: 'sumi', pose: 'greet', text: '会議・電話・交渉…ビジネスの決まり文句は、丸ごと覚えると強いですよ。' },
  it: { who: 'sumi', pose: 'think', text: '朝会・コードレビュー・障害対応…IT の現場は短く正確に伝えるのがコツです。' },
  rail: { who: 'kinako', pose: 'cheer', text: '保線現場と鉄道ビジネスの英会話だ。安全に関わる交信は必ず復唱（repeat back）だぞ！' },
}

function load(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function save(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* noop */
  }
}

function initialGroup(): SceneGroup {
  const saved = load('scene-group') as SceneGroup | null
  if (saved && saved in GROUP_LABEL) return saved
  // 最初は、選んでいるコースのうち最初のものに合わせる
  const first = selectedCats(getSettings())[0]
  return CATEGORIES.find((c) => c.key === first)?.scene ?? 'daily'
}

/** グループごとに、最後に開いた小分類（なければ最初の小分類） */
function initialSub(group: SceneGroup): string {
  const subs = subsOf(group)
  const saved = load(`scene-sub-${group}`)
  return subs.find((s) => s.id === saved)?.id ?? subs[0].id
}

export default function Scenes() {
  const [group, setGroup] = useState<SceneGroup>(initialGroup)
  const [sub, setSub] = useState(() => initialSub(group))
  const all = scenesByGroup(group)
  const subs = subsOf(group)
  const current = subs.find((s) => s.id === sub) ?? subs[0]
  const list = all.filter((s) => s.sub === current.id)
  const intro = INTRO[group]
  return (
    <div>
      <PageHeader title="シーン会話" subtitle="場面ごとの表現を、聞いてロールプレイで使う" settings />
      <div className="space-y-4 px-4 pb-8">
        <Segmented
          value={group}
          onChange={(g) => {
            setGroup(g)
            setSub(initialSub(g))
            save('scene-group', g)
          }}
          options={(['daily', 'business', 'it', 'rail'] as SceneGroup[]).map((g) => ({ value: g, label: GROUP_LABEL[g] }))}
        />
        <Guide who={intro.who} pose={intro.pose} text={intro.text} />

        <div>
          <p className="mb-2 px-1 text-[12.5px] font-semibold text-muted">
            場面の種類 <span className="font-medium text-faint">（{all.length}場面）</span>
          </p>
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="場面の種類">
            {subs.map((x) => {
              const on = x.id === current.id
              const n = all.filter((s) => s.sub === x.id).length
              return (
                <button
                  key={x.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setSub(x.id)
                    save(`scene-sub-${group}`, x.id)
                  }}
                  className={cx(
                    'flex min-h-[56px] items-center gap-2.5 rounded-[14px] border px-3 py-2 text-left transition active:scale-[0.98]',
                    on ? 'border-ink bg-surface shadow-[inset_0_0_0_1px_var(--color-ink)]' : 'border-line bg-surface',
                  )}
                >
                  <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]', on ? 'bg-ink text-bg' : 'bg-brand-soft text-brand-strong')}>
                    <SubIcon name={x.icon} className="h-[19px] w-[19px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold leading-tight">{x.label}</span>
                    <span className="mt-0.5 block text-[11.5px] tabular-nums text-muted">{n}場面</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <section aria-label={current.label}>
          <div className="mb-2 px-1">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <SubIcon name={current.icon} className="h-[18px] w-[18px] text-brand-strong" />
              {current.label}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{current.desc}</p>
          </div>
          <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
            {list.map((s, k) => (
              <Link key={s.id} to={`/scenes/${s.id}`} viewTransition className={cx('flex items-center gap-3.5 py-3.5 pl-4 pr-3 active:bg-surface-2', k > 0 && 'hairline-t')}>
                <span className="w-6 shrink-0 text-[13px] font-medium tabular-nums text-faint">{String(k + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium leading-snug">{s.title}</p>
                  <p className="en text-[14px] italic leading-snug text-muted">{s.titleEn}</p>
                </div>
                <span className="shrink-0">
                  <LevelBadge lv={s.lv} />
                </span>
                <ChevronRight className="h-[18px] w-[18px] shrink-0 text-faint" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
