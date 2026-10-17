import { State } from 'ts-fsrs'
import type { CardRow } from './db'
import { db } from './db'
import { dueCards, interleave, newLearnedToday } from './srs'
import { ALL_CATS, type Category, type Word } from './types'
import { getWord, glossRevealsWord, loadCategory, markedTarget, quizGloss } from './vocab'
import type { Settings } from './settings'

/**
 * 学習セッションの組み立て。
 * - 期限の来た復習（分散学習）を優先し、新出語は少量ずつ挟む
 * - 新出語は「提示 → 数問あとに想起テスト」（検索練習）
 * - 記憶の安定度に応じて、認識（選択）→ 音声認識 → 産出（スペル・穴埋め）へ難易度を上げる（望ましい困難）
 * - カテゴリを混ぜて出題（インターリーブ）
 */
export type QType = 'learn' | 'mc' | 'listen' | 'flip' | 'spell' | 'cloze'

export interface Item {
  key: string
  word: Word
  type: QType
  isNew: boolean
  /** セッション内の再出題の回数（1回目の再出題で1） */
  retry?: number
}

/** 同じ語をセッション内で再出題する上限。何度も間違えたときに問題数が際限なく増えないようにする */
export const MAX_RETRIES = 2

/**
 * 問題の形式を選ぶ。
 * - 和訳に見出し語がそのまま入っている語（API →「API（…）」）は、意味を選ぶ・書く問題だと答えが見えるので、カード（flip）にする
 * - 同じコースに和訳が同じ語がある語（完全に：completely / totally）は、和訳から書く問題だと答えが1つに決まらないので、例文の穴埋めにする
 */
export function chooseType(row: CardRow | undefined, word: Word, seed: number, ambiguous = false): QType {
  const reveals = glossRevealsWord(word)
  if (!row || row.reps < 2 || row.state === State.Learning || row.state === State.Relearning) return reveals ? 'flip' : 'mc'
  if (row.stability < 7) return reveals || seed % 2 !== 0 ? 'flip' : 'listen'
  const hasCloze = word.ex.some((e) => e.en.includes('*')) && !reveals
  const spellable = !/[ ]/.test(word.w) && word.w.length <= 14 && !reveals
  const r = seed % 3
  if (r === 0 && hasCloze) return 'cloze'
  if (r === 1 && spellable) return ambiguous ? (hasCloze ? 'cloze' : 'flip') : 'spell'
  return reveals || seed % 2 !== 0 ? 'flip' : 'listen'
}

const ambiguousCache = new Map<Category, Promise<Set<string>>>()
/** 同じコースに、問題に出す和訳の最初の意味が同じ語がある語の id（書く問題では答えが1つに決まらない） */
export function ambiguousGloss(cat: Category): Promise<Set<string>> {
  let p = ambiguousCache.get(cat)
  if (!p) {
    p = loadCategory(cat).then((ws) => {
      const by = new Map<string, string[]>()
      for (const w of ws) {
        const g = quizGloss(w.ja).split('；')[0]
        by.set(g, [...(by.get(g) ?? []), w.id])
      }
      return new Set([...by.values()].filter((ids) => ids.length > 1).flat())
    })
    ambiguousCache.set(cat, p)
  }
  return p
}

const FUNCTION_POS = new Set(['det', 'pron', 'prep', 'conj', 'aux', 'int', 'num'])

export function newWordPool(
  all: Word[],
  cards: Set<string>,
  s: Pick<Settings, 'studyCats' | 'maxLevel'> & { minLevel?: number },
): Word[][] {
  const groups: Record<Category, Word[]> = { general: [], business: [], it: [], rail: [] }
  for (const w of all) {
    if (cards.has(w.id)) continue
    if (!s.studyCats[w.cat]) continue
    // 数（three → 3）と間投詞（yes → はい）は、意味を選ぶ問題にしても簡単すぎるので新しい単語には出さない（単語帳には残す）
    if (w.pos === 'num' || w.pos === 'int') continue
    groups[w.cat].push(w)
  }
  // IT・鉄道は専門のコースなので、レベルの範囲に関係なく基本の語（低いレベル）から順に出す。
  // 一般・ビジネスはレベルの範囲で絞るが、範囲に語が残っていなければ（ビジネスは3以上しかない・範囲の語を学び終えた）
  // いちばん近いレベルの語を出す（新しい単語が0にならないように）
  const lo = s.minLevel ?? 1
  const hi = s.maxLevel
  for (const c of ['general', 'business'] as const) {
    const g = groups[c]
    const inRange = g.filter((w) => w.lv >= lo && w.lv <= hi)
    if (inRange.length || !g.length) groups[c] = inRange
    else {
      const dist = (w: Word) => (w.lv > hi ? w.lv - hi : lo - w.lv)
      const best = Math.min(...g.map(dist))
      groups[c] = g.filter((w) => dist(w) === best)
    }
  }
  // 同じレベル内では内容語を先に、機能語（冠詞・前置詞など）は後回し
  const fn = (w: Word) => (FUNCTION_POS.has(w.pos) ? 1 : 0)
  const order = (a: Word, b: Word) => a.lv - b.lv || fn(a) - fn(b) || (a.rank ?? 9999) - (b.rank ?? 9999)
  groups.general.sort(order)
  groups.business.sort(order)
  groups.it.sort((a, b) => a.lv - b.lv)
  groups.rail.sort((a, b) => a.lv - b.lv)
  return ALL_CATS.map((c) => groups[c]).filter((g) => g.length > 0)
}

