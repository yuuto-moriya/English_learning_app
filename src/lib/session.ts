import { State } from 'ts-fsrs'
import type { CardRow } from './db'
import { db } from './db'
import { dueCards, interleave, newLearnedToday } from './srs'
import { ALL_CATS, type Category, type Word } from './types'
import { getWord, glossRevealsWord, loadCategory, markedTarget, quizGloss, shuffle } from './vocab'
import { formOf, hasFormQuestion, markedExamples, orderTokens } from './quiz'
import type { Settings } from './settings'

/**
 * 学習セッションの組み立て。
 * - 期限の来た復習（分散学習）を優先し、新出語は少量ずつ挟む
 * - 新出語は「提示 → 数問あとに想起テスト」（検索練習）
 * - 記憶の安定度に応じて、認識（選択）→ 音声認識 → 産出（スペル・穴埋め）・使い分けへ難易度を上げる（望ましい困難）
 * - カテゴリと出題形式を混ぜて出題（インターリーブ）
 */
/**
 * learn＝新しい単語の提示、mc＝意味を選ぶ、listen＝聞いて意味を選ぶ、flip＝カード（自己採点）、spell＝和訳から書く、
 * cloze＝例文の空所に書く、rev＝和訳から英語を選ぶ、usage＝例文の空所に入る語を意味の近い語から選ぶ（使い分け）、
 * form＝不規則動詞の変化形を選ぶ、order＝例文を並べかえる
 */
export type QType = 'learn' | 'mc' | 'listen' | 'flip' | 'spell' | 'cloze' | 'rev' | 'usage' | 'form' | 'order'

export interface Item {
  key: string
  word: Word
  type: QType
  isNew: boolean
  /** セッション内の再出題の回数（1回目の再出題で1） */
  retry?: number
  /** 例文を選ぶときの種（毎回ちがう例文・ちがう問い方にする） */
  seed?: number
}

/** 問題ごとの種（出題形式・例文の選び方）。連番にすると形式が決まった順に回ってしまうので、毎回ばらばらにする */
export const randomSeed = () => Math.floor(Math.random() * 1_000_000)

/** 同じ語をセッション内で再出題する上限。何度も間違えたときに問題数が際限なく増えないようにする */
export const MAX_RETRIES = 2

/** 使い分け（例文の空所を選ぶ）を作れる語：例文の語形が分かり、空所にしても答えが見えない */
export function canUsage(w: Word): boolean {
  if (glossRevealsWord(w)) return false
  return markedExamples(w).some((e) => {
    const used = markedTarget(e.en)
    return !!used && !!formOf(w, used)
  })
}

/**
 * 問題の形式を選ぶ。覚え具合（FSRS の安定度）で段階を上げ、同じ段階の中では seed で形式を混ぜる。
 * - 覚えはじめ：意味を選ぶ（mc）
 * - 7日未満：カード・聞いて選ぶ・英語を選ぶ
 * - 21日未満：書く（spell・cloze）・使い分け・聞いて選ぶ・英語を選ぶ
 * - 定着（21日以上）：使い分け・書く・不規則動詞の変化形・並べかえ・聞いて選ぶ
 * - 和訳に見出し語がそのまま入っている語（API →「API（…）」）は、意味を選ぶ・書く問題だと答えが見えるので、カード（flip）にする
 * - 同じコースに和訳が同じ語がある語（完全に：completely / totally）は、和訳から書く問題だと答えが1つに決まらないので、例文の穴埋めにする
 */
