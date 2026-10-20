import type { Word } from './types'
import { loadCategory } from './vocab'

/**
 * 保線用語グロッサリー。翻訳文・原文に含まれる専門用語を検出し、
 * EN規格の英国表記・米国表記・日本語（JIS）を並べて示す。
 */
export interface GlossaryHit {
  word: Word
  matched: string
  lang: 'en' | 'ja'
}

interface Entry {
  word: Word
  term: string
  lang: 'en' | 'ja'
  re?: RegExp
  /**
   * 一般語としても頻出する語（line, track, ポイント, 更新 など）。
   * 文中に他の（weakでない）保線用語があるときだけ検出する。
   */
  weak: boolean
}

/** 一般英語として頻出する1語の用語。単独では検出せず、他の保線用語と同時に出たときだけ表示する */
const EN_WEAK = new Set(
  [
    // 線路・構造・作業（一般語義が強いもの）
    'line', 'track', 'top', 'cut', 'fill', 'item', 'tie', 'dip', 'yard', 'bed', 'slope', 'bridge', 'pier',
    'portal', 'chord', 'crossing', 'switch', 'points', 'junction', 'depot', 'formation', 'surface', 'grade',
    'gradient', 'alignment', 'spiral', 'shoulder', 'bearer', 'siding', 'cutting', 'diamond', 'frog', 'turnout',
    'crossover', 'interlocking', 'trolley', 'sleeper', 'tamper', 'lifting', 'lining', 'twist', 'warp',
    'hunting', 'squat', 'shelling', 'shim', 'scour', 'drainage', 'corrosion', 'landslide', 'possession',
    'protection', 'isolation', 'earthing', 'grounding', 'insulator', 'obstruction', 'lookout', 'watchman',
    'dispatcher', 'detonator', 'mileage', 'overrun', 'derail',
    // 保全・規格（ビジネス一般語）
    'asset', 'failure', 'fault', 'hazard', 'maintenance', 'replacement', 'renewal', 'refurbishment',
    'rehabilitation', 'overhaul', 'availability', 'reliability', 'maintainability', 'criticality',
    'competence', 'competency', 'compliance', 'tolerance', 'clause', 'shall', 'should', 'waiver', 'backlog',
    'bottleneck', 'downtime', 'subsystem',
  ].map((s) => s.toLowerCase()),
)

/** 一般の日本語でも頻出する語。単独では検出せず、他の保線用語と同時に出たときだけ表示する */
const JA_WEAK = new Set([
  '軌道', '路線', '線形', '勾配', '水準', '高低', '番数', '更新', '設備', '資産', '適合', '保守', '保全', '故障',
  '改修', '腐食', '摩耗', '排水', '配線', '防護', '接地', '支障', '脱線', '除草', '条項', '箇条',
  'ポイント', 'アイテム', 'ヒール', 'ノーズ', 'ジャッキ', 'ハザード', 'フォールト', 'ダウンタイム', 'バックログ',
  'オーバーホール', 'リニューアル', 'スクワット', 'リッピング', 'ミリング', 'くぼみ', 'ねじれ',
  '重要度', '可用性', '停止時間', '分解整備', '作業指示', '未処理作業',
])

/** 括弧内の補足説明から切り出される、用語の言い換えではない断片 */
const JA_DROP = new Set(['簡易', '短時間', '上面', '推奨', '軌道用', '荷重下'])

const JP_CHAR = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u
/** 日本語の用語として受け付ける文字（かな・漢字・長音、型番などの英数字） */
const JA_ALLOWED = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ーA-Za-z0-9]+$/u
const HAN2 = /^\p{Script=Han}{2}$/u

let index: Entry[] | null = null

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 日本語訳の文字列から検出用の語形を取り出す。
 * 「頭部（上面）摩耗」→「頭部摩耗」「上面」のように、括弧外は括弧を除いて1語にまとめ、
 * 括弧内は言い換えとして別に扱う。
 */
