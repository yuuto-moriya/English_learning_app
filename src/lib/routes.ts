import { useSyncExternalStore } from 'react'

/** 集中モード（タブバー・更新トーストを出さない）：単語学習セッション・初回設定・同時通訳 */
export const isFocusMode = (pathname: string) =>
  pathname.startsWith('/study') || pathname.startsWith('/welcome') || pathname.startsWith('/translate/live')

/**
 * 練習の1回分（リスニング・聞き分けなど）の最中も集中モードにする。
 * 画面の URL は変わらないので、練習の画面（SessionShell）が表示されている間だけ数える。
 */
let sessions = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function enterSession(): () => void {
  sessions++
  emit()
  return () => {
    sessions--
    emit()
  }
}

export function useSessionActive(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => sessions > 0,
    () => false,
  )
}
