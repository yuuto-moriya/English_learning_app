import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  theme: Theme
  /** 1日の新出語数 */
  dailyNew: number
  /** FSRSの目標記憶保持率 */
  retention: number
  /** 学習対象カテゴリ */
  studyCats: { general: boolean; business: boolean; rail: boolean }
  /** 新出語の最大レベル（これ以下から出題） */
  maxLevel: number
  /** 読み上げ速度 */
  rate: number
  voiceUS: string
  voiceUK: string
  /** 自動で単語を読み上げる */
  autoPlay: boolean
  /** Cloudflare Functions へのアクセストークン（任意） */
  apiToken: string
  guide: boolean
  onboarded: boolean
}

const defaults: Settings = {
  theme: 'system',
  dailyNew: 10,
  retention: 0.9,
  studyCats: { general: true, business: true, rail: true },
  maxLevel: 3,
  rate: 0.95,
  voiceUS: '',
  voiceUK: '',
  autoPlay: true,
  apiToken: '',
  guide: true,
  onboarded: false,
}

interface Store extends Settings {
  set: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettings = create<Store>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      reset: () => set(defaults),
    }),
    { name: 'tetsu-settings', version: 1 },
  ),
)

export function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* noop */
  }
}

export function getSettings(): Settings {
  return useSettings.getState()
}
