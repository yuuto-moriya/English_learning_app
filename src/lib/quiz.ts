import type { Example, Word } from './types'
import { wordDistractors, type Tier } from './distractors'
import { isIrregularVerb, markedTarget, plain, shuffle } from './vocab'

/**
 * 単語学習の、選択肢から選ぶ問題の組み立て（意味を選ぶ問題は distractors.ts）。
 * - 使い分け：例文の空所に入る語を、意味の近い語の中から選ぶ（和訳に合う1語だけが正解）
 * - 英語を選ぶ：和訳を見て、意味の近い英語の中から選ぶ（意味 → 語の向きで思い出す）
 * - 変化形：不規則動詞の過去形・過去分詞を、まちがえやすい形の中から選ぶ
 * - 並べかえ：例文の語を正しい順に並べる
 */

// ───────── 例文 ─────────

/** 問題に使える例文（学習対象の語に印のあるもの） */
export function markedExamples(w: Word): Example[] {
  return w.ex.filter((e) => /\*[^*]+\*/.test(e.en))
}

/**
 * 問題に使う例文。2つ目以降の例文（はじめて学んだときのカードには出していない文）を優先して、
 * 覚えた1文の丸暗記ではなく、新しい文脈でも分かるかを確かめる。seed で毎回ちがう文になるようにする
 */
export function quizExample(w: Word, seed = 0): Example | undefined {
  const ex = markedExamples(w)
  if (ex.length <= 1) return ex[0]
  const later = ex.slice(1)
  return seed % 3 === 2 ? ex[0] : later[seed % later.length]
}

// ───────── 語形 ─────────

/** 例文で使っている形が、見出し語のどの形か。base＝原形、vf＝動詞の変化形（0:三単現 1:過去形 2:過去分詞 3:-ing）、pl＝名詞の複数形 */
export type FormKey = { kind: 'base' } | { kind: 'vf'; i: number } | { kind: 'pl' }

const alts = (s: string) => s.split(' / ').map((x) => x.trim().toLowerCase())

export function plural(n: string): string {
  if (/[^aeiou]y$/i.test(n)) return n.slice(0, -1) + 'ies'
  if (/(s|x|z|ch|sh)$/i.test(n)) return n + 'es'
  return n + 's'
}

export function formOf(w: Word, used: string): FormKey | null {
  const u = used.toLowerCase()
  if (u === w.w.toLowerCase()) return { kind: 'base' }
  if (w.vf) {
    // 過去形と過去分詞が同じ語（made / made）は、過去形として扱う（どちらでも作る形は同じ）
    for (let i = 0; i < w.vf.length; i++) if (alts(w.vf[i]).includes(u)) return { kind: 'vf', i }
  }
  if (w.pos === 'n' && u === plural(w.w).toLowerCase()) return { kind: 'pl' }
  return null
}

