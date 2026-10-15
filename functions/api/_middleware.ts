import { checkToken, json, type Env } from '../../server/shared'

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url)
  if (url.pathname !== '/api/health') {
    const denied = checkToken(ctx.request, ctx.env)
    if (denied) return denied
  }
  try {
    return await ctx.next()
  } catch (e) {
    // 想定外の例外でもクライアントには必ずJSONを返す（HTMLの500にしない）
    console.error(e)
    return json({ error: 'サーバーエラーが発生しました' }, 500)
  }
}
