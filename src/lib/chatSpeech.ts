/** AI と会話の、声のやりとりの区切り（いつ送るか・どこまで読み上げるか） */

/**
 * 話し終えてから自動で送るまでの待ち（ミリ秒）。音声認識は 0.6 秒黙ると文を区切るので、その後の待ち。
 * 文が . ? ! で終わっていれば短く、and・but・um などで終わっていたら（考えている途中）長く待つ。「ゆっくり話す」ならさらに長く
 */
const MID_SENTENCE = /\b(and|but|so|because|or|um+|uh+|er+|like|the|a|an|to|of|with|my|i)[.,]?$/i
export function autoSendDelay(said: string, slow: boolean): number {
  const t = said.trim()
  const base = MID_SENTENCE.test(t) ? 1800 : /[.!?]$/.test(t) ? 600 : 1000
  return base + (slow ? 1200 : 0)
}

/** 書き終えた文の終わりの位置（ここまでは読み上げてよい）。「10 a.m.」のような略語の点は、後ろに文字が続くまで待つ */
export function sentenceEnd(text: string, complete: boolean): number {
  if (complete) return text.length
  let end = 0
  for (const m of text.matchAll(/[.!?]["')\]]*\s+(?=[A-Z"'])/g)) end = m.index! + m[0].length
  return end
}

/** 文に分ける（読み上げを1文ずつにして、最初の声を早く出す） */
export const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?]["')\]]*)\s+(?=[A-Z"'])/)
    .map((x) => x.trim())
    .filter(Boolean)
