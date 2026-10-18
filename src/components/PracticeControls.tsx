import type { Source } from '@/lib/sentences'
import { getSettings, selectedCats, useSettings } from '@/lib/settings'
import { Chip, Segmented, Toggle } from './ui'

/** 再生速度の表示（例：0.85×・1.0×）。すべての画面でこの形にそろえる */
export const formatRate = (r: number) => `${r.toFixed(2).replace(/0$/, '')}×`

export const SOURCES: { key: Source; label: string }[] = [
  { key: 'general', label: '一般' },
  { key: 'business', label: 'ビジネス' },
  { key: 'it', label: 'IT' },
  { key: 'rail', label: '鉄道' },
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
        options={[0.7, 0.85, 1, 1.15].map((r) => ({ value: String(r), label: formatRate(r) }))}
      />
    </div>
  )
}

/** 聞き取りの問題の声の設定（リスニングの画面と設定画面で同じ文言にする） */
export function VoiceVarietyToggles() {
  const vary = useSettings((s) => s.varyVoices)
  const mix = useSettings((s) => s.mixAccents)
  const set = useSettings((s) => s.set)
  return (
    <>
      <Toggle
        label="いろいろな声で聞く"
        desc="聞き取りの問題を、毎回ちがう話者の声で再生します。初めて聞く声でも聞き取れる力につながります"
        checked={vary}
        onChange={(v) => set({ varyVoices: v })}
      />
      <Toggle
        label="いろいろな国の英語で聞く"
        desc="アメリカ・イギリス・オーストラリア・インドなど、1問ごとに国の発音を変えます"
        checked={mix}
        onChange={(v) => set({ mixAccents: v })}
      />
    </>
  )
}
