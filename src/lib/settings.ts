import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category } from './types'

export type Theme = 'system' | 'light' | 'dark'

/** 学習のタイミング（実行意図：「いつ・どこで」を先に決めておく） */
export type PlanWhen = 'morning' | 'lunch' | 'evening' | 'night' | 'free'

/** 読み上げの方式。auto = 高品質音声（Azure）が使えればそれ、なければ端末の音声 */
export type VoiceEngine = 'auto' | 'device'

export interface Settings {
  theme: Theme
  /** 1日の新出語数 */
  dailyNew: number
  /** 1日の学習時間の目安（分） */
  dailyMinutes: number
  /** 学習するタイミング */
  planWhen: PlanWhen
  /** FSRSの目標記憶保持率 */
  retention: number
  /** 学習するコース（＝出題する単語のカテゴリ）。オンボーディングで選ぶ */
  studyCats: Record<Category, boolean>
  /** 新出語のレベル範囲（一般・ビジネス） */
  minLevel: number
  maxLevel: number
  /** 読み上げ速度 */
  rate: number
  voiceEngine: VoiceEngine
  voiceUS: string
  voiceUK: string
  /** 高品質音声（Azure ニューラル音声）の声 */
  neuralUS: string
  neuralUK: string
  /** リスニング練習で毎回ちがう声にする（話者の多様性） */
  varyVoices: boolean
  /** 自動で単語を読み上げる */
  autoPlay: boolean
  /** サーバーAPI（/api/*）へのアクセストークン（任意） */
  apiToken: string
  guide: boolean
  onboarded: boolean
}

const defaults: Settings = {
  theme: 'system',
  dailyNew: 10,
  dailyMinutes: 10,
  planWhen: 'free',
  retention: 0.9,
  studyCats: { general: true, business: false, rail: false },
  minLevel: 1,
  maxLevel: 3,
  rate: 0.95,
  voiceEngine: 'auto',
  voiceUS: '',
  voiceUK: '',
  neuralUS: 'en-US-AvaNeural',
  neuralUK: 'en-GB-SoniaNeural',
  varyVoices: true,
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
    {
      name: 'tetsu-settings',
      version: 3,
      migrate: (s, version) => {
        const prev = (s ?? {}) as Partial<Settings>
        const next = { ...defaults, ...prev } as Store
        // v2 以前に使っていた人は、これまでどおり3コースすべてを学習していた
        if (version < 3 && prev.onboarded && !prev.studyCats) next.studyCats = { general: true, business: true, rail: true }
        return next
      },
    },
  ),
)

export function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  // ステータスバー（Safari のツールバー）の色を背景色に合わせる
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1012' : '#f6f5f1')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* noop */
  }
}

export function getSettings(): Settings {
  return useSettings.getState()
}

/** 選んでいるコース（カテゴリ）。並びは 一般 → ビジネス → 保線 */
export function selectedCats(s: Pick<Settings, 'studyCats'>): Category[] {
  return (['general', 'business', 'rail'] as Category[]).filter((c) => s.studyCats[c])
}

export const PLAN_LABEL: Record<PlanWhen, string> = {
  morning: '朝の通勤・始業前',
  lunch: '昼休み',
  evening: '帰り道',
  night: '寝る前',
  free: 'すきま時間',
}
