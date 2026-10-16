import { describe, expect, it } from 'vitest'
import { normalizePronunciation, toBase64Utf8 } from '../server/shared'
import { MAX_RETRIES, checkSpelling, chooseType, reinsert, newWordPool, type Item } from '../src/lib/session'
import { diffWords } from '../src/lib/sentences'
import { compareWords } from '../src/lib/localSpeech'
import { downsample, encodeWav } from '../src/lib/recorder'
import { humanizeDiff, interleave, objectiveGrade, Rating } from '../src/lib/srs'
import { splitMarked, markedTarget } from '../src/lib/vocab'
import type { Word } from '../src/lib/types'
import type { CardRow } from '../src/lib/db'

const w = (id: string, extra: Partial<Word> = {}): Word => ({
  id,
  w: id,
  pos: 'n',
  ja: 'テスト',
  lv: 1,
  cat: 'general',
  ex: [{ en: `This is a *${id}*.`, ja: 'テスト' }],
  ...extra,
})

describe('Azure発音評価レスポンスの正規化', () => {
  it('NBest直下の形式', () => {
    const r = normalizePronunciation({
      RecognitionStatus: 'Success',
      NBest: [
        {
          Display: 'Good morning.',
          AccuracyScore: 95,
          FluencyScore: 90,
          CompletenessScore: 100,
          PronScore: 93.4,
          ProsodyScore: 87.8,
          Words: [{ Word: 'good', AccuracyScore: 100, ErrorType: 'None', Phonemes: [{ Phoneme: 'g', AccuracyScore: 99 }] }],
        },
      ],
    })!
    expect(r.pron).toBe(93.4)
    expect(r.prosody).toBe(87.8)
    expect(r.words[0].phonemes[0]).toEqual({ p: 'g', score: 99 })
  })
  it('PronunciationAssessment入れ子の形式', () => {
    const r = normalizePronunciation({
      NBest: [
        {
          Display: 'Hi',
          PronunciationAssessment: { AccuracyScore: 80, FluencyScore: 70, CompletenessScore: 100, PronScore: 81 },
          Words: [{ Word: 'hi', PronunciationAssessment: { AccuracyScore: 60, ErrorType: 'Mispronunciation' } }],
        },
      ],
    })!
    expect(r.accuracy).toBe(80)
    expect(r.prosody).toBeUndefined()
    expect(r.words[0].error).toBe('Mispronunciation')
  })
  it('UTF-8のBase64化（日本語を含む参照文でも壊れない）', () => {
    expect(atob(toBase64Utf8('abc'))).toBe('abc')
    const bin = atob(toBase64Utf8('軌道'))
    expect(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))).toBe('軌道')
  })
})

describe('学習セッション', () => {
  it('スペル判定は大文字小文字・空白を無視し、英米表記どちらも正解', () => {
    const word = w('sleeper', { w: 'sleeper', us: 'tie', cat: 'rail' })
    expect(checkSpelling(' Sleeper ', word)).toBe(true)
    expect(checkSpelling('tie', word)).toBe(true)
    expect(checkSpelling('sleepr', word)).toBe(false)
    expect(checkSpelling('', word)).toBe(false)
  })
  it('不正解の語を数問後に再挿入する', () => {
    const q: Item[] = ['a', 'b', 'c', 'd', 'e', 'f'].map((k) => ({ key: k, word: w(k), type: 'listen', isNew: false }))
    const out = reinsert(q, 0, q[0], 3)
    expect(out.length).toBe(7)
    expect(out[4].word.id).toBe('a')
    expect(out[4].retry).toBe(1)
    expect(out[4].type).toBe('mc')
  })
  it('同じ語の再出題は上限（MAX_RETRIES）までで、問題数が際限なく増えない', () => {
    let q: Item[] = ['a', 'b', 'c'].map((k) => ({ key: k, word: w(k), type: 'mc', isNew: false }))
    let item = q[0]
    for (let i = 0; i < 5; i++) {
      const next = reinsert(q, 0, item, 1)
      if (next === q) break
      q = next
      item = q[2]
    }
    expect(q.filter((x) => x.word.id === 'a').length).toBe(1 + MAX_RETRIES)
  })
  it('未学習・学習初期は選択問題、安定した語は産出問題を含む', () => {
    expect(chooseType(undefined, w('x'), 0)).toBe('mc')
    const stable = { reps: 6, state: 2, stability: 40 } as CardRow
    const types = new Set([0, 1, 2, 3, 4, 5].map((s) => chooseType(stable, w('apple'), s)))
    expect(types.has('cloze') || types.has('spell')).toBe(true)
  })
  it('新出語はカテゴリ設定と上限レベルで絞り込み、低レベルから並ぶ', () => {
    const words = [w('a', { lv: 3, rank: 5 }), w('b', { lv: 1, rank: 9 }), w('c', { lv: 5 }), w('r', { cat: 'rail', lv: 6 }), w('z', { cat: 'business', lv: 3 })]
    const pool = newWordPool(words, new Set(['a']), {
      studyCats: { general: true, business: false, rail: true },
      maxLevel: 3,
    })
    expect(pool.map((g) => g.map((x) => x.id))).toEqual([['b'], ['r']])
  })
  it('インターリーブ', () => {
    expect(interleave<string | number>([[1, 2, 3], ['a'], ['x', 'y']])).toEqual([1, 'a', 'x', 2, 'y', 3])
  })
  it('客観問題の評価', () => {
    expect(objectiveGrade(false, 1000)).toBe(Rating.Again)
    expect(objectiveGrade(true, 3000)).toBe(Rating.Good)
    expect(objectiveGrade(true, 20000)).toBe(Rating.Hard)
  })
  it('間隔の表示', () => {
    expect(humanizeDiff(30_000)).toBe('<1分')
    expect(humanizeDiff(10 * 60_000)).toBe('10分')
    expect(humanizeDiff(3 * 86_400_000)).toBe('3日')
  })
})

describe('テキスト処理', () => {
  it('例文マークの分割', () => {
    expect(splitMarked('I *walk* to work.')).toEqual([
      { t: 'I ', hl: false },
      { t: 'walk', hl: true },
      { t: ' to work.', hl: false },
    ])
    expect(markedTarget('We *maintained* it.')).toBe('maintained')
  })
  it('ディクテーションの差分採点', () => {
    const r = diffWords('The train leaves at nine.', 'the train leave at nine')
    expect(r.tokens.filter((t) => t.kind === 'missing').map((t) => t.t)).toEqual(['leaves'])
    expect(r.score).toBe(80)
  })
  it('端末音声認識の簡易採点', () => {
    const r = compareWords('Please stand behind the yellow line.', 'please stand behind yellow line')
    expect(r.completeness).toBe(83)
    expect(r.words.find((x) => x.word === 'the')?.error).toBe('Omission')
  })
})

describe('録音（WAV）', () => {
  it('16kHzモノラルPCMのヘッダーを書き出す', async () => {
    const blob = encodeWav(new Float32Array(1600), 16000)
    const buf = new DataView(await blob.arrayBuffer())
    expect(buf.getUint32(24, true)).toBe(16000)
    expect(buf.getUint16(22, true)).toBe(1)
    expect(buf.getUint16(34, true)).toBe(16)
    expect(blob.size).toBe(44 + 3200)
  })
  it('48kHz→16kHzのダウンサンプル', () => {
    expect(downsample(new Float32Array(48000), 48000, 16000).length).toBe(16000)
  })
})
