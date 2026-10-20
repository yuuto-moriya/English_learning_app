/**
 * AI との英会話（POST /api/chat）。
 * 返事を作る AI は差し替えられるようにし、無料枠のあるサービスを順に試す（Cloudflare Workers AI → Groq）。
 * どちらも OpenAI 互換の chat/completions を使う。クレジットカードを登録しない無料プランなら、枠を超えても止まるだけで課金されない。
 * 会話の中身はサーバーに保存しない（届いた会話をそのまま AI に渡して、返事を返すだけ）。
 */
import { fetchUpstream, json, upstreamJson, type Env } from './shared.js'

/** 1回に送れる会話の長さ（古い発言は端末側で切る） */
export const CHAT_MAX_TURNS = 16
export const CHAT_MAX_CHARS = 600
export const CHAT_MAX_SCENE = 400

export const CHAT_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
export type ChatLevel = (typeof CHAT_LEVELS)[number]

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatReply {
  reply: string
  /** 学習者の直前の発言の直し（直すところがなければ null） */
  correction: { better: string; note: string } | null
  /** 次に学習者が言える返事の例 */
  hint: string
}

export interface Provider {
  name: 'groq' | 'cloudflare'
  url: string
  key: string
  model: string
}

/**
 * 設定されている AI サービス（試す順）。
 * Cloudflare を先に：1日の無料枠が大きく（約1万 Neurons ≒ 900〜1,300往復）、入力を学習に使わないと公式に明記している。
 * Groq は予備（無料プランは1日の回数・トークン数が小さい）。llama-3.1-8b は両社とも提供終了のため、既定のモデルは後継にしている
 */
export function chatProviders(env: Env): Provider[] {
  const out: Provider[] = []
  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_AI_TOKEN)
    out.push({
      name: 'cloudflare',
      url: `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/ai/v1/chat/completions`,
      key: env.CLOUDFLARE_AI_TOKEN,
      model: env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
    })
  if (env.GROQ_API_KEY)
    out.push({
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: env.GROQ_API_KEY,
      model: env.GROQ_MODEL || 'openai/gpt-oss-20b',
    })
  return out
}

/** モデルに送る本文。gpt-oss は考える過程も出力として数えるので、考える量を小さくして返事の分の上限を残す */
export function completionBody(p: Provider, messages: { role: string; content: string }[]): Record<string, unknown> {
  const reasoning = /gpt-oss/.test(p.model)
  return {
    model: p.model,
    messages,
    temperature: 0.7,
    max_tokens: reasoning ? 800 : 300,
    ...(reasoning ? { reasoning_effort: 'low' } : {}),
  }
}

const LEVEL_GUIDE: Record<ChatLevel, string> = {
  A1: 'very simple words and short present-tense sentences (CEFR A1)',
  A2: 'simple everyday words and short sentences (CEFR A2)',
  B1: 'common everyday vocabulary and clear sentences (CEFR B1)',
  B2: 'natural, fluent English with some idioms (CEFR B2)',
  C1: 'natural, rich English as between native speakers (CEFR C1)',
}

/** AI への指示（役・レベル・返事の形） */
export function systemPrompt(scene: string, level: ChatLevel): string {
  return [
    'You are a friendly conversation partner helping a Japanese adult practice spoken English.',
    `Situation (stay in this role the whole time): ${scene}`,
    `Use ${LEVEL_GUIDE[level]}.`,
    'Rules:',
    '- Reply in 1 or 2 short sentences (at most 30 words), then ask one question or give one prompt so the learner keeps talking.',
    '- Never switch to Japanese in "reply". Do not explain grammar in "reply".',
    "- Look only at the learner's LAST message. If it has a grammar mistake, a wrong word, or sounds unnatural, put a corrected natural version in correction.better and a short explanation in Japanese (at most 60 characters) in correction.note. If it is fine, set correction to null.",
    '- The learner speaks through speech recognition: ignore capitalization, punctuation, and filler words. Do not correct those.',
    '- If there is no learner message yet, start the conversation with a greeting and a first question that fits the situation; correction is null.',
    '- "hint" is one short example sentence the learner could say next in answer to you, at the same level.',
    'Respond with ONLY a JSON object, no other text:',
    '{"reply": "...", "correction": null or {"better": "...", "note": "..."}, "hint": "..."}',
  ].join('\n')
}

