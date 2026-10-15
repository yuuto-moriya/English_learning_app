import { AnimatePresence, motion } from 'motion/react'
import type { Pose } from '@/lib/guide'
import { useSettings } from '@/lib/settings'
import { cx } from './ui'

export const POSE_SRC: Record<Pose, string> = {
  greet: '/guide/tetsu-greet.webp',
  happy: '/guide/tetsu-happy.webp',
  celebrate: '/guide/tetsu-celebrate.webp',
  think: '/guide/tetsu-think.webp',
  cheer: '/guide/tetsu-cheer.webp',
  sleep: '/guide/tetsu-sleep.webp',
  safety: '/guide/tetsu-safety.webp',
  oops: '/guide/tetsu-oops.webp',
}

/** 案内役コーギー「テツ」と吹き出し */
export function Guide({
  pose,
  text,
  size = 88,
  className,
  compact,
}: {
  pose: Pose
  text: string
  size?: number
  className?: string
  compact?: boolean
}) {
  const enabled = useSettings((s) => s.guide)
  if (!enabled) return null
  return (
    <div className={cx('flex items-end gap-2', className)}>
      <AnimatePresence mode="wait">
        <motion.img
          key={pose}
          src={POSE_SRC[pose]}
          alt="テツ"
          width={size}
          height={size}
          initial={{ scale: 0.85, opacity: 0, y: 6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="shrink-0 select-none drop-shadow-sm"
          style={{ width: size, height: size }}
          draggable={false}
        />
      </AnimatePresence>
      <motion.div
        key={text}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className={cx(
          'relative mb-3 flex-1 rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-[14px] leading-relaxed shadow-card',
          compact && 'py-2 text-[13px]',
        )}
      >
        {text}
      </motion.div>
    </div>
  )
}
