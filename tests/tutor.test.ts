import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleTutor, parseLabeled, readTutorBody, toCorrection, toMineFeedback, toReplyExplanation, tutorPrompt, tutorProviders } from '../server/tutor.js'

const post = (body: unknown) => new Request('http://x/api/tutor', { method: 'POST', body: JSON.stringify(body) })
const BASE = { level: 'B1', scene: 'You are a barista.', context: [{ role: 'assistant', content: 'What can I get for you?' }] }
const completion = (content: string) => Response.json({ choices: [{ message: { content } }] })
const ENV = { CLOUDFLARE_ACCOUNT_ID: 'a', CLOUDFLARE_AI_TOKEN: 't' }

afterEach(() => vi.unstubAllGlobals())

describe('先生役（/api/tutor）', () => {
  it('入力を確かめる', () => {
    expect(readTutorBody({ ...BASE, mode: 'ask', text: 'for here って何？' })).not.toBeNull()
    expect(readTutorBody({ ...BASE, mode: 'x', text: 'a' })).toBeNull()
    expect(readTutorBody({ ...BASE, mode: 'ask', text: '' })).toBeNull()
    expect(readTutorBody({ ...BASE, mode: 'ask', text: 'a', context: [{ role: 'system', content: 'x' }] })).toBeNull()
  })

  it('解説の指示に、文と直前の会話を入れる', () => {
    const p = tutorPrompt(readTutorBody({ ...BASE, mode: 'explain-reply', text: 'For here or to go?' })!)
    expect(p).toContain('"For here or to go?"')
    expect(p).toContain('Partner: What can I get for you?')
    expect(p).toContain('PHRASE:')
  })

  it('見出しつきの行を読む（同じ見出しが何度も・見出しのない続きの行）', () => {
    expect(parseLabeled('JA: こちらで？\nお持ち帰り？\nANSWER: For here.\nANSWER: To go, please.')).toEqual({
      JA: ['こちらで？ お持ち帰り？'],
      ANSWER: ['For here.', 'To go, please.'],
    })
  })

  it('相手の英語の解説を読む', () => {
    const out = toReplyExplanation('JA: 店内でお召し上がりですか、お持ち帰りですか？\nPHRASE: for here = 店内で\nPHRASE: to go = 持ち帰りで\nPOINT: 店でよく聞く決まった言い方\nANSWER: For here, please.\nANSWER: To go, please. Thanks!')
    expect(out).toEqual({
      ja: '店内でお召し上がりですか、お持ち帰りですか？',
      phrases: [
        { en: 'for here', ja: '店内で' },
        { en: 'to go', ja: '持ち帰りで' },
      ],
      point: '店でよく聞く決まった言い方',
      answers: ['For here, please.', 'To go, please. Thanks!'],
    })
  })

  it('自分の英語の評価：句読点だけの直しは出さない', () => {
    expect(toMineFeedback('GOOD: 伝わります\nFIX: I want a latte.\nWHY: a が必要\nCASUAL: A latte, please.\nPOLITE: Could I have a latte?', 'I want latte')).toEqual({
      good: '伝わります',
      fix: 'I want a latte.',
      why: 'a が必要',
      casual: 'A latte, please.',
      polite: 'Could I have a latte?',
    })
    expect(toMineFeedback('GOOD: 自然です\nFIX: I want a latte.\nWHY: NONE\nCASUAL: A latte!\nPOLITE: NONE', 'i want a latte')?.fix).toBe('')
  })

  it('先生役は大きめのモデルを先に、使えなければ会話と同じモデル', () => {
    expect(tutorProviders(ENV).map((p) => p.model)).toEqual(['@cf/google/gemma-4-26b-a4b-it', '@cf/meta/llama-3.1-8b-instruct-fp8-fast'])
    expect(tutorProviders({ ...ENV, CLOUDFLARE_TUTOR_MODEL: '@cf/x/y' })[0].model).toBe('@cf/x/y')
  })

  it('Gemma 4 は考える過程を切って送る', async () => {
    const fetchMock = vi.fn(async (_u: string | URL, _i?: RequestInit) => completion('FIX: SAME\nNATURAL: NONE\nNOTE: NONE\nTYPE: NONE'))
    vi.stubGlobal('fetch', fetchMock)
    await handleTutor(post({ ...BASE, mode: 'correct', text: 'I am fine.' }), ENV)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]!.body))
    expect(body).toMatchObject({ model: '@cf/google/gemma-4-26b-a4b-it', temperature: 0, chat_template_kwargs: { enable_thinking: false } })
  })

  it('直し：明らかな誤りは最小限に、正しい文は直さない、より自然な言い方は分ける、日本語は英語に', () => {
    expect(toCorrection('FIX: I want a latte.\nNATURAL: NONE\nNOTE: a が必要\nTYPE: article', 'I want latte')).toEqual({ better: 'I want a latte.', note: 'a が必要', kind: 'fix', type: 'article' })
    expect(toCorrection('FIX: SAME\nNATURAL: NONE\nNOTE: NONE\nTYPE: NONE', 'I am fine')).toBeNull()
    expect(toCorrection('FIX: I want a latte.\nNATURAL: NONE\nNOTE: NONE\nTYPE: NONE', 'i want a latte')).toBeNull()
    expect(toCorrection("FIX: SAME\nNATURAL: I'd like a latte, please.\nNOTE: 店では I'd like が丁寧\nTYPE: NONE", 'I want a latte')).toMatchObject({ kind: 'natural', better: "I'd like a latte, please." })
    expect(toCorrection('FIX: A medium size, please.\nNATURAL: NONE\nNOTE: 英語ではこう言えます\nTYPE: NONE', 'Mサイズで')).toMatchObject({ kind: 'ja', better: 'A medium size, please.' })
  })

  it('直し：先のモデルの出力が読めなければ、次のモデルで', async () => {
    const fetchMock = vi.fn(async (_u: string | URL, init?: RequestInit) =>
      JSON.parse(String(init?.body)).model.includes('gemma') ? completion('') : completion('FIX: I want a latte.\nNATURAL: NONE\nNOTE: a が必要\nTYPE: article'),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await handleTutor(post({ ...BASE, mode: 'correct', text: 'I want latte' }), ENV)
    expect(await res.json()).toMatchObject({ correction: { better: 'I want a latte.', kind: 'fix' } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('質問に日本語で答える', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => completion('「店内で」という意味です。For here, please. と答えます。')))
    const res = await handleTutor(post({ ...BASE, mode: 'ask', text: 'for here って何？' }), ENV)
    expect(res.status).toBe(200)
    expect(((await res.json()) as { answer: string }).answer).toContain('店内で')
  })

  it('未設定なら 503', async () => {
    expect((await handleTutor(post({ ...BASE, mode: 'ask', text: 'a' }), {})).status).toBe(503)
  })
})
