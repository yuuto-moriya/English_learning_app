import { describe, expect, it } from 'vitest'
import type { Scene } from '../src/lib/types'
import { sceneProblems } from './sceneRules'

/** 小分類ごとのファイル（src/data/scenes/<グループ>-<小分類>.ts）を1つずつ確かめる。SCENE_FILE=daily-social で1つだけ */
const files = import.meta.glob<{ default: Scene[] }>('../src/data/scenes/*-*.ts', { eager: true })
const only = process.env.SCENE_FILE

describe('シーン会話の書式', () => {
  for (const [path, mod] of Object.entries(files)) {
    const name = path.split('/').pop()!.replace(/\.ts$/, '')
    if (only && name !== only) continue
    it(name, () => {
      const cut = name.indexOf('-')
      const group = name.slice(0, cut)
      const sub = name.slice(cut + 1)
      const problems: string[] = []
      for (const s of mod.default) {
        if (s.group !== group || s.sub !== sub) problems.push(`${s.id}: group/sub はファイル名（${group}/${sub}）と同じに`)
        problems.push(...sceneProblems(s))
      }
      expect(problems).toEqual([])
    })
  }
})
