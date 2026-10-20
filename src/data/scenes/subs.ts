import type { SceneGroup } from '@/lib/types'

export const SCENE_GROUP_LABEL: Record<SceneGroup, string> = { daily: '一般', business: 'ビジネス', it: 'IT', rail: '鉄道' }

/** シーン会話の小分類。グループの中で、この順に並べる */
export interface SceneSub {
  id: string
  group: SceneGroup
  label: string
  emoji: string
  /** 含まれる場面の例（一覧の見出しの下に出す） */
  desc: string
}

export const SCENE_SUBS: SceneSub[] = [
  { id: 'social', group: 'daily', label: '人付き合い', emoji: '👋', desc: '自己紹介・雑談・誘う・近況・日本の紹介' },
  { id: 'transport', group: 'daily', label: '移動・交通', emoji: '🚉', desc: '道案内・駅・空港・機内・バス・タクシー' },
  { id: 'travel', group: 'daily', label: '旅行・宿・観光', emoji: '🏨', desc: 'ホテル・民泊・ツアー・観光地・写真' },
  { id: 'food', group: 'daily', label: '食事・買い物', emoji: '🍽️', desc: '注文・予約・会計・試着・返品' },
  { id: 'living', group: 'daily', label: '暮らし・手続き', emoji: '🏠', desc: '銀行・郵便・部屋探し・携帯・美容院' },
  { id: 'health', group: 'daily', label: '病院・トラブル', emoji: '🩺', desc: '受付・診察・薬・救急・盗難・欠航' },

  { id: 'meeting', group: 'business', label: '会議', emoji: '🗂️', desc: '進行・意見・聞き返す・進捗・決定事項' },
  { id: 'contact', group: 'business', label: '電話・メール・日程', emoji: '📞', desc: '電話・アポ・日程の変更・伝言・メール' },
  { id: 'client', group: 'business', label: '取引先・商談', emoji: '🤝', desc: '初対面・雑談・ニーズ・製品説明・会食' },
  { id: 'deal', group: 'business', label: '交渉・トラブル対応', emoji: '⚖️', desc: '見積もり・交渉・契約・苦情・おわび' },
  { id: 'office', group: 'business', label: '社内・チーム', emoji: '🏢', desc: '頼む・任せる・フィードバック・休暇' },
  { id: 'present', group: 'business', label: 'プレゼン・面接', emoji: '🎤', desc: '発表・質疑応答・提案・面接・交流会' },

  { id: 'dev', group: 'it', label: '開発チーム', emoji: '💻', desc: '朝会・コードレビュー・計画・設計・振り返り' },
  { id: 'ops', group: 'it', label: '運用・障害対応', emoji: '🚨', desc: '障害報告・アラート・リリース・引き継ぎ' },
  { id: 'security', group: 'it', label: 'セキュリティ', emoji: '🔒', desc: '不審なメール・PC の紛失・権限・脆弱性' },
  { id: 'support', group: 'it', label: 'サポート・ヘルプデスク', emoji: '🛟', desc: 'パスワード・VPN・新しい PC・問い合わせ' },
  { id: 'client', group: 'it', label: '顧客・要件', emoji: '🧾', desc: '要件の聞き取り・説明・デモ・見積もり・変更' },
  { id: 'data', group: 'it', label: 'クラウド・データ・AI', emoji: '☁️', desc: 'クラウド移行・費用・データ分析・AI・DB' },

  { id: 'safety', group: 'rail', label: '作業の安全・連絡', emoji: '🦺', desc: '安全ミーティング・線路閉鎖・見張り・ヒヤリハット' },
  { id: 'inspect', group: 'rail', label: '検査・測定', emoji: '📏', desc: '巡回・検測データ・手検測・分岐器・探傷' },
  { id: 'works', group: 'rail', label: '補修・工事', emoji: '🛠️', desc: '請負業者・つき固め・レール交換・溶接・まくらぎ' },
  { id: 'emergency', group: 'rail', label: '異常時・災害', emoji: '⚠️', desc: 'レール折損・大雨・猛暑・雪・地震' },
  { id: 'asset', group: 'rail', label: '計画・設備管理', emoji: '🧩', desc: '保守計画・EAM・状態監視・LCC・方針の議論' },
  { id: 'global', group: 'rail', label: '国際・対外', emoji: '🌐', desc: '視察の案内・規格・国際会議・海外案件・苦情' },
]

export function subsOf(group: SceneGroup): SceneSub[] {
  return SCENE_SUBS.filter((s) => s.group === group)
}

export function subOf(scene: { group: SceneGroup; sub: string }): SceneSub | undefined {
  return SCENE_SUBS.find((s) => s.group === scene.group && s.id === scene.sub)
}
