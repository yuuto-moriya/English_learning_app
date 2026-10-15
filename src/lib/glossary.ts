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
}

let index: Entry[] | null = null

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export async function glossaryIndex(): Promise<Entry[]> {
  if (index) return index
  const rail = await loadCategory('rail')
  const out: Entry[] = []
  for (const w of rail) {
    for (const t of [w.w, w.us].filter(Boolean) as string[]) {
      if (t.length < 3) continue
      out.push({ word: w, term: t, lang: 'en', re: new RegExp(`\\b${escape(t)}s?\\b`, 'i') })
    }
    const ja = [w.ja, w.jis ?? '']
      .join('；')
      .split(/[；、・/（）()「」〔〕]/)
      .map((s) => s.replace(/[A-Za-z0-9]+/g, '').trim())
      .filter((s) => s.length >= 2)
    for (const t of new Set(ja)) out.push({ word: w, term: t, lang: 'ja' })
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
  for (const en of idx) {
    if (seen.has(en.word.id)) continue
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
    if (hits.length >= max) break
  }
  return hits
}

export function hasJapanese(s: string): boolean {
  return /[぀-ヿ㐀-鿿]/.test(s)
}

/** 規格英語の助動詞の注意喚起 */
export function modalTips(en: string): string[] {
  const tips: string[] = []
  if (/\bshall\b/i.test(en)) tips.push('「shall」は規格・契約での「〜しなければならない（要求事項）」です。')
  if (/\bshould\b/i.test(en)) tips.push('「should」は規格では「〜することが望ましい（推奨）」で、要求ではありません。')
  if (/\bmay\b/i.test(en)) tips.push('「may」は規格では「〜してもよい（許容）」です。')
  return tips
}
