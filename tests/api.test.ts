import { afterEach, describe, expect, it, vi } from 'vitest'
import { guard, handleHealth, handlePronunciation, handleStt, handleTranslate } from '../server/handlers.js'
import type { Env } from '../server/shared.js'

const ENV: Env = {
  AZURE_TRANSLATOR_KEY: 'tk',
  AZURE_TRANSLATOR_REGION: 'japaneast',
  AZURE_SPEECH_KEY: 'sk',
  AZURE_SPEECH_REGION: 'japaneast',
}

const post = (path: string, body: BodyInit, headers: Record<string, string> = {}) =>
  new Request(`https://app.example${path}`, { method: 'POST', body, headers })

const wav = (bytes = 4000) => new Uint8Array(bytes)

afterEach(() => vi.unstubAllGlobals())

describe('guard', () => {
  it('APP_ACCESS_TOKEN が設定されているとトークンなしは 401', async () => {
    const env = { ...ENV, APP_ACCESS_TOKEN: 'secret' }
    const req = post('/api/translate', '{}')
    const res = await guard(req, env, () => new Response('ok'))
    expect(res.status).toBe(401)
    const ok = await guard(post('/api/translate', '{}', { 'X-App-Token': 'secret' }), env, () => new Response('ok'))
    expect(ok.status).toBe(200)
  })

  it('health はトークンなしでも見られる', async () => {
    const env = { ...ENV, APP_ACCESS_TOKEN: 'secret' }
    const res = await guard(new Request('https://app.example/api/health'), env, () => handleHealth(env), { public: true })
    expect(await res.json()).toEqual({ translator: true, speech: true, tokenRequired: true })
  })

  it('想定外の例外は JSON の 500 になる', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await guard(post('/x', ''), ENV, () => {
      throw new Error('boom')
    })
    expect(res.status).toBe(500)
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})

describe('translate', () => {
  it('Azure Translator v3 の形式で呼び出し、訳文を返す', async () => {
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) =>
      Response.json([{ detectedLanguage: { language: 'ja' }, translations: [{ text: 'Track gauge', to: 'en' }] }]),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await handleTranslate(post('/api/translate', JSON.stringify({ text: ' 軌間 ', to: 'en' })), ENV)
    expect(await res.json()).toEqual({ text: 'Track gauge', detected: 'ja' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en')
    expect((init!.headers as Record<string, string>)['Ocp-Apim-Subscription-Region']).toBe('japaneast')
    expect(init!.body).toBe(JSON.stringify([{ Text: '軌間' }]))
  })

  it('不正な入力は 400、未設定は 503', async () => {
    expect((await handleTranslate(post('/api/translate', 'null'), ENV)).status).toBe(400)
    expect((await handleTranslate(post('/api/translate', JSON.stringify({ text: 1 })), ENV)).status).toBe(400)
    expect((await handleTranslate(post('/api/translate', JSON.stringify({ text: 'a', to: 'fr' })), ENV)).status).toBe(400)
    expect((await handleTranslate(post('/api/translate', JSON.stringify({ text: 'a' })), {})).status).toBe(503)
  })

  it('Azure に接続できないときは 502', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('network'))))
    const res = await handleTranslate(post('/api/translate', JSON.stringify({ text: 'hello', to: 'ja' })), ENV)
    expect(res.status).toBe(502)
  })
})

describe('speech', () => {
  it('発音評価ヘッダーを base64 で送り、en-GB ではプロソディを送らない', async () => {
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) =>
      Response.json({
        RecognitionStatus: 'Success',
        NBest: [{ Display: 'Hello.', PronunciationAssessment: { PronScore: 88.26, AccuracyScore: 90 }, Words: [] }],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await handlePronunciation(post('/api/pronunciation?ref=Hello&lang=en-GB', wav()), ENV)
    expect(res.status).toBe(200)
    expect((await res.json()).pron).toBe(88.3)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('japaneast.stt.speech.microsoft.com')
    expect(String(url)).toContain('language=en-GB')
    const header = (init!.headers as Record<string, string>)['Pronunciation-Assessment']
    const params = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(header), (c) => c.charCodeAt(0))))
    expect(params.ReferenceText).toBe('Hello')
    expect(params.EnableProsodyAssessment).toBeUndefined()
  })

  it('短すぎる録音・未対応言語は 400', async () => {
    expect((await handleStt(post('/api/stt?lang=en-US', wav(100)), ENV)).status).toBe(400)
    expect((await handleStt(post('/api/stt?lang=fr-FR', wav()), ENV)).status).toBe(400)
  })

  it('文字起こし結果を返す', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ RecognitionStatus: 'Success', DisplayText: '明日の夜間作業' })))
    const res = await handleStt(post('/api/stt?lang=ja-JP', wav()), ENV)
    expect(await res.json()).toEqual({ text: '明日の夜間作業' })
  })
})
