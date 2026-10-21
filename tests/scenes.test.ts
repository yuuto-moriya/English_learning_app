import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Scene } from '../src/lib/types'
import { sceneProblems } from './sceneRules'

/** 小分類ごとのファイル（src/data/scenes/<グループ>-<小分類>.ts）を1つずつ確かめる。SCENE_FILE=daily-social で1つだけ */
const only = process.env.SCENE_FILE
const names = readdirSync(new URL('../src/data/scenes/', import.meta.url))
  .filter((f) => /^[a-z]+-[a-z]+\.ts$/.test(f))
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((n) => !only || n === only)
const files = await Promise.all(names.map(async (n) => [n, ((await import(`../src/data/scenes/${n}.ts`)) as { default: Scene[] }).default] as const))

describe('シーン会話の書式', () => {
  if (only) it(`${only} がある`, () => expect(names).toEqual([only]))
  for (const [name, scenes] of files) {
    it(name, () => {
      const cut = name.indexOf('-')
      const group = name.slice(0, cut)
      const sub = name.slice(cut + 1)
      const problems: string[] = []
      for (const s of scenes) {
        if (s.group !== group || s.sub !== sub) problems.push(`${s.id}: group/sub はファイル名（${group}/${sub}）と同じに`)
        problems.push(...sceneProblems(s))
      }
      expect(problems).toEqual([])
    })
  }
})
