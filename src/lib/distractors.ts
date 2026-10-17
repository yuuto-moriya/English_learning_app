import type { Word } from './types'
import type { Sentence } from './sentences'
import { shuffle } from './vocab'

/**
 * 選択式の問題の「まちがいの選択肢（ダミー）」を選ぶ。
 *
 * ランダムに選ぶと、正解とまったく関係のない選択肢になり、なんとなくでも当たってしまう。そこで：
 * - どの選択肢も、正解と品詞・和訳の形（〜する・〜い・名詞…）をそろえる（形だけで見分けられないように）
 * - 意味の近い語（犬 → 猫・馬、月曜日 → 火曜日、安い → 高価な）を混ぜる。WordNet から事前に計算した near
 * - むずかしいときは、綴り・音が似た語（adapt / adopt、quite / quiet）も混ぜる
 * - 例文：正解と同じ単語を含む例文、同じ場面の例文
 * 似た選択肢の多さ（＝難しさ）は学習者のレベルと、その語の覚え具合で決める。
 *
 * ただし「どちらも正解に見える」選択肢は作らない。意味が重なる語（類義語・同じ語の仲間・上位語）は除く。
 * 適度に難しい問題の方が記憶に残る（望ましい困難：Bjork, 1994）。もっともらしい誤答の選択肢は、
 * 正解だけでなく関連する知識の想起も促す（Little et al., 2012）。
 */

/** 難しさ。1=やさしい 2=ふつう 3=むずかしい */
export type Tier = 1 | 2 | 3

export const TIER_LABEL: Record<Tier, string> = { 1: 'やさしい', 2: 'ふつう', 3: 'むずかしい' }

/** 学習者のレベル帯：入門・初級（A1–A2）=0、中級・中上級（B1–B2）=1、上級・専門=2 */
export const levelBand = (lv: number): 0 | 1 | 2 => (lv <= 2 ? 0 : lv <= 4 ? 1 : 2)

/** 覚え具合：覚えたて（安定度3日未満）=0、定着しつつある=1、定着（21日以上）=2 */
export const familiarity = (stability?: number): 0 | 1 | 2 => (!stability || stability < 3 ? 0 : stability < 21 ? 1 : 2)

/**
 * 単語の問題の難しさ（行：覚え具合、列：学習者のレベル帯）
 *              入門・初級  中級・中上級  上級・専門
 * 覚えたて      やさしい    ふつう        ふつう
 * 定着しつつある ふつう      ふつう        むずかしい
 * 定着          ふつう      むずかしい    むずかしい
 * やさしい＝意味の近い語1つ、ふつう＝2つ、むずかしい＝2つ＋綴りが似た語。残りも品詞と和訳の形をそろえる
 */
