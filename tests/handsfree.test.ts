import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { BLOCK_SIZE, composeMs, formatClock, playableKinds, repeatMs, takeBlock, thinkMs, userRole, type HfPools } from '../src/lib/handsfree'
import { SCENES } from '../src/data/scenes'
import type { Sentence } from '../src/lib/sentences'
import type { Word } from '../src/lib/types'

const word = (id: string): Word => ({ id, w: id, pos: 'n', ja: 'テスト', lv: 1, cat: 'general', ex: [] })
const sent = (en: string): Sentence => ({ en, ja: '文', lv: 1, src: 'general', accent: 'en-US' })
const pools = (extra: Partial<HfPools> = {}): HfPools => ({
  words: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ word: word(id), dir: 'ja-en' as const })),
  repeat: [sent('one two three four'), sent('five six seven eight')],
  compose: [sent('I like tea.')],
  scenes: [],
  ...extra,
})

describe('ながら練習', () => {
  it('まねして言う間は文の長さに合わせ、ペースで伸び縮みする（短すぎず長すぎず）', () => {
    const short = repeatMs('Thank you.', 'normal')
    const long = repeatMs('Could you tell me how to get to the station from here please?', 'normal')
    expect(short).toBe(3000)
    expect(long).toBeGreaterThan(short)
    expect(long).toBeLessThanOrEqual(9000)
    expect(repeatMs('Thank you.', 'slow')).toBeGreaterThan(short)
    expect(repeatMs('Thank you.', 'quick')).toBeLessThan(short)
    // 日本語から英語にして言うときは、組み立てる時間の分だけ長い
    expect(composeMs('I like tea.', 'normal')).toBeGreaterThan(repeatMs('I like tea.', 'normal'))
    expect(thinkMs('normal')).toBe(4000)
  })
  it('まとまりは決まった数ずつ出し、使い切ったら最初に戻る（長い時間でも止まらない）', () => {
    const p = pools()
    let c = { words: 0, repeat: 0, compose: 0, dialogue: 0 }
    const a = takeBlock('words', p, c)
    expect(a.items.map((x) => (x.kind === 'words' ? x.word.id : ''))).toEqual(['a', 'b', 'c', 'd', 'e'])
    c = a.cursors
    const b = takeBlock('words', p, c)
    expect(b.items.map((x) => (x.kind === 'words' ? x.word.id : ''))).toEqual(['f', 'g', 'a', 'b', 'c'])
    // 内容が少ないときは、同じものを続けて出さないよう数を減らす
    expect(takeBlock('repeat', p, c).items.length).toBe(2)
    expect(BLOCK_SIZE.dialogue).toBe(1)
  })
  it('出せる内容がない種類は飛ばす', () => {
    expect(playableKinds(['words', 'dialogue', 'compose'], pools())).toEqual(['words', 'compose'])
    expect(playableKinds(['dialogue'], pools())).toEqual([])
  })
  it('会話の「あなた」の台詞のあとに、まねして言う間を置く', () => {
    const withYou = SCENES.filter((s) => userRole(s))
    expect(withYou.length).toBeGreaterThan(30)
    for (const s of withYou) expect(s.lines.some((l) => l.sp === userRole(s)), s.id).toBe(true)
  })
  it('残り時間の表示', () => {
    expect(formatClock(15 * 60_000)).toBe('15:00')
    expect(formatClock(61_500)).toBe('1:02')
    expect(formatClock(-5)).toBe('0:00')
  })
})
