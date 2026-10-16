import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bumpDaily, db, exportAll, importAll, shiftDay, todayKey, toggleMark } from '../src/lib/db'
import { buildDrill, isWeak } from '../src/lib/session'
import { ratePercent, voiceQuality } from '../src/lib/tts'
import { jaForSpeech } from '../src/lib/vocab'
import { CONTRASTS } from '../src/data/minimalPairs'
import { EVIDENCE } from '../src/data/research'
import type { CardRow } from '../src/lib/db'

const card = (extra: Partial<CardRow>): CardRow => ({
  id: 'g-x',
  cat: 'general',
  lv: 1,
  due: Date.now(),
  stability: 3,
  difficulty: 5,
  elapsed_days: 0,
  scheduled_days: 0,
  learning_steps: 0,
  reps: 3,
  lapses: 0,
  state: 2,
  last_review: null,
  addedAt: 0,
  ...extra,
})

describe('読み上げの声', () => {
  const v = (name: string, voiceURI = name) => ({ name, voiceURI })
  it('おもちゃ用の声は使わない（負の値）', () => {
    for (const n of ['Albert', 'Bad News', 'Bells', 'Zarvox', 'Whisper', 'Grandma']) expect(voiceQuality(v(n)), n).toBeLessThan(0)
    expect(voiceQuality(v('Eddy', 'com.apple.eloquence.en-US.Eddy'))).toBeLessThan(0)
  })
  it('Premium > Enhanced > 標準の声 > 旧式の声', () => {
    const premium = voiceQuality(v('Ava (Premium)', 'com.apple.voice.premium.en-US.Ava'))
    const enhanced = voiceQuality(v('Ava (Enhanced)', 'com.apple.voice.enhanced.en-US.Ava'))
    const compact = voiceQuality(v('Samantha', 'com.apple.voice.compact.en-US.Samantha'))
    const old = voiceQuality(v('Fred'))
    expect(premium).toBeGreaterThan(enhanced)
    expect(enhanced).toBeGreaterThan(compact)
    expect(compact).toBeGreaterThan(old)
    expect(voiceQuality(v('Microsoft Aria Online (Natural) - English (United States)'))).toBeGreaterThan(compact)
  })
  it('速度は5%刻みの SSML の値にする（キャッシュが効くように）', () => {
    expect(ratePercent(1)).toBe(0)
    expect(ratePercent(0.95)).toBe(-5)
    expect(ratePercent(0.85)).toBe(-15)
    expect(ratePercent(0.6)).toBe(-40)
    expect(ratePercent(1.15)).toBe(15)
    expect(ratePercent(0.2)).toBe(-50)
    expect(ratePercent(3)).toBe(50)
  })
  it('和訳の読み上げは最初の意味だけ・括弧と「〜」を除く', () => {
    expect(jaForSpeech('〜である；いる、ある')).toBe('である')
    expect(jaForSpeech('（米）地下鉄')).toBe('地下鉄')
    expect(jaForSpeech('まくらぎ')).toBe('まくらぎ')
  })
})

describe('苦手・保存した単語', () => {
  beforeEach(async () => {
    await Promise.all([db.cards.clear(), db.marks.clear(), db.daily.clear()])
  })
  it('忘れたことがある語・難易度の高い語を苦手とみなす（未学習・知っている語は除く）', () => {
    expect(isWeak(card({ lapses: 1 }))).toBe(true)
    expect(isWeak(card({ difficulty: 8 }))).toBe(true)
    expect(isWeak(card({}))).toBe(false)
    expect(isWeak(card({ lapses: 2, known: true }))).toBe(false)
    expect(isWeak(card({ lapses: 2, reps: 0 }))).toBe(false)
    expect(isWeak(undefined)).toBe(false)
  })
  it('苦手な語の集中練習は忘れた回数の多い順', async () => {
    await db.cards.bulkPut([card({ id: 'g-a', lapses: 1 }), card({ id: 'g-be', lapses: 3 }), card({ id: 'g-and' })])
    const items = await buildDrill('weak')
    expect(items.map((i) => i.word.id)).toEqual(['g-be', 'g-a'])
  })
  it('保存の切り替えと、保存した語の練習', async () => {
    expect(await toggleMark('g-be')).toBe(true)
    expect(await db.marks.count()).toBe(1)
    const items = await buildDrill('marked')
    expect(items.map((i) => i.word.id)).toEqual(['g-be'])
    expect(await toggleMark('g-be')).toBe(false)
    expect(await db.marks.count()).toBe(0)
  })
  it('バックアップに保存した単語も含まれる', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) })
    await toggleMark('r-sleeper')
    const json = await exportAll()
    await db.marks.clear()
    await importAll(json)
    expect(await db.marks.get('r-sleeper')).toBeTruthy()
    vi.unstubAllGlobals()
  })
  it('古い記録に項目がなくても日々の集計が NaN にならない', async () => {
    await db.daily.put({ date: todayKey(), reviews: 1 } as never)
    await bumpDaily({ listening: 2, seconds: 10 })
    const d = await db.daily.get(todayKey())
    expect(d?.listening).toBe(2)
    expect(d?.seconds).toBe(10)
    expect(d?.reviews).toBe(1)
  })
  it('日付キーをずらす', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('聞き分けの最小対語', () => {
  it('各対立に6組以上あり、組は2語とも違うつづり・重複なし', () => {
    for (const c of CONTRASTS) {
      expect(c.pairs.length, c.id).toBeGreaterThanOrEqual(6)
      const seen = new Set<string>()
      for (const [a, b] of c.pairs) {
        expect(a).not.toBe(b)
        const key = `${a}/${b}`
        expect(seen.has(key), key).toBe(false)
        seen.add(key)
      }
    }
  })
  it('読み方が2通りある語（音声合成が読み違えるおそれ）を含まない', () => {
    const homographs = new Set(['lead', 'live', 'close', 'row', 'read', 'wind', 'bow', 'tear', 'wound', 'bass', 'minute', 'object'])
    for (const c of CONTRASTS) for (const p of c.pairs) for (const w of p) expect(homographs.has(w), `${c.id}:${w}`).toBe(false)
  })
})

describe('学習法の根拠', () => {
  it('すべての項目に文献があり、ID が重複しない', () => {
    const ids = new Set(EVIDENCE.map((e) => e.id))
    expect(ids.size).toBe(EVIDENCE.length)
    for (const e of EVIDENCE) expect(e.refs.length, e.id).toBeGreaterThan(0)
  })
})
