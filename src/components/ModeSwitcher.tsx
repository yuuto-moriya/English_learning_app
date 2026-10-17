import { useEffect, useId, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useOtherDueCount } from '@/lib/hooks'
import { everyCat, MODE_LABEL, modeCaption, modeState, onlyCat, toggleCat, type StudyCats } from '@/lib/mode'
import { useSettings } from '@/lib/settings'
import { CATEGORIES, type Category } from '@/lib/types'
import { cx } from './ui'

/**
 * 学ぶモード（コース）の切り替え。
 * ふだんのタップは「そのモードだけ」への切り替えで、塗りつぶし＝いまのモード。「すべて」で全コース。
 * 「組み合わせる」を押すと、タップでコースを足したり外したりできる。色つき＋チェック＝含まれているコース。
 * 色だけに頼らないよう、状態は下の一文（読み上げにも届く）でも伝える。
 */
export function ModeSwitcher({ className }: { className?: string }) {
  const studyCats = useSettings((s) => s.studyCats)
  const set = useSettings((s) => s.set)
  const otherDue = useOtherDueCount() ?? 0
  const [editing, setEditing] = useState(false)
  // 最後の1つを外そうとしたときの案内
  const [hint, setHint] = useState(false)
  const captionId = useId()
  const m = modeState(studyCats)

  useEffect(() => {
    if (!hint) return
    const t = setTimeout(() => setHint(false), 2500)
    return () => clearTimeout(t)
  }, [hint])

  const apply = (next: StudyCats) => {
    set({ studyCats: next })
    setHint(false)
    try {
      sessionStorage.removeItem('scene-group')
    } catch {
      /* noop */
    }
  }
  const choose = (c: Category) => {
    if (!editing) return apply(onlyCat(c))
    const next = toggleCat(studyCats, c)
    if (next) apply(next)
    else setHint(true)
  }

  const caption = editing ? (hint ? '1つ以上選んでください' : '出題するコースをタップ（いくつでも）') : modeCaption(m)

  return (
    <div data-tour="mode" className={className} role="group" aria-label="学ぶモード" aria-describedby={captionId}>
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
        <Chip
          pressed={m.kind === 'all'}
          look={m.kind !== 'all' ? 'off' : editing ? 'included' : 'filled'}
          soft="bg-surface-2"
          dashed={editing}
          onClick={() => apply(everyCat())}
        >
          すべて
        </Chip>
        {CATEGORIES.map((c) => {
          const inc = studyCats[c.key]
          const filled = !editing && m.kind === 'single' && m.cat === c.key
          return (
            <Chip
              key={c.key}
              pressed={editing ? inc : filled}
              look={filled ? 'filled' : inc ? 'included' : 'off'}
              soft={c.soft}
              dashed={editing}
              onClick={() => choose(c.key)}
              icon={
                inc && !filled ? (
                  <Check className={cx('h-3 w-3', c.text)} strokeWidth={3.2} />
                ) : (
                  <span className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />
                )
              }
            >
              {MODE_LABEL[c.key]}
            </Chip>
          )
        })}
      </div>
      <div className="mt-1.5 flex items-center gap-2 pl-1">
        <div id={captionId} className="min-w-0 flex-1">
          <p aria-live="polite" className={cx('text-[12.5px] font-medium leading-snug', editing ? 'text-brand' : 'text-ink/80')}>{caption}</p>
          {!editing && otherDue > 0 && (
            <p className="text-[11.5px] leading-snug text-muted">ほかのコースの復習 {otherDue}語は止まっています</p>
          )}
        </div>
        <button
          onClick={() => {
            setEditing(!editing)
            setHint(false)
          }}
          className={cx(
            '-my-1 min-h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold transition active:scale-95',
            editing ? 'bg-ink text-bg' : 'text-brand active:bg-brand-soft',
          )}
        >
          {editing ? '完了' : m.kind === 'combo' ? '変更' : '組み合わせる'}
        </button>
      </div>
    </div>
  )
}

/** filled＝いまのモード、included＝含まれているコース、off＝選んでいない。dashed＝組み合わせ中（足せる） */
function Chip({
  pressed,
  look,
  soft,
  dashed,
  icon,
  onClick,
  children,
}: {
  pressed: boolean
  look: 'filled' | 'included' | 'off'
  soft: string
  dashed?: boolean
  icon?: ReactNode
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        'flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-[9px] text-[13px] font-semibold transition active:scale-95',
        look === 'filled' && 'border-ink bg-ink text-bg',
        look === 'included' && cx('border-transparent text-ink', soft),
        look === 'off' && cx('border-line-strong bg-surface text-muted', dashed && 'border-dashed'),
      )}
    >
      {icon && <span className="flex h-3 w-3 shrink-0 items-center justify-center">{icon}</span>}
      {children}
    </button>
  )
}
