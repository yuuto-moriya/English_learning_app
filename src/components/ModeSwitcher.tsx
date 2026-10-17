import { useState } from 'react'
import { Layers } from 'lucide-react'
import { useSettings } from '@/lib/settings'
import { ALL_CATS, CATEGORIES, type Category } from '@/lib/types'
import { cx } from './ui'

const MODE_LABEL: Record<Category, string> = { general: '一般', business: 'ビジネス', it: 'IT', rail: '鉄道' }

/** いま学んでいるモード（コース）の名前。例：「IT」「一般＋鉄道」 */
export function modeName(cats: Category[]): string {
  return cats.map((c) => MODE_LABEL[c]).join('＋')
}

/**
 * 学ぶモードの切り替え（一般・ビジネス・IT・鉄道）。
 * タップでそのモードだけに切り替える。「組み合わせ」をオンにすると、いくつでも同時に選べる。
 * 新しい単語・復習・練習の例文・シーンの最初のタブがモードに合わせて変わる。
 */
export function ModeSwitcher({ className }: { className?: string }) {
  const s = useSettings()
  // 「組み合わせ」は使うときだけオンにする（ふだんのタップは、そのモードへの切り替え）
  const [multi, setMulti] = useState(false)

  const choose = (c: Category) => {
    const on = s.studyCats[c]
    let next: Record<Category, boolean>
    if (multi) {
      next = { ...s.studyCats, [c]: !on }
      // すべて外すと学ぶ単語がなくなるので、最低1つは残す
      if (!ALL_CATS.some((k) => next[k])) return
    } else {
      next = { general: false, business: false, it: false, rail: false, [c]: true }
    }
    s.set({ studyCats: next })
    try {
      // シーンの最初のタブも新しいモードに合わせる
      sessionStorage.removeItem('scene-group')
    } catch {
      /* noop */
    }
  }

  return (
    <div data-tour="mode" className={cx('flex items-center gap-1.5', className)} role="group" aria-label="学ぶモード">
      {CATEGORIES.map((c) => {
        const on = s.studyCats[c.key]
        return (
          <button
            key={c.key}
            aria-pressed={on}
            onClick={() => choose(c.key)}
            className={cx(
              'flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition active:scale-95',
              on ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-surface text-muted',
            )}
          >
            <span className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />
            {MODE_LABEL[c.key]}
          </button>
        )
      })}
      <button
        aria-pressed={multi}
        aria-label="組み合わせて選ぶ"
        title="組み合わせて選ぶ"
        onClick={() => setMulti(!multi)}
        className={cx(
          'ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition active:scale-95',
          multi ? 'border-brand bg-brand-soft text-brand' : 'border-line-strong text-muted',
        )}
      >
        <Layers className="h-4 w-4" strokeWidth={1.9} />
      </button>
    </div>
  )
}