const TIER_TABLE: Tier[][] = [
  [1, 2, 2],
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

/** 漢字・カタカナが2文字以上続けて共通するか */
function commonRun(a: string, b: string, min = 2): boolean {
  for (let i = 0; i + min <= a.length; i++) {
    const s = a.slice(i, i + min)
    if ([...s].every((c) => KANJI_KATA.test(c)) && b.includes(s)) return true
  }
  return false
}

/**
 * 意味が重なる（両方とも正解に見えるおそれがある）。scripts/build_neighbors.py の meaning_overlap と同じ判定
 * - 意味のまとまりが同じ（維持；保守 と 保守）
 * - 一方のまとまり全体が、もう一方に含まれる（影響 と 影響力、ファイル と ファイル名）
 * - 2文字以上の語で終わりが同じ（競争相手 と 対戦相手）。月曜日・火曜日のように前が1文字なら別の意味として扱う
 */
export function meaningOverlap(a: string, b: string): boolean {
  if (a === b) return true
  const pa = glossParts(a)
  const pb = glossParts(b)
  const sb = new Set(pb)
  if (pa.some((p) => sb.has(p))) return true
  for (const x of pa)
    for (const y of pb) {
      const [short, long] = x.length <= y.length ? [x, y] : [y, x]
      // 漢字・カタカナの2文字以上、またはひらがなを含む3文字以上の意味が、もう一方に丸ごと入っている（まくらぎ と コンクリートまくらぎ）
      if ((short.length >= 3 || (short.length >= 2 && [...short].every((c) => KANJI_KATA.test(c)))) && long.includes(short)) return true
      let k = 0
      while (k < Math.min(x.length, y.length) && x[x.length - 1 - k] === y[y.length - 1 - k] && KANJI_KATA.test(x[x.length - 1 - k])) k++
      if (k >= 2 && x.length - k >= 2 && y.length - k >= 2) return true
    }
  return false
}

/** 漢字を1字でも共有するか（綴りが似た語は「意味は別」の選択肢なので、漢字を共有しない語だけを使う） */
function sharesKanji(a: string, b: string): boolean {
  for (const c of a) if (/[㐀-鿿]/.test(c) && b.includes(c)) return true
  return commonRun(a, b)
}

/**
 * 和訳の形：v＝動詞（〜する・〜る・〜く…）、a＝形容詞（〜い・〜な）、x＝「〜」で始まる（前置詞・助動詞など）、n＝名詞ほか。
 * 選択肢の形がそろっていないと、日本語の形だけで正解の見当がついてしまう（例：be の「〜である」に「私たちは」）
 */
export function glossForm(ja: string): 'v' | 'a' | 'x' | 'n' {
  const first = ja.replace(/[（(][^）)]*[）)]/g, '').split(/[；;、,]/)[0].trim()
  if (first.startsWith('〜')) return 'x'
  if (/(する|させる|される|[うくぐすつぬぶむる])$/.test(first)) return 'v'
  if (/[いな]$/.test(first)) return 'a'
  return 'n'
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

/** near＝意味の近い語、form＝綴りが似た語、field＝同じ分野・同じ品詞で頻度が近い語、random＝品詞と和訳の形が同じ語 */
export type DistractorKind = 'near' | 'form' | 'field' | 'random'

const idMaps = new WeakMap<Word[], Map<string, Word>>()
function byId(pool: Word[]): Map<string, Word> {
  let m = idMaps.get(pool)
  if (!m) idMaps.set(pool, (m = new Map(pool.map((w) => [w.id, w]))))
  return m
}

/** 難しさごとの選択肢の組み立て（3つのダミーの種類） */
const PLAN: Record<Tier, DistractorKind[]> = {
  1: ['near', 'random', 'random'],
  2: ['near', 'near', 'random'],
  3: ['near', 'near', 'form'],
}

/** 発音記号から強勢記号を除いたもの（同音異義語の判定用） */
const bareIpa = (ipa?: string) => (ipa ?? '').replace(/[ˈˌ]/g, '')

/** 見出し語の一方がもう一方を語として含む（sleeper と concrete sleeper、rail と guard rail）。下位語・上位語になりやすい */
function containsWord(a: string, b: string): boolean {
  const x = ` ${a.toLowerCase()} `
  const y = ` ${b.toLowerCase()} `
  return x.includes(y) || y.includes(x)
}

/**
 * 単語の意味を選ぶ問題のダミーを3つ選ぶ。
 * listen（音だけを聞いて答える問題）のときは、同じ発音の語（week と weak、by と buy）を入れない（聞いただけでは区別できないため）
 */
export function wordDistractors(target: Word, pool: Word[], tier: Tier, opts: { listen?: boolean } = {}): { word: Word; kind: DistractorKind }[] {
  const shape = glossForm(target.ja)
  const sound = bareIpa(target.ipa)
  const ok = (w: Word) =>
    w.id !== target.id &&
    w.w.toLowerCase() !== target.w.toLowerCase() &&
    !containsWord(target.w, w.w) &&
    !meaningOverlap(target.ja, w.ja) &&
    !(opts.listen && sound && bareIpa(w.ipa) === sound)
  // 副詞の和訳（素早く・ゆっくりと・完全に）は形がまちまちなので、品詞だけをそろえる
  const sameKind = (w: Word) => w.pos === target.pos && (target.pos === 'adv' || glossForm(w.ja) === shape)
  const base = pool.filter(ok)

  // 意味の近い語（近い順の上位から、毎回同じにならないよう少し混ぜる）
  const ids = byId(pool)
  const near = shuffle(
    (target.near ?? [])
      .map((id) => ids.get(id))
      .filter((w): w is Word => !!w && ok(w))
      .slice(0, 4),
  )

  // 綴り・音が似た語（漢字を共有しない＝意味は別。品詞は正解と同じものだけ、和訳の形も同じものを先に）
  const close = base.filter((w) => Math.abs(w.lv - target.lv) <= 2 && !sharesKanji(target.ja, w.ja))
  const form = shuffle(
    close
      .filter((w) => w.pos === target.pos && !sameFamily(target.w, w.w))
      .map((w) => ({ w, s: formSimilarity(target.w, w.w) + (sameKind(w) ? 0.2 : 0) }))
      .filter((x) => x.s >= 0.5)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4),
  ).map((x) => x.w)

  // 同じ分野（保線の分類）・同じ品詞で、レベルと使われる頻度が近い語（意味の近い語が足りないとき）
  const field = shuffle(
    close.filter(
      (w) =>
        sameKind(w) &&
        (target.sub ? w.sub === target.sub : Math.abs(w.lv - target.lv) <= 1 && (target.rank === undefined || w.rank === undefined || Math.abs(w.rank - target.rank) <= 400)),
    ),
  )

  // 品詞と和訳の形が同じ、レベルの近い語（足りなければ品詞だけ・レベルだけで）
  const lvNear = base.filter((w) => Math.abs(w.lv - target.lv) <= 1)
  const sameShape = lvNear.filter(sameKind)
  const samePos = lvNear.filter((w) => w.pos === target.pos)
  const random = shuffle(sameShape.length >= 6 ? sameShape : samePos.length >= 6 ? samePos : lvNear.length >= 3 ? lvNear : base)

  const out: { word: Word; kind: DistractorKind }[] = []
  const take = (w: Word, kind: DistractorKind) => {
    if (out.some((o) => o.word.id === w.id || meaningOverlap(o.word.ja, w.ja))) return false
    out.push({ word: w, kind })
    return true
  }
  const sources: Record<DistractorKind, [Word[], DistractorKind][]> = {
    near: [[near, 'near'], [field, 'field'], [random, 'random']],
    form: [[form, 'form'], [near, 'near'], [field, 'field'], [random, 'random']],
    field: [[field, 'field'], [random, 'random']],
    random: [[random, 'random'], [base, 'random']],
  }
  for (const want of PLAN[tier]) {
    let done = false
    for (const [list, kind] of sources[want]) {
      for (const w of list) if ((done = take(w, kind))) break
      if (done) break
    }
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
