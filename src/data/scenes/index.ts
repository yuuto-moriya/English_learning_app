import type { Scene } from '@/lib/types'
import { SCENE_SUBS } from './subs'
export { learnerRole, sceneAccent } from './helpers'

/**
 * シチュエーション別会話。
 * タスク中心の言語指導（TBLT）に基づき、「目的のある場面」で使う表現をまとまりで学ぶ。
 * 小分類ごとのファイル（<グループ>-<小分類>.ts）に書く。ここで全部を読み込み、グループ → 小分類（subs.ts の順）→ レベル の順に並べる。
 */
const files = import.meta.glob<{ default: Scene[] }>('./*-*.ts', { eager: true })
const ALL: Scene[] = Object.values(files).flatMap((m) => m.default)

const subRank = (s: Scene) => SCENE_SUBS.findIndex((x) => x.group === s.group && x.id === s.sub)
export const SCENES: Scene[] = ALL.map((s, i) => ({ s, i }))
  .sort((a, b) => subRank(a.s) - subRank(b.s) || a.s.lv - b.s.lv || a.i - b.i)
  .map(({ s }) => s)

export function scenesByGroup(group: Scene['group']) {
  return SCENES.filter((s) => s.group === group)
}

export function scenesBySub(group: Scene['group'], sub: string) {
  return SCENES.filter((s) => s.group === group && s.sub === sub)
}

export function getScene(id: string) {
  return SCENES.find((s) => s.id === id)
}
