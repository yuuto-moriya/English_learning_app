import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleTutor, parseLabeled, readTutorBody, toMineFeedback, toReplyExplanation, tutorPrompt, tutorProviders } from '../server/tutor.js'

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

  it('先生役のモデルだけ別に設定できる', () => {
    expect(tutorProviders({ ...ENV, CLOUDFLARE_TUTOR_MODEL: '@cf/x/y' })[0].model).toBe('@cf/x/y')
    expect(tutorProviders(ENV)[0].model).toContain('llama')
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
