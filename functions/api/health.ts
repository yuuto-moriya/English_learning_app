import { json, type Env } from '../../server/shared'

export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  json({
    translator: !!(env.AZURE_TRANSLATOR_KEY && env.AZURE_TRANSLATOR_REGION),
    speech: !!(env.AZURE_SPEECH_KEY && (env.AZURE_SPEECH_REGION || env.AZURE_SPEECH_ENDPOINT)),
    tokenRequired: !!env.APP_ACCESS_TOKEN,
  })
