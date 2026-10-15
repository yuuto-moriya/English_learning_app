import type { PronResult } from './api'

/**
 * クラウド未設定時のフォールバック。
 * Safari（ブラウザ表示時）では webkitSpeechRecognition が使えるため、
 * 認識結果と目標文の単語一致率で簡易評価する。ホーム画面アプリでは利用できない。
 */
type RecCtor = new () => {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function ctor(): RecCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function localRecognitionAvailable(): boolean {
  return typeof window !== 'undefined' && !!ctor()
}

export interface LocalSession {
  stop: () => void
  result: Promise<string>
}

export function startLocalRecognition(lang = 'en-US'): LocalSession {
  const C = ctor()
  if (!C) throw new Error('この環境では音声認識を利用できません')
  const rec = new C()
  rec.lang = lang
  rec.interimResults = false
  rec.continuous = true
  rec.maxAlternatives = 1
  let text = ''
  const result = new Promise<string>((resolve, reject) => {
    rec.onresult = (e) => {
      const parts: string[] = []
      for (let i = 0; i < e.results.length; i++) parts.push(e.results[i][0].transcript)
      text = parts.join(' ')
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech') resolve('')
      else reject(new Error(e.error))
    }
    rec.onend = () => resolve(text)
  })
  rec.start()
  return { stop: () => rec.stop(), result }
}

export function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** 最長共通部分列で目標文の各単語が言えたかを判定 */
export function compareWords(reference: string, heard: string): PronResult {
  const ref = normalizeWords(reference)
  const hyp = normalizeWords(heard)
  const n = ref.length
  const m = hyp.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = ref[i] === hyp[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const matched = new Set<number>()
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (ref[i] === hyp[j]) {
      matched.add(i)
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  const words = ref.map((w, k) => ({
    word: w,
    accuracy: matched.has(k) ? 100 : 0,
    error: matched.has(k) ? 'None' : 'Omission',
    phonemes: [],
  }))
  const completeness = n ? Math.round((matched.size / n) * 100) : 0
  const extra = Math.max(0, m - matched.size)
  const accuracy = Math.max(0, Math.round(completeness - (extra / Math.max(1, n)) * 30))
  return {
    text: heard,
    pron: Math.round((accuracy + completeness) / 2),
    accuracy,
    fluency: completeness,
    completeness,
    words,
    engine: 'local',
  }
}
