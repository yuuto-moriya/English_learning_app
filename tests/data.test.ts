import { describe, expect, it } from 'vitest'
import general from '../src/data/vocab/general.json'
import business from '../src/data/vocab/business.json'
import rail from '../src/data/vocab/rail.json'
import itWords from '../src/data/vocab/it.json'
import counts from '../src/data/vocab/counts.json'
import { SCENES } from '../src/data/scenes'
import { CONTRASTS } from '../src/data/minimalPairs'
import { PAIR_WORDS } from '../src/data/pairWords'
import type { Word } from '../src/lib/types'

const all = [...(general as Word[]), ...(business as Word[]), ...(itWords as Word[]), ...(rail as Word[])]

describe('単語データ', () => {
  it('3,000語以上ある', () => {
    expect(all.length).toBeGreaterThanOrEqual(3000)
  })

  it('語数の集計（counts.json）が単語データと一致する（npm run data:build で再生成）', () => {
    expect(counts).toEqual({ general: general.length, business: business.length, it: itWords.length, rail: rail.length })
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

  it('品詞で読みが変わる語は、その品詞の発音になっている', () => {
    const ipa = (w: string) => all.find((x) => x.w === w)?.ipa
    expect(ipa('live')).toBe('lɪv') // 動詞（住む）。形容詞の laɪv ではない
    expect(ipa('read')).toBe('riːd')
    expect(ipa('use')).toBe('juːz')
    expect(ipa('close')).toBe('kloʊz')
    expect(ipa('increase')).toBe('ɪnˈkriːs') // 動詞は後ろに強勢
    expect(ipa('record')).toBe('ˈrɛkɚd') // 名詞は前に強勢
    expect(ipa('separate')).toBe('ˈsɛpɚət') // 形容詞
    expect(all.filter((w) => w.ipa?.includes('hw')).map((w) => w.w)).toEqual([])
  })

  it('保線用語には出典タグとサブカテゴリがある', () => {
    for (const w of rail as Word[]) {
      expect(w.refs?.length, w.id).toBeGreaterThan(0)
      expect(w.sub, w.id).toBeTruthy()
    }
  })

  it('IT の単語：200語以上、ほかのコースと重複なし、全語に例文と和訳', () => {
    expect(itWords.length).toBeGreaterThanOrEqual(200)
    // IT の見出し語は、ほかのコース（一般・ビジネス・鉄道）と重ならない
    const others = new Set(all.filter((w) => w.cat !== 'it').map((w) => w.w.toLowerCase()))
    expect((itWords as Word[]).filter((w) => others.has(w.w.toLowerCase())).map((w) => w.w)).toEqual([])
    for (const w of itWords as Word[]) {
      expect(w.id.startsWith('i-'), w.id).toBe(true)
      expect(w.ex[0]?.en.includes('*'), w.id).toBe(true)
      expect(w.ex[0]?.ja.length, w.id).toBeGreaterThan(0)
    }
  })

  it('全レベルに単語がある', () => {
    for (const lv of [1, 2, 3, 4, 5, 6]) expect(all.some((w) => w.lv === lv)).toBe(true)
  })
})

describe('シーン会話データ', () => {
  it('日常・ビジネス・保線がそれぞれ8場面以上', () => {
    for (const g of ['daily', 'business', 'it', 'rail'] as const) {
      expect(SCENES.filter((s) => s.group === g).length).toBeGreaterThanOrEqual(8)
    }
  })
  it('ID が重複せず、接頭辞がグループと一致する', () => {
    const prefix = { daily: 'd-', business: 'b-', it: 'i-', rail: 'r-' }
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length)
    for (const s of SCENES) expect(s.id.startsWith(prefix[s.group]), s.id).toBe(true)
  })
  it('日常・ビジネス・IT の場面に保線の専門語が入っていない（鉄道はコースで選ぶ）', () => {
    const railish = /\b(track|tracks|rail|rails|railway|sleepers?|tamp\w*|possession|ballast|grinding)\b/i
    for (const s of SCENES.filter((x) => x.group !== 'rail'))
      for (const t of [...s.phrases, ...s.lines]) expect(railish.test(t.en), `${s.id}: ${t.en}`).toBe(false)
  })
  it('会話の話者がrolesに含まれる', () => {
    for (const s of SCENES) {
      const ids = new Set(s.roles.map((r) => r.id))
      for (const l of s.lines) expect(ids.has(l.sp), `${s.id}:${l.en}`).toBe(true)
    }
  })
})

describe('聞き分け（最小対語）の意味と例文', () => {
  const words = new Set(CONTRASTS.flatMap((c) => c.pairs.flat()))

  it('すべての語に意味・例文・和訳がある', () => {
    for (const w of words) {
      const g = PAIR_WORDS[w]
      expect(g, w).toBeDefined()
      expect(g.ja.trim(), w).not.toBe('')
      expect(g.exJa.trim(), w).not.toBe('')
    }
  })

  it('例文はその語を *word* で1つだけ示す', () => {
    for (const w of words) {
      const marks = [...PAIR_WORDS[w].en.matchAll(/\*([^*]+)\*/g)].map((m) => m[1].toLowerCase())
      expect(marks, w).toEqual([w])
    }
  })

  it('使っていない語の説明を残さない', () => {
    expect(Object.keys(PAIR_WORDS).filter((w) => !words.has(w))).toEqual([])
  })

  it('同じ対立の中に同じ組がない・組の2語はちがう', () => {
    for (const c of CONTRASTS) {
      const keys = c.pairs.map(([a, b]) => `${a}/${b}`)
      expect(new Set(keys).size, c.id).toBe(keys.length)
      for (const [a, b] of c.pairs) expect(a, c.id).not.toBe(b)
    }
  })
})
