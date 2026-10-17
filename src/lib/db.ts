import Dexie, { type EntityTable } from 'dexie'
import type { Category, Level } from './types'

/** FSRSカード状態（単語IDごと） */
export interface CardRow {
  id: string
  cat: Category
  lv: Level
  due: number
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review: number | null
  addedAt: number
  /** 既知としてスキップ */
  known?: boolean
}

export interface LogRow {
  id?: number
  wordId: string
  rating: number
  mode: string
  at: number
  ms: number
}

export interface DailyRow {
  date: string
  reviews: number
  newLearned: number
  correct: number
  listening: number
  speaking: number
  seconds: number
}

export interface TranslationRow {
  id?: number
  at: number
  from: string
  to: string
  src: string
  out: string
  fav?: boolean
}

export interface SpeakingRow {
  id?: number
  at: number
  text: string
  source: string
  pron: number
  accuracy: number
  fluency: number
  completeness: number
}

/** 保存（★）した単語 */
export interface MarkRow {
  id: string
  at: number
}

export class AppDB extends Dexie {
  cards!: EntityTable<CardRow, 'id'>
  logs!: EntityTable<LogRow, 'id'>
  daily!: EntityTable<DailyRow, 'date'>
  translations!: EntityTable<TranslationRow, 'id'>
  speaking!: EntityTable<SpeakingRow, 'id'>
  marks!: EntityTable<MarkRow, 'id'>

  constructor() {
    super('tetsu-english')
    this.version(1).stores({
      cards: 'id, cat, lv, due, state, addedAt',
      logs: '++id, wordId, at',
      daily: 'date',
      translations: '++id, at, fav',
      speaking: '++id, at',
    })
    // v2: 単語の保存（★）
    this.version(2).stores({ marks: 'id, at' })
  }
}

export const db = new AppDB()

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function bumpDaily(patch: Partial<Omit<DailyRow, 'date'>>) {
  const date = todayKey()
  await db.transaction('rw', db.daily, async () => {
    const cur = (await db.daily.get(date)) ?? {
      date,
      reviews: 0,
      newLearned: 0,
      correct: 0,
      listening: 0,
      speaking: 0,
      seconds: 0,
    }
    // 古いバックアップ由来の行に項目がなくても NaN にならないよう 0 から足す
    const row = cur as unknown as Record<string, number>
    for (const [k, v] of Object.entries(patch)) row[k] = (Number(row[k]) || 0) + (v as number)
    await db.daily.put(cur)
  })
}

/** 連続学習日数 */
export async function getStreak(): Promise<number> {
  const rows = await db.daily.toArray()
  const active = new Set(rows.filter((r) => isActiveDay(r)).map((r) => r.date))
  let streak = 0
  const d = new Date()
  if (!active.has(todayKey(d))) d.setDate(d.getDate() - 1)
  while (active.has(todayKey(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export async function exportAll(): Promise<string> {
  const data = {
    app: 'tetsu-english',
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: await db.cards.toArray(),
    logs: await db.logs.toArray(),
    daily: await db.daily.toArray(),
    translations: await db.translations.toArray(),
    speaking: await db.speaking.toArray(),
    marks: await db.marks.toArray(),
    settings: localStorage.getItem('tetsu-settings'),
  }
  return JSON.stringify(data)
}

export async function importAll(json: string) {
  const data = JSON.parse(json)
  if (data.app !== 'tetsu-english') throw new Error('このアプリのバックアップファイルではありません')
  await db.transaction('rw', [db.cards, db.logs, db.daily, db.translations, db.speaking, db.marks], async () => {
    await Promise.all([db.cards.clear(), db.logs.clear(), db.daily.clear(), db.translations.clear(), db.speaking.clear(), db.marks.clear()])
    await db.cards.bulkPut(data.cards ?? [])
    await db.logs.bulkPut(data.logs ?? [])
    await db.daily.bulkPut(data.daily ?? [])
    await db.translations.bulkPut(data.translations ?? [])
    await db.speaking.bulkPut(data.speaking ?? [])
    await db.marks.bulkPut(data.marks ?? [])
  })
  if (data.settings) localStorage.setItem('tetsu-settings', data.settings)
}

/** 単語の保存（★）を切り替える */
export async function toggleMark(id: string): Promise<boolean> {
  return db.transaction('rw', db.marks, async () => {
    if (await db.marks.get(id)) {
      await db.marks.delete(id)
      return false
    }
    await db.marks.put({ id, at: Date.now() })
    return true
  })
}

/** その日に何か学習したか（単語・リスニング・スピーキングのどれか） */
export const isActiveDay = (r: DailyRow | undefined) => !!r && (r.reviews || 0) + (r.listening || 0) + (r.speaking || 0) > 0

/** 日付キーを n 日ずらす */
export function shiftDay(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return todayKey(new Date(y, m - 1, d + n))
}
