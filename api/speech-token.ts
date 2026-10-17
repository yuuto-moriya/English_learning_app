import { guard, handleSpeechToken } from '../server/handlers.js'
import { readEnv } from '../server/env.js'

export const config = { maxDuration: 10 }

export function GET(request: Request) {
  const env = readEnv()
  return guard(request, env, () => handleSpeechToken(env))
}
