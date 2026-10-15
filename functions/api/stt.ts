import { ALLOWED_LANGS, json, MAX_AUDIO_BYTES, speechUrl, type AzureSttResponse, type Env } from '../../server/shared'

/** 音声入力（翻訳画面のマイク）用の文字起こし */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AZURE_SPEECH_KEY || !(env.AZURE_SPEECH_REGION || env.AZURE_SPEECH_ENDPOINT)) {
    return json({ error: '音声API（Azure Speech）が未設定です' }, 503)
  }
  const lang = new URL(request.url).searchParams.get('lang') ?? 'en-US'
  if (!ALLOWED_LANGS.has(lang)) return json({ error: '未対応の言語です' }, 400)
  const audio = await request.arrayBuffer()
  if (audio.byteLength < 2000) return json({ error: '録音が短すぎます' }, 400)
  if (audio.byteLength > MAX_AUDIO_BYTES) return json({ error: '録音が長すぎます' }, 413)

  const res = await fetch(speechUrl(env, lang, false), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      Accept: 'application/json',
    },
    body: audio,
  })
  if (!res.ok) return json({ error: `音声APIエラー (${res.status})` }, 502)
  const data = (await res.json()) as AzureSttResponse
  if (data.RecognitionStatus !== 'Success') return json({ error: '音声を認識できませんでした' }, 422)
  return json({ text: data.DisplayText ?? '' })
}
