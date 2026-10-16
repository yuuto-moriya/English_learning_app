import { type ButtonHTMLAttributes, type ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Loader2, Volume2 } from 'lucide-react'
import { speak, stopSpeaking, type Accent, type SpeakOptions } from '@/lib/tts'
import { LEVELS, catMeta, type Category, type Level } from '@/lib/types'
import { splitMarked } from '@/lib/vocab'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** 面。区切りは影ではなく細い罫線で表す */
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-[18px] border border-line bg-surface p-4',
        onClick && 'cursor-pointer transition-transform duration-150 active:scale-[0.99]',
        className,
      )}
    >
      {children}
    </div>
  )
}

type BtnVariant = 'primary' | 'ink' | 'secondary' | 'outline' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  block,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; block?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-brand text-on-brand disabled:bg-surface-3 disabled:text-faint',
    ink: 'bg-ink text-bg disabled:bg-surface-3 disabled:text-faint',
    secondary: 'bg-surface-2 text-ink disabled:text-faint',
    outline: 'border border-line-strong bg-surface text-ink disabled:text-faint',
    ghost: 'bg-transparent text-ink disabled:text-faint',
    danger: 'bg-ng-soft text-ng disabled:opacity-50',
  }
  const sizes = {
    sm: 'min-h-9 rounded-[11px] px-3 text-[13px]',
    md: 'min-h-12 rounded-[14px] px-4 text-[15px]',
    lg: 'min-h-14 rounded-[16px] px-5 text-[16px]',
  }
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 font-semibold tracking-[-0.01em] transition duration-150 active:scale-[0.98] active:opacity-90 disabled:active:scale-100',
        sizes[size],
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
      aria-pressed={active}
      className={cx(
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition active:scale-95',
        active ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-surface text-muted',
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
  size = 'md',
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex rounded-[12px] bg-surface-2 p-[3px]" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-[9px] px-1.5 font-semibold transition duration-150',
            size === 'sm' ? 'min-h-8 text-[12px]' : 'min-h-9 text-[13px]',
            value === o.value ? 'bg-surface text-ink shadow-[0_1px_3px_rgb(0_0_0/0.1)] dark:bg-surface-3' : 'text-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({
  value,
  max,
  className,
  color = 'bg-brand',
}: {
  value: number
  max: number
  className?: string
  color?: string
}) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className={cx('h-1.5 overflow-hidden rounded-full bg-surface-3', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={cx('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

/**
 * 路線図のような進捗表示（駅＝区切り）。今日の目標の進み具合に使う。
 * 線路の保守に関わる利用者へのささやかな目配せで、数字だけより達成までの距離が見える。
 */
export function RouteProgress({ value, max, stops = 4, className }: { value: number; max: number; stops?: number; className?: string }) {
  const pct = max ? Math.min(1, value / max) : 0
  return (
    <div className={cx('relative h-3', className)} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-surface-3" />
      <div
        className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-brand transition-[width] duration-700 ease-out"
        style={{ width: `${pct * 100}%` }}
      />
      {Array.from({ length: stops + 1 }, (_, i) => {
        const at = i / stops
        const passed = pct >= at - 1e-6 && (pct > 0 || i === 0)
        return (
          <span
            key={i}
            className={cx(
              'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] transition-colors duration-500',
              passed ? 'border-brand bg-surface' : 'border-surface-3 bg-surface',
              i === stops && pct >= 1 && 'bg-brand',
            )}
            style={{ left: `${at * 100}%` }}
          />
        )
      })}
    </div>
  )
}

export function ProgressRing({
  value,
  max,
  size = 64,
  children,
  track = 'var(--surface-3)',
  stroke = 'var(--brand)',
  width = 6,
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

/** カテゴリ（コース）の印：色の点＋名前 */
export function CategoryBadge({ cat }: { cat: Category }) {
  const m = catMeta(cat)
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-[12px] font-semibold', m.text)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.short}
    </span>
  )
}

export function LevelBadge({ lv }: { lv: Level }) {
  const L = LEVELS.find((l) => l.lv === lv)!
  return (
    <span className="rounded-md border border-line-strong px-1.5 py-px text-[11px] font-semibold tabular-nums text-muted">
      {L.cefr === 'ESP' ? '専門' : L.cefr}
    </span>
  )
}

/** UK / US などの小さな文字ラベル（国旗の絵文字の代わり） */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-[5px] bg-surface-2 px-1.5 py-px text-[10.5px] font-bold tracking-wide text-muted', className)}>
      {children}
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
  voice,
}: {
  text: string
  accent?: Accent
  rate?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  voice?: SpeakOptions['voice']
}) {
  const [busy, setBusy] = useState(false)
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'
  useEffect(() => () => setBusy(false), [])
  return (
    <button
      aria-label={label ?? '読み上げ'}
      onClick={async (e) => {
        e.stopPropagation()
        if (busy) {
          stopSpeaking()
          return
        }
        setBusy(true)
        await speak(text, { accent, rate, voice })
        setBusy(false)
      }}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition active:scale-90',
        busy ? 'border-brand bg-brand-soft text-brand-strong' : 'border-line-strong bg-surface text-ink',
        label ? 'h-auto min-h-8 w-auto gap-1 px-3 py-1.5 text-[12px] font-semibold' : dim,
        className,
      )}
    >
      {busy ? (
        <Loader2 className={cx('animate-spin', size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />
      ) : (
        <Volume2 className={cx(size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-[15px] w-[15px]' : 'h-[18px] w-[18px]')} strokeWidth={1.9} />
      )}
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

/** セクションの見出し（小さく控えめに） */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('mb-2 mt-8 flex items-end justify-between px-1', className)}>
      <h2 className="text-[13px] font-semibold tracking-wide text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-[18px] border border-dashed border-line-strong p-6 text-center text-[13px] text-muted">{children}</div>
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-[15px]">{label}</span>
        {desc && <span className="mt-0.5 block text-[12px] leading-snug text-muted">{desc}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors', checked ? 'bg-ok' : 'bg-surface-3')}
      >
        <span
          className={cx(
            'absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/0.2)] transition-all duration-200',
            checked ? 'left-[22px]' : 'left-[2px]',
          )}
        />
      </button>
    </label>
  )
}

/** iOS の「グループ化されたリスト」 */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('overflow-hidden rounded-[18px] border border-line bg-surface', className)}>{children}</div>
}

export function ListRow({
  to,
  onClick,
  icon,
  title,
  sub,
  right,
  chevron = true,
  className,
}: {
  to?: string
  onClick?: () => void
  icon?: ReactNode
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
  chevron?: boolean
  className?: string
}) {
  const body = (
    <div className="flex min-h-[56px] items-center gap-3.5 pl-4">
      {icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink [&>svg]:h-[21px] [&>svg]:w-[21px] [&>svg]:stroke-[1.7]">{icon}</span>}
      <div className="flex min-w-0 flex-1 items-center gap-2 py-3 pr-3 [.list-row+.list-row_&]:hairline-t">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium leading-snug">{title}</div>
          {sub && <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{sub}</div>}
        </div>
        {right && <div className="shrink-0 text-[13px] text-muted">{right}</div>}
        {chevron && (to || onClick) && <ChevronRight className="h-[18px] w-[18px] shrink-0 text-faint" />}
      </div>
    </div>
  )
  const cls = cx('list-row block transition-colors active:bg-surface-2', className)
  if (to)
    return (
      <Link to={to} viewTransition className={cls}>
        {body}
      </Link>
    )
  if (onClick)
    return (
      <button onClick={onClick} className={cx(cls, 'w-full text-left')}>
        {body}
      </button>
    )
  return <div className={cx('list-row', className)}>{body}</div>
}

/** 大きな数字と小さな説明（統計） */
export function Metric({ value, unit, label, className }: { value: ReactNode; unit?: string; label: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-[13px] font-medium text-muted">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[12px] text-muted">{label}</p>
    </div>
  )
}

/** 画面下部に固定する操作バー（回答後の「次へ」など） */
export function BottomBar({ children, tone, className }: { children: ReactNode; tone?: 'ok' | 'ng'; className?: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div
        className={cx(
          'pointer-events-auto mx-auto max-w-xl rounded-t-[22px] border-t px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3.5 animate-sheet',
          tone === 'ok' ? 'border-ok/25 bg-ok-soft' : tone === 'ng' ? 'border-ng/25 bg-ng-soft' : 'glass border-line',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
