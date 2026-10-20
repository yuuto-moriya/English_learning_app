import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatProviders, completionBody, handleChat, parseChatReply, readChatBody, systemPrompt } from '../server/chat.js'
import type { Env } from '../server/shared.js'

const BOTH: Env = { CLOUDFLARE_ACCOUNT_ID: 'acc', CLOUDFLARE_AI_TOKEN: 'cf', GROQ_API_KEY: 'gsk' }
const post = (body: unknown) => new Request('http://x/api/chat', { method: 'POST', body: JSON.stringify(body) })
const OK = { scene: 'You are a barista at a cafe.', level: 'B1', messages: [{ role: 'user', content: 'I want coffee' }] }
const completion = (content: string) => Response.json({ choices: [{ message: { content } }] })

afterEach(() => vi.unstubAllGlobals())

describe('AI 会話（/api/chat）', () => {
  it('Cloudflare → Groq の順に試す。未設定なら 503', async () => {
    expect(chatProviders(BOTH).map((p) => p.name)).toEqual(['cloudflare', 'groq'])
    expect(chatProviders({ GROQ_API_KEY: 'gsk' }).map((p) => p.name)).toEqual(['groq'])
    expect((await handleChat(post(OK), {})).status).toBe(503)
  })

  it('gpt-oss は考える量を小さくし、上限を多めに', () => {
    const [cf, groq] = chatProviders(BOTH)
    expect(completionBody(groq, [])).toMatchObject({ model: 'openai/gpt-oss-20b', reasoning_effort: 'low' })
    expect(completionBody(cf, [])).not.toHaveProperty('reasoning_effort')
  })

  it('入力を確かめる（長さ・役・最後は自分の発言）', () => {
    expect(readChatBody(OK)).not.toBeNull()
    expect(readChatBody({ ...OK, messages: [] })).not.toBeNull()
    expect(readChatBody({ ...OK, level: 'X' })).toBeNull()
    expect(readChatBody({ ...OK, messages: [{ role: 'system', content: 'hi' }] })).toBeNull()
    expect(readChatBody({ ...OK, messages: [{ role: 'assistant', content: 'Hi!' }] })).toBeNull()
    expect(readChatBody({ ...OK, messages: [{ role: 'user', content: 'a'.repeat(601) }] })).toBeNull()
    expect(readChatBody({ ...OK, scene: '' })).toBeNull()
  })

  it('指示に場面とレベルを入れ、JSON だけで返させる', () => {
    const p = systemPrompt('You are a hotel receptionist.', 'A2')
    expect(p).toContain('hotel receptionist')
    expect(p).toContain('CEFR A2')
    expect(p).toContain('"correction"')
  })

  it('AI の出力を読む（前後の文・直しなし・JSON でない）', () => {
    expect(parseChatReply('Sure! {"reply":"What size?","correction":{"better":"I\'d like a coffee.","note":"want より would like が丁寧"},"hint":"A large one, please."}')).toEqual({
      reply: 'What size?',
      correction: { better: "I'd like a coffee.", note: 'want より would like が丁寧' },
      hint: 'A large one, please.',
    })
    expect(parseChatReply('{"reply":"Nice!","correction":null,"hint":""}')?.correction).toBeNull()
    expect(parseChatReply('Hello there, how are you?')).toEqual({ reply: 'Hello there, how are you?', correction: null, hint: '' })
    expect(parseChatReply('   ')).toBeNull()
  })

  it('1つめが枠切れなら次のサービスで返事する', async () => {
    const fetchMock = vi.fn(async (url: string | URL) =>
      String(url).includes('cloudflare') ? new Response('quota', { status: 429 }) : completion('{"reply":"Hi!","correction":null,"hint":"Hello."}'),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await handleChat(post(OK), BOTH)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ reply: 'Hi!', provider: 'groq' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('どちらも枠切れなら、料金はかからないと伝える 502', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota', { status: 429 })))
    const res = await handleChat(post(OK), BOTH)
    expect(res.status).toBe(502)
    expect(((await res.json()) as { error: string }).error).toContain('料金はかからず')
  })
})
