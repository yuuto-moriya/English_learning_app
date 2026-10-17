import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { db, getStreak, shiftDay, todayKey, type CardRow, type DailyRow } from './db'
import { getHealth, type Health } from './api'
import { useSettings } from './settings'
import { ALL_CATS } from './types'

export function useCardsMap(): Map<string, CardRow> | undefined {
  const rows = useLiveQuery(() => db.cards.toArray(), [])
  // 描画のたびに Map を作り直すと、これを依存にした絞り込み（単語帳の数千語）が毎回やり直しになる
  return useMemo(() => (rows ? new Map(rows.map((r) => [r.id, r])) : undefined), [rows])
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

/** 選んでいないコースで、復習の時期が来た単語の数（そのコースの復習は止まっている） */
export function useOtherDueCount() {
  const now = useNow()
  const cats = useSettings((s) => s.studyCats)
  return useLiveQuery(
    () =>
      ALL_CATS.every((c) => cats[c])
        ? 0
        : db.cards
            .where('due')
            .belowOrEqual(now)
            .filter((r) => !r.known && !cats[r.cat])
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

/** 直近 n 日の学習記録（古い順。記録のない日は undefined） */
export function useRecentDays(n: number): { date: string; row?: DailyRow }[] | undefined {
  const today = todayKey(new Date(useNow()))
  const from = shiftDay(today, -(n - 1))
  const rows = useLiveQuery(() => db.daily.where('date').between(from, today, true, true).toArray(), [from, today])
  if (!rows) return undefined
  const map = new Map(rows.map((r) => [r.date, r]))
  return Array.from({ length: n }, (_, i) => {
    const date = shiftDay(from, i)
    return { date, row: map.get(date) }
  })
}

/** 保存（★）した単語の ID */
export function useMarks(): Set<string> | undefined {
  const rows = useLiveQuery(() => db.marks.toArray(), [])
  return useMemo(() => (rows ? new Set(rows.map((r) => r.id)) : undefined), [rows])
}

/** active のあいだ画面を消さない（対応ブラウザのみ）。アプリに戻ったら取り直す */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    type Lock = { release: () => Promise<void> }
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Lock> } }
    let lock: Lock | null = null
    const acquire = () => {
      if (!active || !nav.wakeLock || document.visibilityState !== 'visible') return
      nav.wakeLock
        .request('screen')
        .then((l) => (lock = l))
        .catch(() => undefined)
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release().catch(() => undefined)
    }
  }, [active])
}
