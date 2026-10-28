import { describe, expect, it } from 'vitest'
import { SCENES } from '../src/data/scenes'
import { SCENE_SUBS } from '../src/data/scenes/subs'
import { sceneProblems } from './sceneRules'

/** 小分類ごと（src/data/scenes/<グループ>-<小分類>.ts）に、書式の決まりを確かめる */
describe('シーン会話の書式', () => {
  for (const sub of SCENE_SUBS) {
    it(`${sub.group}-${sub.id}`, () => {
      const scenes = SCENES.filter((s) => s.group === sub.group && s.sub === sub.id)
      expect(scenes.length, '場面がある').toBeGreaterThanOrEqual(5)
      expect(scenes.flatMap(sceneProblems)).toEqual([])
    })
  }
})
