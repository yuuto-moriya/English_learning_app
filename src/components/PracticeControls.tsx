import type { Source } from '@/lib/sentences'
import { Chip, Segmented } from './ui'

export const SOURCES: { key: Source; label: string }[] = [
  { key: 'general', label: '一般' },
  { key: 'business', label: 'ビジネス' },
  { key: 'rail', label: '保線' },
  { key: 'scene', label: '会話' },
]

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
    <div className="space-y-2">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
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
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <Chip key={l} active={level === l} onClick={() => onLevel(l)}>
            〜Lv{l}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function SpeedPicker({ rate, onRate }: { rate: number; onRate: (r: number) => void }) {
  return (
    <Segmented
      value={String(rate)}
      onChange={(v) => onRate(Number(v))}
      options={[
        { value: '0.7', label: '0.7x' },
        { value: '0.85', label: '0.85x' },
        { value: '1', label: '1.0x' },
        { value: '1.15', label: '1.15x' },
      ]}
    />
  )
}
