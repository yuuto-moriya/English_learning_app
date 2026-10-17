import { ALL_CATS, type Category } from './types'

/** 学ぶモード（コース）の選び方。設定の studyCats と同じ形 */
export type StudyCats = Record<Category, boolean>

export const MODE_LABEL: Record<Category, string> = { general: '一般', business: 'ビジネス', it: 'IT', rail: '鉄道' }

/** いま学んでいるモード（コース）の名前。例：「IT」「一般＋鉄道」 */
export function modeName(cats: Category[]): string {
  return cats.map((c) => MODE_LABEL[c]).join('＋')
}

/** モードの状態。1コースだけ／すべて／いくつかの組み合わせ */
export type ModeState = { kind: 'single'; cat: Category } | { kind: 'all' } | { kind: 'combo'; cats: Category[] }

export function modeState(s: StudyCats): ModeState {
  const cats = ALL_CATS.filter((c) => s[c])
  if (cats.length === ALL_CATS.length) return { kind: 'all' }
  if (cats.length === 1) return { kind: 'single', cat: cats[0] }
  return { kind: 'combo', cats }
}

/** いまのモードを一言で（切り替えの下に出す） */
export function modeCaption(m: ModeState): string {
  if (m.kind === 'all') return 'すべてのコースから出題'
  if (m.kind === 'single') return `${MODE_LABEL[m.cat]}だけを出題`
  return m.cats.length ? `${modeName(m.cats)}から出題` : '出題するコースを選んでください'
}

/** そのコースだけにする */
export function onlyCat(c: Category): StudyCats {
  return Object.fromEntries(ALL_CATS.map((k) => [k, k === c])) as StudyCats
}

/** すべてのコースにする */
export function everyCat(): StudyCats {
  return Object.fromEntries(ALL_CATS.map((k) => [k, true])) as StudyCats
}

/** 組み合わせにコースを足す・外す。最後の1つは外せない（null を返す） */
export function toggleCat(s: StudyCats, c: Category): StudyCats | null {
  const next = { ...s, [c]: !s[c] }
  return ALL_CATS.some((k) => next[k]) ? next : null
}
