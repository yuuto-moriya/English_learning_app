import { describe, expect, it } from 'vitest'
import { chooseType, canUsage } from '../src/lib/session'
import { formOf, formQuestion, hasFormQuestion, inflect, orderMatches, orderTokens, plural, quizExample, scrambled, usageQuestion } from '../src/lib/quiz'
import { CONFUSABLES } from '../src/data/confusables'
import general from '../src/data/vocab/general.json'
import business from '../src/data/vocab/business.json'
import itWords from '../src/data/vocab/it.json'
import type { Word } from '../src/lib/types'
import type { CardRow } from '../src/lib/db'

const G = general as Word[]
const byW = (w: string) => G.find((x) => x.w === w)!

describe('語形（使い分けの選択肢を例文と同じ形にする）', () => {
  it('複数形', () => {
    expect(plural('city')).toBe('cities')
    expect(plural('box')).toBe('boxes')
    expect(plural('day')).toBe('days')
  })
  it('例文の形が原形・変化形・複数形のどれか分かり、ほかの語を同じ形にできる', () => {
    const go = byW('go')
    const take = byW('take')
    expect(formOf(go, 'went')).toEqual({ kind: 'vf', i: 1 })
    expect(inflect(take, { kind: 'vf', i: 1 })).toBe('took')
    expect(formOf(byW('city'), 'cities')).toEqual({ kind: 'pl' })
    expect(formOf(go, 'Go')).toEqual({ kind: 'base' })
  })
})

describe('使い分け（例文の空所を意味の近い語から選ぶ）', () => {
  it('選択肢はすべて同じ品詞・同じ形で、正解は1つ', () => {
    let made = 0
    for (const w of G.filter((x) => x.pos === 'v' || x.pos === 'n' || x.pos === 'adj').slice(0, 400)) {
      const q = usageQuestion(w, G, 3, quizExample(w, 0))
      if (!q) continue
      made++
      expect(q.options.filter((o) => o.word.id === w.id)).toHaveLength(1)
      expect(new Set(q.options.map((o) => o.text.toLowerCase())).size).toBe(q.options.length)
      for (const o of q.options) expect(o.word.pos).toBe(w.pos)
      expect(q.blanked).toContain('＿＿＿')
      expect(q.blanked.toLowerCase()).not.toContain(`*`)
    }
    expect(made).toBeGreaterThan(300)
  })
  it('過去形の例文なら、選択肢も過去形にする', () => {
    const w = byW('choose')
    const ex = { en: 'I *chose* the red one.', ja: '赤いのを選んだ。' }
    const q = usageQuestion(w, G, 3, ex)!
    expect(q.answer).toBe('chose')
    for (const o of q.options.filter((o) => o.word.id !== w.id)) expect(o.text).toBe(o.word.vf![1].split(' / ')[0])
  })
  it('一般・ビジネス・IT のほとんどの語で作れる', () => {
    for (const ws of [G, business as Word[], itWords as Word[]]) {
      const ok = ws.filter(canUsage).length
      expect(ok / ws.length).toBeGreaterThan(0.85)
    }
  })
  it('問題の例文は、2つ目（はじめて学んだときに見せていない文）を優先する', () => {
    const w = byW('travel')
    expect(w.ex.length).toBeGreaterThanOrEqual(2)
    const picked = [0, 1, 3, 4].map((s) => quizExample(w, s)!.en)
    expect(picked.every((e) => e === w.ex[1].en)).toBe(true)
  })
})

describe('不規則動詞の変化形', () => {
  it('過去形と過去分詞を問い、まちがえやすい形（goed・choosen）を混ぜる', () => {
    const go = byW('go')
    const past = formQuestion(go, 0)!
    expect(past.label).toBe('過去形')
    expect(past.answer).toBe('went')
    expect(past.options).toContain('gone')
    expect(past.options).toContain('goed')
    const pp = formQuestion(byW('choose'), 1)!
    expect(pp.label).toBe('過去分詞')
    expect(pp.answer).toBe('chosen')
    expect(pp.options).toContain('chose')
    expect(new Set(pp.options).size).toBe(pp.options.length)
  })
  it('規則動詞・be は出さない。正しい別の形（learnt）をまちがいにしない', () => {
    expect(hasFormQuestion(byW('study'))).toBe(false)
    expect(hasFormQuestion(byW('be'))).toBe(false)
    for (const w of G.filter(hasFormQuestion)) {
      for (const s of [0, 1]) {
        const q = formQuestion(w, s)
        if (!q) continue
        const right = (q.label === '過去形' ? w.vf![1] : w.vf![2]).split(' / ').map((x) => x.trim())
        expect(q.options.filter((o) => right.includes(o))).toEqual([q.answer])
      }
    }
  })
})

describe('並べかえ', () => {
  it('4〜9語の文だけ。混ぜた順は元と違い、正しく並べると正解', () => {
    expect(orderTokens('Hi there.')).toBeNull()
    const t = orderTokens('I *like* to travel by train.')!
    expect(t).toEqual(['I', 'like', 'to', 'travel', 'by', 'train.'])
    const s = scrambled(t)
    expect(s.join(' ')).not.toBe(t.join(' '))
    expect([...s].sort()).toEqual([...t].sort())
    expect(orderMatches(t, t)).toBe(true)
    expect(orderMatches(s, t)).toBe(false)
  })
})

describe('出題形式の段階', () => {
  it('定着した語には、使い分け・書く・並べかえなど、いろいろな形式が出る', () => {
    const stable = { reps: 6, state: 2, stability: 40 } as CardRow
    const types = new Set(Array.from({ length: 12 }, (_, s) => chooseType(stable, byW('choose'), s)))
    expect(types.has('usage')).toBe(true)
    expect(types.has('form')).toBe(true)
    expect(types.size).toBeGreaterThanOrEqual(4)
  })
  it('覚えはじめの語は意味を選ぶ問題、7日未満は英語を選ぶ問題も混ぜる', () => {
    expect(chooseType(undefined, byW('travel'), 0)).toBe('mc')
    const young = { reps: 3, state: 2, stability: 4 } as CardRow
    const types = new Set([0, 1, 2].map((s) => chooseType(young, byW('travel'), s)))
    expect(types.has('rev')).toBe(true)
  })
})

describe('使い分けのデータ', () => {
  it('どの問題も、答えが選択肢に1つだけあり、空所が1つ', () => {
    for (const set of CONFUSABLES) {
      expect(set.items.length, set.id).toBeGreaterThanOrEqual(3)
      for (const it of set.items) {
        expect(it.en.split('___').length, it.en).toBe(2)
        expect(it.opts.filter((o) => o === it.ans), it.en).toHaveLength(1)
        expect(new Set(it.opts).size).toBe(it.opts.length)
        expect(it.opts.length).toBeGreaterThanOrEqual(2)
        expect(it.ja).toMatch(/[。？！]$/)
      }
    }
    expect(new Set(CONFUSABLES.map((s) => s.id)).size).toBe(CONFUSABLES.length)
  })
})
