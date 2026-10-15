import { describe, expect, it } from 'vitest'
import { findTerms, jaVariants } from '../src/lib/glossary'

const words = async (text: string) => (await findTerms(text)).map((h) => h.word.w)

describe('保線用語の検出（glossary）', () => {
  it('例文から軌間・カント・道床・つき固めを検出する', async () => {
    const hits = await findTerms('明日の夜間に下り線で道床つき固めを行い、軌間とカントを測定します。')
    const w = hits.map((h) => h.word.w)
    expect(w).toContain('track gauge')
    expect(w).toContain('cant')
    expect(hits.find((h) => h.word.w === 'track gauge')?.matched).toBe('軌間')
    expect(hits.find((h) => h.word.w === 'cant')?.matched).toBe('カント')
    expect(hits.some((h) => h.matched === '道床')).toBe(true)
    expect(hits.some((h) => h.matched.includes('つき固め'))).toBe(true)
  })

  it('かな2文字の語は部分一致させない（受けた→けた=girder など）', async () => {
    expect(await words('受けた説明')).not.toContain('girder')
    expect(await words('レトロな雰囲気')).not.toContain('trolley')
    expect(await words('いつもの通りです')).not.toContain('alignment')
  })

  it('一般英語の1語（line など）は単独では検出しない', async () => {
    expect(await words('The line was busy')).not.toContain('line')
    expect(await words('Please cut the top of the item and fill it in.')).toEqual([])
  })

  it('他の保線用語と一緒なら一般語も検出する', async () => {
    const w = await words('Tamping was carried out on the line.')
    expect(w).toContain('tamping')
    expect(w).toContain('line')
  })

  it('略語は大文字小文字を区別する', async () => {
    expect(await words('He rams the door.')).not.toContain('RAMS')
  })

  it('記号を含む断片や括弧内の補足は語形にしない', () => {
    expect(jaVariants('レール傾斜（1:40等）')).toEqual(['レール傾斜'])
    expect(jaVariants('標準偏差（σ値）')).toEqual(['標準偏差'])
    expect(jaVariants('桁（けた）')).toEqual([])
    expect(jaVariants('頭部（上面）摩耗')).toEqual(['頭部摩耗'])
    expect(jaVariants('現行（As-Is）プロセス')).toEqual(['現行プロセス'])
    expect(jaVariants('軌道基盤；道床・路盤')).toEqual(['軌道基盤', '道床', '路盤'])
  })
})
