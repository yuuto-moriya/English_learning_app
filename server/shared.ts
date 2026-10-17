/** API 共通処理（Azure呼び出し・レスポンス正規化）。Web 標準 API のみ使用 */

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

/** Content-Length が音声の上限を超えていれば、本文を読み込む前に拒否できるよう true を返す */
export function audioTooLarge(request: Request): boolean {
  const len = Number(request.headers.get('content-length') ?? '')
  return Number.isFinite(len) && len > MAX_AUDIO_BYTES
}

/** リクエスト本文を ArrayBuffer で読む（切断などで読めなければ null） */
export async function readAudio(request: Request): Promise<ArrayBuffer | null> {
  try {
    return await request.arrayBuffer()
  } catch {
    return null
  }
}

/** Azure 等の外部APIを呼ぶ（DNS・接続失敗などで例外になったら null） */
export async function fetchUpstream(url: string | URL, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init)
  } catch {
    return null
  }
}

/** 外部APIのJSON応答を読む（壊れたJSONなら undefined） */
export async function upstreamJson<T>(res: Response): Promise<T | undefined> {
  try {
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

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

/** 一時トークンの発行先（カスタムドメインがあればそちら） */
export function speechTokenUrl(env: Env): string {
  return env.AZURE_SPEECH_ENDPOINT
    ? `${env.AZURE_SPEECH_ENDPOINT.replace(/\/$/, '')}/sts/v1.0/issueToken`
    : `https://${env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`
}

export const ALLOWED_LANGS = new Set(['en-US', 'en-GB', 'ja-JP'])

/** 音声合成（ニューラル音声）の URL。カスタムドメインがあればそちらを使う */
export function ttsEndpoint(env: Env): string {
  return env.AZURE_SPEECH_ENDPOINT
    ? `${env.AZURE_SPEECH_ENDPOINT.replace(/\/$/, '')}/tts/cognitiveservices/v1`
    : `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`
}

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)
}

/** 発音指定に使える IPA（学習者向け表記の記号）。単語1つ分 */
export const PHONEME_RE = /^[a-zɑɒɔəɛɪʊʌɝɚæðθŋʃʒɡˈˌː]{1,40}$/u
export const SINGLE_WORD_RE = /^[A-Za-z][A-Za-z'-]{0,39}$/

/** 学習者向け IPA を Azure の en-US 音素（IPA）表記に寄せる：r → ɹ、長音記号は付けない */
export function azureIpa(ipa: string): string {
  return ipa.replace(/r/g, 'ɹ').replace(/ː/g, '')
}

/**
 * 読み上げ用の SSML。速度は % で指定（-50〜+50）。
 * ph（IPA）があれば単語の発音を指定する（live を「リヴ」と読ませるなど、品詞で読みが変わる語のため）
 */
export function buildSsml(text: string, voice: string, ratePct: number, ph?: string): string {
  const lang = voice.slice(0, 5)
  const rate = `${ratePct >= 0 ? '+' : ''}${ratePct}%`
  const body = ph ? `<phoneme alphabet="ipa" ph="${escapeXml(azureIpa(ph))}">${escapeXml(text)}</phoneme>` : escapeXml(text)
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">` +
    `<voice name="${voice}"><prosody rate="${rate}">${body}</prosody></voice></speak>`
  )
}

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
