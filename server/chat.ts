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
export const CHAT_MAX_SCENE = 700

export const CHAT_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
export type ChatLevel = (typeof CHAT_LEVELS)[number]

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatReply {
  reply: string
  /** 学習者の直前の発言の直し（直すところがなければ null） */
  correction: { better: string; note: string; type?: ErrorType } | null
  /** 次に学習者が言える返事の例 */
  hint: string
}

/** 直しの種類（日本人の話す英語で多い順に。端末で集計して「最近多い間違い」に出す） */
export const ERROR_TYPES = ['article', 'plural', 'tense', 'preposition', 'agreement', 'word-order', 'word-choice', 'missing-word', 'other'] as const
export type ErrorType = (typeof ERROR_TYPES)[number]

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
  // Gemma 4・GLM 4.7・Qwen 3 は考える過程が既定でオン。会話では待ち時間とトークンの無駄になるので切る
  const thinking = /gemma-4|glm-4|qwen3/i.test(p.model)
  return {
    model: p.model,
    messages,
    temperature: 0.6,
    max_tokens: reasoning ? 800 : 220,
    ...(reasoning ? { reasoning_effort: 'low' } : {}),
    ...(thinking ? { chat_template_kwargs: { enable_thinking: false } } : {}),
  }
}

const LEVEL_GUIDE: Record<ChatLevel, string> = {
  A1: 'very simple words and short present-tense sentences (CEFR A1)',
  A2: 'simple everyday words and short sentences (CEFR A2)',
  B1: 'common everyday vocabulary and clear sentences (CEFR B1)',
  B2: 'natural, fluent English with some idioms (CEFR B2)',
  C1: 'natural, rich English as between native speakers (CEFR C1)',
}

/**
 * AI への指示（役・レベル・返事の形）。
 * 小さいモデルは JSON を途中で崩しやすい（返事のあとに {"correction": … が切れて混ざる）ので、
 * 見出しつきの行（REPLY: / BETTER: / NOTE: / HINT:）で返させる
 */
export function systemPrompt(scene: string, level: ChatLevel): string {
  return [
    'You are a friendly conversation partner helping a Japanese adult practice spoken English.',
    `Situation (stay in this role the whole time): ${scene}`,
    `Use ${LEVEL_GUIDE[level]}.`,
    'Rules:',
    '- REPLY: 1 or 2 short sentences (at most 25 words) in English, then one question so the learner keeps talking. Make the first sentence short. No Japanese, no grammar explanations, no corrections (a teacher handles those separately).',
    '- HINT: one short example sentence the learner could say next in answer to your REPLY.',
    '- The learner speaks through speech recognition: ignore capitalization, punctuation, filler words, and small recognition errors. If the message is unclear, kindly ask them to say it again.',
    '- If there is no learner message yet, greet the learner and ask a first question that fits the situation.',
    '- If the situation lists goals for the learner, lead the conversation through them one at a time.',
    '- If the learner writes Japanese (or mixes Japanese), reply in simple English and gently encourage them to try saying it in English.',
    '- If the learner asks you to repeat, speak slowly, or say it more simply, say your last point again with easier words and shorter sentences, and keep using easier English after that.',
    '- If the learner asks what a word means, explain it in very simple English, then return to the situation.',
    '- If the learner gives very short answers, use easier words and offer two choices in your question. If they answer easily, use slightly richer English.',
    '- Never write the learner\'s lines for them.',
    'Answer with exactly these two lines and nothing else:',
    'REPLY: ...',
    'HINT: ...',
    'Example:',
    'REPLY: Sure! Which station would you like to go to?',
    'HINT: I want to go to Tokyo Station.',
  ].join('\n')
}

/** 毎回の念押し（小さいモデルは会話が長くなると役やレベルを忘れるので、最後に短く言い直す） */
export function reminder(level: ChatLevel): string {
  return `Remember: stay in your role, use CEFR ${level} English, at most 25 words, end with one question. Answer with the REPLY and HINT lines only.`
}

