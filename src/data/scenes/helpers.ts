import type { Scene } from '@/lib/types'
import type { Accent } from '@/lib/accents'
import { accentFor } from '@/lib/settings'

/** 場面のデータを読み込まずに使える関数（データは大きいので、練習の画面では必要になってから読み込む） */

/** シーンの基本の発音（舞台の土地が決まっていればその発音。なければ設定の発音：鉄道は railAccent、それ以外は accent） */
export function sceneAccent(scene: Scene): Accent {
  return scene.accent ?? accentFor(scene.group === 'rail' ? 'rail' : undefined)
}

/** 学習者の役（名前が You か You (役割)）。ロールプレイの既定の役・ながら練習でまねして言う役 */
export function learnerRole(scene: Scene): string | undefined {
  return scene.roles.find((r) => r.name === 'You' || r.name.startsWith('You ('))?.id
}
