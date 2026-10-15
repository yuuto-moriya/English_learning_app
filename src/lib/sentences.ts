import { SCENES } from '@/data/scenes'
import type { Category } from './types'
import { loadCategory, plain, shuffle } from './vocab'

export type Source = Category | 'scene'

export interface Sentence {
  en: string
  ja: string
  lv: number
  src: Source
  accent: 'en-US' | 'en-GB'
  wordId?: string
}

const wc = (s: string) => s.split(/\s+/).filter(Boolean).length

/** 例文・会話文から練習用の文を集める */
export async function sentencePool(sources: Source[], maxLv: number, minLv = 1): Promise<Sentence[]> {
  const out: Sentence[] = []
  for (const src of sources) {
    if (src === 'scene') {
      for (const sc of SCENES) {
        if (sc.lv > maxLv || sc.lv < minLv) continue
        for (const l of sc.lines) {
          if (wc(l.en) < 4 || wc(l.en) > 20) continue
          out.push({ en: l.en, ja: l.ja, lv: sc.lv, src, accent: sc.group === 'rail' ? 'en-GB' : 'en-US' })
        }
      }
      continue
    }
    const words = await loadCategory(src)
    for (const w of words) {
      if (w.lv > maxLv || w.lv < minLv) continue
      for (const e of w.ex) {
        const p = plain(e.en)
        if (wc(p) < 4 || wc(p) > 18) continue
        out.push({ en: p, ja: e.ja, lv: w.lv, src, accent: src === 'rail' ? 'en-GB' : 'en-US', wordId: w.id })
      }
    }
  }
  return out
}

export function pickRound(pool: Sentence[], n = 10): Sentence[] {
  return shuffle(pool).slice(0, n)
}

/** 長さが近い和訳を誤答選択肢に */
export function jaDistractors(target: Sentence, pool: Sentence[], n = 3): string[] {
  const len = target.ja.length
  const cand = shuffle(pool.filter((s) => s.ja !== target.ja && Math.abs(s.ja.length - len) <= Math.max(6, len * 0.4)))
  const out: string[] = []
  for (const c of cand) {
    if (!out.includes(c.ja)) out.push(c.ja)
    if (out.length >= n) break
  }
  return out
}

export interface DiffToken {
  t: string
  ok: boolean
  kind: 'match' | 'missing' | 'extra'
}

const norm = (w: string) => w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'-]/g, '')

/** ディクテーションの採点（単語単位の最長共通部分列） */
export function diffWords(reference: string, typed: string): { tokens: DiffToken[]; score: number } {
  const ref = reference.split(/\s+/).filter(Boolean)
  const hyp = typed.split(/\s+/).filter(Boolean)
  const R = ref.map(norm)
  const H = hyp.map(norm)
  const n = R.length
  const m = H.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = R[i] === H[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const tokens: DiffToken[] = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && R[i] === H[j]) {
      tokens.push({ t: ref[i], ok: true, kind: 'match' })
      i++
      j++
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      tokens.push({ t: hyp[j], ok: false, kind: 'extra' })
      j++
    } else {
      tokens.push({ t: ref[i], ok: false, kind: 'missing' })
      i++
    }
  }
  const matched = tokens.filter((t) => t.kind === 'match').length
  const score = n ? Math.round((matched / Math.max(n, m)) * 100) : 0
  return { tokens, score }
}
