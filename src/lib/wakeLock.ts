import { useEffect, useRef } from 'react'

type Sentinel = { release: () => Promise<void> }
type WakeNav = Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }

/** この端末で「画面を消さない」が使えるか（iOS 16.4 以降の Safari など） */
export const wakeLockSupported = () => typeof navigator !== 'undefined' && !!(navigator as WakeNav).wakeLock

/** active の間は画面を消さない（対応ブラウザのみ）。アプリに戻ったら取り直す */
export function useWakeLock(active: boolean) {
  const lock = useRef<Sentinel | null>(null)
  useEffect(() => {
    const nav = navigator as WakeNav
    const acquire = () => {
      if (!active || !nav.wakeLock || document.visibilityState !== 'visible') return
      nav.wakeLock
        .request('screen')
        .then((l) => (lock.current = l))
        .catch(() => undefined)
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      void lock.current?.release().catch(() => undefined)
      lock.current = null
    }
  }, [active])
}
