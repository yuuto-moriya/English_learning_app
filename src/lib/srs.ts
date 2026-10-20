import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs'
import { bumpDaily, db, todayKey, type CardRow } from './db'
import type { Category, Word } from './types'

export { Rating, State }
export type { Grade }

/**
 * FSRS（Free Spaced Repetition Scheduler）で復習間隔を決める。
 * 目標保持率(request_retention)に到達する直前に復習を入れることで、
 * 想起の努力（desirable difficulty）と記憶の安定化を両立させる。
 */
export function scheduler(retention = 0.9) {
  return fsrs(
    generatorParameters({
      request_retention: retention,
      maximum_interval: 3650,
      enable_fuzz: true,
      enable_short_term: true,
    }),
  )
}

export function rowToCard(row: CardRow): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  }
}

export function cardToRow(card: Card, word: Pick<Word, 'id' | 'cat' | 'lv'>, prev?: CardRow): CardRow {
  return {
    id: word.id,
    cat: word.cat,
    lv: word.lv,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.getTime() : null,
    addedAt: prev?.addedAt ?? Date.now(),
    known: prev?.known,
    checkedAt: prev?.checkedAt,
  }
}

/** 客観問題（選択・入力）の結果からFSRSの評価を決める */
export function objectiveGrade(correct: boolean, ms: number, typed = false): Grade {
  if (!correct) return Rating.Again
  // 入力する問題は、iPhone で打つ時間がかかるので長めに見る（正しく書けたのに「難しい」にならないように）
  if (ms > (typed ? 25000 : 12000)) return Rating.Hard
  return Rating.Good
}

/** 単語を1回復習した結果を保存する */
export async function recordReview(
  word: Pick<Word, 'id' | 'cat' | 'lv'>,
  grade: Grade,
  mode: string,
  ms: number,
  retention = 0.9,
): Promise<CardRow> {
  const f = scheduler(retention)
  const now = new Date()
  const prev = await db.cards.get(word.id)
  const isNew = !prev
  const card = prev ? rowToCard(prev) : createEmptyCard(now)
  const { card: next } = f.next(card, now, grade)
  const row = cardToRow(next, word, prev)
  await db.transaction('rw', db.cards, db.logs, async () => {
    await db.cards.put(row)
    await db.logs.add({ wordId: word.id, rating: grade, mode, at: now.getTime(), ms })
  })
  await bumpDaily({
    reviews: 1,
    newLearned: isNew ? 1 : 0,
    // 「難しい」は思い出せた（正解）。セッションのまとめと同じ数え方にする
    correct: grade !== Rating.Again ? 1 : 0,
    seconds: Math.min(60, Math.round(ms / 1000)),
  })
  return row
}

/** 各評価を押した場合の次回復習までの間隔プレビュー */
export function previewIntervals(row: CardRow | undefined, retention = 0.9): Record<Grade, string> {
  const f = scheduler(retention)
  const now = new Date()
  const card = row ? rowToCard(row) : createEmptyCard(now)
  const preview = f.repeat(card, now)
  const out = {} as Record<Grade, string>
  for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[]) {
    out[g] = humanizeDiff(preview[g].card.due.getTime() - now.getTime())
  }
  return out
}

export function humanizeDiff(ms: number): string {
  if (ms < 60000) return '<1分'
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min}分`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}時間`
  const d = Math.round(h / 24)
  if (d < 31) return `${d}日`
  const mo = Math.round(d / 30)
  if (mo < 12) return `${mo}か月`
  return `${(d / 365).toFixed(1)}年`
}

/** 記憶の想起確率（0〜1） */
export function retrievability(row: CardRow, now = new Date()): number {
  const f = scheduler()
  return f.get_retrievability(rowToCard(row), now, false)
}

/**
 * 期日の来た復習カード（期日の早い順）。
 * 「知っている」と学習対象外カテゴリは limit の前に除外する
 * （先に limit すると、除外対象が多いときに本来の復習が取りこぼされるため）。
 */
export async function dueCards(
  now = Date.now(),
  limit = 200,
  cats?: Partial<Record<Category, boolean>>,
): Promise<CardRow[]> {
  return db.cards
    .where('due')
    .belowOrEqual(now)
    .filter((r) => !r.known && (!cats || !!cats[r.cat]))
    .limit(limit)
    .toArray()
}

export async function newLearnedToday(): Promise<number> {
  const d = await db.daily.get(todayKey())
  return d?.newLearned ?? 0
}

/** カテゴリを交互に並べる（インターリーブ） */
export function interleave<T>(groups: T[][]): T[] {
  const out: T[] = []
  const max = Math.max(0, ...groups.map((g) => g.length))
  for (let i = 0; i < max; i++) for (const g of groups) if (g[i] !== undefined) out.push(g[i])
  return out
}

export async function markKnown(word: Pick<Word, 'id' | 'cat' | 'lv'>, known: boolean) {
  await db.transaction('rw', db.cards, async () => {
    const prev = await db.cards.get(word.id)
    if (prev) {
      // 一度も学習していない語の「知っている」を取り消したら行ごと消し、新出語の候補に戻す
      // （残すと due=MAX_SAFE_INTEGER のまま復習にも新出にも出てこなくなる）
      if (!known && prev.reps === 0) await db.cards.delete(word.id)
      else await db.cards.update(word.id, { known })
    } else if (known) {
      const card = createEmptyCard(new Date())
      await db.cards.put({ ...cardToRow(card, word), known, due: Number.MAX_SAFE_INTEGER })
    }
  })
}
