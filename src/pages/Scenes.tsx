import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide, type CharId, type Pose } from '@/components/Guide'
import { Card, Segmented } from '@/components/ui'
import { scenesByGroup } from '@/data/scenes'
import { LEVELS, type SceneGroup } from '@/lib/types'

const INTRO: Record<SceneGroup, { who: CharId; pose: Pose; text: string }> = {
  daily: { who: 'tetsu', pose: 'greet', text: '旅行や日常で「すぐ使える」会話だワン。まずは聞いて、次にロールプレイ！' },
  business: { who: 'sumi', pose: 'greet', text: '会議・電話・交渉…ビジネスの決まり文句は、丸ごと覚えると強いですよ。' },
  rail: { who: 'kinako', pose: 'cheer', text: '保線現場と鉄道ビジネスの英会話だ。安全に関わる交信は必ず復唱（repeat back）だぞ！' },
}

const TINT: Record<SceneGroup, string> = {
  daily: 'bg-gen-soft',
  business: 'bg-biz-soft',
  rail: 'bg-rail-soft',
}

export default function Scenes() {
  const [group, setGroup] = useState<SceneGroup>(() => {
    try {
      return (sessionStorage.getItem('scene-group') as SceneGroup) || 'daily'
    } catch {
      return 'daily'
    }
  })
  const list = scenesByGroup(group)
  const intro = INTRO[group]
  return (
    <div>
      <PageHeader title="シーン会話" subtitle="場面ごとに表現をまとめて練習" settings />
      <div className="space-y-3 px-4">
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
          options={[
            { value: 'daily', label: '日常会話' },
            { value: 'business', label: 'ビジネス' },
            { value: 'rail', label: '保線・鉄道' },
          ]}
        />
        <Guide who={intro.who} pose={intro.pose} text={intro.text} size={80} />
        <div className="space-y-2.5">
          {list.map((s) => {
            const L = LEVELS.find((l) => l.lv === s.lv)!
            return (
              <Link key={s.id} to={`/scenes/${s.id}`} className="block">
                <Card className="flex items-center gap-3.5 transition-transform active:scale-[0.98]">
                  <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-[26px] ${TINT[group]}`}>{s.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[15px] font-extrabold">{s.title}</p>
                      <span className="shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">{L.cefr}</span>
                    </div>
                    <p className="truncate text-[12px] font-medium text-muted">{s.titleEn}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted">{s.goal}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
