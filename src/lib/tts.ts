import { plain } from './vocab'
import { getSettings } from './settings'

/**
 * 端末内蔵の音声合成（Web Speech API / iOSのSiri音声エンジン）で読み上げる。
 * 無料・オフラインで動作し、米音(en-US)と英音(en-GB)を切り替えられる。
 */
export type Accent = 'en-US' | 'en-GB'

const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' ? window.speechSynthesis : undefined
let voices: SpeechSynthesisVoice[] = []

function refreshVoices() {
  if (!synth) return
  voices = synth.getVoices()
}
if (synth) {
  refreshVoices()
  synth.addEventListener?.('voiceschanged', refreshVoices)
}

export const ttsAvailable = !!synth

export function listVoices(accent: Accent): SpeechSynthesisVoice[] {
  refreshVoices()
  const want = accent.toLowerCase()
  return voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === want)
}

const PREFERRED: Record<Accent, string[]> = {
  'en-US': ['Samantha', 'Ava', 'Allison', 'Susan', 'Alex', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny'],
  'en-GB': ['Daniel', 'Serena', 'Kate', 'Arthur', 'Google UK English Female', 'Microsoft Sonia', 'Microsoft Libby'],
}

export function pickVoice(accent: Accent, preferred?: string): SpeechSynthesisVoice | undefined {
  const list = listVoices(accent)
  if (preferred) {
    const v = list.find((x) => x.name === preferred)
    if (v) return v
  }
  // 高品質（Enhanced/Premium）を優先
  const premium = list.find((v) => /premium|enhanced|natural/i.test(v.name))
  if (premium) return premium
  for (const name of PREFERRED[accent]) {
    const v = list.find((x) => x.name.startsWith(name))
    if (v) return v
  }
  return list[0]
}

export interface SpeakOptions {
  accent?: Accent
  rate?: number
  onStart?: () => void
}

let current: SpeechSynthesisUtterance | null = null

export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!synth) return resolve()
    const s = getSettings()
    const accent = opts.accent ?? 'en-US'
    synth.cancel()
    const u = new SpeechSynthesisUtterance(plain(text))
    u.lang = accent
    const v = pickVoice(accent, accent === 'en-US' ? s.voiceUS : s.voiceUK)
    if (v) u.voice = v
    u.rate = opts.rate ?? s.rate
    u.pitch = 1
    u.onstart = () => opts.onStart?.()
    const done = () => {
      if (current === u) current = null
      resolve()
    }
    u.onend = done
    u.onerror = done
    current = u
    synth.speak(u)
    // iOSで長時間停止するバグ対策：念のためのタイムアウト
    const est = Math.max(3000, plain(text).length * 140 / (u.rate || 1))
    setTimeout(() => {
      if (current === u && !synth.speaking) done()
    }, est + 4000)
  })
}

export function speakJa(text: string, rate = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!synth) return resolve()
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    const v = voices.find((x) => x.lang.replace('_', '-') === 'ja-JP')
    if (v) u.voice = v
    u.rate = rate
    u.onend = () => resolve()
    u.onerror = () => resolve()
    synth.speak(u)
  })
}

export function stopSpeaking() {
  synth?.cancel()
  current = null
}

export function isSpeaking(): boolean {
  return !!synth?.speaking
}