const NONE = /^(none|n\/a|null|-|なし)?\.?$/i
/** 行の見出しで区切って取り出す（見出しの前後の空白・** の強調・大文字小文字はゆるく扱う） */
function field(text: string, name: string): string {
  const re = new RegExp(`(?:^|\\n)\\s*\\**\\s*${name}\\s*\\**\\s*[:：]\\s*\\**\\s*([\\s\\S]*?)(?=\\n\\s*\\**\\s*(?:REPLY|BETTER|NOTE|TYPE|HINT)\\s*\\**\\s*[:：]|$)`, 'i')
  const m = text.match(re)
  return m ? m[1].trim().replace(/^["“]|["”]$/g, '').trim() : ''
}

/**
 * AI の出力を読む。見出しの行の形を優先し、JSON で返してきたときも読む。
 * どちらでもないときは、JSON の切れ端（{"correction": …）を除いた全体を返事にする
 */
export function parseChatReply(raw: string): ChatReply | null {
  const text = raw.replace(/\r/g, '').trim()
  if (!text) return null
  // 返事の行に JSON の切れ端が続いていたら捨てる
  const reply = field(text, 'REPLY').split(/\{\s*"/)[0].trim()
  if (reply) {
    const better = field(text, 'BETTER')
    const note = field(text, 'NOTE')
    const hint = field(text, 'HINT')
    const type = field(text, 'TYPE').toLowerCase().replace(/[^a-z-]/g, '') as ErrorType
    return {
      reply,
      correction:
        better && !NONE.test(better)
          ? { better, note: NONE.test(note) ? '' : note, ...(ERROR_TYPES.includes(type) ? { type } : {}) }
          : null,
      hint: NONE.test(hint) ? '' : hint,
    }
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
      const r = typeof j.reply === 'string' ? j.reply.trim() : ''
      if (r) {
        const c = j.correction as Record<string, unknown> | null | undefined
        const better = c && typeof c.better === 'string' ? c.better.trim() : ''
        const note = c && typeof c.note === 'string' ? c.note.trim() : ''
        return { reply: r, correction: better ? { better, note } : null, hint: typeof j.hint === 'string' ? j.hint.trim() : '' }
      }
    } catch {
      /* JSON でなければ下へ */
    }
  }
  // 返事のあとに JSON や見出しの切れ端が続いていたら、そこから後ろは捨てる
  const cut = text.search(/\{\s*"|\n\s*(?:BETTER|NOTE|TYPE|HINT)\s*[:：]/i)
  const plainReply = (cut > 0 ? text.slice(0, cut) : text).replace(/^["\s]+|["\s]+$/g, '').trim()
  return plainReply && !plainReply.startsWith('{') ? { reply: plainReply.slice(0, 400), correction: null, hint: '' } : null
}

/** これまでの AI の発言も同じ形にして渡す（小さいモデルが前の発言をまねて、見出しを付けなくなるのを防ぐ） */
export function historyForModel(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => (m.role === 'assistant' ? { role: m.role, content: `REPLY: ${m.content}` } : m))
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

/** 句読点・大文字小文字・空白を除いて比べる（音声認識の文は句読点がなく、それだけ違う「直し」は出さない） */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** 直しが元の文と（句読点・大文字小文字のほかは）同じなら、直しなしにする */
export function dropSameCorrection(out: ChatReply, said: string | undefined): ChatReply {
  if (!out.correction || !said) return out
  return normalize(out.correction.better) === normalize(said) ? { ...out, correction: null } : out
}

/** 生成の途中の文から、返事（REPLY の行）のここまでを取り出す。complete は返事の行を書き終えたか */
export function partialReply(text: string): { text: string; complete: boolean } {
  const m = /(?:^|\n)\s*\**\s*REPLY\s*\**\s*[:：]\s*\**\s*/i.exec(text)
  if (!m) return { text: '', complete: false }
  const rest = text.slice(m.index + m[0].length)
  const nl = rest.indexOf('\n')
  const line = (nl >= 0 ? rest.slice(0, nl) : rest).split(/\{\s*"/)[0].replace(/\*+\s*$/, '').trim()
  return { text: line, complete: nl >= 0 }
}

/** 上流の応答（SSE の stream か、ふつうの JSON）から、生成された文を順に取り出す */
export async function* upstreamText(res: Response): AsyncGenerator<string> {
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('event-stream') || !res.body) {
    const data = await upstreamJson<CompletionResponse>(res)
    const c = data?.choices?.[0]?.message?.content
    if (c) yield c
    return
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i: number
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const j = JSON.parse(data) as { choices?: { delta?: { content?: string } }[]; response?: string }
        // OpenAI 互換は choices[0].delta.content、Cloudflare の独自形式は response
        const d = j.choices?.[0]?.delta?.content ?? j.response
        if (typeof d === 'string' && d) yield d
      } catch {
        /* 壊れた行は飛ばす */
      }
    }
  }
}

/**
 * 返事を生成しながら送る（1行に1つの JSON）。
 * {"type":"reply","text":"…","complete":false} を返事が伸びるたびに、最後に {"type":"done", 返事・直し・ヒント}。
 * 端末は届いた返事をすぐ表示し、返事の行を書き終えた時点で読み上げを始められる
 */
function streamReply(res: Response, p: Provider, said: string | undefined, fallback: () => Promise<string>): Response {
  const enc = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + '\n'))
      let text = ''
      let last = ''
      let lastComplete = false
      try {
        for await (const d of upstreamText(res)) {
          text += d
          const r = partialReply(text)
          if (r.text && (r.text !== last || r.complete !== lastComplete)) {
            last = r.text
            lastComplete = r.complete
            send({ type: 'reply', text: r.text, complete: r.complete })
          }
        }
        // stream に対応していない・何も届かなかったときは、同じサービスにふつうの形でもう一度たのむ
        if (!text.trim()) text = await fallback().catch(() => '')
        const out = parseChatReply(text)
        if (out) send({ type: 'done', ...dropSameCorrection(out, said), provider: p.name })
        else send({ type: 'error', error: 'AI の返事を読み取れませんでした。もう一度送ってください' })
      } catch {
        // 途中で切れても、そこまでの返事が読めれば使う
        const out = parseChatReply(text)
        if (out) send({ type: 'done', ...dropSameCorrection(out, said), provider: p.name })
        else send({ type: 'error', error: 'AI の返事が途中で切れました。もう一度送ってください' })
      }
      controller.close()
    },
  })
  return new Response(body, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  })
}