/** AI の出力（JSON のはず）を読む。前後に余計な文があっても、最初の {…} を探す。読めなければ全体を返事とみなす */
export function parseChatReply(raw: string): ChatReply | null {
  const text = raw.trim()
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
      const reply = typeof j.reply === 'string' ? j.reply.trim() : ''
      if (reply) {
        const c = j.correction as Record<string, unknown> | null | undefined
        const better = c && typeof c.better === 'string' ? c.better.trim() : ''
        const note = c && typeof c.note === 'string' ? c.note.trim() : ''
        return {
          reply,
          correction: better ? { better, note } : null,
          hint: typeof j.hint === 'string' ? j.hint.trim() : '',
        }
      }
    } catch {
      /* JSON でなければ下へ */
    }
  }
  // JSON にならなかったときは、記号を除いた全体を返事にする（直しとヒントはなし）
  const plainReply = text.replace(/^[{"\s]+|[}"\s]+$/g, '')
  return plainReply ? { reply: plainReply.slice(0, 400), correction: null, hint: '' } : null
}

/** 会話の入力を確かめる。不正なら null */
export function readChatBody(body: unknown): { scene: string; level: ChatLevel; messages: ChatMessage[] } | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const b = body as Record<string, unknown>
  if (typeof b.scene !== 'string' || !b.scene.trim() || b.scene.length > CHAT_MAX_SCENE) return null
  if (!CHAT_LEVELS.includes(b.level as ChatLevel)) return null
  if (!Array.isArray(b.messages) || b.messages.length > CHAT_MAX_TURNS) return null
  const messages: ChatMessage[] = []
  for (const m of b.messages) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as Record<string, unknown>
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const c = content.trim()
    if (!c || c.length > CHAT_MAX_CHARS) return null
    messages.push({ role, content: c })
  }
  // 最後は学習者の発言か、会話の始まり（空）
  if (messages.length && messages[messages.length - 1].role !== 'user') return null
  return { scene: b.scene.trim(), level: b.level as ChatLevel, messages }
}

type CompletionResponse = { choices?: { message?: { content?: string } }[] }

/** POST /api/chat — { scene, level, messages } に、相手の返事・直し・ヒントを返す */
export async function handleChat(request: Request, env: Env): Promise<Response> {
  const providers = chatProviders(env)
  if (!providers.length) return json({ error: 'AI 会話（Cloudflare / Groq）が未設定です' }, 503)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'リクエスト形式が不正です' }, 400)
  }
  const input = readChatBody(body)
  if (!input) return json({ error: 'リクエスト形式が不正です' }, 400)

  const messages = [{ role: 'system', content: systemPrompt(input.scene, input.level) }, ...input.messages]
  let quota = false
  for (const p of providers) {
    const res = await fetchUpstream(p.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(completionBody(p, messages)),
    })
    // つながらない・枠を超えた・サーバーの不調なら、次のサービスを試す
    if (!res) continue
    if (!res.ok) {
      if (res.status === 429 || res.status === 403) quota = true
      console.error(`chat ${p.name} ${res.status}`, (await res.text().catch(() => '')).slice(0, 300))
      continue
    }
    const data = await upstreamJson<CompletionResponse>(res)
    const out = parseChatReply(data?.choices?.[0]?.message?.content ?? '')
    if (out) return json({ ...out, provider: p.name })
  }
  return json(
    { error: quota ? '今日の AI 会話の無料枠を使い切りました。料金はかからず、時間がたつとまた使えます' : 'AI に接続できませんでした。しばらくしてからもう一度お試しください' },
    502,
  )
}
