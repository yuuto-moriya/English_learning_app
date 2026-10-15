/**
 * API ハンドラ本体（Web 標準の Request/Response のみを使うので、実行基盤に依存しない）。
 * Vercel Functions のエントリポイントは /api/*.ts。
 */
import {
  ALLOWED_LANGS,
  audioTooLarge,
  checkToken,
  fetchUpstream,
  json,
  MAX_AUDIO_BYTES,
  MAX_TEXT_CHARS,
  normalizePronunciation,
  readAudio,
  speechUrl,
  toBase64Utf8,
  upstreamJson,
  type AzureSttResponse,
  type Env,
} from './shared.js'

/** トークン確認（health 以外）と、想定外の例外を JSON の 500 にする共通ラッパー */
export async function guard(
  request: Request,
  env: Env,
  handler: () => Promise<Response> | Response,
  opts: { public?: boolean } = {},
): Promise<Response> {
  if (!opts.public) {
    const denied = checkToken(request, env)
    if (denied) return denied
  }
  try {
    return await handler()
  } catch (e) {
    // 想定外の例外でもクライアントには必ずJSONを返す（HTMLの500にしない）
    console.error(e)
    return json({ error: 'サーバーエラーが発生しました' }, 500)
  }
}

/** GET /api/health — 各APIが設定済みかどうか（キーそのものは返さない） */
export function handleHealth(env: Env): Response {
  return json({
    translator: !!(env.AZURE_TRANSLATOR_KEY && env.AZURE_TRANSLATOR_REGION),
    speech: !!(env.AZURE_SPEECH_KEY && (env.AZURE_SPEECH_REGION || env.AZURE_SPEECH_ENDPOINT)),
    tokenRequired: !!env.APP_ACCESS_TOKEN,
  })
}

type Lang = 'en' | 'ja'
const isLang = (v: unknown): v is Lang => v === 'en' || v === 'ja'

type AzureTranslateResponse = {
  detectedLanguage?: { language?: string }
  translations?: { text?: string; to?: string }[]
}[]

/** POST /api/translate — { text, to, from? } を Azure Translator で翻訳 */
export async function handleTranslate(request: Request, env: Env): Promise<Response> {
  if (!env.AZURE_TRANSLATOR_KEY || !env.AZURE_TRANSLATOR_REGION) {
    return json({ error: '翻訳API（Azure Translator）が未設定です' }, 503)
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'リクエスト形式が不正です' }, 400)
  }
  // null・配列・text が文字列でない場合などは TypeError にせず 400 を返す
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'リクエスト形式が不正です' }, 400)
  const b = body as Record<string, unknown>
  if (typeof b.text !== 'string') return json({ error: 'テキストが不正です' }, 400)
  const text = b.text.trim()
  const to = b.to ?? 'en'
  const from = b.from ?? undefined
  if (!text) return json({ error: 'テキストが空です' }, 400)
  if (text.length > MAX_TEXT_CHARS) return json({ error: `${MAX_TEXT_CHARS}文字以内で入力してください` }, 413)
  if (!isLang(to) || (from !== undefined && from !== '' && !isLang(from))) {
    return json({ error: '対応言語は en / ja です' }, 400)
  }

  const endpoint = (env.AZURE_TRANSLATOR_ENDPOINT ?? 'https://api.cognitive.microsofttranslator.com').replace(/\/$/, '')
  const url = new URL(`${endpoint}/translate`)
  url.searchParams.set('api-version', '3.0')
  url.searchParams.set('to', to)
  if (isLang(from)) url.searchParams.set('from', from)

  const res = await fetchUpstream(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_TRANSLATOR_KEY,
      'Ocp-Apim-Subscription-Region': env.AZURE_TRANSLATOR_REGION,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify([{ Text: text }]),
  })
  if (!res) return json({ error: '翻訳APIに接続できませんでした' }, 502)
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const quota = res.status === 403 || res.status === 429
    return json({ error: quota ? '翻訳APIの無料枠または回数制限に達しました' : `翻訳APIエラー (${res.status})`, detail: detail.slice(0, 300) }, 502)
  }
  const data = await upstreamJson<AzureTranslateResponse>(res)
  if (!Array.isArray(data)) return json({ error: '翻訳APIの応答を読み取れませんでした' }, 502)
  const first = data[0]
  const out = first?.translations?.[0]?.text
  return json({ text: typeof out === 'string' ? out : '', detected: first?.detectedLanguage?.language })
}

