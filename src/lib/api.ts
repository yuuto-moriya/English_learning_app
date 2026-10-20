import { getSettings } from './settings'

/** Vercel Functions（/api/*）経由で Azure を呼ぶ。APIキーはサーバー側にのみ保存。 */

export interface Health {
  translator: boolean
  speech: boolean
  /** 高品質音声（Azure ニューラル音声） */
  tts?: boolean
  /** リアルタイムの音声認識・音声翻訳（同時通訳） */
  realtime?: boolean
  /** AI 会話（Cloudflare Workers AI / Groq） */
  chat?: boolean
  tokenRequired: boolean
}

let healthCache: { at: number; v: Health | null } | null = null

function headers(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { ...extra }
  const token = getSettings().apiToken
  if (token) h['X-App-Token'] = token
  return h
}

export const apiHeaders = () => headers()

/** 読み上げ音声の URL（同じ文・声・速度なら同じ URL になり、CDN と端末のキャッシュが効く） */
/** ph: 単語の発音の指定（IPA。品詞で読みが変わる語だけ） */
export function ttsUrl(text: string, voice: string, ratePct: number, ph?: string): string {
  const q = new URLSearchParams({ v: voice, r: String(ratePct), t: text })
  if (ph) q.set('p', ph)
  return `/api/tts?${q}`
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

/** 同時通訳・リアルタイム音声入力用の一時トークン（有効10分。8分は使い回す） */
let tokenCache: { at: number; token: string; region: string } | null = null
export async function getSpeechToken(force = false): Promise<{ token: string; region: string }> {
  if (!force && tokenCache && Date.now() - tokenCache.at < 8 * 60_000) return tokenCache
  const res = await fetch('/api/speech-token', { headers: headers() })
  await ensureOk(res)
  const j = (await res.json()) as { token: string; region: string }
  tokenCache = { at: Date.now(), ...j }
  return j
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

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatReply {
  reply: string
  /** 直前の自分の発言の直し（直すところがなければ null） */
  correction: { better: string; note: string } | null
  /** 次に言える返事の例 */
  hint: string
}

/**
 * AI との英会話：場面・レベル・これまでの会話を送り、相手の返事・直し・ヒントを受け取る（会話はサーバーに保存しない）。
 * 返事は生成しながら届く（onReply）。complete は返事の文を書き終えたとき（読み上げを始めてよい）
 */
export async function chat(
  scene: string,
  level: string,
  messages: ChatTurn[],
  onReply?: (text: string, complete: boolean) => void,
  /** 会話ごとの ID（同じ会話を AI 側で使い回してもらい、返事を速くする） */
  cid?: string,
): Promise<ChatReply> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ scene, level, messages, stream: true, cid }),
  })
  await ensureOk(res)
  if (!(res.headers.get('content-type') ?? '').includes('ndjson') || !res.body) return (await res.json()) as ChatReply
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (value) buf += dec.decode(value, { stream: true })
    let i: number
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line) continue
      let ev: { type?: string; text?: string; complete?: boolean; error?: string } & Partial<ChatReply>
      try {
        ev = JSON.parse(line)
      } catch {
        continue
      }
      if (ev.type === 'reply' && ev.text) onReply?.(ev.text, !!ev.complete)
      else if (ev.type === 'done') return { reply: ev.reply ?? '', correction: ev.correction ?? null, hint: ev.hint ?? '' }
      else if (ev.type === 'error') throw new ApiError(502, ev.error ?? 'AI の返事を読み取れませんでした')
    }
    if (done) break
  }
  throw new ApiError(502, 'AI の返事が途中で切れました。もう一度送ってください')
}

export interface ReplyExplanation {
  ja: string
  phrases: { en: string; ja: string }[]
  point: string
  answers: string[]
}
export interface MineFeedback {
  good: string
  fix: string
  why: string
  casual: string
  polite: string
}
type TutorBase = { level: string; scene: string; context: ChatTurn[] }

async function tutor<T>(mode: 'explain-reply' | 'explain-mine' | 'ask', text: string, base: TutorBase): Promise<T> {
  const res = await fetch('/api/tutor', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ mode, text, ...base, context: base.context.slice(-6) }),
  })
  await ensureOk(res)
  return (await res.json()) as T
}

/** 先生役：相手の英語の解説（訳・表現・ポイント・返し方の例） */
export const explainReply = (text: string, base: TutorBase) => tutor<ReplyExplanation>('explain-reply', text, base)
/** 先生役：自分の英語の詳しい評価（よかった点・直し・理由・くだけた言い方・ていねいな言い方） */
export const explainMine = (text: string, base: TutorBase) => tutor<MineFeedback>('explain-mine', text, base)
/** 先生役：会話の途中で日本語で質問する */
export const askTutor = (question: string, base: TutorBase) => tutor<{ answer: string }>('ask', question, base).then((r) => r.answer)
