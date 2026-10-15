import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Card, Segmented } from '@/components/ui'
import { scenesByGroup } from '@/data/scenes'
import { LEVELS, type SceneGroup } from '@/lib/types'

const INTRO: Record<SceneGroup, { pose: 'greet' | 'happy' | 'safety'; text: string }> = {
  daily: { pose: 'greet', text: '旅行や日常で「すぐ使える」会話だワン。まずは聞いて、次にロールプレイ！' },
  business: { pose: 'happy', text: '会議・電話・交渉…ビジネスの決まり文句は丸ごと覚えると強いワン。' },
  rail: { pose: 'safety', text: '保線現場と鉄道ビジネスの英会話だワン。安全に関わる交信は必ず復唱（repeat back）！' },
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
        <Guide pose={intro.pose} text={intro.text} size={76} />
        <div className="space-y-2">
          {list.map((s) => {
            const L = LEVELS.find((l) => l.lv === s.lv)!
            return (
              <Link key={s.id} to={`/scenes/${s.id}`} className="block">
                <Card className="flex items-center gap-3 active:scale-[0.99] transition-transform">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl">{s.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{s.title}</p>
                    <p className="truncate text-[12px] text-muted">{s.titleEn}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">🎯 {s.goal}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">
                      {L.cefr}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
