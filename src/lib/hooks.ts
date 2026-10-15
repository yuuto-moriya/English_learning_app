import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db, getStreak, todayKey, type CardRow } from './db'
import { getHealth, type Health } from './api'

export function useCardsMap(): Map<string, CardRow> | undefined {
  const rows = useLiveQuery(() => db.cards.toArray(), [])
  if (!rows) return undefined
  return new Map(rows.map((r) => [r.id, r]))
}

export function useToday() {
  return useLiveQuery(() => db.daily.get(todayKey()), [])
}

export function useDueCount() {
  return useLiveQuery(async () => {
    const now = Date.now()
    const rows = await db.cards.where('due').belowOrEqual(now).toArray()
    return rows.filter((r) => !r.known).length
  }, [])
}

export function useStreak() {
  return useLiveQuery(() => getStreak(), [])
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
