import type { Scene } from '@/lib/types'
import { SCENE_SUBS } from './subs'
export { learnerRole, sceneAccent } from './helpers'
import dailySocial from './daily-social'
import dailyTransport from './daily-transport'
import dailyTravel from './daily-travel'
import dailyFood from './daily-food'
import dailyLiving from './daily-living'
import dailyHealth from './daily-health'
import businessMeeting from './business-meeting'
import businessContact from './business-contact'
import businessClient from './business-client'
import businessDeal from './business-deal'
import businessOffice from './business-office'
import businessPresent from './business-present'
import itDev from './it-dev'
import itOps from './it-ops'
import itSecurity from './it-security'
import itSupport from './it-support'
import itClient from './it-client'
import itData from './it-data'
import railSafety from './rail-safety'
import railInspect from './rail-inspect'
import railWorks from './rail-works'
import railEmergency from './rail-emergency'
import railAsset from './rail-asset'
import railGlobal from './rail-global'

/**
 * シチュエーション別会話。
 * タスク中心の言語指導（TBLT）に基づき、「目的のある場面」で使う表現をまとまりで学ぶ。
 * 小分類ごとのファイル（<グループ>-<小分類>.ts）に書き、ここで グループ → 小分類（subs.ts の順）→ レベル の順に並べる。
 */
const ALL: Scene[] = [
  ...dailySocial,
  ...dailyTransport,
  ...dailyTravel,
  ...dailyFood,
  ...dailyLiving,
  ...dailyHealth,
  ...businessMeeting,
  ...businessContact,
  ...businessClient,
  ...businessDeal,
  ...businessOffice,
  ...businessPresent,
  ...itDev,
  ...itOps,
  ...itSecurity,
  ...itSupport,
  ...itClient,
  ...itData,
  ...railSafety,
  ...railInspect,
  ...railWorks,
  ...railEmergency,
  ...railAsset,
  ...railGlobal,
]

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
