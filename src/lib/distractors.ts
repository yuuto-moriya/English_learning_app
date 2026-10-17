import type { Word } from './types'
import type { Sentence } from './sentences'
import { shuffle } from './vocab'

/**
 * 選択式の問題の「まちがいの選択肢（ダミー）」を選ぶ。
 *
 * ランダムに選ぶと、正解とまったく関係のない選択肢になり、なんとなくでも当たってしまう。
 * そこで「正解に似た選択肢」を混ぜる。似ている数（＝難しさ）は学習者のレベルと、その語の覚え具合で決める。
 * - 単語：綴り・音が似た語（adapt / adopt）、同じ分野・同じ品詞でよく使う語
 * - 例文：正解と同じ単語を含む例文、同じ場面の例文
 *
 * ただし「どちらも正解に見える」選択肢は作らない。意味が重なる語（類義語・同じ語の仲間）は除く。
 * 適度に難しい問題の方が記憶に残る（望ましい困難：Bjork, 1994）。もっともらしい誤答の選択肢は、
 * 正解だけでなく関連する知識の想起も促す（Little et al., 2012）。
 */

/** 難しさ。1=やさしい 2=ふつう 3=むずかしい（＝3つのダミーのうち、似た選択肢の数） */
export type Tier = 1 | 2 | 3

export const TIER_LABEL: Record<Tier, string> = { 1: 'やさしい', 2: 'ふつう', 3: 'むずかしい' }

/** 学習者のレベル帯：入門・初級（A1–A2）=0、中級・中上級（B1–B2）=1、上級・専門=2 */
export const levelBand = (lv: number): 0 | 1 | 2 => (lv <= 2 ? 0 : lv <= 4 ? 1 : 2)

/** 覚え具合：覚えたて（安定度3日未満）=0、定着しつつある=1、定着（21日以上）=2 */
export const familiarity = (stability?: number): 0 | 1 | 2 => (!stability || stability < 3 ? 0 : stability < 21 ? 1 : 2)

/**
 * 単語の問題の難しさ（行：覚え具合、列：学習者のレベル帯）
 *              入門・初級  中級・中上級  上級・専門
 * 覚えたて      やさしい    やさしい      ふつう
 * 定着しつつある ふつう      ふつう        むずかしい
 * 定着          ふつう      むずかしい    むずかしい
 */
const TIER_TABLE: Tier[][] = [
  [1, 1, 2],
  [2, 2, 3],
  [2, 3, 3],
]

export function wordTier(o: { learnerLevel: number; stability?: number; retry?: number }): Tier {
  const t = TIER_TABLE[familiarity(o.stability)][levelBand(o.learnerLevel)]
  // 同じ回でまちがえて出し直す問題は、1段やさしくして覚え直しを確かめる
  return (o.retry ? Math.max(1, t - 1) : t) as Tier
}

/** レベル診断の難しさ：その語のレベルで決める（覚え具合は「定着しつつある」と同じ扱いにして、偶然の正解を減らす） */
export const diagnosticTier = (wordLevel: number): Tier => TIER_TABLE[1][levelBand(wordLevel)]

/** リスニングの難しさ：選んだレベルで決め、回の中で正解が続けば上げ、まちがえたら下げる（adjust は −1〜+1） */
export function listeningTier(level: number, adjust = 0): Tier {
  return Math.max(1, Math.min(3, levelBand(level) + 1 + adjust)) as Tier
}

// ───────── 意味の重なり ─────────

const KANJI_KATA = /[㐀-鿿゠-ヿー]/
/** 和訳を意味のまとまりに分ける（「維持する；保守する」→「維持」「保守」）。同じ和訳を何度も分けないよう覚えておく */
const partsCache = new Map<string, string[]>()
function glossParts(ja: string): string[] {
  const hit = partsCache.get(ja)
  if (hit) return hit
  const parts = ja
    .replace(/[（(][^）)]*[）)]/g, '')
    .split(/[；;、,・／/\s]+/)
    .map((p) => p.replace(/(する|させる|される|な|の|に|的な|的)$/, '').trim())
    .filter(Boolean)
  partsCache.set(ja, parts)
  return parts
}

