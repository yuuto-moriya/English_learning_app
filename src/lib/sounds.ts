import { getSettings } from './settings'

/**
 * 効果音（音声ファイルを使わず Web Audio で合成）。設定の「効果音」がオフなら鳴らさない。
 * 正解・不正解・回の終わり・録音の開始と終了など、操作の結果を音でもすぐ分かるようにする。
 */
export type Cue = 'correct' | 'wrong' | 'complete' | 'start' | 'stop' | 'tap'

type Note = { f: number; at: number; len: number; type?: OscillatorType; gain?: number }

const CUES: Record<Cue, Note[]> = {
  // 長3度の上行（明るく短い）
  correct: [
    { f: 1046.5, at: 0, len: 0.09, type: 'triangle' },
    { f: 1318.5, at: 0.075, len: 0.16, type: 'triangle' },
  ],
  // 低く柔らかい2音（責めない音）
  wrong: [
    { f: 311.1, at: 0, len: 0.12, type: 'sine', gain: 0.9 },
    { f: 261.6, at: 0.1, len: 0.2, type: 'sine', gain: 0.9 },
  ],
  // ド・ミ・ソ・ド
  complete: [
    { f: 523.3, at: 0, len: 0.1, type: 'triangle' },
    { f: 659.3, at: 0.09, len: 0.1, type: 'triangle' },
    { f: 784.0, at: 0.18, len: 0.1, type: 'triangle' },
    { f: 1046.5, at: 0.27, len: 0.28, type: 'triangle' },
  ],
  // マイクを開く：上行
  start: [
    { f: 659.3, at: 0, len: 0.07, type: 'sine' },
    { f: 987.8, at: 0.07, len: 0.11, type: 'sine' },
  ],
  // マイクを閉じる：下行
  stop: [
    { f: 987.8, at: 0, len: 0.07, type: 'sine' },
    { f: 659.3, at: 0.07, len: 0.11, type: 'sine' },
  ],
  tap: [{ f: 1760, at: 0, len: 0.03, type: 'sine', gain: 0.5 }],
}

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    try {
      ctx = new C()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined)
  return ctx
}

/** 効果音を鳴らす。音量は控えめ（読み上げの邪魔をしない） */
export function play(cue: Cue, force = false) {
  if (!force && !getSettings().sounds) return
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + 0.01
  const master = c.createGain()
  master.gain.value = 0.11
  master.connect(c.destination)
  for (const n of CUES[cue]) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = n.type ?? 'sine'
    o.frequency.value = n.f
    const peak = n.gain ?? 1
    // クリック音が出ないように、立ち上がり・減衰をつける
    g.gain.setValueAtTime(0.0001, t0 + n.at)
    g.gain.exponentialRampToValueAtTime(peak, t0 + n.at + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.len)
    o.connect(g)
    g.connect(master)
    o.start(t0 + n.at)
    o.stop(t0 + n.at + n.len + 0.02)
  }
}

/** タップ操作の中で呼ぶ：iOS では最初のタップで AudioContext を起こしておく必要がある */
export function unlockSounds() {
  audio()
}
if (typeof document !== 'undefined') {
  const once = () => {
    if (getSettings().sounds) unlockSounds()
    document.removeEventListener('touchend', once, true)
    document.removeEventListener('click', once, true)
  }
  document.addEventListener('touchend', once, true)
  document.addEventListener('click', once, true)
}
