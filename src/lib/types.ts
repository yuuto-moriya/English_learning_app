export type Category = 'general' | 'business' | 'rail'

/** 例文。英文中の学習対象語は *word* のようにアスタリスクで囲む */
export interface Example {
  en: string
  ja: string
}

export interface Word {
  /** g-0001 / b-0001 / r-0001 */
  id: string
  /** 見出し語（保線用語はEN規格に沿った英国表記） */
  w: string
  pos: string
  ja: string
  /** 1:入門(A1) 2:初級(A2) 3:中級(B1) 4:中上級(B2) 5:上級(C1) 6:専門 */
  lv: Level
  cat: Category
  /** 保線用語のサブカテゴリ */
  sub?: string
  /** 米音IPA */
  ipa?: string
  /** 英音IPA（保線用語） */
  ipaUk?: string
  /** 品詞で読みが変わる語（live, record など）の、この品詞での米音。単語だけを高品質音声で読むときに指定する */
  say?: string
  /** 米国表記（保線用語で英国表記と異なる場合） */
  us?: string
  /** JIS等の日本語用語 */
  jis?: string
  ex: Example[]
  /** 解説 */
  note?: string
  /** 出典となる規格・文書 */
  refs?: string[]
  /** 頻度順位（NGSL/BSL/TSL内） */
  rank?: number
}

export type Level = 1 | 2 | 3 | 4 | 5 | 6

export const LEVELS: { lv: Level; label: string; cefr: string; toeic: string }[] = [
  { lv: 1, label: '入門', cefr: 'A1', toeic: '〜300' },
  { lv: 2, label: '初級', cefr: 'A2', toeic: '300〜450' },
  { lv: 3, label: '中級', cefr: 'B1', toeic: '450〜600' },
  { lv: 4, label: '中上級', cefr: 'B2', toeic: '600〜780' },
  { lv: 5, label: '上級', cefr: 'C1', toeic: '780〜' },
  { lv: 6, label: '専門', cefr: 'ESP', toeic: '専門' },
]

/** コース（＝単語のカテゴリ）。オンボーディングで選び、出題・シーン・練習の既定に使う */
export const CATEGORIES: {
  key: Category
  label: string
  short: string
  desc: string
  source: string
  /** シーン会話のグループ */
  scene: SceneGroup
  /** 文字色・背景色（Tailwind のクラス） */
  text: string
  soft: string
  dot: string
}[] = [
  {
    key: 'general',
    label: '一般会話',
    short: '一般',
    desc: '日常の会話・旅行・暮らしで使う高頻度の英語',
    source: 'NGSL（一般英語の約92%をカバーする高頻度語）',
    scene: 'daily',
    text: 'text-gen',
    soft: 'bg-gen-soft',
    dot: 'bg-gen',
  },
  {
    key: 'business',
    label: 'ビジネス',
    short: 'ビジネス',
    desc: '会議・メール・電話・交渉などの仕事の英語',
    source: 'BSL / TSL（ビジネス・TOEIC 頻出語）',
    scene: 'business',
    text: 'text-biz',
    soft: 'bg-biz-soft',
    dot: 'bg-biz',
  },
  {
    key: 'rail',
    label: '保線',
    short: '保線',
    desc: '鉄道保線・設備管理（EAM）の専門用語と現場の英語',
    source: 'EN 規格・TSI・JIS に基づく保線／設備管理用語',
    scene: 'rail',
    text: 'text-rail',
    soft: 'bg-rail-soft',
    dot: 'bg-rail',
  },
]

export const catMeta = (c: Category) => CATEGORIES.find((x) => x.key === c)!

export const RAIL_SUBS: Record<string, string> = {
  general: '線路一般・線形',
  structure: '軌道構造・材料',
  rail: 'レール・継目・溶接',
  snc: '分岐器',
  geometry: '軌道狂い・検測',
  defect: '損傷・劣化',
  work: '保線作業・機械',
  safety: '安全・運転取扱い',
  civil: '土木・構造物',
  eam: '設備管理・保全(EAM)',
  standard: '規格・制度',
}

export interface DialogueLine {
  sp: string
  en: string
  ja: string
}

export interface Phrase {
  en: string
  ja: string
  note?: string
}

export type SceneGroup = 'daily' | 'business' | 'rail'

export interface Scene {
  id: string
  group: SceneGroup
  /** 舞台の土地の発音（最初の話者がこの発音で話す）。省略時は保線＝英国、それ以外＝米国 */
  accent?: 'en-US' | 'en-GB'
  title: string
  titleEn: string
  lv: Level
  emoji: string
  goal: string
  roles: { id: string; name: string }[]
  phrases: Phrase[]
  lines: DialogueLine[]
  tip?: string
}
