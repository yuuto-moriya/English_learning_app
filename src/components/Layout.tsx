import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BookOpen, ChevronLeft, Headphones, House, Languages, MessagesSquare, Settings } from 'lucide-react'
import { type ReactNode, Suspense, useEffect, useRef, useState } from 'react'
import { isFocusMode, useSessionActive } from '@/lib/routes'
import { cx } from './ui'
import { UpdateToast } from './UpdateToast'

const TABS = [
  { to: '/', label: 'ホーム', icon: House, end: true },
  { to: '/words', label: '単語', icon: BookOpen },
  { to: '/practice', label: '練習', icon: Headphones },
  { to: '/scenes', label: 'シーン', icon: MessagesSquare },
  { to: '/translate', label: '翻訳', icon: Languages },
]

export function Layout() {
  const { pathname } = useLocation()
  const session = useSessionActive()
  const focus = isFocusMode(pathname) || session
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className={cx('flex-1', focus ? 'pb-safe' : 'pb-[calc(92px+env(safe-area-inset-bottom))]')}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <UpdateToast />
      {!focus && <TabBar />}
    </div>
  )
}

/** 浮かぶすりガラスのタブバー */
function TabBar() {
  return (
    <nav
      aria-label="メインメニュー"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(env(safe-area-inset-bottom),10px)]"
    >
      {/* view-transition-name は親に付けると backdrop-filter が効かなくなる（親が Backdrop Root になる）ので、ガラス自身に付ける */}
      <div className="vt-tabbar glass pointer-events-auto mx-auto grid max-w-md grid-cols-5 rounded-[28px] border border-line p-1 shadow-float">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            viewTransition
            data-tour={`tab-${to === '/' ? 'home' : to.slice(1)}`}
            className={({ isActive }) =>
              cx(
                'flex min-h-[52px] flex-col items-center justify-center gap-[3px] rounded-[24px] text-[10px] font-semibold tracking-wide transition-colors duration-200',
                isActive ? 'bg-ink/[0.07] text-ink dark:bg-white/[0.09]' : 'text-muted active:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.1 : 1.7} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export const iconBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition active:scale-95'

/** iOS風の大見出しヘッダー（スクロールすると上部バーに小さく表示） */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  back,
  right,
  settings,
}: {
  title: ReactNode
  subtitle?: ReactNode
  /** 見出しの上の小さな文字（日付など） */
  eyebrow?: ReactNode
  back?: boolean | string
  right?: ReactNode
  settings?: boolean
}) {
  const nav = useNavigate()
  const [compact, setCompact] = useState(false)
  const titleRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-56px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <>
      <header className="sticky top-0 z-20 px-4 pt-safe">
        <div
          className={cx(
            'glass absolute inset-0 -z-10 transition-opacity duration-200 hairline-b',
            compact ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div className="flex h-12 items-center gap-2">
          <div className="flex w-[84px] items-center">
            {back && (
              <button
                onClick={() => {
                  // 直接開いた（履歴がない）場合は指定先かホームへ
                  if (typeof back === 'string') nav(back, { viewTransition: true })
                  else if (window.history.state?.idx > 0) nav(-1)
                  else nav('/')
                }}
                className={cx(iconBtn, '-ml-0.5')}
                aria-label="戻る"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
          </div>
          <p
            aria-hidden={!compact}
            className={cx(
              'min-w-0 flex-1 truncate text-center text-[15px] font-semibold transition-opacity duration-200',
              compact ? 'opacity-100' : 'opacity-0',
            )}
          >
            {title}
          </p>
          <div className="flex w-[84px] items-center justify-end gap-2">
            {right}
            {settings && (
              <NavLink to="/settings" viewTransition aria-label="設定" data-tour="settings" className={cx(iconBtn, 'text-muted')}>
                <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <div ref={titleRef} className={cx('px-5', title || subtitle ? 'pb-4 pt-1' : 'pb-1')}>
        {eyebrow && <p className="mb-1 text-[13px] font-medium text-muted">{eyebrow}</p>}
        {title && (
          <h1
            className={cx(
              'font-bold leading-[1.15] tracking-[-0.02em]',
              typeof title === 'string' && title.length > 11 ? 'text-[24px]' : 'text-[30px]',
            )}
          >
            {title}
          </h1>
        )}
        {subtitle && <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
    </>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-3 p-4 pt-[calc(4rem+env(safe-area-inset-top))]" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-surface-2" />
      <div className="h-32 animate-pulse rounded-[18px] bg-surface-2" />
      <div className="h-20 animate-pulse rounded-[18px] bg-surface-2" />
      <div className="h-20 animate-pulse rounded-[18px] bg-surface-2" />
    </div>
  )
}
