import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ALL_CATS, type Category } from './types'
import { isAccent, type Accent } from './accents'
import type { HfKind, HfPace } from './handsfree'

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
  /** 英語の発音（国・地域）。一般・ビジネス・IT の読み上げに使う */
  accent: Accent
  /** 鉄道（保線）の読み上げの発音。保線用語は EN 規格（英国表記）が基本なので既定はイギリス */
  railAccent: Accent
  /** 発音ごとの高品質音声（Azure ニューラル音声）の声 ID */
  neural: Partial<Record<Accent, string>>
  /** 発音ごとの端末の声（SpeechSynthesisVoice.name） */
  deviceVoice: Partial<Record<Accent, string>>
  /** 和訳・案内を読む端末の日本語の声（空なら品質の高い声を自動で） */
  deviceVoiceJa: string
  /** リスニング練習で毎回ちがう声にする（話者の多様性） */
  varyVoices: boolean
  /** リスニング練習でいろいろな国の英語を混ぜる */
  mixAccents: boolean
  /** 効果音（正解・不正解・録音の開始と終了など） */
  sounds: boolean
  /** 翻訳・同時通訳で、訳を自動で読み上げる */
  speakTranslation: boolean
  /** はじめての人向けの使い方ツアーを見終えた */
  tourDone: boolean
  /** 自動で単語を読み上げる */
  autoPlay: boolean
  /** サーバーAPI（/api/*）へのアクセストークン（任意） */
  apiToken: string
  /** ながら練習：時間（分）・内容・間の長さ・日本語の案内（前回の選択を覚えておく） */
  hfMinutes: number
  hfKinds: HfKind[]
  hfPace: HfPace
  hfCues: boolean
  guide: boolean
  onboarded: boolean
}

const defaults: Settings = {
  theme: 'system',
  dailyNew: 10,
  dailyMinutes: 10,
  planWhen: 'free',
  retention: 0.9,
  studyCats: { general: true, business: false, it: false, rail: false },
  minLevel: 1,
  maxLevel: 3,
  rate: 0.95,
  voiceEngine: 'auto',
  accent: 'en-US',
  railAccent: 'en-GB',
  neural: {},
  deviceVoice: {},
  deviceVoiceJa: '',
  varyVoices: true,
  mixAccents: false,
  sounds: true,
  speakTranslation: true,
  tourDone: false,
  autoPlay: true,
  apiToken: '',
  hfMinutes: 15,
  hfKinds: ['words', 'repeat', 'compose', 'dialogue'],
  hfPace: 'normal',
  hfCues: true,
  guide: true,
  onboarded: false,
}

/** 古い版の設定を今の形に直す（persist の migrate。テストからも使う） */
export function migrateSettings(s: unknown, version: number): Settings {
  const prev = (s ?? {}) as Partial<Settings> & { voiceUS?: string; voiceUK?: string; neuralUS?: string; neuralUK?: string }
  const next = { ...defaults, ...prev } as Settings & Record<string, unknown>
  // v2 以前に使っていた人は、これまでどおり3コースすべてを学習していた
  if (version < 3 && prev.onboarded && !prev.studyCats) next.studyCats = { general: true, business: true, it: false, rail: true }
  next.studyCats = { ...defaults.studyCats, ...next.studyCats }
  if (version < 4) {
    // v3 までの「米国・英国の声」を、発音ごとの声に移す
    next.neural = { 'en-US': prev.neuralUS || undefined, 'en-GB': prev.neuralUK || undefined }
    next.deviceVoice = { 'en-US': prev.voiceUS || undefined, 'en-GB': prev.voiceUK || undefined }
    for (const k of ['voiceUS', 'voiceUK', 'neuralUS', 'neuralUK']) delete next[k]
  }
  if (!isAccent(next.accent)) next.accent = defaults.accent
  if (!isAccent(next.railAccent)) next.railAccent = defaults.railAccent
  return next
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
      version: 4,
      migrate: (s, version) => migrateSettings(s, version) as Store,
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

/** 選んでいるコース（カテゴリ）。並びは 一般 → ビジネス → IT → 鉄道 */
export function selectedCats(s: Pick<Settings, 'studyCats'>): Category[] {
  return ALL_CATS.filter((c) => s.studyCats[c])
}

/** そのコースの読み上げの発音（鉄道は railAccent、それ以外は accent） */
export function accentFor(cat: Category | undefined, s: Pick<Settings, 'accent' | 'railAccent'> = getSettings()): Accent {
  return cat === 'rail' ? s.railAccent : s.accent
}

/** 1日の学習時間の目安の選択肢（分）。最大2時間 */
export const MINUTE_CHOICES = [5, 10, 15, 20, 30, 45, 60, 90, 120]

/**
 * 学習時間の目安から1日の新出語数を決める。FSRS（保持率90%）では、新出語1語につき
 * しばらくの間は1日あたり数回分の復習が積み上がるため、1分あたり約0.6語にしておく。
 * 長い時間を選んでも新出語は30語まで（それ以上は翌日以降の復習が増えすぎる）。残りの時間は復習と練習に使う。
 */
export const MAX_NEW_PER_DAY = 30
export const newPerDay = (minutes: number) => Math.min(MAX_NEW_PER_DAY, Math.max(3, Math.round(minutes * 0.6)))

/** 分を「15分」「1時間」「1時間30分」の形に */
export function formatMinutes(m: number): string {
  if (m < 60) return `${m}分`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}時間${r}分` : `${h}時間`
}

export const PLAN_LABEL: Record<PlanWhen, string> = {
  morning: '朝の通勤・始業前',
  lunch: '昼休み',
  evening: '帰り道',
  night: '寝る前',
  free: 'すきま時間',
}
