/**
 * AI と会話の「先生」役（POST /api/tutor）。会話の相手役とは別に、日本語で教える。
 * - explain-reply：相手の英語の解説（訳・表現・ポイント・返し方の例）
 * - explain-mine：自分の英語の詳しい評価（よかった点・直し・理由・くだけた言い方・ていねいな言い方）
 * - ask：会話の途中で、先生に日本語で質問する（「for here ってどういう意味？」など）
 * 会話の中身はサーバーに保存しない。
 */
import { chatProviders, CHAT_LEVELS, completionBody, upstreamText, type ChatLevel, type Provider } from './chat.js'
import { fetchUpstream, json, type Env } from './shared.js'

export const TUTOR_MODES = ['explain-reply', 'explain-mine', 'ask'] as const
export type TutorMode = (typeof TUTOR_MODES)[number]
const MAX_TEXT = 600
const MAX_CONTEXT = 6

export interface TutorInput {
  mode: TutorMode
  level: ChatLevel
  scene: string
  /** 解説する文、または質問 */
  text: string
  /** 直前の会話（古い順。相手＝assistant、自分＝user） */
  context: { role: 'user' | 'assistant'; content: string }[]
}

export function readTutorBody(body: unknown): TutorInput | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const b = body as Record<string, unknown>
  if (!TUTOR_MODES.includes(b.mode as TutorMode)) return null
  if (!CHAT_LEVELS.includes(b.level as ChatLevel)) return null
  if (typeof b.scene !== 'string' || b.scene.length > 700) return null
  if (typeof b.text !== 'string' || !b.text.trim() || b.text.length > MAX_TEXT) return null
  const ctx = Array.isArray(b.context) ? b.context.slice(-MAX_CONTEXT) : []
  const context: TutorInput['context'] = []
  for (const m of ctx) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as Record<string, unknown>
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || content.length > MAX_TEXT) return null
    if (content.trim()) context.push({ role, content: content.trim() })
  }
  return { mode: b.mode as TutorMode, level: b.level as ChatLevel, scene: b.scene.trim(), text: b.text.trim(), context }
}

const transcript = (ctx: TutorInput['context']) =>
  ctx.length ? ctx.map((m) => `${m.role === 'assistant' ? 'Partner' : 'Learner'}: ${m.content}`).join('\n') : '(none)'

/** 先生役への指示。出力は見出しつきの行（小さいモデルでも崩れにくい） */
export function tutorPrompt(input: TutorInput): string {
  const head = [
    'You are a kind, precise English teacher for a Japanese adult learner (CEFR ' + input.level + ').',
    'Write explanations in natural, simple Japanese. Keep English examples short and natural.',
    `Role-play situation: ${input.scene || 'free conversation'}`,
    'Recent conversation:',
    transcript(input.context),
  ]
  if (input.mode === 'explain-reply')
    return [
      ...head,
      '',
      `Explain this sentence from the partner: "${input.text}"`,
      'Answer with these lines only:',
      'JA: a natural Japanese translation',
      'PHRASE: an important English phrase from the sentence = its meaning in Japanese (write 1 to 3 PHRASE lines)',
      'POINT: one short grammar or usage point in Japanese (at most 60 characters)',
      'ANSWER: a natural short reply the learner could say (write 2 ANSWER lines, one simple and one a little richer)',
    ].join('\n')
  if (input.mode === 'explain-mine')
    return [
      ...head,
      '',
      `Give feedback on this sentence the learner said: "${input.text}"`,
      'It came from speech recognition, so ignore capitalization and punctuation. Do not invent mistakes: if it is correct and natural, say so.',
      'Answer with these lines only:',
      'GOOD: what is good about it, in Japanese (at most 40 characters)',
      'FIX: the corrected sentence with minimal changes, or NONE if it is already correct',
      'WHY: why, in Japanese (at most 60 characters), or NONE',
      'CASUAL: a natural casual way to say the same thing',
      'POLITE: a natural polite way to say the same thing',
    ].join('\n')
  return [
    ...head,
    '',
    `The learner asks you (outside the role-play): "${input.text}"`,
    'Answer in Japanese in at most 3 short sentences (at most 150 characters), with one short English example if useful.',
    'Do not answer for the learner in the role-play; help them say it themselves.',
  ].join('\n')
}

