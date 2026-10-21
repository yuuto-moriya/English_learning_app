import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatProviders, completionBody, dropSameCorrection, handleChat, historyForModel, parseChatReply, partialReply, readChatBody, systemPrompt } from '../server/chat.js'
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

  it('指示に場面とレベルを入れ、見出しの行で返させる', () => {
    const p = systemPrompt('You are a hotel receptionist.', 'A2')
    expect(p).toContain('hotel receptionist')
    expect(p).toContain('CEFR A2')
    expect(p).toContain('REPLY:')
    expect(p).toContain('HINT:')
    // 直しは別の呼び出し（先生役）で、返事の側には書かせない
    expect(p).not.toContain('BETTER:')
  })

  it('見出しの行で返した出力を読む（直しなし・強調・全角コロン）', () => {
    expect(parseChatReply("REPLY: What size would you like?\nBETTER: I'd like a latte, please.\nNOTE: want より丁寧\nHINT: A medium, please.")).toEqual({
      reply: 'What size would you like?',
      correction: { better: "I'd like a latte, please.", note: 'want より丁寧' },
      hint: 'A medium, please.',
    })
    expect(parseChatReply('**REPLY:** Nice to meet you! Where are you from?\n**BETTER:** NONE\n**NOTE:** NONE\n**HINT:** I am from Tokyo.')).toEqual({
      reply: 'Nice to meet you! Where are you from?',
      correction: null,
      hint: 'I am from Tokyo.',
    })
    expect(parseChatReply('REPLY：Hello!\nBETTER：none.')?.correction).toBeNull()
  })

  it('返事に JSON の切れ端が混ざっても、返事だけを出す（実機で出た崩れ）', () => {
    const broken = 'It sounds like you love Australia. What do you like to do there? {"correction": {"better"'
    expect(parseChatReply(broken)).toEqual({ reply: 'It sounds like you love Australia. What do you like to do there?', correction: null, hint: '' })
    expect(parseChatReply('REPLY: Great! {"correction": null}')?.reply).toBe('Great!')
  })

  it('これまでの AI の発言にも見出しを付けて渡す', () => {
    expect(historyForModel([{ role: 'assistant', content: 'Hi!' }, { role: 'user', content: 'Hello' }])).toEqual([
      { role: 'assistant', content: 'REPLY: Hi!' },
      { role: 'user', content: 'Hello' },
    ])
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
      String(url).includes('cloudflare') ? new Response('quota', { status: 429 }) : completion('REPLY: Hi!\nBETTER: NONE\nNOTE: NONE\nHINT: Hello.'),
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

  it('句読点・大文字だけ違う「直し」は出さない', () => {
    const out = { reply: 'OK', correction: { better: "I'd like a latte.", note: '' }, hint: '' }
    expect(dropSameCorrection(out, "i'd like a latte").correction).toBeNull()
    expect(dropSameCorrection(out, 'I want latte').correction).not.toBeNull()
  })

  it('生成の途中から、返事の行のここまでを取り出す', () => {
    expect(partialReply('REPLY: Sure! What si')).toEqual({ text: 'Sure! What si', complete: false })
    expect(partialReply('REPLY: Sure! What size?\nBETT')).toEqual({ text: 'Sure! What size?', complete: true })
    expect(partialReply('Sure')).toEqual({ text: '', complete: false })
  })

  it('stream なら、生成しながら返事を送り、最後に直しとヒントを送る', async () => {
    const sse = ['REPLY: Sure! What', ' size?\nBETTER: I want a latte, please.\n', 'NOTE: a を付ける\nHINT: Medium, please.']
      .map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`)
      .join('') + 'data: [DONE]\n\n'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(sse, { headers: { 'Content-Type': 'text/event-stream' } })))
    const res = await handleChat(post({ ...OK, stream: true }), { CLOUDFLARE_ACCOUNT_ID: 'a', CLOUDFLARE_AI_TOKEN: 't' })
    expect(res.headers.get('content-type')).toContain('ndjson')
    const lines = (await res.text()).trim().split('\n').map((l) => JSON.parse(l))
    expect(lines[0]).toEqual({ type: 'reply', text: 'Sure! What', complete: false })
    expect(lines.some((l) => l.type === 'reply' && l.complete && l.text === 'Sure! What size?')).toBe(true)
    expect(lines.at(-1)).toMatchObject({ type: 'done', reply: 'Sure! What size?', correction: { better: 'I want a latte, please.' }, hint: 'Medium, please.', provider: 'cloudflare' })
  })

  it('stream で何も届かなければ、同じサービスにふつうの形でたのみ直す', async () => {
    const fetchMock = vi.fn(async (_u: string | URL, init?: RequestInit) =>
      JSON.parse(String(init?.body)).stream
        ? new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
        : completion('REPLY: Hello again!\nBETTER: NONE\nNOTE: NONE\nHINT: Hi.'),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await handleChat(post({ ...OK, stream: true, cid: 'abcdef12-3456' }), { CLOUDFLARE_ACCOUNT_ID: 'a', CLOUDFLARE_AI_TOKEN: 't' })
    const lines = (await res.text()).trim().split('\n').map((l) => JSON.parse(l))
    expect(lines.at(-1)).toMatchObject({ type: 'done', reply: 'Hello again!' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((fetchMock.mock.calls[0][1]!.headers as Record<string, string>)['x-session-affinity']).toBe('abcdef12-3456')
  })

  it('有料プランが必要なモデル（403・5035）は枠切れと言わない', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"errors":[{"code":5035}]}', { status: 403 })))
    const res = await handleChat(post(OK), { CLOUDFLARE_ACCOUNT_ID: 'a', CLOUDFLARE_AI_TOKEN: 't' })
    expect(((await res.json()) as { error: string }).error).toContain('接続できませんでした')
  })

  it('直しの種類（TYPE）を読む。知らない種類は付けない', () => {
    expect(parseChatReply('REPLY: OK!\nBETTER: I want a latte.\nNOTE: a が必要\nTYPE: article\nHINT: Thanks.')?.correction).toEqual({
      better: 'I want a latte.',
      note: 'a が必要',
      type: 'article',
    })
    expect(parseChatReply('REPLY: OK!\nBETTER: I want a latte.\nNOTE: x\nTYPE: spelling\nHINT: Thanks.')?.correction).toEqual({ better: 'I want a latte.', note: 'x' })
    expect(partialReply('REPLY: Sure!\nTYPE: NONE')).toEqual({ text: 'Sure!', complete: true })
  })
})

describe('AI と会話：声のやりとりの区切り', async () => {
  const { autoSendDelay, sentenceEnd, splitSentences } = await import('../src/lib/chatSpeech')
  it('文が . ? ! で終わっていれば早く送り、考えている途中（and・um）なら長く待つ', () => {
    expect(autoSendDelay('I want a latte.', false)).toBe(600)
    expect(autoSendDelay('I want a latte and', false)).toBe(1800)
    expect(autoSendDelay('I want a latte', false)).toBe(1000)
    expect(autoSendDelay('I want a latte.', true)).toBe(1800)
  })
  it('書き終えた文から読み上げる（略語の点では区切らない）', () => {
    expect(sentenceEnd('Sure! What si', false)).toBe(6)
    expect(sentenceEnd('It opens at 10 a.m. tomorrow', false)).toBe(0)
    expect(sentenceEnd('Sure! What size?', true)).toBe(16)
    expect(splitSentences('Sure! What size would you like? Small or large?')).toEqual(['Sure!', 'What size would you like?', 'Small or large?'])
  })
})
