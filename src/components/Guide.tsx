import { CHARACTERS, charSrc, type CharId, type Pose } from '@/lib/characters'
import { useSettings } from '@/lib/settings'
import { cx } from './ui'

export type { CharId, Pose }

/** キャラクター画像（3Dレンダリング） */
export function CharImage({
  who = 'tetsu',
  pose,
  size = 88,
  className,
  float,
}: {
  who?: CharId
  pose: Pose
  size?: number
  className?: string
  float?: boolean
}) {
  // key でポーズが変わるたびに作り直し、CSS アニメーションで出し直す（動きのライブラリは使わない）
  return (
    <img
      key={`${who}-${pose}`}
      src={charSrc(who, pose)}
      alt={CHARACTERS[who].name}
      width={size}
      height={size}
      decoding="async"
      className={cx(
        'shrink-0 select-none drop-shadow-[0_6px_10px_rgb(16_24_40/0.12)]',
        float ? 'animate-[char-in_0.35s_cubic-bezier(.2,1.4,.4,1)_both,float_3.2s_ease-in-out_0.4s_infinite]' : 'animate-[char-in_0.35s_cubic-bezier(.2,1.4,.4,1)_both]',
        className,
      )}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

/** キャラクターと吹き出し（既定は案内役テツ） */
export function Guide({
  who = 'tetsu',
  pose,
  text,
  size = 88,
  className,
  compact,
}: {
  who?: CharId
  pose: Pose
  text: string
  size?: number
  className?: string
  compact?: boolean
}) {
  const enabled = useSettings((s) => s.guide)
  if (!enabled) return null
  const c = CHARACTERS[who]
  return (
    <div className={cx('flex items-end gap-1.5', className)}>
      <CharImage who={who} pose={pose} size={size} />
      <div
        key={text}
        className={cx(
          'relative mb-3 flex-1 animate-[bubble-in_0.25s_ease-out_both] rounded-[20px] rounded-bl-md bg-surface px-3.5 py-2.5 shadow-card ring-1 ring-ring',
          compact && 'py-2',
        )}
      >
        {!compact && <p className={cx('text-[11px] font-extrabold', c.tint)}>{c.name}</p>}
        <p className={cx('leading-relaxed', compact ? 'text-[13px]' : 'text-[14px]')}>{text}</p>
      </div>
    </div>
  )
}
