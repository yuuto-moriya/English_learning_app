/**
 * キャラクター（案内役のコーギー「テツ」と、いろいろな犬種のなかまたち）。
 * 画像は scripts/blender/ で作ったぬいぐるみ風3Dモデルのレンダリング（public/guide/<id>-<pose>.webp）。
 */
export type CharId = 'tetsu' | 'moka' | 'sumi' | 'kinako' | 'yuki' | 'chocola'

/** テツのポーズ（8種） */
export type Pose = 'greet' | 'happy' | 'celebrate' | 'think' | 'cheer' | 'sleep' | 'safety' | 'oops'
/** なかまのポーズ（4種） */
type CastPose = 'greet' | 'happy' | 'think' | 'cheer'

export interface Character {
  id: CharId
  name: string
  /** 犬種と毛色（みんなぬいぐるみ） */
  breed: string
  role: string
  /** 名札の色（Tailwind のクラス） */
  tint: string
  intro: string
}

export const CHARACTERS: Record<CharId, Character> = {
  tetsu: {
    id: 'tetsu',
    name: 'テツ',
    breed: 'コーギー（レッド＆ホワイト）',
    role: '案内役・応援係',
    tint: 'text-brand-strong',
    intro: '毎日の単語学習を案内して、がんばりを応援するワン。青いリボンが目印だよ。',
  },
  moka: {
    id: 'moka',
    name: 'モカ',
    breed: 'トイプードル（アプリコット）',
    role: 'リスニング・発音コーチ',
    tint: 'text-[#d63a6d] dark:text-[#ff8fb3]',
    intro: '耳がいいのが自慢だよ♪ 聞く・話す練習はモカにおまかせ！',
  },
  sumi: {
    id: 'sumi',
    name: 'スミ',
    breed: 'フレンチブルドッグ（フォーン）',
    role: 'ビジネス英語の先輩',
    tint: 'text-biz',
    intro: '会議・メール・電話の決まり文句なら、わたしがお手伝いします。',
  },
  kinako: {
    id: 'kinako',
    name: 'キナコ',
    breed: '柴犬（クリーム）',
    role: '保線のベテラン',
    tint: 'text-rail',
    intro: '線路を守るのが大好きなベテランだぞ。現場の英語と安全確認はまかせてくれ！',
  },
  yuki: {
    id: 'yuki',
    name: 'ユキ先生',
    breed: 'サモエド（ホワイト）',
    role: '学習法の研究者',
    tint: 'text-gen',
    intro: '記憶と言語習得の研究を、このアプリの仕組みに生かしておるのじゃ。',
  },
  chocola: {
    id: 'chocola',
    name: 'ショコラ',
    breed: 'ミニチュアダックス（チョコタン）',
    role: '翻訳のお手伝い',
    tint: 'text-[#b8650a] dark:text-[#ffb35c]',
    intro: '長いお耳でことばをキャッチ！日本語と英語の橋わたしをするよ。',
  },
}

export const CAST_ORDER: CharId[] = ['tetsu', 'moka', 'sumi', 'kinako', 'yuki', 'chocola']

/** テツ専用ポーズを、なかまの近いポーズに読み替える */
const CAST_POSE: Record<Pose, CastPose> = {
  greet: 'greet',
  happy: 'happy',
  celebrate: 'happy',
  think: 'think',
  cheer: 'cheer',
  sleep: 'think',
  safety: 'cheer',
  oops: 'think',
}

export function charSrc(id: CharId, pose: Pose): string {
  const p = id === 'tetsu' ? pose : CAST_POSE[pose]
  return `/guide/${id}-${p}.webp`
}
