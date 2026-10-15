import { json, MAX_TEXT_CHARS, type Env } from '../../server/shared'

interface Body {
  text?: string
  to?: string
  from?: string
}

const LANGS = new Set(['en', 'ja'])

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AZURE_TRANSLATOR_KEY || !env.AZURE_TRANSLATOR_REGION) {
    return json({ error: '翻訳API（Azure Translator）が未設定です' }, 503)
  }
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return json({ error: 'リクエスト形式が不正です' }, 400)
  }
  const text = (body.text ?? '').trim()
  const to = body.to ?? 'en'
  if (!text) return json({ error: 'テキストが空です' }, 400)
  if (text.length > MAX_TEXT_CHARS) return json({ error: `${MAX_TEXT_CHARS}文字以内で入力してください` }, 413)
  if (!LANGS.has(to) || (body.from && !LANGS.has(body.from))) return json({ error: '対応言語は en / ja です' }, 400)

  const endpoint = (env.AZURE_TRANSLATOR_ENDPOINT ?? 'https://api.cognitive.microsofttranslator.com').replace(/\/$/, '')
  const url = new URL(`${endpoint}/translate`)
  url.searchParams.set('api-version', '3.0')
  url.searchParams.set('to', to)
  if (body.from) url.searchParams.set('from', body.from)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_TRANSLATOR_KEY,
      'Ocp-Apim-Subscription-Region': env.AZURE_TRANSLATOR_REGION,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify([{ Text: text }]),
  })
  if (!res.ok) {
    const detail = await res.text()
    const quota = res.status === 403 || res.status === 429
    return json({ error: quota ? '翻訳APIの無料枠または回数制限に達しました' : `翻訳APIエラー (${res.status})`, detail: detail.slice(0, 300) }, 502)
  }
  const data = (await res.json()) as {
    detectedLanguage?: { language: string }
    translations: { text: string; to: string }[]
  }[]
  return json({ text: data[0]?.translations?.[0]?.text ?? '', detected: data[0]?.detectedLanguage?.language })
}
