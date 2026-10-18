import { plain, sayHint } from './vocab'
import { getSettings } from './settings'
import { getHealth, ttsUrl, apiHeaders } from './api'
import { accentInfo, NEURAL_VOICES, type Accent, type NeuralVoice } from './accents'
import { preferPlayback } from './audioSession'

export { NEURAL_VOICES, type NeuralVoice }

/**
 * 読み上げ。2つの方式を自動で使い分ける。
 *
 * 1. 高品質音声（Azure AI Speech のニューラル音声）… サーバー（/api/tts）が設定済みで通信できるとき。
 *    一度聞いた音声は端末に保存（Cache Storage）し、次からはオフラインでもすぐ再生する。
 * 2. 端末の音声合成（Web Speech API）… 未設定・オフライン・失敗したときの代わり。
 *    おもちゃ用の声（Bells・Zarvox など）は除外し、Premium / Enhanced / Natural の声を優先する。
 *
 * 話者を変えて聞く（voice: 'random'）と、同じ語を複数の声で聞けるので聞き取りの汎化に役立つ
 * （Barcroft & Sommers, 2005 / 高変動音声訓練）。
 */
export type { Accent } from './accents'
/** main = 既定の声、alt = もう一人の話者（会話の相手役）、random = 毎回ちがう声 */
export type VoiceRole = 'main' | 'alt' | 'random'

export interface SpeakOptions {
  accent?: Accent
  rate?: number
  onStart?: () => void
  voice?: VoiceRole
}

// ───────── ニューラル音声（Azure） ─────────

/** 和訳・案内を読む日本語の高品質音声（女性・男性の2つから選べる） */
export const NEURAL_JA_VOICES = [
  { id: 'ja-JP-NanamiNeural', name: 'Nanami', gender: 'F' },
  { id: 'ja-JP-KeitaNeural', name: 'Keita', gender: 'M' },
] as const
const neuralJa = () => NEURAL_JA_VOICES.find((v) => v.id === getSettings().neuralJa)?.id ?? NEURAL_JA_VOICES[0].id

let neuralAvailable: boolean | null = null
let neuralFailures = 0

/** /api/health の結果を反映（起動時とオンライン復帰時に確認） */
export function refreshNeural(force = false) {
  return getHealth(force).then((h) => {
    neuralAvailable = !!h?.tts
    if (neuralAvailable) neuralFailures = 0
    return neuralAvailable
  })
}
if (typeof window !== 'undefined') {
  void refreshNeural()
  window.addEventListener('online', () => void refreshNeural(true))
}

export function neuralEnabled(): boolean {
  return getSettings().voiceEngine === 'auto' && neuralAvailable === true && neuralFailures < 3
}

export function isNeuralActive(): boolean {
  return neuralEnabled()
}

function neuralVoice(accent: Accent, role: VoiceRole = 'main'): string {
  const list = NEURAL_VOICES[accent] ?? NEURAL_VOICES['en-US']
  const mainId = getSettings().neural?.[accent]
  const main = list.find((v) => v.id === mainId) ?? list[0]
  if (role === 'alt') return (list.find((v) => v.gender !== main.gender) ?? list[1] ?? main).id
  if (role === 'random') return list[Math.floor(Math.random() * list.length)].id
  return main.id
}

/** 端末の速度（0.6〜1.2）を SSML の速度（%）に。5%刻みにしてキャッシュを効かせる */
export function ratePercent(rate: number): number {
  const p = Math.round(((rate - 1) * 100) / 5) * 5
  return Math.max(-50, Math.min(50, p))
}

const CACHE_NAME = 'tts-v1'
const mem = new Map<string, Promise<string>>()
const MEM_MAX = 160

function remember(key: string, p: Promise<string>) {
  mem.set(key, p)
  if (mem.size > MEM_MAX) {
    const oldest = mem.keys().next().value as string
    const old = mem.get(oldest)
    mem.delete(oldest)
    old?.then((u) => URL.revokeObjectURL(u)).catch(() => undefined)
  }
}

async function loadAudio(text: string, voice: string, pct: number, ph?: string): Promise<string> {
  const url = ttsUrl(text, voice, pct, ph)
  let cache: Cache | undefined
  try {
    cache = await caches.open(CACHE_NAME)
    const hit = await cache.match(url)
    if (hit) return URL.createObjectURL(await hit.blob())
  } catch {
    cache = undefined
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline')
  const res = await fetch(url, { headers: apiHeaders() })
  if (!res.ok || !(res.headers.get('content-type') ?? '').includes('audio')) throw new Error(`tts ${res.status}`)
  const blob = await res.blob()
  if (blob.size < 200) throw new Error('tts empty')
  try {
    await cache?.put(url, new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } }))
  } catch {
    /* 容量不足などは無視 */
  }
  return URL.createObjectURL(blob)
}

