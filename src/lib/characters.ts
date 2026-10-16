/**
 * キャラクター（案内役テツと、なかまたち）。
 * 画像は scripts/blender/ で作った3Dモデルのレンダリング（public/guide/<id>-<pose>.webp）。
 */
export type CharId = 'tetsu' | 'pico' | 'penta' | 'bolt' | 'hoo'

/** テツのポーズ（8種） */
export type Pose = 'greet' | 'happy' | 'celebrate' | 'think' | 'cheer' | 'sleep' | 'safety' | 'oops'
/** なかまのポーズ（4種） */
type CastPose = 'greet' | 'happy' | 'think' | 'cheer'

export interface Character {
  id: CharId
  name: string
  animal: string
  role: string
  /** 名札の色（Tailwind のクラス） */
  tint: string
  intro: string
}

export const CHARACTERS: Record<CharId, Character> = {
  tetsu: {
    id: 'tetsu',
    name: 'テツ',
    animal: 'コーギー',
    role: '案内役・応援係',
    tint: 'text-brand-strong',
    intro: '毎日の単語学習を案内して、がんばりを応援するワン。保線の安全ルールにもくわしいよ。',
  },
  pico: {
    id: 'pico',
    name: 'ピコ',
    animal: 'セキセイインコ',
    role: 'リスニング・発音コーチ',
    tint: 'text-ok',
    intro: 'まねするのが得意なインコだピ。聞く・話す練習はボクにまかせて！',
  },
  penta: {
    id: 'penta',
    name: 'ペンタ',
    animal: 'ペンギン',
    role: 'ビジネス英語の先輩',
    tint: 'text-biz',
    intro: '会議・メール・電話の決まり文句なら、わたしがお手伝いしますペン。',
  },
  bolt: {
    id: 'bolt',
    name: 'ボルト',
    animal: 'ビーバー',
    role: '保線のベテラン',
    tint: 'text-rail',
    intro: '線路を守って30年…の気持ちのビーバーだ。現場の英語と安全確認はオレに聞いてくれ！',
  },
  hoo: {
    id: 'hoo',
    name: 'ホー先生',
    animal: 'フクロウ',
    role: '学習法の研究者',
    tint: 'text-gen',
    intro: '記憶と言語習得の研究を、このアプリの仕組みに生かしておるのじゃホー。',
  },
}

export const CAST_ORDER: CharId[] = ['tetsu', 'pico', 'penta', 'bolt', 'hoo']

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
