import { SCENES, sceneAccent } from '@/data/scenes'
import { catMeta, type Category } from './types'
import { accentFor } from './settings'
import type { Accent } from './accents'
import { loadCategory, plain, shuffle } from './vocab'
import { db } from './db'

export type Source = Category | 'scene'

export interface Sentence {
  en: string
  ja: string
  lv: number
  src: Source
  accent: Accent
  wordId?: string
  /** シーン会話の文のときの場面 */
  scene?: string
}

const wc = (s: string) => s.split(/\s+/).filter(Boolean).length

/** 例文・会話文から練習用の文を集める */
export async function sentencePool(sources: Source[], maxLv: number, minLv = 1): Promise<Sentence[]> {
  const out: Sentence[] = []
  for (const src of sources) {
    if (src === 'scene') {
      // 一緒に選んだコースに合う場面だけ（シーン会話だけを選んだときはすべて）
      const groups = new Set(sources.flatMap((x) => (x === 'scene' ? [] : [catMeta(x).scene])))
      for (const sc of SCENES) {
        if (sc.lv > maxLv || sc.lv < minLv) continue
        if (groups.size && !groups.has(sc.group)) continue
        for (const l of sc.lines) {
          if (wc(l.en) < 4 || wc(l.en) > 20) continue
          out.push({ en: l.en, ja: l.ja, lv: sc.lv, src, accent: sceneAccent(sc), scene: sc.id })
        }
      }
      continue
    }
    const words = await loadCategory(src)
    // ビジネス・IT・鉄道は語のレベルが3以上しかないので、選んだレベルより上でも、そのコースのいちばん下のレベルまでは使う
    // （低いレベルを選ぶと、リスニングなどの対象が0文になってしまうため）
    const floor = src === 'general' ? 1 : Math.min(...words.map((w) => w.lv))
    const hi = Math.max(maxLv, floor)
    const lo = src === 'general' ? minLv : Math.min(minLv, floor)
    for (const w of words) {
      if (w.lv > hi || w.lv < lo) continue
      for (const e of w.ex) {
        const p = plain(e.en)
        if (wc(p) < 4 || wc(p) > 18) continue
        out.push({ en: p, ja: e.ja, lv: w.lv, src, accent: accentFor(src), wordId: w.id })
      }
    }
  }
  return out
}

/**
 * 1回分の文を選ぶ。learned（学習した・知っている語の id）を渡すと、その語の例文を先に使い、
 * 足りない分をシーン会話、ほかの例文の順で補う（まだ学んでいない語ばかりが出ないように）
 */
export function pickRound(pool: Sentence[], n = 10, learned?: Set<string>): Sentence[] {
  if (!learned) return shuffle(pool).slice(0, n)
  const mine = shuffle(pool.filter((s) => s.wordId && learned.has(s.wordId)))
  const scene = shuffle(pool.filter((s) => !s.wordId))
  const rest = shuffle(pool.filter((s) => s.wordId && !learned.has(s.wordId)))
  return [...mine, ...scene, ...rest].slice(0, n)
}

/** 学習した（復習したことがある）語と「知っている」にした語の id */
export async function learnedIds(): Promise<Set<string>> {
  const rows = await db.cards.toArray().catch(() => [])
  return new Set(rows.filter((r) => r.known || r.reps > 0).map((r) => r.id))
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
