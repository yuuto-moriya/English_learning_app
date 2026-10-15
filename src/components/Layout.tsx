import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BookOpen, ChevronLeft, Headphones, Home, Languages, MessagesSquare, Settings } from 'lucide-react'
import { type ReactNode, Suspense, useEffect } from 'react'
import { cx } from './ui'

const TABS = [
  { to: '/', label: 'ホーム', icon: Home, end: true },
  { to: '/words', label: '単語', icon: BookOpen },
  { to: '/practice', label: '練習', icon: Headphones },
  { to: '/scenes', label: 'シーン', icon: MessagesSquare },
  { to: '/translate', label: '翻訳', icon: Languages },
]

export function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className="flex-1 pb-[calc(76px+env(safe-area-inset-bottom))]">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
    </div>
  )
}

function TabBar() {
  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/85 backdrop-blur-xl pb-safe"
    >
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10.5px] font-semibold transition',
                isActive ? 'text-brand' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cx('h-6 w-6', isActive && 'stroke-[2.4]')} />
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
  return (
    <header className="sticky top-0 z-20 bg-bg/85 px-4 pt-safe backdrop-blur-xl">
      <div className="flex h-11 items-center justify-between">
        {back ? (
          <button
            onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
            className="-ml-2 flex items-center text-[16px] font-medium text-brand"
            aria-label="戻る"
          >
            <ChevronLeft className="h-6 w-6" />
            戻る
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1">
          {right}
          {settings && (
            <NavLink to="/settings" aria-label="設定" className="rounded-full p-2 text-muted active:bg-surface-2">
              <Settings className="h-5 w-5" />
            </NavLink>
          )}
        </div>
      </div>
      <div className="pb-2">
        <h1
          className={cx(
            'font-extrabold leading-tight tracking-tight',
            typeof title === 'string' && title.length > 11 ? 'text-[22px]' : 'text-[28px]',
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
    </header>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-3 p-4 pt-16" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-28 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-20 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-20 animate-pulse rounded-2xl bg-surface-2" />
    </div>
  )
}
