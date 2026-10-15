import type { Env } from './shared.js'

type ProcessLike = { env: Record<string, string | undefined> }

/** Vercel Functions（Node.js ランタイム）の環境変数を読む（@types/node に依存しない書き方） */
export function readEnv(): Env {
  const e = (globalThis as { process?: ProcessLike }).process?.env ?? {}
  return {
    AZURE_TRANSLATOR_KEY: e.AZURE_TRANSLATOR_KEY,
    AZURE_TRANSLATOR_REGION: e.AZURE_TRANSLATOR_REGION,
    AZURE_TRANSLATOR_ENDPOINT: e.AZURE_TRANSLATOR_ENDPOINT,
    AZURE_SPEECH_KEY: e.AZURE_SPEECH_KEY,
    AZURE_SPEECH_REGION: e.AZURE_SPEECH_REGION,
    AZURE_SPEECH_ENDPOINT: e.AZURE_SPEECH_ENDPOINT,
    APP_ACCESS_TOKEN: e.APP_ACCESS_TOKEN,
  }
}
