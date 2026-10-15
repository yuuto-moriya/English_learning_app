import { fetchUpstream, json, MAX_TEXT_CHARS, upstreamJson, type Env } from '../../server/shared'

type Lang = 'en' | 'ja'

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'ja'

type AzureTranslateResponse = {
  detectedLanguage?: { language?: string }
  translations?: { text?: string; to?: string }[]
}[]

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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
