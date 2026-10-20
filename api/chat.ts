import { guard } from '../server/handlers.js'
import { handleChat } from '../server/chat.js'
import { readEnv } from '../server/env.js'

export function POST(request: Request) {
  const env = readEnv()
  return guard(request, env, () => handleChat(request, env))
}
