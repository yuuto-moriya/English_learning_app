import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'
import { isFocusMode, useSessionActive } from '@/lib/routes'

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
  const session = useSessionActive()
  // 単語学習・練習の最中は操作ボタンに重なるので出さない（終わってから表示）
  if (!show || isFocusMode(pathname) || session) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),10px)+70px)] z-40 px-4">
      <div
        role="status"
        aria-live="polite"
        className="glass pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-[18px] border border-line p-2.5 pl-4 shadow-float animate-rise"
      >
        <p className="min-w-0 flex-1 text-[13px] font-medium">新しいバージョンがあります</p>
        <button
          onClick={() => setNeedRefresh(false)}
          className="shrink-0 rounded-[10px] px-3 py-2 text-[13px] font-medium text-muted"
        >
          あとで
        </button>
        <button
          onClick={() => {
            setNeedRefresh(false)
            void updateSW?.(true)
          }}
          className="shrink-0 rounded-[10px] bg-ink px-3.5 py-2 text-[13px] font-semibold text-bg"
        >
          更新
        </button>
      </div>
    </div>
  )
}
