import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide, type CharId, type Pose } from '@/components/Guide'
import { Segmented } from '@/components/ui'
import { scenesByGroup } from '@/data/scenes'
import { CATEGORIES, LEVELS, type SceneGroup } from '@/lib/types'
import { getSettings, selectedCats } from '@/lib/settings'

const INTRO: Record<SceneGroup, { who: CharId; pose: Pose; text: string }> = {
  daily: { who: 'tetsu', pose: 'greet', text: '旅行や毎日の暮らしで「すぐ使える」会話だワン。まず聞いて、次にロールプレイ！' },
  business: { who: 'sumi', pose: 'greet', text: '会議・電話・交渉…ビジネスの決まり文句は、丸ごと覚えると強いですよ。' },
  it: { who: 'sumi', pose: 'think', text: '朝会・コードレビュー・障害対応…IT の現場は短く正確に伝えるのがコツです。' },
  rail: { who: 'kinako', pose: 'cheer', text: '保線現場と鉄道ビジネスの英会話だ。安全に関わる交信は必ず復唱（repeat back）だぞ！' },
}

const GROUP_LABEL: Record<SceneGroup, string> = { daily: '日常', business: 'ビジネス', it: 'IT', rail: '鉄道' }

function initialGroup(): SceneGroup {
  try {
    const saved = sessionStorage.getItem('scene-group') as SceneGroup | null
    if (saved) return saved
  } catch {
    /* noop */
  }
  // 最初は、選んでいるコースのうち最初のものに合わせる
  const first = selectedCats(getSettings())[0]
  return CATEGORIES.find((c) => c.key === first)?.scene ?? 'daily'
}

export default function Scenes() {
  const [group, setGroup] = useState<SceneGroup>(initialGroup)
  const list = scenesByGroup(group)
  const intro = INTRO[group]
  return (
    <div>
      <PageHeader title="シーン会話" subtitle="場面ごとの表現を、聞いてロールプレイで使う" settings />
      <div className="space-y-4 px-4">
        <Segmented
          value={group}
          onChange={(g) => {
            setGroup(g)
            try {
              sessionStorage.setItem('scene-group', g)
            } catch {
              /* noop */
            }
          }}
          options={(['daily', 'business', 'it', 'rail'] as SceneGroup[]).map((g) => ({ value: g, label: GROUP_LABEL[g] }))}
        />
        <Guide who={intro.who} pose={intro.pose} text={intro.text} />
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
          {list.map((s, k) => {
            const L = LEVELS.find((l) => l.lv === s.lv)!
            return (
              <Link key={s.id} to={`/scenes/${s.id}`} viewTransition className={`flex items-center gap-4 py-3.5 pl-4 pr-3 active:bg-surface-2 ${k > 0 ? 'hairline-t' : ''}`}>
                <span className="w-6 shrink-0 text-[13px] font-medium tabular-nums text-faint">{String(k + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{s.title}</p>
                  <p className="en truncate text-[14px] italic text-muted">{s.titleEn}</p>
                </div>
                <span className="shrink-0 rounded-md border border-line-strong px-1.5 py-px text-[10.5px] font-semibold text-muted">{L.cefr === 'ESP' ? '専門' : L.cefr}</span>
                <ChevronRight className="h-[18px] w-[18px] shrink-0 text-faint" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