/** 別の語を、同じ形にする。作れないときは null */
export function inflect(w: Word, f: FormKey): string | null {
  if (f.kind === 'base') return w.w
  // 固有名詞（January・Monday）は複数形にしない
  if (f.kind === 'pl') return w.pos === 'n' && !/\s/.test(w.w) && !/^[A-Z]/.test(w.w) ? plural(w.w) : null
  const v = w.vf?.[f.i]
  return v ? v.split(' / ')[0].trim() : null
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** a / an のどちらが付く語か（音ではなく綴りで見るので、hour・unit などは例外にする） */
const takesAn = (w: string) => /^(hour|honest|honor|heir)/i.test(w) || (/^[aeiou]/i.test(w) && !/^(uni|use|usu|eu|one|once)/i.test(w))

/**
 * 空所の前の a / an が答えの手がかりにならないようにする。選択肢に a の語と an の語が混ざっているときは「a(n)」にする
 * （「an ＿＿＿」なら母音で始まる選択肢だけが答えになってしまうため）
 */
export function neutralArticle(blanked: string, options: string[]): string {
  const kinds = new Set(options.map(takesAn))
  if (kinds.size < 2) return blanked
  return blanked.replace(/\b([Aa])n? (＿＿＿|___)/, '$1(n) $2')
}

// ───────── 使い分け（例文の空所に入る語を選ぶ） ─────────

export interface UsageQuestion {
  /** 空所を ＿＿＿ にした英文 */
  blanked: string
  /** 例文の全体（答えの表示・読み上げ用） */
  en: string
  ja: string
  answer: string
  /** 選択肢（正解を含む）。word は選択肢の語（正解は問題の語） */
  options: { text: string; word: Word }[]
}

/**
 * 使い分けの問題を作る。まちがいの選択肢は、意味の近い語（似た意味・同じ分野）を、例文と同じ形（過去形・複数形…）にしたもの。
 * 和訳を一緒に見せるので、意味の近い語でも「この文の意味になるのは1語だけ」に決まる（意味が重なる語は distractors で除いている）。
 * 作れないとき（語形が分からない・選択肢が足りない）は null
 */
export function usageQuestion(w: Word, pool: Word[], tier: Tier, ex?: Example): UsageQuestion | null {
  if (!ex) return null
  const used = markedTarget(ex.en)
  if (!used) return null
  const f = formOf(w, used)
  if (!f) return null
  // 同じ品詞の語だけから選ぶ（文に入れたときに形で見分けられないように）
  const same = pool.filter((x) => x.pos === w.pos && !/\s/.test(x.w) === !/\s/.test(w.w))
  const cap = /^[A-Z]/.test(used) && ex.en.trimStart().startsWith('*')
  const fit = (s: string) => (cap ? capitalize(s) : s)
  const options: { text: string; word: Word }[] = [{ text: used, word: w }]
  // ふだんより1段むずかしくして、意味の近い語を多めにする（使い分けを確かめる問題なので）
  for (const d of wordDistractors(w, same, Math.min(3, tier + 1) as Tier)) {
    const t = inflect(d.word, f)
    if (!t || options.some((o) => o.text.toLowerCase() === t.toLowerCase())) continue
    options.push({ text: fit(t), word: d.word })
  }
  if (options.length < 3) return null
  return {
    blanked: neutralArticle(ex.en.replace(/\*[^*]+\*/, '＿＿＿'), options.map((o) => o.text)),
    en: plain(ex.en),
    ja: ex.ja,
    answer: used,
    options: shuffle(options),
  }
}

// ───────── 不規則動詞の変化形 ─────────

export interface FormQuestion {
  /** 過去形・過去分詞 */
  label: string
  answer: string
  options: string[]
}

/** 規則変化で作った過去形（まちがえやすい形：goed, buyed, choosed） */
function regularPast(v: string): string {
  if (/e$/.test(v)) return v + 'd'
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied'
  return v + 'ed'
}

/** 変化形を問える動詞か（過去形か過去分詞が不規則な、1語の動詞。be は形が多すぎるので除く） */
export function hasFormQuestion(w: Word): boolean {
  return w.pos === 'v' && !/\s/.test(w.w) && w.w !== 'be' && isIrregularVerb(w.vf)
}

/**
 * 不規則動詞の過去形・過去分詞を選ぶ問題。まちがいの選択肢は、同じ語の別の形（過去形と過去分詞の取り違え・-ing・三単現）と、
 * 規則変化で作ったまちがいの形（choosed）。seed で過去形と過去分詞のどちらを問うかを決める
 */
export function formQuestion(w: Word, seed = 0): FormQuestion | null {
  if (!hasFormQuestion(w) || !w.vf) return null
  const past = alts(w.vf[1])
  const pp = alts(w.vf[2])
  const reg = regularPast(w.w)
  // 過去形と過去分詞が違う語（take / took / taken）は両方を問う。同じ語（make / made / made）は過去形だけ
  const askPP = pp.join() !== past.join() && seed % 2 === 1
  const answer = (askPP ? pp : past)[0]
  const right = new Set(askPP ? pp : past)
  const wrong = [
    ...(askPP ? past : pp),
    reg,
    // 過去分詞に -en を付けたまちがい（choosen）・過去形に -ed を重ねたまちがい（wented）
    askPP ? w.w + 'en' : past[0] + 'ed',
    w.vf[0],
    w.vf[3],
  ]
    .map((x) => x.toLowerCase())
    .filter((x, k, a) => !right.has(x) && x !== w.w.toLowerCase() && a.indexOf(x) === k)
  if (wrong.length < 2) return null
  return { label: askPP ? '過去分詞' : '過去形', answer, options: shuffle([answer, ...wrong.slice(0, 3)]) }
}

// ───────── 並べかえ ─────────

/** 並べかえに使える文の長さ（語数） */
const ORDER_MIN = 4
const ORDER_MAX = 9

/** 例文を並べかえの語に分ける（句読点は前の語につける）。長すぎ・短すぎる文は null */
export function orderTokens(en: string): string[] | null {
  const t = plain(en).trim().split(/\s+/).filter(Boolean)
  if (t.length < ORDER_MIN || t.length > ORDER_MAX) return null
  return t
}

/** 正しい順と同じにならないように混ぜる */
export function scrambled(tokens: string[], rnd = Math.random): string[] {
  for (let k = 0; k < 8; k++) {
    const s = shuffle(tokens, rnd)
    if (s.join(' ') !== tokens.join(' ')) return s
  }
  return tokens.slice().reverse()
}

/** 並べた答えが正しいか（大文字小文字・前後の空白は見ない） */
export function orderMatches(picked: string[], tokens: string[]): boolean {
  const n = (a: string[]) => a.join(' ').toLowerCase().replace(/\s+/g, ' ').trim()
  return n(picked) === n(tokens)
}