const speechConfigured = (env: Env) => !!env.AZURE_SPEECH_KEY && !!(env.AZURE_SPEECH_REGION || env.AZURE_SPEECH_ENDPOINT)

/** POST /api/pronunciation?ref=…&lang=… — 録音(WAV 16kHz mono)と目標文から Azure Speech の発音評価を返す */
export async function handlePronunciation(request: Request, env: Env): Promise<Response> {
  if (!speechConfigured(env)) return json({ error: '音声API（Azure Speech）が未設定です' }, 503)
  const url = new URL(request.url)
  const ref = (url.searchParams.get('ref') ?? '').replace(/\*/g, '').trim()
  const lang = url.searchParams.get('lang') ?? 'en-US'
  if (!ref || ref.length > 600) return json({ error: '目標文が不正です' }, 400)
  if (!ALLOWED_LANGS.has(lang)) return json({ error: '未対応の言語です' }, 400)
  if (audioTooLarge(request)) return json({ error: '録音が長すぎます（30秒以内）' }, 413)

  const audio = await readAudio(request)
  if (!audio) return json({ error: '録音データを読み取れませんでした' }, 400)
  if (audio.byteLength < 2000) return json({ error: '録音が短すぎます' }, 400)
  if (audio.byteLength > MAX_AUDIO_BYTES) return json({ error: '録音が長すぎます（30秒以内）' }, 413)

  const params: Record<string, string> = {
    ReferenceText: ref,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: 'True',
  }
  // プロソディ評価は en-US のみ対応（Azure のドキュメント上）。他言語では送らない
  if (lang === 'en-US') params.EnableProsodyAssessment = 'True'

  const res = await fetchUpstream(speechUrl(env, lang, true), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY!,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      Accept: 'application/json',
      'Pronunciation-Assessment': toBase64Utf8(JSON.stringify(params)),
    },
    body: audio,
  })
  if (!res) return json({ error: '音声APIに接続できませんでした' }, 502)
  if (!res.ok) {
    const quota = res.status === 403 || res.status === 429
    return json({ error: quota ? '音声APIの無料枠または回数制限に達しました' : `音声APIエラー (${res.status})` }, 502)
  }
  const data = await upstreamJson<AzureSttResponse>(res)
  if (!data || typeof data !== 'object') return json({ error: '音声APIの応答を読み取れませんでした' }, 502)
  if (data.RecognitionStatus !== 'Success') {
    return json({ error: '音声を認識できませんでした。静かな場所でもう一度お試しください' }, 422)
  }
  const out = normalizePronunciation(data)
  if (!out) return json({ error: '評価結果を取得できませんでした' }, 422)
  return json(out)
}

/** POST /api/stt?lang=… — 音声入力（翻訳画面のマイク）用の文字起こし */
export async function handleStt(request: Request, env: Env): Promise<Response> {
  if (!speechConfigured(env)) return json({ error: '音声API（Azure Speech）が未設定です' }, 503)
  const lang = new URL(request.url).searchParams.get('lang') ?? 'en-US'
  if (!ALLOWED_LANGS.has(lang)) return json({ error: '未対応の言語です' }, 400)
  if (audioTooLarge(request)) return json({ error: '録音が長すぎます' }, 413)

  const audio = await readAudio(request)
  if (!audio) return json({ error: '録音データを読み取れませんでした' }, 400)
  if (audio.byteLength < 2000) return json({ error: '録音が短すぎます' }, 400)
  if (audio.byteLength > MAX_AUDIO_BYTES) return json({ error: '録音が長すぎます' }, 413)

  const res = await fetchUpstream(speechUrl(env, lang, false), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY!,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      Accept: 'application/json',
    },
    body: audio,
  })
  if (!res) return json({ error: '音声APIに接続できませんでした' }, 502)
  if (!res.ok) {
    const quota = res.status === 403 || res.status === 429
    return json({ error: quota ? '音声APIの無料枠または回数制限に達しました' : `音声APIエラー (${res.status})` }, 502)
  }
  const data = await upstreamJson<AzureSttResponse>(res)
  if (!data || typeof data !== 'object') return json({ error: '音声APIの応答を読み取れませんでした' }, 502)
  if (data.RecognitionStatus !== 'Success') return json({ error: '音声を認識できませんでした' }, 422)
  return json({ text: typeof data.DisplayText === 'string' ? data.DisplayText : '' })
}
