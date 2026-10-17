import { useEffect, useState } from 'react'
import { ALL_CATS, type Category, type Word } from './types'

const loaders: Record<Category, () => Promise<{ default: unknown }>> = {
  general: () => import('../data/vocab/general.json'),
  business: () => import('../data/vocab/business.json'),
  it: () => import('../data/vocab/it.json'),
  rail: () => import('../data/vocab/rail.json'),
}

const cache: Partial<Record<Category, Word[]>> = {}
const byId = new Map<string, Word>()
const pending: Partial<Record<Category, Promise<Word[]>>> = {}
/** 品詞で読みが変わる見出し語 → その品詞の発音（読み込んだカテゴリの分だけ） */
const sayHints = new Map<string, string>()

/** 単語だけを読むときの発音の指定（live → lɪv など）。該当しなければ undefined */
export function sayHint(text: string): string | undefined {
  return sayHints.get(text.trim().toLowerCase())
}

export function catOfId(id: string): Category {
  if (id.startsWith('r-')) return 'rail'
  if (id.startsWith('b-')) return 'business'
  if (id.startsWith('i-')) return 'it'
  return 'general'
}

export async function loadCategory(cat: Category): Promise<Word[]> {
  if (cache[cat]) return cache[cat]!
  if (!pending[cat]) {
    pending[cat] = loaders[cat]().then((m) => {
      const list = m.default as Word[]
      cache[cat] = list
      for (const w of list) {
        byId.set(w.id, w)
        if (w.say) sayHints.set(w.w.toLowerCase(), w.say)
      }
      return list
    })
  }
  return pending[cat]!
}

export async function loadAll(): Promise<Word[]> {
  const lists = await Promise.all(ALL_CATS.map((c) => loadCategory(c)))
  return lists.flat()
}

export async function getWord(id: string): Promise<Word | undefined> {
  if (byId.has(id)) return byId.get(id)
  await loadCategory(catOfId(id))
  return byId.get(id)
}

export function getWordSync(id: string): Word | undefined {
  return byId.get(id)
}

export function useCategory(cat: Category | 'all') {
  const [words, setWords] = useState<Word[] | null>(() =>
    cat === 'all' ? null : (cache[cat] ?? null),
  )
  useEffect(() => {
    let alive = true
    const p = cat === 'all' ? loadAll() : loadCategory(cat)
    p.then((w) => alive && setWords(w))
    return () => {
      alive = false
    }
  }, [cat])
  return words
}

export function useWord(id: string | undefined) {
  const [word, setWord] = useState<Word | null | undefined>(id ? byId.get(id) : undefined)
  useEffect(() => {
    if (!id) return
    let alive = true
    getWord(id).then((w) => alive && setWord(w ?? null))
    return () => {
      alive = false
    }
  }, [id])
  return word
}

/** 例文の *word* をプレーンテキストにする */
export function plain(s: string): string {
  return s.replace(/\*/g, '')
}

/** 例文を [テキスト, ハイライト?] の配列に分割 */
export function splitMarked(s: string): { t: string; hl: boolean }[] {
  const out: { t: string; hl: boolean }[] = []
  const re = /\*([^*]+)\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index), hl: false })
    out.push({ t: m[1], hl: true })
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ t: s.slice(last), hl: false })
  return out
}

/** 和訳の読み上げ用：最初の意味だけにし、括弧書きと「〜」を除く */
export function jaForSpeech(ja: string): string {
  return ja
    .split('；')[0]
    .replace(/（[^）]*）|\([^)]*\)/g, '')
    .replace(/[〜~]/g, '')
    .trim()
}

/** 例文中のターゲット語（最初のマーク） */
/**
 * 選択問題・書く問題に出す和訳。単語の画面ではすべての意味を見せるが、問題では答えの手がかりにならないよう整える。
 * - 英語の入ったかっこを取る（「頼る（rely on）」→「頼る」。英語がそのまま答えになるため）
 * - 別の品詞の意味（「本；（動詞）予約する」の「（動詞）予約する」）と、英語のかっこで始まる別の語の意味（（March）3月）は出さない
 * - 意味は最初の2つまで（選択肢の長さをそろえ、長さで見当がつかないように）
 */
export function quizGloss(ja: string): string {
  const parts = ja
    .split('；')
    .map((p) => p.trim())
    .filter((p) => p && !/^（[^）]*詞）/.test(p) && !/^（[^）]*[A-Za-z][^）]*）/.test(p))
    .map((p) => p.replace(/（[^）]*[A-Za-z][^）]*）/g, '').trim())
    .filter(Boolean)
  return (parts.length ? parts : [ja]).slice(0, 2).join('；')
}

/** 和訳（問題用に整えたもの）に見出し語がそのまま入っている（API → 「API（…）」など）。意味を選ぶ・書く問題では答えが見えてしまう */
export function glossRevealsWord(w: { w: string; ja: string }): boolean {
  return quizGloss(w.ja).toLowerCase().includes(w.w.toLowerCase())
}

export function markedTarget(s: string): string | null {
  const m = /\*([^*]+)\*/.exec(s)
  return m ? m[1] : null
}

export function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

