import { getSettings } from './settings'

/** Cloudflare Pages Functions（/api/*）経由で Azure を呼ぶ。APIキーはサーバー側にのみ保存。 */

export interface Health {
  translator: boolean
  speech: boolean
  tokenRequired: boolean
}

let healthCache: { at: number; v: Health | null } | null = null

function headers(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { ...extra }
  const token = getSettings().apiToken
  if (token) h['X-App-Token'] = token
  return h
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function ensureOk(res: Response) {
  if (res.ok) return
  let msg = `${res.status}`
  try {
    const j = await res.json()
    msg = j.error ?? msg
  } catch {
    /* noop */
  }
  throw new ApiError(res.status, msg)
}

export async function getHealth(force = false): Promise<Health | null> {
  if (!force && healthCache && Date.now() - healthCache.at < 60_000) return healthCache.v
  try {
    const res = await fetch('/api/health', { headers: headers() })
    const ct = res.headers.get('content-type') ?? ''
    const v = res.ok && ct.includes('json') ? ((await res.json()) as Health) : null
    healthCache = { at: Date.now(), v }
    return v
  } catch {
    healthCache = { at: Date.now(), v: null }
    return null
  }
}

export interface TranslateResult {
  text: string
  detected?: string
}

export async function translate(text: string, to: 'en' | 'ja', from?: 'en' | 'ja'): Promise<TranslateResult> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ text, to, from }),
  })
  await ensureOk(res)
  return (await res.json()) as TranslateResult
}

export interface PronPhoneme {
  p: string
  score: number
}
export interface PronWord {
  word: string
  accuracy: number
  error: string
  phonemes: PronPhoneme[]
}
export interface PronResult {
  text: string
  pron: number
  accuracy: number
  fluency: number
  completeness: number
  prosody?: number
  words: PronWord[]
  engine: 'azure' | 'local'
}

export async function assessPronunciation(wav: Blob, reference: string, lang = 'en-US'): Promise<PronResult> {
  const q = new URLSearchParams({ ref: reference, lang })
  const res = await fetch(`/api/pronunciation?${q}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'audio/wav' }),
    body: wav,
  })
  await ensureOk(res)
  return { ...((await res.json()) as Omit<PronResult, 'engine'>), engine: 'azure' }
}

export async function transcribe(wav: Blob, lang: 'en-US' | 'ja-JP'): Promise<string> {
  const res = await fetch(`/api/stt?lang=${lang}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'audio/wav' }),
    body: wav,
  })
  await ensureOk(res)
  const j = (await res.json()) as { text: string }
  return j.text
}
