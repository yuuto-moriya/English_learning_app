import { type ButtonHTMLAttributes, type ReactNode, useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { speak, type Accent } from '@/lib/tts'
import { LEVELS, type Category, type Level } from '@/lib/types'
import { splitMarked } from '@/lib/vocab'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-[22px] bg-surface p-4 shadow-card ring-1 ring-ring',
        onClick && 'cursor-pointer transition-transform active:scale-[0.985]',
        className,
      )}
    >
      {children}
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'rail'

export function Button({
  variant = 'primary',
  className,
  children,
  block,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; block?: boolean }) {
  const styles: Record<BtnVariant, string> = {
    primary:
      'bg-brand-grad text-white shadow-glow [text-shadow:0_1px_1px_rgb(150_50_0/0.25)] disabled:bg-none disabled:bg-surface-3 disabled:text-muted disabled:shadow-none disabled:[text-shadow:none]',
    secondary: 'bg-surface-2 text-ink active:bg-surface-3 disabled:opacity-50',
    ghost: 'bg-transparent text-ink active:bg-surface-2 disabled:opacity-50',
    danger: 'bg-ng text-white disabled:opacity-50',
    rail: 'bg-rail text-white disabled:opacity-50',
  }
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[15px] font-bold transition active:scale-[0.97] disabled:active:scale-100',
        styles[variant],
        block && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition active:scale-95',
        active ? 'bg-ink text-bg shadow-sm' : 'bg-surface text-muted ring-1 ring-line',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-2xl bg-surface-2 p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-9 flex-1 rounded-xl px-1.5 py-2 text-[13px] font-bold transition',
            value === o.value ? 'bg-surface text-ink shadow-card' : 'text-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value, max, className, color = 'bg-brand-grad' }: { value: number; max: number; className?: string; color?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className={cx('h-2 overflow-hidden rounded-full bg-surface-3', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={cx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ProgressRing({
  value,
  max,
  size = 76,
  children,
  track = 'var(--surface-3)',
  stroke = 'var(--brand)',
  width = 8,
}: {
  value: number
  max: number
  size?: number
  children?: ReactNode
  track?: string
  stroke?: string
  width?: number
}) {
  const r = (size - width - 2) / 2
  const c = 2 * Math.PI * r
  const pct = max ? Math.min(1, value / max) : 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={width} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

const catStyle: Record<Category, string> = {
  general: 'bg-gen-soft text-gen',
  business: 'bg-biz-soft text-biz',
  rail: 'bg-rail-soft text-rail',
}
const catLabel: Record<Category, string> = { general: '一般', business: 'ビジネス', rail: '保線' }

export function CategoryBadge({ cat }: { cat: Category }) {
  return <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', catStyle[cat])}>{catLabel[cat]}</span>
}

export function LevelBadge({ lv }: { lv: Level }) {
  const L = LEVELS.find((l) => l.lv === lv)!
  return (
    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">
      Lv{lv} {L.cefr}
    </span>
  )
}

export function SpeakButton({
  text,
  accent = 'en-US',
  rate,
  label,
  size = 'md',
  className,
}: {
  text: string
  accent?: Accent
  rate?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'
  return (
    <button
      aria-label={label ?? '読み上げ'}
      onClick={async (e) => {
        e.stopPropagation()
        setBusy(true)
        await speak(text, { accent, rate })
        setBusy(false)
      }}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong transition active:scale-90',
        label ? 'h-auto min-h-8 w-auto gap-1 px-3 py-1.5 text-xs font-bold' : dim,
        className,
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} />}
      {label}
    </button>
  )
}

/** 例文の *target* をハイライト表示 */
export function Marked({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {splitMarked(text).map((p, i) => (p.hl ? <mark key={i} className="hl">{p.t}</mark> : <span key={i}>{p.t}</span>))}
    </span>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-7 flex items-center justify-between px-0.5">
      <h2 className="text-[17px] font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-[22px] border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="text-[15px]">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-[30px] w-[50px] shrink-0 rounded-full transition', checked ? 'bg-ok' : 'bg-surface-3')}
      >
        <span className={cx('absolute top-[2px] h-[26px] w-[26px] rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-[2px]')} />
      </button>
    </label>
  )
}
