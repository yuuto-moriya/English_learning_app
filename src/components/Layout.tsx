import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BookOpen, ChevronLeft, Headphones, Home, Languages, MessagesSquare, Settings } from 'lucide-react'
import { type ReactNode, Suspense, useEffect, useRef, useState } from 'react'
import { isFocusMode } from '@/lib/routes'
import { cx } from './ui'
import { UpdateToast } from './UpdateToast'

const TABS = [
  { to: '/', label: 'ホーム', icon: Home, end: true },
  { to: '/words', label: '単語', icon: BookOpen },
  { to: '/practice', label: '練習', icon: Headphones },
  { to: '/scenes', label: 'シーン', icon: MessagesSquare },
  { to: '/translate', label: '翻訳', icon: Languages },
]

export function Layout() {
  const { pathname } = useLocation()
  const focus = isFocusMode(pathname)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className={cx('flex-1', focus ? 'pb-safe' : 'pb-[calc(96px+env(safe-area-inset-bottom))]')}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <UpdateToast />
      {!focus && <TabBar />}
    </div>
  )
}

function TabBar() {
  return (
    <nav
      aria-label="メインメニュー"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 gap-0.5 rounded-[26px] bg-surface/92 p-1.5 shadow-float ring-1 ring-ring backdrop-blur-xl backdrop-saturate-150">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-0.5 rounded-[20px] py-1.5 text-[10.5px] font-bold transition active:scale-95',
                isActive ? 'bg-brand-soft text-brand-strong' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cx('h-[22px] w-[22px]', isActive ? 'stroke-[2.4]' : 'stroke-[1.9]')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** iOS風の大見出しヘッダー */
export function PageHeader({
  title,
  subtitle,
  back,
  right,
  settings,
}: {
  title: ReactNode
  subtitle?: ReactNode
  back?: boolean | string
  right?: ReactNode
  settings?: boolean
}) {
  const nav = useNavigate()
  // 大見出しはスクロールで流し、見えなくなったら上部バーに小さく表示する（iOS の大見出しと同じ動き）
  const [compact, setCompact] = useState(false)
  const titleRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-60px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const iconBtn = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-card ring-1 ring-ring active:scale-95'
  return (
    <>
      <header className="sticky top-0 z-20 px-4 pt-safe">
        <div
          className={cx(
            'absolute inset-0 -z-10 transition-opacity duration-200',
            'bg-bg/92 shadow-[0_1px_0_var(--border)] backdrop-blur-xl backdrop-saturate-150',
            compact ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div className="flex h-12 items-center gap-2">
          <div className="flex w-[88px] items-center">
            {back && (
              <button
                onClick={() => {
                  // 直接開いた（履歴がない）場合は指定先かホームへ
                  if (typeof back === 'string') nav(back)
                  else if (window.history.state?.idx > 0) nav(-1)
                  else nav('/')
                }}
                className={cx(iconBtn, '-ml-1 text-ink')}
                aria-label="戻る"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>
          <p
            aria-hidden={!compact}
            className={cx(
              'min-w-0 flex-1 truncate text-center text-[15px] font-extrabold transition-opacity duration-200',
              compact ? 'opacity-100' : 'opacity-0',
            )}
          >
            {title}
          </p>
          <div className="flex w-[88px] items-center justify-end gap-2">
            {right}
            {settings && (
              <NavLink to="/settings" aria-label="設定" className={cx(iconBtn, 'text-muted')}>
                <Settings className="h-[18px] w-[18px]" />
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <div ref={titleRef} className={cx('px-4', title || subtitle ? 'pb-3 pt-0.5' : 'pb-1')}>
        {title && (
          <h1
            className={cx(
              'font-extrabold leading-tight tracking-tight',
              typeof title === 'string' && title.length > 11 ? 'text-[23px]' : 'text-[30px]',
            )}
          >
            {title}
          </h1>
        )}
        {subtitle && <p className="mt-0.5 text-[13px] font-medium text-muted">{subtitle}</p>}
      </div>
    </>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-3 p-4 pt-[calc(4rem+env(safe-area-inset-top))]" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-surface-2" />
      <div className="h-28 animate-pulse rounded-[22px] bg-surface-2" />
      <div className="h-20 animate-pulse rounded-[22px] bg-surface-2" />
      <div className="h-20 animate-pulse rounded-[22px] bg-surface-2" />
    </div>
  )
}
