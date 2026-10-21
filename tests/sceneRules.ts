import type { Scene } from '../src/lib/types'
import { SCENE_SUBS } from '../src/data/scenes/subs'

/** シーン会話の書式の決まり。守れていない点を文で返す（空なら合格） */

const JA = /[぀-ヿ㐀-鿿]/
const PREFIX = { daily: 'd-', business: 'b-', it: 'i-', rail: 'r-' } as const
/** 一般・ビジネス・IT の場面に出さない保線の語（鉄道はコースで選ぶ） */
export const RAILISH = /\b(track|tracks|rail|rails|railway|sleepers?|tamp\w*|possession|ballast|grinding)\b/i
const words = (s: string) => s.split(/\s+/).filter(Boolean).length
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const isLearner = (name: string) => name === 'You' || name.startsWith('You (')

export function sceneProblems(s: Scene): string[] {
  const out: string[] = []
  const bad = (msg: string) => out.push(`${s.id}: ${msg}`)

  if (!/^[dbir]-[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) bad('id は小文字・数字・ハイフン')
  if (!s.id.startsWith(PREFIX[s.group])) bad(`id の接頭辞は ${PREFIX[s.group]}`)
  if (!SCENE_SUBS.some((x) => x.group === s.group && x.id === s.sub)) bad(`小分類 ${s.sub} がグループ ${s.group} にない`)
  if (!JA.test(s.title) || s.title.length > 18) bad('title は日本語で18字以内')
  if (JA.test(s.titleEn) || s.titleEn.length > 42) bad('titleEn は英語で42字以内')
  if (![1, 2, 3, 4, 5, 6].includes(s.lv)) bad('lv は 1〜6')
  if (!s.emoji || /[a-z0-9]/i.test(s.emoji)) bad('emoji は絵文字1つ')
  if (!JA.test(s.goal) || s.goal.length > 50) bad('goal は日本語で50字以内')
  if (!s.tip || !JA.test(s.tip) || s.tip.length > 170) bad('tip は日本語で170字以内（必須）')

  // 役は2人：1人目が相手、2人目が学習者（You）
  if (s.roles.length !== 2) bad('roles は2人')
  else {
    const [p, me] = s.roles
    if (p.id !== 'A' || me.id !== 'B') bad('roles の id は A（相手）・B（あなた）')
    if (!isLearner(me.name)) bad('2人目の名前は You か You (役割)')
    if (isLearner(p.name) || JA.test(p.name) || p.name.length > 24) bad('1人目（相手）の名前は英語で24字以内')
  }

  if (s.phrases.length < 6 || s.phrases.length > 8) bad(`phrases は6〜8個（いま ${s.phrases.length}）`)
  if (s.lines.length < 12 || s.lines.length > 16) bad(`lines は12〜16行（いま ${s.lines.length}）`)

  const all = [...s.phrases.map((p) => ({ ...p, kind: 'phrase' })), ...s.lines.map((l) => ({ ...l, kind: 'line' }))]
  for (const t of all) {
    if (!t.en.trim() || JA.test(t.en)) bad(`英文に日本語・空: ${t.en}`)
    if (/[‘’“”…]/.test(t.en)) bad(`英文はまっすぐな ' " を使い、… を使わない: ${t.en}`)
    if (!JA.test(t.ja)) bad(`和訳がない: ${t.en}`)
    if (words(t.en) > 30) bad(`英文が長すぎる（30語まで）: ${t.en}`)
    if (s.group !== 'rail' && RAILISH.test(t.en)) bad(`保線の語が入っている: ${t.en}`)
  }
  for (const p of s.phrases) {
    if (/\.\.\.|___/.test(p.en)) bad(`キーフレーズは完全な文で（... や ___ を使わない）: ${p.en}`)
    if (p.note !== undefined && !JA.test(p.note)) bad(`note は日本語で: ${p.en}`)
  }

  const ids = new Set(s.roles.map((r) => r.id))
  for (const l of s.lines) if (!ids.has(l.sp)) bad(`話者が roles にない: ${l.en}`)
  const mine = s.lines.filter((l) => l.sp === 'B').length
  const theirs = s.lines.length - mine
  if (mine < 5 || mine / s.lines.length < 0.35) bad(`あなた（B）の台詞が少ない（${mine}/${s.lines.length}）`)
  if (theirs < 4) bad('相手（A）の台詞が少ない')
  const seen = new Set<string>()
  for (const l of s.lines) {
    const k = norm(l.en)
    if (seen.has(k)) bad(`同じ台詞が2回: ${l.en}`)
    seen.add(k)
  }

  // キーフレーズの半分以上は、会話の中で（ほぼそのまま）使う
  const body = ' ' + s.lines.map((l) => norm(l.en)).join(' | ') + ' '
  const used = s.phrases.filter((p) => body.includes(norm(p.en))).length
  if (used * 2 < s.phrases.length) bad(`キーフレーズのうち会話で使っているのが少ない（${used}/${s.phrases.length}）`)
  return out
}
