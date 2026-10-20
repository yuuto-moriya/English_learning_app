import { guard } from '../server/handlers.js'
import { handleTutor } from '../server/tutor.js'
import { readEnv } from '../server/env.js'

export function POST(request: Request) {
  const env = readEnv()
  return guard(request, env, () => handleTutor(request, env))
}
