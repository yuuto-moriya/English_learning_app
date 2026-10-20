import { describe, expect, it } from 'vitest'
import general from '../src/data/vocab/general.json'
import business from '../src/data/vocab/business.json'
import rail from '../src/data/vocab/rail.json'
import itWords from '../src/data/vocab/it.json'
import counts from '../src/data/vocab/counts.json'
import { SCENES } from '../src/data/scenes'
import { SCENE_SUBS } from '../src/data/scenes/subs'
import { sceneProblems } from './sceneRules'
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

/** 拡充前（2026-10）の64場面の ID */
const OLD_SCENE_IDS = [
  'd-intro', 'd-cafe', 'd-directions', 'd-station', 'd-hotel', 'd-restaurant', 'd-shopping', 'd-pharmacy', 'd-airport', 'd-smalltalk',
  'b-meeting-partner', 'b-phone', 'b-run-meeting', 'b-opinion', 'b-schedule', 'b-presentation', 'b-online', 'b-negotiate', 'b-complaint', 'b-email',
  'i-helpdesk', 'i-standup', 'i-code-review', 'i-outage', 'i-requirements', 'i-explain', 'i-phishing', 'i-cloud-migration', 'r-briefing',
  'r-possession', 'r-broken-rail', 'r-recording-review', 'r-planning', 'r-site-visit', 'r-standards', 'r-contractor', 'r-eam', 'r-heavy-rain',
  'r-opinion', 'r-complaint', 'd-clinic', 'd-taxi', 'd-bank', 'd-postoffice', 'd-salon', 'd-reserve-call', 'd-repair', 'd-lost-found',
  'd-houseparty', 'd-tourist-info', 'd-gym', 'd-neighbor', 'b-interview', 'b-welcome-colleague', 'b-one-on-one', 'b-client-smalltalk',
  'b-product-demo', 'b-extension', 'b-client-dinner', 'b-trade-show', 'i-password-reset', 'i-sprint-planning', 'i-demo', 'i-postmortem',
]

describe('シーン会話データ', () => {
  const groups = ['daily', 'business', 'it', 'rail'] as const
  it('場面の数：一般48・ビジネス40・IT 32・鉄道30 以上（拡充前の64本の倍以上）', () => {
    const min = { daily: 48, business: 40, it: 32, rail: 30 }
    for (const g of groups) expect(SCENES.filter((s) => s.group === g).length, g).toBeGreaterThanOrEqual(min[g])
    expect(SCENES.length).toBeGreaterThanOrEqual(128)
  })
  it('ID が重複せず、接頭辞がグループと一致する', () => {
    const prefix = { daily: 'd-', business: 'b-', it: 'i-', rail: 'r-' }
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length)
    for (const s of SCENES) expect(s.id.startsWith(prefix[s.group]), s.id).toBe(true)
  })
  it('拡充前からある場面の ID が残っている（練習の記録が場面の ID で残るため）', () => {
    const ids = new Set(SCENES.map((s) => s.id))
    for (const id of OLD_SCENE_IDS) expect(ids.has(id), id).toBe(true)
  })
  it('どの小分類にも5場面以上あり、グループの中で題が重ならない', () => {
    for (const sub of SCENE_SUBS) expect(SCENES.filter((s) => s.group === sub.group && s.sub === sub.id).length, `${sub.group}/${sub.id}`).toBeGreaterThanOrEqual(5)
    for (const g of groups) {
      const titles = SCENES.filter((s) => s.group === g).map((s) => s.title)
      expect(new Set(titles).size, g).toBe(titles.length)
    }
  })
  it('書式の決まり（台詞12〜16行・キーフレーズ6〜8個・あなたの役・和訳・保線の語など）を守る', () => {
    expect(SCENES.flatMap(sceneProblems)).toEqual([])
  })
  it('グループ → 小分類 → レベルの順に並ぶ', () => {
    const rank = (s: (typeof SCENES)[number]) => groups.indexOf(s.group) * 100 + SCENE_SUBS.findIndex((x) => x.group === s.group && x.id === s.sub)
    for (let i = 1; i < SCENES.length; i++) {
      const a = SCENES[i - 1]
      const b = SCENES[i]
      expect(rank(a) < rank(b) || (rank(a) === rank(b) && a.lv <= b.lv), `${a.id} → ${b.id}`).toBe(true)
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
