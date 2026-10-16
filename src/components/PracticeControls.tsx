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
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[12px] font-bold text-muted">出題範囲（複数選択可）</p>
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
        <p className="mb-1.5 text-[12px] font-bold text-muted">レベル（ここまで）</p>
        <Segmented
          value={String(level)}
          onChange={(v) => onLevel(Number(v))}
          options={[1, 2, 3, 4, 5, 6].map((l) => ({ value: String(l), label: `Lv${l}` }))}
        />
      </div>
    </div>
  )
}

export function SpeedPicker({ rate, onRate }: { rate: number; onRate: (r: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold text-muted">再生速度</p>
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
    </div>
  )
}
