import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'

/**
 * PWAの更新通知。
 * registerType: 'prompt' で、新しいサービスワーカーが待機状態になったらトーストを出し、
 * ユーザーが「更新」を押したときだけ切り替えてリロードする（学習中の自動リロードを防ぐ）。
 */
let needRefresh = false
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null
const listeners = new Set<() => void>()

function setNeedRefresh(v: boolean) {
  needRefresh = v
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const getSnapshot = () => needRefresh

let registered = false
/** 本番ビルドでのみサービスワーカーを登録する（main.tsx から1回だけ呼ぶ） */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || registered) return
  registered = true
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh: () => setNeedRefresh(true),
      })
    })
    .catch(() => {
      /* オフライン等で読み込めなくてもアプリは動かす */
    })
}

export function UpdateToast() {
  const show = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const { pathname } = useLocation()
  // 単語学習の最中は操作ボタンに重なるので出さない（終わってから表示）
  if (!show || pathname.startsWith('/study')) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 px-4">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-line bg-surface p-3 shadow-card animate-pop"
      >
        <p className="min-w-0 flex-1 text-[13px] font-semibold">アプリの新しいバージョンがあります</p>
        <button
          onClick={() => setNeedRefresh(false)}
          className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold text-muted"
        >
          あとで
        </button>
        <button
          onClick={() => {
            setNeedRefresh(false)
            void updateSW?.(true)
          }}
          className="shrink-0 rounded-lg bg-brand px-3 py-2 text-[13px] font-bold text-white active:bg-brand-strong"
        >
          更新
        </button>
      </div>
    </div>
  )
}
