import { State } from 'ts-fsrs'
import type { CardRow } from './db'
import { db } from './db'
import { dueCards, interleave, newLearnedToday } from './srs'
import type { Category, Word } from './types'
import { getWord, loadCategory } from './vocab'
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
  retry?: boolean
}

export function chooseType(row: CardRow | undefined, word: Word, seed: number): QType {
  if (!row || row.reps < 2 || row.state === State.Learning || row.state === State.Relearning) return 'mc'
  if (row.stability < 7) return seed % 2 === 0 ? 'listen' : 'flip'
  const hasCloze = word.ex.some((e) => e.en.includes('*'))
  const spellable = !/[ ]/.test(word.w) && word.w.length <= 14
  const r = seed % 3
  if (r === 0 && hasCloze) return 'cloze'
  if (r === 1 && spellable) return 'spell'
  return seed % 2 === 0 ? 'listen' : 'flip'
}

const FUNCTION_POS = new Set(['det', 'pron', 'prep', 'conj', 'aux', 'int', 'num'])

export function newWordPool(
  all: Word[],
  cards: Set<string>,
  s: Pick<Settings, 'studyCats' | 'maxLevel'> & { minLevel?: number },
): Word[][] {
  const groups: Record<Category, Word[]> = { general: [], business: [], rail: [] }
  for (const w of all) {
    if (cards.has(w.id)) continue
    if (!s.studyCats[w.cat]) continue
    if (w.cat !== 'rail' && (w.lv > s.maxLevel || w.lv < (s.minLevel ?? 1))) continue
    groups[w.cat].push(w)
  }
  // 同じレベル内では内容語を先に、機能語（冠詞・前置詞など）は後回し
  const fn = (w: Word) => (FUNCTION_POS.has(w.pos) ? 1 : 0)
  const order = (a: Word, b: Word) => a.lv - b.lv || fn(a) - fn(b) || (a.rank ?? 9999) - (b.rank ?? 9999)
  groups.general.sort(order)
  groups.business.sort(order)
  groups.rail.sort((a, b) => a.lv - b.lv)
  return [groups.general, groups.business, groups.rail].filter((g) => g.length > 0)
}

export async function buildSession(s: Settings, opts: { extra?: boolean; maxDue?: number } = {}): Promise<Item[]> {
  const maxDue = opts.maxDue ?? 50
  const dueRows = await dueCards(Date.now(), maxDue, s.studyCats)
  const allCards = await db.cards.toArray()
  const cardSet = new Set(allCards.map((c) => c.id))
  const rowMap = new Map(allCards.map((c) => [c.id, c]))

  const learned = await newLearnedToday()
  const newCount = opts.extra ? 5 : Math.max(0, s.dailyNew - learned)

  const cats = (['general', 'business', 'rail'] as Category[]).filter((c) => s.studyCats[c])
  const lists = await Promise.all(cats.map((c) => loadCategory(c)))
  const pool = interleave(newWordPool(lists.flat(), cardSet, s))
  const fresh = pool.slice(0, newCount)

  const dueItems: Item[] = []
  let seed = Math.floor(Math.random() * 1000)
  for (const r of dueRows) {
    const w = await getWord(r.id)
    if (!w) continue
    dueItems.push({ key: `d-${w.id}`, word: w, type: chooseType(rowMap.get(w.id), w, seed++), isNew: false })
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
    for (const w of chunk) out.push({ key: `t-${w.id}`, word: w, type: 'mc', isNew: true })
  }
  while (di < dueMixed.length) out.push(dueMixed[di++])
  return out
}

/** 不正解の語を数問後に再挿入（セッション内の繰り返し想起） */
export function reinsert(queue: Item[], index: number, item: Item, gap = 4): Item[] {
  const q = queue.slice()
  const pos = Math.min(q.length, index + 1 + gap)
  q.splice(pos, 0, { ...item, key: `${item.key}-r${index}`, type: item.type === 'flip' ? 'flip' : 'mc', retry: true })
  return q
}

/** スペル判定（大文字小文字・前後空白・ハイフン差を無視。保線語は英米どちらでも可） */
export function checkSpelling(input: string, word: Word, target?: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[‐-―-]/g, '-').replace(/\s+/g, ' ').trim()
  const a = norm(input)
  if (!a) return false
  const answers = target ? [target] : [word.w, word.us].filter(Boolean) as string[]
  return answers.some((t) => norm(t) === a || norm(t).replace(/-/g, ' ') === a.replace(/-/g, ' '))
}
