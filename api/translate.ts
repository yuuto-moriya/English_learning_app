import { guard, handleTranslate } from '../server/handlers.js'
import { readEnv } from '../server/env.js'

export function POST(request: Request) {
  const env = readEnv()
  return guard(request, env, () => handleTranslate(request, env))
}
