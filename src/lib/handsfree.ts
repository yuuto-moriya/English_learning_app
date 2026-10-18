import { SCENES } from '@/data/scenes'
import { db } from './db'
import { interleave, retrievability } from './srs'
import { newWordPool } from './session'
import { getSettings, selectedCats } from './settings'
import { learnedIds, pickRound, sentencePool, type Sentence, type Source } from './sentences'
import { getWord, loadCategory, shuffle } from './vocab'
import { catMeta, type Scene, type Word } from './types'

/**
 * ながら練習：家事や身支度など、手と目がふさがっているときに、耳と声だけで続ける練習。
 * 4種類のまとまり（ブロック）を順番に回し（インターリーブ）、決めた時間になったら区切りのよいところで終える。
 * - 単語を思い出す：音だけの検索練習（日本語 → 考える間 → 英語 → 例文）
 * - まねして言う：英文を聞いてすぐ声に出す（産出効果・リピーティング）
 * - 日本語から英語で言う：瞬間英作文を音だけで
 * - 会話を聞く：シーンの会話。「あなた」の台詞のあとに間を置いて、まねして言う
 * 答え合わせはしないので、復習の予定（FSRS）は変えず、学習時間だけを記録する。
 */
export type HfKind = 'words' | 'repeat' | 'compose' | 'dialogue'
export type HfPace = 'slow' | 'normal' | 'quick'

export const HF_KINDS: { key: HfKind; title: string; sub: string; cue: string; again: string }[] = [
  {
    key: 'words',
    title: '単語を思い出す',
    sub: '日本語を聞いて英語を言う → 答えと例文',
    cue: '単語です。日本語のあとに、英語で言ってみましょう。',
    again: '次は、単語です。',
  },
  {
    key: 'repeat',
    title: 'まねして言う',
    sub: '英文を聞いて、すぐ声に出してまねる',
    cue: 'まねして言う練習です。英語のあとに、声に出して言いましょう。',
    again: '次は、まねして言う練習です。',
  },
  {
    key: 'compose',
    title: '日本語から英語で言う',
    sub: '日本語の文を聞いて、英語にして言う（瞬間英作文）',
    cue: '瞬間英作文です。日本語の文を、英語で言ってみましょう。',
    again: '次は、瞬間英作文です。',
  },
  {
    key: 'dialogue',
    title: '会話を聞く',
    sub: 'シーンの会話。あなたの台詞は、まねして言う',
    cue: '会話を聞きます。あなたの台詞は、まねして言いましょう。',
    again: '次は、会話です。',
  },
]

export const HF_MINUTES = [5, 10, 15, 20, 30, 45, 60]

export const HF_PACES: { key: HfPace; label: string }[] = [
  { key: 'slow', label: 'ゆっくり' },
  { key: 'normal', label: 'ふつう' },
  { key: 'quick', label: 'はやめ' },
]

/** 1つのまとまりで続けて出す数（会話は1場面） */
export const BLOCK_SIZE: Record<HfKind, number> = { words: 5, repeat: 4, compose: 3, dialogue: 1 }

const PACE: Record<HfPace, number> = { slow: 1.4, normal: 1, quick: 0.7 }

const wc = (s: string) => s.split(/\s+/).filter(Boolean).length
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/** 単語を思い出す間（ミリ秒） */
export const thinkMs = (pace: HfPace) => Math.round(4000 * PACE[pace])
/** まねして言う間。文の長さに合わせる（1語あたり約0.45秒＋言い始めの余裕） */
export const repeatMs = (en: string, pace: HfPace) => Math.round(clamp(1.5 + 0.45 * wc(en), 3, 9) * 1000 * PACE[pace])
/** 日本語から英語にして言う間。組み立てる時間を足す */
export const composeMs = (en: string, pace: HfPace) => Math.round(clamp(2.5 + 0.6 * wc(en), 5, 12) * 1000 * PACE[pace])

/** 残り時間の表示（12:05） */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export type HfItem =
  | { kind: 'words'; word: Word; dir: 'ja-en' | 'en-ja' }
  | { kind: 'repeat'; s: Sentence }
  | { kind: 'compose'; s: Sentence }
  | { kind: 'dialogue'; scene: Scene }

