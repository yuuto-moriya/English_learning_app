/**
 * マイク録音 → 16kHz/モノラル/16bit PCM の WAV を作る。
 * Azure Speech の短い音声用REST APIはこの形式を受け付ける。
 * iOSのホーム画面アプリ(PWA)でも getUserMedia + Web Audio は利用可能。
 */
export const TARGET_RATE = 16000
export const MAX_SECONDS = 28

export interface Recording {
  wav: Blob
  url: string
  seconds: number
}

export const recorderAvailable =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== 'undefined'

export class WavRecorder {
  private ctx?: AudioContext
  private stream?: MediaStream
  private node?: ScriptProcessorNode
  private source?: MediaStreamAudioSourceNode
  private chunks: Float32Array[] = []
  private rate = 48000
  private lastLevel = 0
  private timer?: ReturnType<typeof setTimeout>
  onAutoStop?: () => void

  async start() {
    this.chunks = []
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    this.rate = this.ctx.sampleRate
    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.node = this.ctx.createScriptProcessor(4096, 1, 1)
    this.node.onaudioprocess = (e) => {
      const data = new Float32Array(e.inputBuffer.getChannelData(0))
      this.chunks.push(data)
      let sum = 0
      for (let i = 0; i < data.length; i += 8) sum += data[i] * data[i]
      this.lastLevel = Math.min(1, Math.sqrt(sum / (data.length / 8)) * 4)
    }
    this.source.connect(this.node)
    this.node.connect(this.ctx.destination)
    this.timer = setTimeout(() => this.onAutoStop?.(), MAX_SECONDS * 1000)
  }

  level(): number {
    return this.lastLevel
  }

  async stop(): Promise<Recording> {
    clearTimeout(this.timer)
    this.node?.disconnect()
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    await this.ctx?.close().catch(() => undefined)
    const merged = merge(this.chunks)
    const pcm = downsample(merged, this.rate, TARGET_RATE)
    const trimmed = trimSilence(pcm)
    const wav = encodeWav(trimmed, TARGET_RATE)
    return { wav, url: URL.createObjectURL(wav), seconds: trimmed.length / TARGET_RATE }
  }

  cancel() {
    clearTimeout(this.timer)
    this.node?.disconnect()
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.ctx?.close().catch(() => undefined)
  }
}

function merge(chunks: Float32Array[]): Float32Array {
  const len = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Float32Array(len)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

export function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input
  const ratio = from / to
  const len = Math.floor(input.length / ratio)
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    // 区間平均による簡易ローパス
    const start = Math.floor(i * ratio)
    const end = Math.min(input.length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = start; j < end; j++) sum += input[j]
    out[i] = sum / Math.max(1, end - start)
  }
  return out
}

/** 前後の無音を除去（前後0.25秒は残す） */
export function trimSilence(pcm: Float32Array, threshold = 0.012): Float32Array {
  const win = 320
  let s = 0
  let e = pcm.length
  const rms = (a: number) => {
    let sum = 0
    for (let i = a; i < Math.min(pcm.length, a + win); i++) sum += pcm[i] * pcm[i]
    return Math.sqrt(sum / win)
  }
  while (s < pcm.length && rms(s) < threshold) s += win
  while (e > s && rms(Math.max(0, e - win)) < threshold) e -= win
  const pad = TARGET_RATE / 4
  s = Math.max(0, s - pad)
  e = Math.min(pcm.length, e + pad)
  return e - s > TARGET_RATE / 5 ? pcm.subarray(s, e) : pcm
}

export function encodeWav(samples: Float32Array, rate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let o = 44
  for (let i = 0; i < samples.length; i++, o += 2) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
