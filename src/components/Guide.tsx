import { CHARACTERS, charSrc, type CharId, type Pose } from '@/lib/characters'
import { useSettings } from '@/lib/settings'
import { cx } from './ui'

export type { CharId, Pose }

/** キャラクター画像（Blender のぬいぐるみ風3Dモデルのレンダリング） */
export function CharImage({
  who = 'tetsu',
  pose,
  size = 88,
  className,
}: {
  who?: CharId
  pose: Pose
  size?: number
  className?: string
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
      className={cx('shrink-0 select-none animate-[char-in_0.35s_cubic-bezier(.2,1.2,.4,1)_both]', className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

/** キャラクターのひとこと（既定は案内役テツ）。設定で非表示にできる */
export function Guide({
  who = 'tetsu',
  pose,
  text,
  size = 56,
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
    <div className={cx('flex items-end gap-2', className)}>
      <CharImage who={who} pose={pose} size={size} className="-mb-1" />
      <div
        key={text}
        className={cx(
          'min-w-0 flex-1 animate-rise rounded-[16px] rounded-bl-[6px] bg-surface-2 px-3.5',
          compact ? 'py-2' : 'py-2.5',
        )}
      >
        {!compact && <p className={cx('text-[11.5px] font-semibold', c.tint)}>{c.name}</p>}
        <p className={cx('leading-relaxed', compact ? 'text-[13px]' : 'text-[14px]')}>{text}</p>
      </div>
    </div>
  )
}