function audioFor(text: string, voice: string, pct: number, ph?: string): Promise<string> {
  const key = `${voice}|${pct}|${text}|${ph ?? ''}`
  const hit = mem.get(key)
  if (hit) return hit
  const p = loadAudio(text, voice, pct, ph)
  remember(key, p)
  p.catch(() => mem.delete(key))
  return p
}

/**
 * 品詞で読みが変わる語（live, record など）を単語だけで読むときは、その品詞の発音を指定する。
 * 米国の声だけ（発音は米音）。サーバーが指定を受け付けなかったら以後は使わない。
 */
let phonemeOk = true
function neuralAudio(text: string, accent: Accent, voice: string, pct: number): Promise<string> {
  const ph = phonemeOk && accent === 'en-US' ? sayHint(text) : undefined
  if (!ph) return audioFor(text, voice, pct)
  return audioFor(text, voice, pct, ph).catch((e: unknown) => {
    if (e instanceof Error && e.message === 'tts 400') phonemeOk = false
    return audioFor(text, voice, pct)
  })
}

/** これから読む文を先に取得しておく（高品質音声のときだけ。再生はしない） */
export function prefetchSpeech(items: { text: string; accent?: Accent; voice?: VoiceRole; rate?: number }[]) {
  if (!neuralEnabled()) return
  const s = getSettings()
  for (const it of items.slice(0, 12)) {
    const t = plain(it.text).trim()
    if (!t || t.length > 400) continue
    // random は再生時に声が変わるので先読みしない
    if (it.voice === 'random') continue
    const accent = it.accent ?? s.accent
    neuralAudio(t, accent, neuralVoice(accent, it.voice), ratePercent(it.rate ?? s.rate)).catch(() => undefined)
  }
}

// ───────── 再生の共通処理 ─────────

let audioEl: HTMLAudioElement | null = null
function el(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.preload = 'auto'
    ;(audioEl as HTMLAudioElement & { playsInline?: boolean }).playsInline = true
  }
  return audioEl
}

/** 44byte の無音 WAV。最初のタップで再生して、以後の自動再生を許可してもらう（iOS） */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='
let unlocked = false

/** タップ操作の中で呼ぶ：音声の再生を許可してもらう（iOS Safari は操作なしの再生を止める） */
export function primeAudio() {
  if (typeof window === 'undefined') return
  // 消音スイッチがオンでも読み上げが聞こえるように（マイクを使っている間は変えない）
  preferPlayback()
  if (unlocked) return
  const a = el()
  if (!a.src || a.src === SILENT_WAV || a.paused) {
    a.src = SILENT_WAV
    a.play()
      .then(() => {
        unlocked = true
      })
      .catch(() => undefined)
  }
}
if (typeof document !== 'undefined') {
  const onFirst = () => {
    primeAudio()
    if (unlocked) {
      document.removeEventListener('touchend', onFirst, true)
      document.removeEventListener('click', onFirst, true)
    }
  }
  document.addEventListener('touchend', onFirst, true)
  document.addEventListener('click', onFirst, true)
}

interface Playing {
  finish: (ok: boolean) => void
  cancel: () => void
}
/** 再生中（または再生待ち）の発話。キャンセル時は false で確定させる */
let current: Playing | null = null
/** speak() の世代。stopSpeaking() と新しい speak() で増やし、取得待ちの古い音声を捨てる */
let seq = 0

function settleCurrent() {
  const p = current
  current = null
  p?.cancel()
  p?.finish(false)
}

function playUrl(url: string, onStart?: () => void): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    settleCurrent()
    synth?.cancel()
    const a = el()
    let settled = false
    let started = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      a.onplaying = a.onended = a.onerror = null
      clearTimeout(timer)
      if (current?.finish === finish) current = null
      resolve(ok)
    }
    a.onplaying = () => {
      if (started) return
      started = true
      onStart?.()
    }
    a.onended = () => finish(true)
    a.onerror = () => finish(false)
    current = { finish, cancel: () => a.pause() }
    a.src = url
    a.playbackRate = 1
    // 再生が始まらないまま固まった場合の保険
    const timer = setTimeout(() => {
      if (!started) finish(false)
    }, 8000)
    a.play().catch(() => finish(false))
  })
}

// ───────── 端末の音声合成（Web Speech API） ─────────

const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' ? window.speechSynthesis : undefined
let voices: SpeechSynthesisVoice[] = []

function refreshVoices() {
  if (!synth) return
  voices = synth.getVoices()
}
if (synth) {
  refreshVoices()
  synth.addEventListener?.('voiceschanged', refreshVoices)
}

export const ttsAvailable = !!synth

/**
 * 遊び用・旧式の声（学習に向かない）。iPhone を日本語で使っていると名前が日本語になる（オルガン・ささやき声・トリノイド…）ので、
 * 英語名だけでなく voiceURI（言語に関係なく英語の ID）と日本語名でも見分ける。
 */