/** 見出しつきの行を読む（同じ見出しが何度出てもよい。見出しのない行は直前の見出しの続き） */
export function parseLabeled(text: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  let last: string | null = null
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const m = /^[-*•\s]*\**\s*([A-Z]{2,8})\s*\**\s*[:：]\s*\**\s*(.*)$/.exec(line)
    if (m) {
      last = m[1].toUpperCase()
      ;(out[last] ??= []).push(m[2].trim())
    } else if (last) {
      const arr = out[last]
      arr[arr.length - 1] = `${arr[arr.length - 1]} ${line}`.trim()
    }
  }
  return out
}

const NONE = /^(none|n\/a|null|-|なし)?\.?$/i
const one = (f: Record<string, string[]>, k: string) => {
  const v = (f[k]?.[0] ?? '').replace(/^["“]|["”]$/g, '').trim()
  return NONE.test(v) ? '' : v
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

export function toReplyExplanation(text: string): ReplyExplanation | null {
  const f = parseLabeled(text)
  const phrases = (f.PHRASE ?? [])
    .map((p) => {
      const [en, ...rest] = p.split(/\s*[=＝:：]\s*/)
      return { en: (en ?? '').replace(/^["“]|["”]$/g, '').trim(), ja: rest.join(' ').trim() }
    })
    .filter((p) => p.en && p.ja)
    .slice(0, 3)
  const out = { ja: one(f, 'JA'), phrases, point: one(f, 'POINT'), answers: (f.ANSWER ?? []).map((a) => a.replace(/^["“]|["”]$/g, '').trim()).filter((a) => a && !NONE.test(a)).slice(0, 2) }
  return out.ja || out.phrases.length || out.answers.length ? out : null
}

export function toMineFeedback(text: string, said: string): MineFeedback | null {
  const f = parseLabeled(text)
  let fix = one(f, 'FIX')
  // 句読点・大文字だけの違いは「直し」にしない
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (fix && norm(fix) === norm(said)) fix = ''
  const out = { good: one(f, 'GOOD'), fix, why: fix ? one(f, 'WHY') : '', casual: one(f, 'CASUAL'), polite: one(f, 'POLITE') }
  return out.good || out.fix || out.casual || out.polite ? out : null
}

/** 先生役のモデル（設定があれば会話の相手役とは別のモデル。日本語の説明が得意なものを使える） */
export function tutorProviders(env: Env): Provider[] {
  return chatProviders(env).map((p) => {
    const m = p.name === 'cloudflare' ? env.CLOUDFLARE_TUTOR_MODEL : env.GROQ_TUTOR_MODEL
    return m ? { ...p, model: m } : p
  })
}

/** POST /api/tutor — { mode, level, scene, text, context } */
export async function handleTutor(request: Request, env: Env): Promise<Response> {
  const providers = tutorProviders(env)
  if (!providers.length) return json({ error: 'AI 会話（Cloudflare / Groq）が未設定です' }, 503)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'リクエスト形式が不正です' }, 400)
  }
  const input = readTutorBody(body)
  if (!input) return json({ error: 'リクエスト形式が不正です' }, 400)
  const messages = [{ role: 'user', content: tutorPrompt(input) }]
  let quota = false
  for (const p of providers) {
    const res = await fetchUpstream(p.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...completionBody(p, messages), temperature: 0.3, max_tokens: /gpt-oss/.test(p.model) ? 900 : 380 }),
      signal: AbortSignal.timeout(25_000),
    })
    if (!res) continue
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300)
      if (res.status === 429 || (res.status === 403 && !/5035|paid/i.test(detail))) quota = true
      console.error(`tutor ${p.name} ${res.status}`, detail)
      continue
    }
    let text = ''
    for await (const d of upstreamText(res)) text += d
    if (input.mode === 'ask') {
      const answer = text.trim()
      if (answer) return json({ answer: answer.slice(0, 600), provider: p.name })
      continue
    }
    const out = input.mode === 'explain-reply' ? toReplyExplanation(text) : toMineFeedback(text, input.text)
    if (out) return json({ ...out, provider: p.name })
  }
  return json(
    { error: quota ? '今日の AI 会話の無料枠を使い切りました。料金はかからず、時間がたつとまた使えます' : '先生に接続できませんでした。しばらくしてからもう一度お試しください' },
    502,
  )
}
