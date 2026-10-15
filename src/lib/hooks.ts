import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { db, getStreak, todayKey, type CardRow } from './db'
import { getHealth, type Health } from './api'
import { useSettings } from './settings'

export function useCardsMap(): Map<string, CardRow> | undefined {
  const rows = useLiveQuery(() => db.cards.toArray(), [])
  if (!rows) return undefined
  return new Map(rows.map((r) => [r.id, r]))
}

/**
 * 現在時刻（60秒ごと＋アプリが前面に戻ったときに更新）。
 * ホーム画面アプリを開いたまま日付をまたいでも「今日」の数字が古いままにならないようにする。
 * 全コンポーネントで1つのタイマーを共有する。
 */
const NOW_INTERVAL = 60_000
let nowValue = Date.now()
const nowListeners = new Set<() => void>()
let nowTimer: ReturnType<typeof setInterval> | undefined

function refreshNow() {
  nowValue = Date.now()
  for (const l of nowListeners) l()
}

function onVisibility() {
  if (document.visibilityState === 'visible') refreshNow()
}

function subscribeNow(listener: () => void) {
  nowListeners.add(listener)
  if (nowListeners.size === 1) {
    nowTimer = setInterval(refreshNow, NOW_INTERVAL)
    document.addEventListener('visibilitychange', onVisibility)
  }
  return () => {
    nowListeners.delete(listener)
    if (nowListeners.size === 0) {
      clearInterval(nowTimer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}

function getNow() {
  // 購読者がいない間に古くなった値は、次に読まれたときに一度だけ更新する
  if (Date.now() - nowValue >= NOW_INTERVAL) nowValue = Date.now()
  return nowValue
}

export function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, getNow)
}

export function useToday() {
  const day = todayKey(new Date(useNow()))
  return useLiveQuery(() => db.daily.get(day), [day])
}

export function useDueCount() {
  const now = useNow()
  const cats = useSettings((s) => s.studyCats)
  return useLiveQuery(
    () =>
      db.cards
        .where('due')
        .belowOrEqual(now)
        .filter((r) => !r.known && !!cats[r.cat])
        .count(),
    [now, cats],
  )
}

export function useStreak() {
  const day = todayKey(new Date(useNow()))
  return useLiveQuery(() => getStreak(), [day])
}

export function useHealth() {
  const [h, setH] = useState<Health | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    getHealth().then((v) => alive && setH(v))
    return () => {
      alive = false
    }
  }, [])
  return h
}

export function useStandalone() {
  const [s] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true),
  )
  return s
}
