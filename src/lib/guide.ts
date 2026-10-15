/**
 * 案内役コーギー「テツ」のセリフ。
 * - 能力ではなく「努力・プロセス」をほめる（Mueller & Dweck, 1998）
 * - 間違いを学習の機会として扱う（誤りからの学習・高確信度エラーの訂正）
 * - 学習科学の根拠を短く添えて、やり方への納得感（自律性）を高める（自己決定理論）
 */
export type Pose = 'greet' | 'happy' | 'celebrate' | 'think' | 'cheer' | 'sleep' | 'safety' | 'oops'

export interface GuideLine {
  pose: Pose
  text: string
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function greeting(now = new Date(), name = ''): GuideLine {
  const h = now.getHours()
  const you = name ? `${name}さん` : ''
  if (h < 5) return { pose: 'sleep', text: `夜勤おつかれさまだワン…${you}。5分だけ復習して、しっかり休もうね。` }
  if (h < 11) return { pose: 'greet', text: pick([`おはよう${you}！朝の10分は記憶のゴールデンタイムだワン。`, `おはようだワン！今日もひとつずつ積み上げよう。`]) }
  if (h < 17) return { pose: 'greet', text: pick([`こんにちは${you}！すきま時間に復習しよう。`, `お昼休みに5問だけ、どうかな？`]) }
  if (h < 22) return { pose: 'greet', text: pick([`おかえり${you}！今日の復習が待ってるワン。`, `今日もおつかれさま。寝る前の復習は定着に効くワン！`]) }
  return { pose: 'sleep', text: '寝る前に少しだけ復習すると、睡眠中に記憶が整理されやすいワン。' }
}

export function dueMessage(due: number, newLeft: number): GuideLine {
  if (due === 0 && newLeft === 0) return { pose: 'celebrate', text: '今日の目標は達成だワン！リスニングやシーン練習で「使う」練習をしよう。' }
  if (due > 50) return { pose: 'cheer', text: `復習が${due}枚たまってるワン。全部じゃなくて大丈夫、まず20枚からいこう！` }
  if (due > 0) return { pose: 'cheer', text: `忘れかけたころが復習のベストタイミング。${due}枚の復習が待ってるワン！` }
  return { pose: 'happy', text: `新しい単語があと${newLeft}語。例文ごと覚えると使える英語になるワン。` }
}

export function correctMessage(streak: number): GuideLine {
  if (streak >= 10) return { pose: 'celebrate', text: `${streak}問連続正解！集中力がすごいワン！` }
  if (streak >= 5) return { pose: 'happy', text: pick(['いい調子！思い出す努力が記憶を強くしてるワン。', 'その調子！ちゃんと積み上がってるワン。']) }
  return { pose: 'happy', text: pick(['正解！', 'ナイス！', 'バッチリだワン！', 'よく思い出せたね！']) }
}

export function wrongMessage(): GuideLine {
  return pick([
    { pose: 'oops', text: '惜しい！間違えた単語は、あとでもう一度出すから大丈夫だワン。' },
    { pose: 'think', text: '間違いは記憶を強くするチャンス。正解と例文をもう一度見ておこう。' },
    { pose: 'oops', text: 'ドンマイ！「思い出そうとした」こと自体が学習になってるワン。' },
  ])
}

export function sessionDoneMessage(correct: number, total: number, minutes: number): GuideLine {
  const rate = total ? Math.round((correct / total) * 100) : 0
  if (rate >= 90) return { pose: 'celebrate', text: `${total}問中${correct}問正解（${rate}%）！${minutes}分の集中、すばらしいワン！` }
  if (rate >= 70) return { pose: 'happy', text: `${rate}%正解！間違えた単語は短い間隔でまた出てくるから安心してね。` }
  return { pose: 'cheer', text: `おつかれさま！難しい単語に挑戦した証拠だワン。明日の復習でぐっと伸びるよ。` }
}

export function speakingMessage(score: number): GuideLine {
  if (score >= 90) return { pose: 'celebrate', text: 'ネイティブみたいな発音だワン！' }
  if (score >= 75) return { pose: 'happy', text: 'よく伝わる発音だワン！赤い単語だけもう一度練習しよう。' }
  if (score >= 55) return { pose: 'cheer', text: 'いい挑戦！お手本を聞いてから、ゆっくりはっきり言ってみよう。' }
  return { pose: 'think', text: 'まずはお手本をまねして（シャドーイング）、口の動きに慣れよう。' }
}

export function streakMessage(streak: number): GuideLine | null {
  if (streak >= 30) return { pose: 'celebrate', text: `${streak}日連続！もう英語が習慣になってるワン！` }
  if (streak >= 7) return { pose: 'happy', text: `${streak}日連続で学習中！習慣化まであと少しだワン。` }
  if (streak >= 2) return { pose: 'cheer', text: `${streak}日連続！毎日少しずつが一番効くワン。` }
  return null
}

export const SAFETY_TIPS: string[] = [
  '線路閉鎖は possession（英）、待避は move to a position of safety。安全の英語は最優先で覚えようワン。',
  '規格の shall は「しなければならない」、should は「望ましい」。翻訳で混ぜないでね。',
  '英国の sleeper は米国では tie。英米両方の言い方を知っておくと会議で困らないワン。',
  '数値の報告は単位まではっきり：twenty millimetres、four hundred metres。',
]

export const LEARNING_TIPS: string[] = [
  '見て覚えるより「思い出す」方が記憶に残るワン（テスト効果）。',
  '一度にまとめてより、間隔を空けて復習した方が長く覚えていられるワン（分散学習）。',
  '単語は例文ごと音で覚えると、聞き取りと会話でも使えるワン。',
  '1回で完璧を目指さなくてOK。何度か出会ううちに定着するワン。',
  'お手本の音声をまねするシャドーイングは、聞き取り力アップに効果的だワン。',
  '一般・ビジネス・保線を混ぜて復習すると、使い分けの力がつくワン（インターリーブ）。',
]

export function randomTip(): string {
  return pick([...LEARNING_TIPS, ...SAFETY_TIPS])
}
