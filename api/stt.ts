import { guard, handleStt } from '../server/handlers.js'
import { readEnv } from '../server/env.js'

export const config = { maxDuration: 30 }

export function POST(request: Request) {
  const env = readEnv()
  return guard(request, env, () => handleStt(request, env))
}