export async function buildSession(s: Settings, opts: { extra?: boolean; maxDue?: number } = {}): Promise<Item[]> {
  const maxDue = opts.maxDue ?? 50
  const dueRows = await dueCards(Date.now(), maxDue, s.studyCats)
  const allCards = await db.cards.toArray()
  const cardSet = new Set(allCards.map((c) => c.id))
  const rowMap = new Map(allCards.map((c) => [c.id, c]))

  const learned = await newLearnedToday()
  const newCount = opts.extra ? 5 : Math.max(0, s.dailyNew - learned)

  const cats = ALL_CATS.filter((c) => s.studyCats[c])
  const lists = await Promise.all(cats.map((c) => loadCategory(c)))
  const pool = interleave(newWordPool(lists.flat(), cardSet, s))
  const fresh = pool.slice(0, newCount)

  const dueItems: Item[] = []
  let seed = Math.floor(Math.random() * 1000)
  for (const r of dueRows) {
    const w = await getWord(r.id)
    if (!w) continue
    const ambiguous = (await ambiguousGloss(w.cat)).has(w.id)
    dueItems.push({ key: `d-${w.id}`, word: w, type: chooseType(rowMap.get(w.id), w, seed++, ambiguous), isNew: false })
  }
  // 復習もカテゴリを混ぜる
  const dueByCat = cats.map((c) => dueItems.filter((i) => i.word.cat === c))
  const dueMixed = interleave(dueByCat)

  const out: Item[] = []
  let di = 0
  for (let i = 0; i < fresh.length; i += 3) {
    const chunk = fresh.slice(i, i + 3)
    for (const w of chunk) out.push({ key: `l-${w.id}`, word: w, type: 'learn', isNew: true })
    // 提示と想起テストの間に少し間隔を空ける（短い分散）
    for (let k = 0; k < 3 && di < dueMixed.length; k++) out.push(dueMixed[di++])
    for (const w of chunk) out.push({ key: `t-${w.id}`, word: w, type: glossRevealsWord(w) ? 'flip' : 'mc', isNew: true })
  }
  while (di < dueMixed.length) out.push(dueMixed[di++])
  return out
}

/** 苦手な語：忘れたことがある、または FSRS の難易度が高い（10段階で7以上） */
export function isWeak(r: CardRow | undefined): boolean {
  return !!r && !r.known && r.reps > 0 && (r.lapses >= 1 || r.difficulty >= 7)
}

/**
 * 苦手な語・保存した語だけの集中練習（復習の予定は変えない）。
 * 期日前に解いた結果で FSRS の予定を動かすと最適な間隔からずれるため、記録は日々の学習量だけにする。
 */
export async function buildDrill(kind: 'weak' | 'marked', limit = 15): Promise<Item[]> {
  const rows = await db.cards.toArray()
  const rowMap = new Map(rows.map((r) => [r.id, r]))
  let ids: string[]
  if (kind === 'weak') {
    ids = rows
      .filter(isWeak)
      .sort((a, b) => b.lapses - a.lapses || b.difficulty - a.difficulty)
      .slice(0, limit)
      .map((r) => r.id)
  } else {
    // 「知っている」にした語は出さない
    ids = (await db.marks.orderBy('at').reverse().toArray())
      .map((m) => m.id)
      .filter((id) => !rowMap.get(id)?.known)
      .slice(0, limit)
  }
  const out: Item[] = []
  let seed = Math.floor(Math.random() * 1000)
  for (const id of ids) {
    const w = await getWord(id)
    if (!w) continue
    const row = rowMap.get(id)
    // まだ学んでいない語（単語帳で保存しただけの語）は、先に提示してから問う
    if (!row || row.reps === 0) {
      out.push({ key: `xl-${id}`, word: w, type: 'learn', isNew: false })
      out.push({ key: `x-${id}`, word: w, type: glossRevealsWord(w) ? 'flip' : 'mc', isNew: false })
      continue
    }
    // 苦手な語は意味の想起（選択・音声）を中心に、安定してきた語は産出も混ぜる
    const ambiguous = (await ambiguousGloss(w.cat)).has(w.id)
    out.push({ key: `x-${id}`, word: w, type: chooseType(row, w, seed++, ambiguous), isNew: false })
  }
  return out
}

/** 不正解の語を数問後に再挿入（セッション内の繰り返し想起）。上限（MAX_RETRIES）に達したら入れない */
export function reinsert(queue: Item[], index: number, item: Item, gap = 4): Item[] {
  const n = (item.retry ?? 0) + 1
  if (n > MAX_RETRIES) return queue
  const q = queue.slice()
  const pos = Math.min(q.length, index + 1 + gap)
  q.splice(pos, 0, { ...item, key: `${item.key}-r${index}`, type: item.type === 'flip' ? 'flip' : 'mc', retry: n })
  return q
}

/** スペル判定（大文字小文字・前後空白・ハイフン差を無視。保線語は英米どちらでも可） */
export function checkSpelling(input: string, word: Word, target?: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[‐-―-]/g, '-').replace(/\s+/g, ' ').trim()
  const a = norm(input)
  if (!a) return false
  // 例文で使っている形（headquarters・congratulations など、見出し語と形が違う語）も正解にする
  const used = word.ex.map((e) => markedTarget(e.en)).filter((t): t is string => !!t)
  const answers = target ? [target] : ([word.w, word.us, ...used].filter(Boolean) as string[])
  return answers.some((t) => norm(t) === a || norm(t).replace(/-/g, ' ') === a.replace(/-/g, ' '))
}
