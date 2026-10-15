import { checkToken, type Env } from '../../server/shared'

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url)
  if (url.pathname !== '/api/health') {
    const denied = checkToken(ctx.request, ctx.env)
    if (denied) return denied
  }
  return ctx.next()
}
