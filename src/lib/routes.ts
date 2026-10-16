/** 単語学習セッションは集中モード（タブバー・更新トーストを出さない） */
export const isFocusMode = (pathname: string) => pathname.startsWith('/study')
