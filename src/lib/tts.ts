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

interface Pending {
  u: SpeechSynthesisUtterance
  finish: (ok: boolean) => void
}

/** 再生中（または再生待ち）の発話。キャンセル時は false で確定させる */
let current: Pending | null = null

/**
 * 現在の発話を「キャンセル」として確定させる。
 * Safari は cancel() でも onend を発火させるため、cancel() より先に false で resolve しておく。
 */
function settleCurrent() {
  const p = current
  current = null
  p?.finish(false)
}

function say(u: SpeechSynthesisUtterance, est: number, onStart?: () => void): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!synth) return resolve(false)
    settleCurrent()
    synth.cancel()
    let settled = false
    let started = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (current?.u === u) current = null
      resolve(ok)
    }
    u.onstart = () => {
      started = true
      onStart?.()
    }
    u.onend = () => finish(true)
    u.onerror = () => finish(false)
    current = { u, finish }
    synth.speak(u)
    // iOSで onend が来ないまま止まるバグ対策：一定時間後に発話が終わっていれば確定させる。
    // 発話が始まっていた（onstart済み）なら最後まで読めたとみなし、始まらなかった場合は失敗扱い。
    // speaking のまま固まるケースもあるため、見積もりの3倍を上限に打ち切る。
    const deadline = Date.now() + est * 3 + 10000
    const check = () => {
      if (settled) return
      if (synth.speaking && Date.now() < deadline) timer = setTimeout(check, 2000)
      else finish(started)
    }
    timer = setTimeout(check, est + 4000)
  })
}

/**
 * 英文を読み上げる。
 * 戻り値: 最後まで読み上げた（onend）場合のみ true。エラー・キャンセル（別の speak / stopSpeaking）・
 * 発話が始まらずタイムアウトした場合は false。結果を使わない呼び出し側はそのまま無視してよい。
 */
export function speak(text: string, opts: SpeakOptions = {}): Promise<boolean> {
  if (!synth) return Promise.resolve(false)
  const s = getSettings()
  const accent = opts.accent ?? 'en-US'
  const t = plain(text)
  const u = new SpeechSynthesisUtterance(t)
  u.lang = accent
  const v = pickVoice(accent, accent === 'en-US' ? s.voiceUS : s.voiceUK)
  if (v) u.voice = v
  u.rate = opts.rate ?? s.rate
  u.pitch = 1
  const est = Math.max(3000, (t.length * 140) / (u.rate || 1))
  return say(u, est, opts.onStart)
}

export function speakJa(text: string, rate = 1): Promise<boolean> {
  if (!synth) return Promise.resolve(false)
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  const v = voices.find((x) => x.lang.replace('_', '-') === 'ja-JP')
  if (v) u.voice = v
  u.rate = rate
  const est = Math.max(3000, (text.length * 250) / (rate || 1))
  return say(u, est)
}

export function stopSpeaking() {
  settleCurrent()
  synth?.cancel()
}

export function isSpeaking(): boolean {
  return !!synth?.speaking
}