const NOVELTY =
  /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Deranged|Hysterical|Pipe Organ|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i
const NOVELTY_JA =
  /^(アルバート|悪い知らせ|バッドニュース|ベル|ボイン|ブーイング|バブル|泡|チェロ|良い知らせ|グッドニュース|道化|オルガン|パイプオルガン|スーパースター|トリノイド|ささやき|震え|ザーボックス|ザルボックス|錯乱|ヒステリック|エディ|フロー|おばあちゃん|おじいちゃん|リード|ロッコ|サンディ|シェリー|フレッド|ジュニア|ラルフ|キャシー|プリンセス|ヴィッキー|ビッキー|ヴィクトリア|ビクトリア|アグネス|ブルース)/
/** macOS 由来の遊び用・旧式の声の ID（com.apple.speech.synthesis.voice.Organ など） */
const LEGACY_URI =
  /speech\.synthesis\.voice\.(Albert|BadNews|Bahh|Bells|Boing|Bubbles|Cellos|GoodNews|Jester|Organ|PipeOrgan|Superstar|Trinoids|Whisper|Wobble|Zarvox|Deranged|Hysterical|Fred|Junior|Ralph|Kathy|Princess|Vicki|Victoria|Agnes|Bruce)\b/i
const OLD_MACINTALK = /^(Fred|Junior|Ralph|Kathy|Princess|Vicki|Victoria|Agnes|Bruce)\b/i
const GOOD_APPLE =
  /^(Samantha|Ava|Allison|Susan|Zoe|Evan|Nathan|Joelle|Noelle|Tom|Nicky|Aaron|Alex|Daniel|Kate|Serena|Arthur|Martha|Oliver|Stephanie|Jamie|Siri)\b/i

/** iPhone・Mac の日本語の標準の声（遊び用の声と区別する） */
const GOOD_APPLE_JA = /^(Kyoko|Otoya|O-ren|Hattori)\b/i

/** 声の品質の目安（大きいほど良い。負の値は使わない） */
export function voiceQuality(v: Pick<SpeechSynthesisVoice, 'name' | 'voiceURI'>): number {
  const id = `${v.voiceURI} ${v.name}`
  if (NOVELTY.test(v.name) || NOVELTY_JA.test(v.name) || OLD_MACINTALK.test(v.name)) return -1
  if (/eloquence/i.test(v.voiceURI) || LEGACY_URI.test(v.voiceURI)) return -1
  if (/premium/i.test(id)) return 100
  if (/microsoft/i.test(id) && /(natural|online)/i.test(id)) return 95
  if (/enhanced/i.test(id)) return 85
  if (/^Google/i.test(v.name)) return 60
  if (GOOD_APPLE.test(v.name) || GOOD_APPLE_JA.test(v.name)) return 50
  return 20
}

const langOf = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase()

/** その言語の声（品質の高い順。遊び用の声は除く） */
export function listVoices(accent: Accent | 'ja-JP'): SpeechSynthesisVoice[] {
  refreshVoices()
  const want = accent.toLowerCase()
  return voices
    .filter((v) => langOf(v) === want && voiceQuality(v) >= 0)
    // 同じ品質なら、端末の既定の声（iPhone の「読み上げ」で選んだ声）を先に
    .sort((a, b) => voiceQuality(b) - voiceQuality(a) || Number(!!b.default) - Number(!!a.default) || a.name.localeCompare(b.name))
}

/** その発音の端末の声。なければ近い発音の声（オーストラリア → イギリスなど） */
export function voicesFor(accent: Accent): SpeechSynthesisVoice[] {
  for (const a of [accent, ...accentInfo(accent).fallback]) {
    const list = listVoices(a)
    if (list.length) return list
  }
  return []
}

export function pickVoice(accent: Accent, preferred?: string, role: VoiceRole = 'main'): SpeechSynthesisVoice | undefined {
  const list = voicesFor(accent)
  const main = (preferred && list.find((x) => x.name === preferred)) || list[0]
  if (role === 'main' || list.length < 2) return main
  const good = list.filter((v) => voiceQuality(v) >= 50 && v !== main)
  const pool = good.length ? good : list.filter((v) => v !== main)
  if (role === 'alt') return pool[0] ?? main
  const all = [main, ...pool].filter(Boolean) as SpeechSynthesisVoice[]
  return all[Math.floor(Math.random() * all.length)]
}

