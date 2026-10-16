import type { Source } from '@/lib/sentences'
import { getSettings, selectedCats } from '@/lib/settings'
import { Chip, Segmented } from './ui'

export const SOURCES: { key: Source; label: string }[] = [
  { key: 'general', label: '一般会話' },
  { key: 'business', label: 'ビジネス' },
  { key: 'rail', label: '保線' },
  { key: 'scene', label: 'シーン会話' },
]

/** 練習の出題範囲の既定：選んでいるコースの例文（＋必要ならシーン会話） */
export function defaultSources(withScene = true): Source[] {
  const cats: Source[] = selectedCats(getSettings())
  return withScene ? [...cats, 'scene'] : cats.length ? cats : ['general']
}

/** 練習のレベルの既定：新出語の上限レベル */
export const defaultLevel = () => Math.max(1, Math.min(6, getSettings().maxLevel))

export function SourcePicker({
  sources,
  onSources,
  level,
  onLevel,
}: {
  sources: Source[]
  onSources: (s: Source[]) => void
  level: number
  onLevel: (n: number) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[12px] font-medium text-muted">出題範囲（複数選べます）</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => {
            const on = sources.includes(s.key)
            return (
              <Chip
                key={s.key}
                active={on}
                onClick={() => {
                  const next = on ? sources.filter((x) => x !== s.key) : [...sources, s.key]
                  if (next.length) onSources(next)
                }}
              >
                {s.label}
              </Chip>
            )
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-medium text-muted">レベル（ここまで）</p>
        <Segmented
          size="sm"
          value={String(level)}
          onChange={(v) => onLevel(Number(v))}
          options={[
            { value: '1', label: 'A1' },
            { value: '2', label: 'A2' },
            { value: '3', label: 'B1' },
            { value: '4', label: 'B2' },
            { value: '5', label: 'C1' },
            { value: '6', label: '専門' },
          ]}
        />
      </div>
    </div>
  )
}

export function SpeedPicker({ rate, onRate }: { rate: number; onRate: (r: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-medium text-muted">再生速度</p>
      <Segmented
        size="sm"
        value={String(rate)}
        onChange={(v) => onRate(Number(v))}
        options={[
          { value: '0.7', label: '0.7×' },
          { value: '0.85', label: '0.85×' },
          { value: '1', label: '1.0×' },
          { value: '1.15', label: '1.15×' },
        ]}
      />
    </div>
  )
}