/** 漢字・カタカナが2文字以上続けて共通するか（影響する／影響力、ファイル／ファイル名） */
function commonRun(a: string, b: string, min = 2): boolean {
  for (let i = 0; i + min <= a.length; i++) {
    const s = a.slice(i, i + min)
    if ([...s].every((c) => KANJI_KATA.test(c)) && b.includes(s)) return true
  }
  return false
}

/** 意味が重なる（両方とも正解に見えるおそれがある） */
export function meaningOverlap(a: string, b: string): boolean {
  if (a === b) return true
  const pa = glossParts(a)
  const pb = new Set(glossParts(b))
  if (pa.some((p) => pb.has(p))) return true
  return commonRun(a, b)
}

/** 漢字を1字でも共有するか（似た選択肢には、意味の近さを疑われないよう漢字を共有しない語だけを使う） */
function sharesKanji(a: string, b: string): boolean {
  for (const c of a) if (/[㐀-鿿]/.test(c) && b.includes(c)) return true
  return commonRun(a, b)
}

// ───────── 綴りの近さ ─────────

/** 綴りの近さ 0〜1（1文字の入れ替えも1回と数える編集距離から） */
export function formSimilarity(a: string, b: string): number {
  a = a.toLowerCase()
  b = b.toLowerCase()
  const n = a.length
  const m = b.length
  if (!n || !m) return 0
  // 長さが大きく違えば、それだけで似ていない（計算を省く）
  if (Math.abs(n - m) / Math.max(n, m) > 0.5) return 0
  // 3行だけ持って計算する（2つ前の行は入れ替えの判定に使う）
  let prev2 = new Array<number>(m + 1).fill(0)
  let prev = Array.from({ length: m + 1 }, (_, j) => j)
  let row = new Array<number>(m + 1).fill(0)
  for (let i = 1; i <= n; i++) {
    row[0] = i
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1)
      row[j] = v
    }
    ;[prev2, prev, row] = [prev, row, prev2]
  }
  return 1 - prev[m] / Math.max(n, m)
}

/** 同じ語の仲間（decide / decision のように片方がもう片方を含む・語幹が同じ） */
function sameFamily(a: string, b: string): boolean {
  a = a.toLowerCase()
  b = b.toLowerCase()
  if (a.includes(b) || b.includes(a)) return true
  const stem = Math.min(a.length, b.length) >= 6 ? 5 : 99
  return a.slice(0, stem) === b.slice(0, stem)
}

// ───────── 単語のダミー ─────────

export type DistractorKind = 'form' | 'field' | 'random'

/**
 * 単語の意味を選ぶ問題のダミーを n 個選ぶ。tier の数だけ「似た選択肢」を混ぜ、残りはランダム。
 * 似た選択肢は「綴り・音が似た語」と「同じ分野・同じ品詞でよく使う語」を交互に使う。
 */
export function wordDistractors(target: Word, pool: Word[], tier: Tier, n = 3): { word: Word; kind: DistractorKind }[] {
  const base = pool.filter((w) => w.id !== target.id && w.w.toLowerCase() !== target.w.toLowerCase() && !meaningOverlap(target.ja, w.ja))
  const close = base.filter((w) => Math.abs(w.lv - target.lv) <= 2 && !sharesKanji(target.ja, w.ja))

  // 綴り・音が似た語（似ている順に上位から、毎回同じにならないよう少し混ぜる）
  const form = close
    .filter((w) => !sameFamily(target.w, w.w))
    .map((w) => ({ w, s: formSimilarity(target.w, w.w) }))
    .filter((x) => x.s >= 0.5)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
  const formPick = shuffle(form.slice(0, 4)).map((x) => x.w)

  // 同じ分野（保線の分類）・同じ品詞で、レベルと使われる頻度が近い語
  const field = shuffle(
    close.filter(
      (w) =>
        w.pos === target.pos &&
        (target.sub ? w.sub === target.sub : Math.abs(w.lv - target.lv) <= 1 && (target.rank === undefined || w.rank === undefined || Math.abs(w.rank - target.rank) <= 400)),
    ),
  )

  const out: { word: Word; kind: DistractorKind }[] = []
  const used = new Set<string>()
  const take = (w: Word | undefined, kind: DistractorKind) => {
    if (!w || used.has(w.id) || out.some((o) => meaningOverlap(o.word.ja, w.ja))) return false
    used.add(w.id)
    out.push({ word: w, kind })
    return true
  }
  for (let k = 0; k < Math.min(tier, n); k++) {
    const order: [Word[], DistractorKind][] = k % 2 === 0 ? [[formPick, 'form'], [field, 'field']] : [[field, 'field'], [formPick, 'form']]
    let ok = false
    for (const [list, kind] of order) {
      for (const w of list) if ((ok = take(w, kind))) break
      if (ok) break
    }
  }
  // 残りはランダム（レベルが近く、できれば同じ品詞）
  const near = base.filter((w) => Math.abs(w.lv - target.lv) <= 1)
  const samePos = near.filter((w) => w.pos === target.pos)
  for (const w of shuffle(samePos.length >= n * 3 ? samePos : near.length >= n ? near : base)) {
    if (out.length >= n) break
    take(w, 'random')
  }
  return out
}

