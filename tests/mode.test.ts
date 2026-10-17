import { describe, expect, it } from 'vitest'
import { everyCat, modeCaption, modeName, modeState, onlyCat, toggleCat } from '../src/lib/mode'

const sel = (...on: string[]) => ({
  general: on.includes('general'),
  business: on.includes('business'),
  it: on.includes('it'),
  rail: on.includes('rail'),
})

describe('学ぶモードの状態', () => {
  it('1コースだけ・すべて・組み合わせを見分ける', () => {
    expect(modeState(sel('it'))).toEqual({ kind: 'single', cat: 'it' })
    expect(modeState(sel('general', 'business', 'it', 'rail'))).toEqual({ kind: 'all' })
    expect(modeState(sel('general', 'rail'))).toEqual({ kind: 'combo', cats: ['general', 'rail'] })
  })

  it('組み合わせの名前', () => {
    expect(modeName(['general', 'rail'])).toBe('一般＋鉄道')
  })

  it('状態ごとの説明', () => {
    expect(modeCaption(modeState(sel('it')))).toBe('ITだけを出題')
    expect(modeCaption(modeState(sel('general', 'business', 'it', 'rail')))).toBe('すべてのコースから出題')
    expect(modeCaption(modeState(sel('general', 'business', 'it')))).toBe('一般＋ビジネス＋ITから出題')
    expect(modeCaption(modeState(sel()))).toBe('出題するコースを選んでください')
  })

  it('そのコースだけ・すべてにする', () => {
    expect(onlyCat('business')).toEqual(sel('business'))
    expect(everyCat()).toEqual(sel('general', 'business', 'it', 'rail'))
  })

  it('組み合わせの足し外し。最後の1つは外せない', () => {
    expect(toggleCat(sel('general'), 'rail')).toEqual(sel('general', 'rail'))
    expect(toggleCat(sel('general', 'rail'), 'general')).toEqual(sel('rail'))
    expect(toggleCat(sel('rail'), 'rail')).toBeNull()
  })
})
