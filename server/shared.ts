/** Cloudflare Pages Functions 共通処理（Azure呼び出し・レスポンス正規化） */

export interface Env {
  AZURE_TRANSLATOR_KEY?: string
  AZURE_TRANSLATOR_REGION?: string
  AZURE_TRANSLATOR_ENDPOINT?: string
  AZURE_SPEECH_KEY?: string
  AZURE_SPEECH_REGION?: string
  /** 例: https://<resource>.cognitiveservices.azure.com （任意） */
  AZURE_SPEECH_ENDPOINT?: string
  /** 設定するとクライアントは X-App-Token ヘッダーが必要（無料枠の不正利用防止） */
  APP_ACCESS_TOKEN?: string
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export const MAX_AUDIO_BYTES = 2 * 1024 * 1024
export const MAX_TEXT_CHARS = 5000

export function toBase64Utf8(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function speechUrl(env: Env, lang: string, detailed: boolean): string {
  const base = env.AZURE_SPEECH_ENDPOINT
    ? `${env.AZURE_SPEECH_ENDPOINT.replace(/\/$/, '')}/stt/speech/recognition/conversation/cognitiveservices/v1`
    : `https://${env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
  const q = new URLSearchParams({ language: lang, format: detailed ? 'detailed' : 'simple' })
  return `${base}?${q}`
}

export const ALLOWED_LANGS = new Set(['en-US', 'en-GB', 'ja-JP'])

interface AzurePhoneme {
  Phoneme?: string
  AccuracyScore?: number
  PronunciationAssessment?: { AccuracyScore?: number }
}
interface AzureWord {
  Word?: string
  AccuracyScore?: number
  ErrorType?: string
  PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string }
  Phonemes?: AzurePhoneme[]
}
interface AzureNBest {
  Display?: string
  Lexical?: string
  AccuracyScore?: number
  FluencyScore?: number
  CompletenessScore?: number
  PronScore?: number
  ProsodyScore?: number
  PronunciationAssessment?: {
    AccuracyScore?: number
    FluencyScore?: number
    CompletenessScore?: number
    PronScore?: number
    ProsodyScore?: number
  }
  Words?: AzureWord[]
}
export interface AzureSttResponse {
  RecognitionStatus?: string
  DisplayText?: string
  NBest?: AzureNBest[]
}

const r = (n: number | undefined) => Math.round((n ?? 0) * 10) / 10

/** Azureの発音評価レスポンス（新旧どちらの形式にも対応）をアプリ用に正規化 */
export function normalizePronunciation(data: AzureSttResponse) {
  const nb = data.NBest?.[0]
  if (!nb) return null
  const pa = nb.PronunciationAssessment ?? nb
  return {
    text: nb.Display ?? data.DisplayText ?? '',
    pron: r(pa.PronScore),
    accuracy: r(pa.AccuracyScore),
    fluency: r(pa.FluencyScore),
    completeness: r(pa.CompletenessScore),
    prosody: pa.ProsodyScore === undefined ? undefined : r(pa.ProsodyScore),
    words: (nb.Words ?? []).map((w) => ({
      word: w.Word ?? '',
      accuracy: r(w.PronunciationAssessment?.AccuracyScore ?? w.AccuracyScore),
      error: w.PronunciationAssessment?.ErrorType ?? w.ErrorType ?? 'None',
      phonemes: (w.Phonemes ?? []).map((p) => ({
        p: p.Phoneme ?? '',
        score: r(p.PronunciationAssessment?.AccuracyScore ?? p.AccuracyScore),
      })),
    })),
  }
}

export function checkToken(request: Request, env: Env): Response | null {
  if (!env.APP_ACCESS_TOKEN) return null
  const got = request.headers.get('X-App-Token') ?? ''
  if (got !== env.APP_ACCESS_TOKEN) return json({ error: 'アクセストークンが正しくありません（設定画面で入力してください）' }, 401)
  return null
}
