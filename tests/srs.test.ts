import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, todayKey } from '../src/lib/db'
import { dueCards, markKnown, Rating, recordReview, retrievability } from '../src/lib/srs'
import { newWordPool } from '../src/lib/session'

const word = { id: 'g-track', cat: 'general' as const, lv: 2 as const }

describe('FSRSによる復習記録', () => {
  beforeEach(async () => {
    await Promise.all([db.cards.clear(), db.logs.clear(), db.daily.clear()])
  })

  it('初回の正解でカードが作られ、日次統計が更新される', async () => {
    const row = await recordReview(word, Rating.Good, 'mc', 3000)
    expect(row.reps).toBe(1)
    expect(row.due).toBeGreaterThan(Date.now())
    const d = await db.daily.get(todayKey())
    expect(d?.newLearned).toBe(1)
    expect(d?.correct).toBe(1)
    expect(await db.logs.count()).toBe(1)
  })

  it('不正解（Again）は短い間隔、Easyは長い間隔になる', async () => {
    const again = await recordReview({ ...word, id: 'a' }, Rating.Again, 'mc', 3000)
    const easy = await recordReview({ ...word, id: 'b' }, Rating.Easy, 'mc', 3000)
    expect(easy.due - Date.now()).toBeGreaterThan(again.due - Date.now())
  })

  it('復習を重ねると安定度が上がる', async () => {
    let row = await recordReview(word, Rating.Good, 'mc', 2000)
    const s1 = row.stability
    // 次回の期日まで時間を進めて復習した状態を再現
    await db.cards.update(word.id, { due: Date.now() - 1000, last_review: Date.now() - 3 * 86_400_000 })
    row = await recordReview(word, Rating.Good, 'flip', 2000)
    expect(row.stability).toBeGreaterThan(s1)
    expect(retrievability(row)).toBeGreaterThan(0.8)
  })

  it('期日の来たカードを抽出し、「知っている」は除外する', async () => {
    await recordReview({ ...word, id: 'x' }, Rating.Good, 'mc', 2000)
    await db.cards.update('x', { due: Date.now() - 1 })
    expect((await dueCards()).map((r) => r.id)).toEqual(['x'])
    await markKnown({ ...word, id: 'x' }, true)
    expect(await dueCards()).toEqual([])
  })

  it('未学習語の「知っている」を取り消すとカードが消え、新出語の候補に戻る', async () => {
    const w = { ...word, id: 'unseen' }
    await markKnown(w, true)
    const row = await db.cards.get('unseen')
    expect(row?.known).toBe(true)
    expect(row?.reps).toBe(0)
    await markKnown(w, false)
    expect(await db.cards.get('unseen')).toBeUndefined()
    // カードがない語は newWordPool の対象になる
    const cardSet = new Set((await db.cards.toArray()).map((c) => c.id))
    const pool = newWordPool([{ id: 'unseen', w: 'unseen', pos: 'adj', ja: 'テスト', lv: 2, cat: 'general', ex: [] }], cardSet, {
      studyCats: { general: true, business: true, rail: true },
      maxLevel: 3,
    })
    expect(pool.flat().map((x) => x.id)).toEqual(['unseen'])
    // 記録のない語の取り消しは何もしない
    await markKnown({ ...word, id: 'never' }, false)
    expect(await db.cards.get('never')).toBeUndefined()
  })

  it('学習済みの語の「知っている」を取り消すと、履歴を残したまま復習対象に戻る', async () => {
    const w = { ...word, id: 'seen' }
    await recordReview(w, Rating.Good, 'mc', 2000)
    await db.cards.update('seen', { due: Date.now() - 1 })
    await markKnown(w, true)
    expect(await dueCards()).toEqual([])
    await markKnown(w, false)
    const row = await db.cards.get('seen')
    expect(row?.reps).toBe(1)
    expect(row?.known).toBe(false)
    expect((await dueCards()).map((r) => r.id)).toEqual(['seen'])
  })

  it('「知っている」や対象外カテゴリが多くても、本来の復習が limit で取りこぼされない', async () => {
    const past = Date.now() - 60_000
    for (let i = 0; i < 5; i++) {
      await recordReview({ ...word, id: `known${i}` }, Rating.Good, 'mc', 2000)
      await db.cards.update(`known${i}`, { due: past - 1000 + i, known: true })
    }
    for (let i = 0; i < 5; i++) {
      await recordReview({ ...word, id: `rail${i}`, cat: 'rail' }, Rating.Good, 'mc', 2000)
      await db.cards.update(`rail${i}`, { due: past - 500 + i })
    }
    await recordReview({ ...word, id: 'real' }, Rating.Good, 'mc', 2000)
    await db.cards.update('real', { due: past })
    const cats = { general: true, business: true, rail: false }
    expect((await dueCards(Date.now(), 3, cats)).map((r) => r.id)).toEqual(['real'])
    // カテゴリ指定なしなら期日の早い順に limit 件
    expect((await dueCards(Date.now(), 3)).map((r) => r.id)).toEqual(['rail0', 'rail1', 'rail2'])
  })
})
