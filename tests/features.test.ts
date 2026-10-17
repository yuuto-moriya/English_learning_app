import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bumpDaily, db, exportAll, importAll, shiftDay, todayKey, toggleMark } from '../src/lib/db'
import { buildDrill, isWeak } from '../src/lib/session'
import { ratePercent, voiceQuality } from '../src/lib/tts'
import { jaForSpeech } from '../src/lib/vocab'
import { CONTRASTS } from '../src/data/minimalPairs'
import { EVIDENCE } from '../src/data/research'
import { SCENES, sceneAccent } from '../src/data/scenes'
import { sentencePool } from '../src/lib/sentences'
import { accentFor, formatMinutes, MINUTE_CHOICES, migrateSettings, newPerDay } from '../src/lib/settings'
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
  it('日本語の iPhone で名前が日本語になった遊び用の声も使わない（Samantha は残す）', () => {
    const jp = [
      ['オルガン', 'com.apple.speech.synthesis.voice.Organ'],
      ['ささやき声', 'com.apple.speech.synthesis.voice.Whisper'],
      ['スーパースター', 'com.apple.speech.synthesis.voice.Superstar'],
      ['トリノイド', 'com.apple.speech.synthesis.voice.Trinoids'],
      ['ベル', 'com.apple.speech.synthesis.voice.Bells'],
      ['震え', 'com.apple.speech.synthesis.voice.Wobble'],
      ['道化', 'com.apple.speech.synthesis.voice.Jester'],
    ]
    for (const [name, uri] of jp) {
      expect(voiceQuality(v(name, uri)), name).toBeLessThan(0)
      // 名前が想定外の訳でも、ID で見分けられる
      expect(voiceQuality(v('（不明な名前）', uri)), uri).toBeLessThan(0)
    }
    expect(voiceQuality(v('Samantha', 'com.apple.voice.compact.en-US.Samantha'))).toBeGreaterThanOrEqual(0)
    expect(voiceQuality(v('Fred', 'com.apple.speech.synthesis.voice.Fred'))).toBeLessThan(0)
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

describe('練習の文（シーン会話）', () => {
  const sceneOf = new Map(SCENES.flatMap((sc) => sc.lines.map((l) => [l.en, sc] as const)))
  it('一緒に選んだコースの場面だけを使う', async () => {
    const pool = (await sentencePool(['general', 'scene'], 6)).filter((s) => s.src === 'scene')
    expect(pool.length).toBeGreaterThan(0)
    for (const s of pool) expect(sceneOf.get(s.en)?.group, s.en).toBe('daily')
  })
  it('シーン会話だけを選んだときはすべての場面', async () => {
    const groups = new Set((await sentencePool(['scene'], 6)).map((s) => sceneOf.get(s.en)?.group))
    expect(groups).toEqual(new Set(['daily', 'business', 'it', 'rail']))
  })
  it('発音は舞台に合わせる（英国の駅は英国の発音）', () => {
    expect(sceneAccent(SCENES.find((s) => s.id === 'd-station')!)).toBe('en-GB')
    expect(sceneAccent(SCENES.find((s) => s.id === 'd-cafe')!)).toBe('en-US')
    expect(sceneAccent(SCENES.find((s) => s.id === 'r-briefing')!)).toBe('en-GB')
  })
})

describe('設定の移行（国・地域の発音、IT コース）', () => {
  it('v3 の米国・英国の声を、発音ごとの声に移す。IT は追加でオフ', () => {
    const v3 = { onboarded: true, studyCats: { general: true, business: false, rail: true }, voiceUS: 'Ava (Premium)', voiceUK: '', neuralUS: 'en-US-AndrewNeural', neuralUK: 'en-GB-RyanNeural' }
    const s = migrateSettings(v3, 3)
    expect(s.deviceVoice['en-US']).toBe('Ava (Premium)')
    expect(s.deviceVoice['en-GB']).toBeUndefined()
    expect(s.neural['en-GB']).toBe('en-GB-RyanNeural')
    expect(s.studyCats).toEqual({ general: true, business: false, it: false, rail: true })
    expect('voiceUS' in s).toBe(false)
    expect(s.accent).toBe('en-US')
    expect(s.railAccent).toBe('en-GB')
    expect(s.tourDone).toBe(false)
  })
  it('1日の目安は最大2時間。新しい単語は30語まで', () => {
    expect(Math.max(...MINUTE_CHOICES)).toBe(120)
    expect(formatMinutes(15)).toBe('15分')
    expect(formatMinutes(60)).toBe('1時間')
    expect(formatMinutes(90)).toBe('1時間30分')
    expect(formatMinutes(120)).toBe('2時間')
    expect(newPerDay(10)).toBe(6)
    expect(newPerDay(120)).toBe(30)
    expect(newPerDay(5)).toBe(3)
  })
  it('鉄道は railAccent、それ以外は選んだ発音', () => {
    const s = { accent: 'en-AU', railAccent: 'en-GB' } as const
    expect(accentFor('it', s)).toBe('en-AU')
    expect(accentFor('general', s)).toBe('en-AU')
    expect(accentFor('rail', s)).toBe('en-GB')
  })
})

describe('学習法の根拠', () => {
  it('すべての項目に文献があり、ID が重複しない', () => {
    const ids = new Set(EVIDENCE.map((e) => e.id))
    expect(ids.size).toBe(EVIDENCE.length)
    for (const e of EVIDENCE) expect(e.refs.length, e.id).toBeGreaterThan(0)
  })
})
