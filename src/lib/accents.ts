/**
 * 英語の発音（国・地域）。iPhone の「リーダーと読み上げ → 声 → 英語 → 声」と同じように、国ごとの話し方を選べる。
 * 高品質音声（Azure のニューラル音声）は各国 2 人以上。端末の声は iPhone に入っている国の分だけ。
 */
export type Accent = 'en-US' | 'en-GB' | 'en-AU' | 'en-CA' | 'en-IE' | 'en-IN' | 'en-NZ' | 'en-ZA'

export interface AccentInfo {
  id: Accent
  /** 国・地域の名前 */
  label: string
  /** 短い表記（タグ用） */
  short: string
  /** 発音の特徴（学習者向けのひとこと） */
  note: string
  /** 端末にその国の声がないときに代わりに使う発音（近い順） */
  fallback: Accent[]
}

export const ACCENTS: AccentInfo[] = [
  { id: 'en-US', label: 'アメリカ', short: 'US', note: 'このアプリの基本。r をはっきり発音する', fallback: [] },
  { id: 'en-GB', label: 'イギリス', short: 'UK', note: '語末の r を発音しない。EN 規格・保線用語の基本', fallback: [] },
  { id: 'en-AU', label: 'オーストラリア', short: 'AU', note: '母音の響きが独特。語末の r は発音しない', fallback: ['en-GB'] },
  { id: 'en-CA', label: 'カナダ', short: 'CA', note: 'アメリカの発音に近く、r を発音する', fallback: ['en-US'] },
  { id: 'en-IE', label: 'アイルランド', short: 'IE', note: 'r を発音し、th が t・d に近くなることがある', fallback: ['en-GB'] },
  { id: 'en-IN', label: 'インド', short: 'IN', note: '話す人が多く、ビジネスや IT の現場でよく聞く', fallback: ['en-GB'] },
  { id: 'en-NZ', label: 'ニュージーランド', short: 'NZ', note: 'オーストラリアの発音に近く、語末の r は発音しない', fallback: ['en-AU', 'en-GB'] },
  { id: 'en-ZA', label: '南アフリカ', short: 'ZA', note: '語末の r は発音しない', fallback: ['en-GB'] },
]

export const accentInfo = (a: Accent): AccentInfo => ACCENTS.find((x) => x.id === a) ?? ACCENTS[0]

export const isAccent = (x: unknown): x is Accent => typeof x === 'string' && ACCENTS.some((a) => a.id === x)

export interface NeuralVoice {
  id: string
  name: string
  gender: 'F' | 'M'
}

/** 高品質音声の声。サーバー側の許可リスト（server/handlers.ts の TTS_VOICES）と同じもの */
export const NEURAL_VOICES: Record<Accent, NeuralVoice[]> = {
  'en-US': [
    { id: 'en-US-AvaNeural', name: 'Ava', gender: 'F' },
    { id: 'en-US-AndrewNeural', name: 'Andrew', gender: 'M' },
    { id: 'en-US-EmmaNeural', name: 'Emma', gender: 'F' },
    { id: 'en-US-BrianNeural', name: 'Brian', gender: 'M' },
    { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'F' },
    { id: 'en-US-GuyNeural', name: 'Guy', gender: 'M' },
  ],
  'en-GB': [
    { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'F' },
    { id: 'en-GB-RyanNeural', name: 'Ryan', gender: 'M' },
    { id: 'en-GB-LibbyNeural', name: 'Libby', gender: 'F' },
  ],
  'en-AU': [
    { id: 'en-AU-NatashaNeural', name: 'Natasha', gender: 'F' },
    { id: 'en-AU-WilliamNeural', name: 'William', gender: 'M' },
  ],
  'en-CA': [
    { id: 'en-CA-ClaraNeural', name: 'Clara', gender: 'F' },
    { id: 'en-CA-LiamNeural', name: 'Liam', gender: 'M' },
  ],
  'en-IE': [
    { id: 'en-IE-EmilyNeural', name: 'Emily', gender: 'F' },
    { id: 'en-IE-ConnorNeural', name: 'Connor', gender: 'M' },
  ],
  'en-IN': [
    { id: 'en-IN-NeerjaNeural', name: 'Neerja', gender: 'F' },
    { id: 'en-IN-PrabhatNeural', name: 'Prabhat', gender: 'M' },
  ],
  'en-NZ': [
    { id: 'en-NZ-MollyNeural', name: 'Molly', gender: 'F' },
    { id: 'en-NZ-MitchellNeural', name: 'Mitchell', gender: 'M' },
  ],
  'en-ZA': [
    { id: 'en-ZA-LeahNeural', name: 'Leah', gender: 'F' },
    { id: 'en-ZA-LukeNeural', name: 'Luke', gender: 'M' },
  ],
}

/** 会話の相手役の発音：基本がアメリカならイギリス、それ以外ならアメリカ（聞き比べやすいように） */
export function otherAccent(a: Accent): Accent {
  return a === 'en-US' ? 'en-GB' : 'en-US'
}