export function chooseType(row: CardRow | undefined, word: Word, seed: number, ambiguous = false): QType {
  const reveals = glossRevealsWord(word)
  if (!row || row.reps < 2 || row.state === State.Learning || row.state === State.Relearning) return reveals ? 'flip' : 'mc'
  const hasCloze = markedExamples(word).length > 0 && !reveals
  const spellable = !/[ ]/.test(word.w) && word.w.length <= 14 && !reveals
  const usage = canUsage(word)
  const order = word.ex.some((e) => orderTokens(e.en))
  // 和訳から英語を選ぶ問題は、和訳が同じ語がある語だと答えが1つに決まらないので出さない
  const rev = !reveals && !ambiguous
  const fallback: QType = reveals || seed % 2 !== 0 ? 'flip' : 'listen'
  const pick = (cands: (QType | false)[]): QType => {
    const ok = cands.filter((c): c is QType => !!c)
    return ok.length ? ok[seed % ok.length] : fallback
  }
  if (row.stability < 7) return pick([reveals ? 'flip' : 'listen', 'flip', rev && 'rev'])
  if (row.stability < 21)
    return pick([hasCloze && 'cloze', spellable && (ambiguous ? hasCloze && 'cloze' : 'spell'), usage && 'usage', !reveals && 'listen', rev && 'rev'])
  return pick([
    usage && 'usage',
    spellable && (ambiguous ? hasCloze && 'cloze' : 'spell'),
    hasCloze && 'cloze',
    hasFormQuestion(word) && 'form',
    order && 'order',
    !reveals && 'listen',
  ])
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

/** 新しい単語の順番のゆらぎ：頻度の順位をこの幅でずらす（毎回・人ごとに同じ順にならないように。よく使う語が先なのは保つ） */
export const RANK_JITTER = 300

export function newWordPool(
  all: Word[],
  cards: Set<string>,
  s: Pick<Settings, 'studyCats' | 'maxLevel'> & { minLevel?: number },
  rnd: () => number = Math.random,
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
  // 同じレベル内では内容語を先に、機能語（冠詞・前置詞など）は後回し。
  // 頻度の順位はそのまま使うと毎回まったく同じ順になるので、少しずらして混ぜる（よく使う語ほど先に出やすいのは変えない）
  const fn = (w: Word) => (FUNCTION_POS.has(w.pos) ? 1 : 0)
  const key = new Map(all.map((w) => [w.id, (w.rank ?? 9999) + rnd() * RANK_JITTER]))
  const order = (a: Word, b: Word) => a.lv - b.lv || fn(a) - fn(b) || key.get(a.id)! - key.get(b.id)!
  groups.general.sort(order)
  groups.business.sort(order)
  // IT・鉄道は頻度の順位がないので、レベルの中で混ぜる
  const mix = (g: Word[]) => shuffle(g, rnd).sort((a, b) => a.lv - b.lv)
  groups.it = mix(groups.it)
  groups.rail = mix(groups.rail)
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
  // 期日の早い語から選ぶが、出す順は混ぜる（毎回、期日順・同じ形式の順に並ばないように）
  for (const r of shuffle(dueRows)) {
    const w = await getWord(r.id)
    if (!w) continue
    const ambiguous = (await ambiguousGloss(w.cat)).has(w.id)
    const sd = randomSeed()
    dueItems.push({ key: `d-${w.id}`, word: w, type: chooseType(rowMap.get(w.id), w, sd, ambiguous), isNew: false, seed: sd })
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
    // 想起テストは、提示した順とは別の順で（順番で答えの見当がつかないように）
    for (const w of shuffle(chunk)) out.push({ key: `t-${w.id}`, word: w, type: glossRevealsWord(w) ? 'flip' : 'mc', isNew: true })
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
  for (const id of shuffle(ids)) {
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
    const sd = randomSeed()
    out.push({ key: `x-${id}`, word: w, type: chooseType(row, w, sd, ambiguous), isNew: false, seed: sd })
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

/** 定着チェックの対象：定着した（安定度21日以上）語。少なければ、定着しつつある（7日以上）語も入れる */
export const CHECK_STABLE = 21

/**
 * 定着チェック：覚えたはずの語を、いちばん確かめにくい形で問う（1語に2問）。
 * 1問目は使い分け（はじめて見る例文の空所に、意味の近い語の中から選ぶ）、2問目は和訳から英語を選ぶ・書く。
 * まだ確かめていない語・確かめてから時間がたった語から出す。
 */
export async function buildCheck(limit = 10): Promise<Item[]> {
  const rows = (await db.cards.toArray()).filter((r) => !r.known && r.reps >= 2 && r.state === State.Review)
  let cands = rows.filter((r) => r.stability >= CHECK_STABLE)
  if (cands.length < 5) cands = rows.filter((r) => r.stability >= 7)
  cands = shuffle(cands).sort((a, b) => (a.checkedAt ?? 0) - (b.checkedAt ?? 0)).slice(0, limit)
  const first: Item[] = []
  const second: Item[] = []
  for (const r of shuffle(cands)) {
    const w = await getWord(r.id)
    if (!w) continue
    const reveals = glossRevealsWord(w)
    const ambiguous = (await ambiguousGloss(w.cat)).has(w.id)
    const spellable = !/[ ]/.test(w.w) && w.w.length <= 14 && !reveals && !ambiguous
    const kinds: QType[] = [
      ...(canUsage(w) ? (['usage'] as const) : []),
      ...(!reveals && !ambiguous ? (['rev'] as const) : []),
      ...(spellable ? (['spell'] as const) : []),
      ...(reveals ? (['flip'] as const) : ['mc' as const]),
    ]
    const sd = randomSeed()
    first.push({ key: `c1-${w.id}`, word: w, type: kinds[0], isNew: false, seed: sd })
    if (kinds[1]) second.push({ key: `c2-${w.id}`, word: w, type: kinds[1], isNew: false, seed: sd + 1 })
  }
  // 同じ語の2問が続かないように、1問目をすべて出してから2問目を別の順で
  return [...first, ...shuffle(second)]
}
