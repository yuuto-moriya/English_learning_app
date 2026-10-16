/** 集中モード（タブバー・更新トーストを出さない）：単語学習セッションと初回設定 */
export const isFocusMode = (pathname: string) => pathname.startsWith('/study') || pathname.startsWith('/welcome')
