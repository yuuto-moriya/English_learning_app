import { guard, handleHealth } from '../server/handlers.js'
import { readEnv } from '../server/env.js'

export function GET(request: Request) {
  const env = readEnv()
  return guard(request, env, () => handleHealth(env), { public: true })
}
