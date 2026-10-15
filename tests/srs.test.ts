import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, todayKey } from '../src/lib/db'
import { dueCards, markKnown, Rating, recordReview, retrievability } from '../src/lib/srs'

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
})
