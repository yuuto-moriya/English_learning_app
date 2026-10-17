import { describe, expect, it } from 'vitest'
import general from '../src/data/vocab/general.json'
import rail from '../src/data/vocab/rail.json'
import { SCENES } from '../src/data/scenes'
import {
  diagnosticTier,
  formSimilarity,
  listeningTier,
  meaningOverlap,
  sentenceDistractors,
  wordDistractors,
  wordTier,
  type Tier,
} from '../src/lib/distractors'
import type { Sentence } from '../src/lib/sentences'
import type { Word } from '../src/lib/types'

const words = general as Word[]

describe('選択肢の難しさ', () => {
  it('学習者のレベルと覚え具合で決まる', () => {
    expect(wordTier({ learnerLevel: 1 })).toBe(1)
    expect(wordTier({ learnerLevel: 3, stability: 1 })).toBe(1)
    expect(wordTier({ learnerLevel: 5 })).toBe(2)
    expect(wordTier({ learnerLevel: 2, stability: 10 })).toBe(2)
    expect(wordTier({ learnerLevel: 5, stability: 10 })).toBe(3)
    expect(wordTier({ learnerLevel: 3, stability: 30 })).toBe(3)
    expect(wordTier({ learnerLevel: 1, stability: 30 })).toBe(2)
  })

  it('同じ回で出し直す問題は1段やさしく（1より下にはしない）', () => {
    expect(wordTier({ learnerLevel: 5, stability: 10, retry: 1 })).toBe(2)
    expect(wordTier({ learnerLevel: 1, retry: 1 })).toBe(1)
  })

  it('レベル診断・リスニング', () => {
    expect(diagnosticTier(1)).toBe(2)
    expect(diagnosticTier(5)).toBe(3)
    expect(listeningTier(1)).toBe(1)
    expect(listeningTier(3)).toBe(2)
    expect(listeningTier(6)).toBe(3)
    expect(listeningTier(1, -1)).toBe(1)
    expect(listeningTier(6, 1)).toBe(3)
    expect(listeningTier(3, 1)).toBe(3)
  })
})

describe('意味の重なり・綴りの近さ', () => {
  it('意味が重なる組（どちらも正解に見える）', () => {
    expect(meaningOverlap('維持する；保守する', '保守する')).toBe(true)
    expect(meaningOverlap('影響する', '影響；効果')).toBe(true)
    expect(meaningOverlap('ファイル', 'ファイル名')).toBe(true)
    expect(meaningOverlap('借りる', '貸す')).toBe(false)
    expect(meaningOverlap('静かな', 'かなり')).toBe(false)
  })

  it('綴りの近さ', () => {
    expect(formSimilarity('adapt', 'adopt')).toBeCloseTo(0.8)
    expect(formSimilarity('quite', 'quiet')).toBeGreaterThanOrEqual(0.6)
    expect(formSimilarity('price', 'banana')).toBeLessThan(0.4)
  })
})

describe('単語のダミー', () => {
  const sample = words.filter((_, i) => i % 37 === 0)
  const closeCount = (tier: Tier) => {
    let n = 0
    for (const w of sample) n += wordDistractors(w, words, tier).filter((d) => d.kind !== 'random').length
    return n / sample.length
  }

  it('3つ選び、正解と同じ語・意味が重なる語・ダミーどうしの重なりは入れない', () => {
    for (const tier of [1, 2, 3] as const)
      for (const w of sample) {
        const d = wordDistractors(w, words, tier)
        expect(d).toHaveLength(3)
        expect(new Set(d.map((x) => x.word.id)).size).toBe(3)
        for (const x of d) {
          expect(x.word.id).not.toBe(w.id)
          expect(meaningOverlap(w.ja, x.word.ja), `${w.w} / ${x.word.w}`).toBe(false)
        }
        for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) expect(meaningOverlap(d[a].word.ja, d[b].word.ja)).toBe(false)
      }
  })

  it('難しいほど似た選択肢が増える', () => {
    const [c1, c2, c3] = [closeCount(1), closeCount(2), closeCount(3)]
    expect(c1).toBeGreaterThan(0.9)
    expect(c2).toBeGreaterThan(c1)
    expect(c3).toBeGreaterThan(c2)
  })

  it('綴りが似た語を選ぶ（quite → quiet / white / write など）', () => {
    const quite = words.find((w) => w.w === 'quite')!
    const forms = new Set<string>()
    for (let k = 0; k < 20; k++) for (const d of wordDistractors(quite, words, 3)) if (d.kind === 'form') forms.add(d.word.w)
    expect([...forms].some((w) => ['quiet', 'white', 'write', 'quit'].includes(w))).toBe(true)
  })

  it('保線用語は同じ分類の語を使う', () => {
    const pool = rail as Word[]
    const gauge = pool.find((w) => w.w === 'track gauge')!
    const d = wordDistractors(gauge, pool, 3)
    expect(d.filter((x) => x.kind !== 'random').length).toBeGreaterThanOrEqual(2)
  })
})

describe('例文のダミー（リスニング）', () => {
  const plain = (s: string) => s.replace(/\*/g, '')
  const pool: Sentence[] = []
  for (const w of words) if (w.lv <= 3) for (const e of w.ex) pool.push({ en: plain(e.en), ja: e.ja, lv: w.lv, src: 'general', accent: 'en-US', wordId: w.id })
  for (const sc of SCENES) for (const l of sc.lines) pool.push({ en: l.en, ja: l.ja, lv: sc.lv, src: 'scene', accent: 'en-US', scene: sc.id })
  const sample = pool.filter((_, i) => i % 41 === 0)

  it('3つ選び、正解と同じ和訳・ダミーどうしの同じ和訳は入れない', () => {
    for (const t of sample) {
      const d = sentenceDistractors(t, pool, 3)
      expect(d).toHaveLength(3)
      expect(new Set(d.map((x) => x.ja)).size).toBe(3)
      for (const x of d) expect(x.ja).not.toBe(t.ja)
    }
  })

  it('似た例文の数は難しさの数まで', () => {
    for (const t of sample)
      for (const tier of [1, 2, 3] as const) expect(sentenceDistractors(t, pool, tier).filter((x) => x.kind === 'close').length).toBeLessThanOrEqual(tier)
  })
})