/** POST /api/chat — { scene, level, messages, stream? } に、相手の返事・直し・ヒントを返す（stream なら生成しながら送る） */
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
  const stream = (body as { stream?: unknown }).stream === true
  const said = input.messages.at(-1)?.content

  const messages = [
    { role: 'system', content: systemPrompt(input.scene, input.level) },
    ...historyForModel(input.messages),
    ...(input.messages.length ? [{ role: 'system', content: reminder(input.level) }] : []),
  ]
  const cid = (body as { cid?: unknown }).cid
  const call = (p: Provider, asStream: boolean) =>
    fetchUpstream(p.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${p.key}`,
        'Content-Type': 'application/json',
        // Cloudflare：同じ会話を同じ場所で処理させ、前の部分の計算を使い回して最初の返事を速くする（プロンプトキャッシュ）
        ...(p.name === 'cloudflare' && typeof cid === 'string' && /^[\w-]{8,64}$/.test(cid) ? { 'x-session-affinity': cid } : {}),
      },
      body: JSON.stringify({ ...completionBody(p, messages), ...(asStream ? { stream: true } : {}) }),
      // 返事が来ないまま待たせない（次のサービスを試す）
      signal: AbortSignal.timeout(25_000),
    })
  let quota = false
  for (const p of providers) {
    const res = await call(p, stream)
    // つながらない・枠を超えた・サーバーの不調なら、次のサービスを試す
    if (!res) continue
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300)
      // 429 は無料枠・回数の上限。403 のうち 5035 は「有料プランが必要なモデル」なので枠切れとは分ける
      if (res.status === 429 || (res.status === 403 && !/5035|paid/i.test(detail))) quota = true
      console.error(`chat ${p.name} ${res.status}`, detail)
      continue
    }
    if (stream)
      return streamReply(res, p, said, async () => {
        const r = await call(p, false)
        const data = r?.ok ? await upstreamJson<CompletionResponse>(r) : undefined
        return data?.choices?.[0]?.message?.content ?? ''
      })
    const data = await upstreamJson<CompletionResponse>(res)
    const out = parseChatReply(data?.choices?.[0]?.message?.content ?? '')
    if (out) return json({ ...dropSameCorrection(out, said), provider: p.name })
  }
  return json(
    { error: quota ? '今日の AI 会話の無料枠を使い切りました。料金はかからず、時間がたつとまた使えます' : 'AI に接続できませんでした。しばらくしてからもう一度お試しください' },
    502,
  )
}
