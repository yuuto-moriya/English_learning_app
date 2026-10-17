/**
 * iOS Safari の Audio Session（navigator.audioSession）の切り替え。
 * - 読み上げ・効果音だけのとき：playback（消音スイッチがオンでも聞こえる）
 * - マイクを使っている間：play-and-record（録音しながら再生できる種類。playback のままだと録音と競合することがある）
 * 対応していないブラウザでは何もしない。
 */
type Kind = 'auto' | 'playback' | 'play-and-record'

let capturing = 0

function setKind(kind: Kind) {
  try {
    const s = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (s && s.type !== kind) s.type = kind
  } catch {
    /* 非対応 */
  }
}

/** 再生用にする（マイクを使っている間は変えない） */
export function preferPlayback() {
  if (typeof navigator === 'undefined' || capturing > 0) return
  setKind('playback')
}

/** マイクを使い始める。終わったら必ず endCapture を1回呼ぶ */
export function beginCapture(): () => void {
  capturing++
  setKind('play-and-record')
  let done = false
  return () => {
    if (done) return
    done = true
    capturing = Math.max(0, capturing - 1)
    if (capturing === 0) setKind('playback')
  }
}
