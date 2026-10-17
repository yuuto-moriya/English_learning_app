/** 集中モード（タブバー・更新トーストを出さない）：単語学習セッション・初回設定・同時通訳 */
export const isFocusMode = (pathname: string) =>
  pathname.startsWith('/study') || pathname.startsWith('/welcome') || pathname.startsWith('/translate/live')