export interface HfPools {
  words: { word: Word; dir: 'ja-en' | 'en-ja' }[]
  repeat: Sentence[]
  compose: Sentence[]
  scenes: Scene[]
}

export type HfCursors = Record<HfKind, number>

const poolOf = (kind: HfKind, p: HfPools): HfItem[] => {
  if (kind === 'words') return p.words.map((x) => ({ kind, ...x }))
  if (kind === 'repeat') return p.repeat.map((s) => ({ kind, s }))
  if (kind === 'compose') return p.compose.map((s) => ({ kind, s }))
  return p.scenes.map((scene) => ({ kind, scene }))
}

/** 出せる内容があるまとまりだけ（選んだ順のまま） */
export function playableKinds(kinds: HfKind[], p: HfPools): HfKind[] {
  return kinds.filter((k) => poolOf(k, p).length > 0)
}

/**
 * 次のまとまりの中身。使い切ったら最初に戻る（長い時間でも止まらない）。
 * cursors はまとまりごとの次の位置で、更新した値を返す。
 */
export function takeBlock(kind: HfKind, p: HfPools, cursors: HfCursors): { items: HfItem[]; cursors: HfCursors } {
  const pool = poolOf(kind, p)
  if (!pool.length) return { items: [], cursors }
  const n = Math.min(BLOCK_SIZE[kind], pool.length)
  const start = cursors[kind] % pool.length
  const items = Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length])
  return { items, cursors: { ...cursors, [kind]: start + n } }
}

/**
 * 耳で思い出す単語。忘れかけている語（想起確率の低い順）を優先し、学習した語が少ないときは、これから学ぶ語を足す。
 * learned は先頭から何語が学習した語か（残りはまだ学んでいない語なので、英語 → 日本語で聞く）
 */
export async function reviewWords(n = 20): Promise<{ words: Word[]; learned: number }> {
  const s = getSettings()
  const all = await db.cards.toArray()
  // 選んでいるコースの、学習した語（「知っている」にした語は除く）
  const rows = all.filter((r) => r.reps > 0 && !r.known && s.studyCats[r.cat])
  const now = new Date()
  const ranked = rows
    .map((r) => ({ r, p: retrievability(r, now) }))
    .sort((a, b) => a.p - b.p)
    .slice(0, n)
  const words = (await Promise.all(ranked.map((x) => getWord(x.r.id)))).filter(Boolean) as Word[]
  if (words.length >= 5) return { words, learned: words.length }
  const lists = await Promise.all(selectedCats(s).map((c) => loadCategory(c)))
  // これから学ぶ語の候補から、学習した語と「知っている」にした語を除く
  const ids = new Set(all.map((r) => r.id))
  const fresh = interleave(newWordPool(lists.flat(), ids, s)).slice(0, n)
  return { words: [...words, ...fresh].slice(0, n), learned: words.length }
}

/** ながら練習で使う内容をまとめて用意する（学習した語・その例文を先に） */
export async function buildPools(): Promise<HfPools> {
  const s = getSettings()
  const cats = selectedCats(s)
  const level = Math.max(1, Math.min(6, s.maxLevel))
  const [rw, learned, pool] = await Promise.all([
    reviewWords(40),
    learnedIds(),
    sentencePool([...cats, 'scene'] as Source[], level, 1),
  ])
  const words = rw.words.map((word, i) => ({ word, dir: (i < rw.learned ? 'ja-en' : 'en-ja') as 'ja-en' | 'en-ja' }))
  const short = pool.filter((x) => wc(x.en) <= 14)
  const repeat = pickRound(short, 200, learned)
  // 瞬間英作文は短めの文で。まねして言う練習と同じ文が続かないよう、別に並べ直す
  const compose = pickRound(short.filter((x) => wc(x.en) <= 12), 200, learned)
  const groups = new Set(cats.map((c) => catMeta(c).scene))
  const inGroups = SCENES.filter((sc) => groups.has(sc.group))
  const fit = inGroups.filter((sc) => sc.lv <= level + 1)
  const scenes = shuffle(fit.length ? fit : inGroups)
  return { words, repeat, compose, scenes }
}

/** 会話で「あなた」の役（台詞のあとにまねして言う間を置く）。いない場面は聞くだけ */
export function userRole(scene: Scene): string | undefined {
  return scene.roles.find((r) => r.name === 'You')?.id
}
