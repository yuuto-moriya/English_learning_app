import {
  ALLOWED_LANGS,
  audioTooLarge,
  fetchUpstream,
  json,
  MAX_AUDIO_BYTES,
  normalizePronunciation,
  readAudio,
  speechUrl,
  toBase64Utf8,
  upstreamJson,
  type AzureSttResponse,
  type Env,
} from '../../server/shared'

/** 録音(WAV 16kHz mono) と目標文を受け取り、Azure Speech の発音評価を返す */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AZURE_SPEECH_KEY || !(env.AZURE_SPEECH_REGION || env.AZURE_SPEECH_ENDPOINT)) {
    return json({ error: '音声API（Azure Speech）が未設定です' }, 503)
  }
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
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
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