function sayDevice(u: SpeechSynthesisUtterance, est: number, onStart?: () => void): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!synth) return resolve(false)
    settleCurrent()
    synth.cancel()
    let settled = false
    let started = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (current?.finish === finish) current = null
      resolve(ok)
    }
    u.onstart = () => {
      started = true
      onStart?.()
    }
    u.onend = () => finish(true)
    u.onerror = () => finish(false)
    current = { finish, cancel: () => undefined }
    synth.speak(u)
    // iOSで onend が来ないまま止まるバグ対策：一定時間後に発話が終わっていれば確定させる。
    // 発話が始まっていた（onstart済み）なら最後まで読めたとみなし、始まらなかった場合は失敗扱い。
    // speaking のまま固まるケースもあるため、見積もりの3倍を上限に打ち切る。
    const deadline = Date.now() + est * 3 + 10000
    const check = () => {
      if (settled) return
      if (synth.speaking && Date.now() < deadline) timer = setTimeout(check, 2000)
      else finish(started)
    }
    timer = setTimeout(check, est + 4000)
  })
}

function speakDevice(t: string, accent: Accent, rate: number, opts: SpeakOptions): Promise<boolean> {
  if (!synth) return Promise.resolve(false)
  const s = getSettings()
  const u = new SpeechSynthesisUtterance(t)
  const v = pickVoice(accent, s.deviceVoice?.[accent], opts.voice)
  u.lang = v?.lang.replace('_', '-') ?? accent
  if (v) u.voice = v
  u.rate = rate
  u.pitch = 1
  const est = Math.max(3000, (t.length * 140) / (u.rate || 1))
  return sayDevice(u, est, opts.onStart)
}

/**
 * 音声の取得を待っている間も「再生中」として登録し、stopSpeaking() や次の speak() で
 * false に確定できるようにする。取得できたら release() で外してから再生する。
 */
function holdCurrent() {
  let resolveWait: (ok: boolean) => void = () => undefined
  const waiting = new Promise<boolean>((r) => (resolveWait = r))
  const placeholder: Playing = { finish: (ok) => resolveWait(ok), cancel: () => undefined }
  current = placeholder
  return {
    waiting,
    release: () => {
      if (current === placeholder) current = null
    },
  }
}

/**
 * 英文を読み上げる。
 * 戻り値: 最後まで読み上げた場合のみ true。エラー・キャンセル（別の speak / stopSpeaking）・
 * 再生が始まらずタイムアウトした場合は false。結果を使わない呼び出し側はそのまま無視してよい。
 */
export function speak(text: string, opts: SpeakOptions = {}): Promise<boolean> {
  const t = plain(text).trim()
  if (!t) return Promise.resolve(false)
  const s = getSettings()
  const accent = opts.accent ?? s.accent
  const rate = opts.rate ?? s.rate
  const my = ++seq
  settleCurrent()
  synth?.cancel()
  if (neuralEnabled() && t.length <= 400) {
    const { waiting, release } = holdCurrent()
    const run = neuralAudio(t, accent, neuralVoice(accent, opts.voice), ratePercent(rate)).then(
      (url) => {
        if (my !== seq) return false
        release()
        neuralFailures = 0
        return playUrl(url, opts.onStart)
      },
      () => {
        if (my !== seq) return false
        release()
        neuralFailures++
        return speakDevice(t, accent, rate, opts)
      },
    )
    return Promise.race([waiting, run])
  }
  return speakDevice(t, accent, rate, opts)
}

/** 日本語の読み上げ（耳で復習の和訳など） */
export function speakJa(text: string, rate = 1): Promise<boolean> {
  const my = ++seq
  settleCurrent()
  synth?.cancel()
  if (neuralEnabled() && text.length <= 400) {
    const { waiting, release } = holdCurrent()
    const run = audioFor(text, neuralJa(), ratePercent(rate)).then(
      (url) => {
        if (my !== seq) return false
        release()
        return playUrl(url)
      },
      () => {
        if (my !== seq) return false
        release()
        return speakJaDevice(text, rate)
      },
    )
    return Promise.race([waiting, run])
  }
  return speakJaDevice(text, rate)
}

function speakJaDevice(text: string, rate: number): Promise<boolean> {
  if (!synth) return Promise.resolve(false)
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  const list = listVoices('ja-JP')
  const pref = getSettings().deviceVoiceJa
  const v = (pref && list.find((x) => x.name === pref)) || list[0]
  if (v) u.voice = v
  u.rate = rate
  const est = Math.max(3000, (text.length * 250) / (rate || 1))
  return sayDevice(u, est)
}

/** タップ操作の中で呼ぶ：iOS は最初の読み上げを操作の中で行う必要がある */
export function warmUpSpeech() {
  primeAudio()
  if (!synth || neuralEnabled()) return
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    synth.speak(u)
  } catch {
    /* noop */
  }
}

export function stopSpeaking() {
  seq++
  settleCurrent()
  synth?.cancel()
  audioEl?.pause()
}

export function isSpeaking(): boolean {
  return !!synth?.speaking || (!!audioEl && !audioEl.paused && audioEl.src !== SILENT_WAV)
}