export function jaVariants(s: string): string[] {
  const out = new Set<string>()
  for (const alt of s.split(/[；;]/)) {
    const inner: string[] = []
    const main = alt.replace(/[（(「〔]([^）)」〕]*)[）)」〕]/g, (_, c: string) => {
      inner.push(c)
      return ''
    })
    for (const part of [main, ...inner]) {
      for (const raw of part.split(/[、・/／]/)) {
        const t = raw.trim()
        if (!t || JA_DROP.has(t)) continue
        // 記号（:、σ、〜、& など）を含む断片は誤検出の元なので除外
        if (!JA_ALLOWED.test(t)) continue
        const jpLen = [...t].filter((c) => JP_CHAR.test(c)).length
        if (jpLen === 0) continue
        // 3文字以上、または漢字2文字（軌間・道床など）のみ。かな2文字（けた・トロ）は部分一致の誤検出が多い
        if ([...t].length >= 3 ? jpLen >= 2 : HAN2.test(t)) out.add(t)
      }
    }
  }
  return [...out]
}

export async function glossaryIndex(): Promise<Entry[]> {
  if (index) return index
  const rail = await loadCategory('rail')
  const out: Entry[] = []
  for (const w of rail) {
    for (const t of [w.w, w.us].filter(Boolean) as string[]) {
      if (t.length < 3) continue
      const multi = /[\s-]/.test(t)
      // RAMS・AREMA などの略語は大文字小文字を区別（rams 等の一般語と区別）
      const acronym = /^[A-Z]{2,}$/.test(t)
      out.push({
        word: w,
        term: t,
        lang: 'en',
        re: new RegExp(`\\b${escape(t)}(?:e?s)?\\b`, acronym ? '' : 'i'),
        weak: !multi && EN_WEAK.has(t.toLowerCase()),
      })
    }
    const ja = new Set([...jaVariants(w.ja), ...(w.jis ? jaVariants(w.jis) : [])])
    for (const t of ja) out.push({ word: w, term: t, lang: 'ja', weak: JA_WEAK.has(t) })
  }
  // 長い語から優先して一致させる
  out.sort((a, b) => b.term.length - a.term.length)
  index = out
  return out
}

export async function findTerms(text: string, max = 12): Promise<GlossaryHit[]> {
  if (!text.trim()) return []
  const idx = await glossaryIndex()
  const hits: GlossaryHit[] = []
  const seen = new Set<string>()
  const covered: [number, number][] = []
  const overlaps = (s: number, e: number) => covered.some(([a, b]) => s < b && e > a)
  const scan = (weak: boolean) => {
    for (const en of idx) {
      if (hits.length >= max) return
      if (en.weak !== weak || seen.has(en.word.id)) continue
      let pos = -1
      let len = en.term.length
      if (en.lang === 'en') {
        const m = en.re!.exec(text)
        if (m) {
          pos = m.index
          len = m[0].length
        }
      } else {
        pos = text.indexOf(en.term)
      }
      if (pos < 0 || overlaps(pos, pos + len)) continue
      covered.push([pos, pos + len])
      seen.add(en.word.id)
      hits.push({ word: en.word, matched: text.slice(pos, pos + len), lang: en.lang })
    }
  }
  scan(false)
  // 一般語と紛らわしい語は、文中に他の保線用語があるとき（保線の文脈）だけ表示
  if (hits.length > 0) scan(true)
  return hits
}

export function hasJapanese(s: string): boolean {
  return /[぀-ヿ㐀-鿿]/.test(s)
}

/**
 * 入力した文の言語を見分ける。日本語の文字の数と英単語の数を比べる
 * （「APIのendpointをdeployする」は日本語、「Check the 道床 today」は英語）
 */
export function detectLang(text: string): 'ja' | 'en' | null {
  const ja = (text.match(/[぀-ヿ㐀-鿿ｦ-ﾟ]/g) ?? []).length
  const en = (text.match(/[A-Za-z]+/g) ?? []).length
  if (!ja && !en) return null
  return ja >= en ? 'ja' : 'en'
}

/** 規格英語の助動詞の注意喚起 */
export function modalTips(en: string): string[] {
  const tips: string[] = []
  if (/\bshall\b/i.test(en)) tips.push('「shall」は規格・契約での「〜しなければならない（要求事項）」です。')
  if (/\bshould\b/i.test(en)) tips.push('「should」は規格では「〜することが望ましい（推奨）」で、要求ではありません。')
  if (/\bmay\b/i.test(en)) tips.push('「may」は規格では「〜してもよい（許容）」です。')
  return tips
}
