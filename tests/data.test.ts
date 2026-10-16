import { describe, expect, it } from 'vitest'
import general from '../src/data/vocab/general.json'
import business from '../src/data/vocab/business.json'
import rail from '../src/data/vocab/rail.json'
import counts from '../src/data/vocab/counts.json'
import { SCENES } from '../src/data/scenes'
import type { Word } from '../src/lib/types'

const all = [...(general as Word[]), ...(business as Word[]), ...(rail as Word[])]

describe('単語データ', () => {
  it('3,000語以上ある', () => {
    expect(all.length).toBeGreaterThanOrEqual(3000)
  })

  it('語数の集計（counts.json）が単語データと一致する（npm run data:build で再生成）', () => {
    expect(counts).toEqual({ general: general.length, business: business.length, rail: rail.length })
  })

  it('IDが一意', () => {
    const ids = new Set(all.map((w) => w.id))
    expect(ids.size).toBe(all.length)
  })

  it('全語に和訳・例文（英日）・レベルがある', () => {
    for (const w of all) {
      expect(w.ja, w.id).toBeTruthy()
      expect(w.ex.length, w.id).toBeGreaterThan(0)
      expect(w.ex[0].en, w.id).toBeTruthy()
      expect(w.ex[0].ja, w.id).toBeTruthy()
      expect(w.lv).toBeGreaterThanOrEqual(1)
      expect(w.lv).toBeLessThanOrEqual(6)
    }
  })

  it('例文に学習対象語のマーク（*word*）がある', () => {
    const missing = all.filter((w) => !w.ex[0].en.includes('*'))
    expect(missing.map((w) => w.id)).toEqual([])
  })

  it('全語に米音IPAがあり、保線用語には英音IPAもある', () => {
    expect(all.filter((w) => !w.ipa).map((w) => w.id)).toEqual([])
    expect((rail as Word[]).filter((w) => !w.ipaUk).map((w) => w.id)).toEqual([])
  })

  it('保線用語には出典タグとサブカテゴリがある', () => {
    for (const w of rail as Word[]) {
      expect(w.refs?.length, w.id).toBeGreaterThan(0)
      expect(w.sub, w.id).toBeTruthy()
    }
  })

  it('全レベルに単語がある', () => {
    for (const lv of [1, 2, 3, 4, 5, 6]) expect(all.some((w) => w.lv === lv)).toBe(true)
  })
})

describe('シーン会話データ', () => {
  it('日常・ビジネス・保線がそれぞれ8場面以上', () => {
    for (const g of ['daily', 'business', 'rail'] as const) {
      expect(SCENES.filter((s) => s.group === g).length).toBeGreaterThanOrEqual(8)
    }
  })
  it('会話の話者がrolesに含まれる', () => {
    for (const s of SCENES) {
      const ids = new Set(s.roles.map((r) => r.id))
      for (const l of s.lines) expect(ids.has(l.sp), `${s.id}:${l.en}`).toBe(true)
    }
  })
})