// ───────── 例文のダミー ─────────

const STOP = new Set(
  'a an the to of in on at for from by with and or but is are was were be been am do does did have has had i you he she it we they me him her us them my your his its our their this that these those there here what which who how when where why not no yes can could will would should may might must shall just so very too also please'.split(
    ' ',
  ),
)
const wordsCache = new Map<string, Set<string>>()
/** 英文の内容語（冠詞・代名詞などを除き、複数形の s を落とす）。例文ごとに1回だけ計算する */
function contentWords(en: string): Set<string> {
  const hit = wordsCache.get(en)
  if (hit) return hit
  const set = new Set(
    en
      .toLowerCase()
      .replace(/[^a-z' ]/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/([^s])s$/, '$1'))
      .filter((w) => w.length > 2 && !STOP.has(w)),
  )
  wordsCache.set(en, set)
  return set
}

/** 和訳の近さ 0〜1（2文字ずつの重なり）。近すぎる和訳は「どちらも正解」に見えるので除く */
function jaSimilarity(a: string, b: string): number {
  const bi = (s: string) => {
    const out = new Set<string>()
    const t = s.replace(/[。、！？!?「」（）()\s]/g, '')
    for (let i = 0; i + 1 < t.length; i++) out.add(t.slice(i, i + 2))
    return out
  }
  const x = bi(a)
  const y = bi(b)
  if (!x.size || !y.size) return 0
  let k = 0
  for (const v of x) if (y.has(v)) k++
  return (2 * k) / (x.size + y.size)
}

/**
 * リスニングの意味を選ぶ問題のダミー（和訳）を n 個選ぶ。
 * tier の数だけ「正解と同じ単語を含む例文」「同じ単語・同じ場面の例文」を混ぜ、キーワード1つでは選べないようにする。
 */
export function sentenceDistractors(target: Sentence, pool: Sentence[], tier: Tier, n = 3): { ja: string; kind: 'close' | 'random' }[] {
  const len = target.ja.length
  const tw = contentWords(target.en)
  const base = pool.filter(
    (s) => s.ja !== target.ja && s.en !== target.en && Math.abs(s.ja.length - len) <= Math.max(6, len * 0.4) && jaSimilarity(s.ja, target.ja) < 0.5,
  )
  const scored = base
    .map((s) => {
      let shared = 0
      for (const w of contentWords(s.en)) if (tw.has(w)) shared++
      const sameWord = target.wordId && s.wordId === target.wordId ? 2 : 0
      const sameScene = target.scene && s.scene === target.scene ? 1.5 : 0
      return { s, score: shared + sameWord + sameScene }
    })
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
  const close = shuffle(scored.slice(0, 6)).map((x) => x.s)

  const out: { ja: string; kind: 'close' | 'random' }[] = []
  const take = (s: Sentence, kind: 'close' | 'random') => {
    if (out.some((o) => o.ja === s.ja || jaSimilarity(o.ja, s.ja) >= 0.5)) return
    out.push({ ja: s.ja, kind })
  }
  for (const s of close) {
    if (out.length >= Math.min(tier, n)) break
    take(s, 'close')
  }
  for (const s of shuffle(base)) {
    if (out.length >= n) break
    take(s, 'random')
  }
  return out
}
