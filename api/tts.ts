import { guard, handleTts } from '../server/handlers.js'
import { readEnv } from '../server/env.js'

export const config = { maxDuration: 15 }

export function GET(request: Request) {
  const env = readEnv()
  return guard(request, env, () => handleTts(request, env))
}
