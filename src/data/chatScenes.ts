import type { Category } from '@/lib/types'

/** AI と会話する場面。role は AI への指示（英語）。学ぶコースに合う場面だけを出す（一般はいつも） */
export interface ChatScene {
  id: string
  cat: Category
  title: string
  sub: string
  role: string
  /** この場面でやること（日本語は画面に、英語は AI への指示に） */
  goals: [ja: string, en: string][]
  /** 始める前に見る、この場面で使える言い方（英語・日本語） */
  phrases: [en: string, ja: string][]
}

export const CHAT_SCENES: ChatScene[] = [
  {
    id: 'free',
    cat: 'general',
    title: '自由に話す',
    sub: '話したいことを何でも。趣味・仕事・今日のこと',
    role: 'You are a friendly English-speaking friend. Chat casually about anything the learner wants: hobbies, work, daily life, travel.',
    goals: [
      ['自分のことを1つ話す', 'share one thing about themselves'],
      ['相手に質問を1つする', 'ask the partner one question'],
      ['理由を付けて話す（because …）', 'explain a reason with "because"'],
    ],    phrases: [
      ['I\'m really into ___.', '〜にはまっています'],
      ['What about you?', 'あなたは？'],
      ['That\'s because ___.', 'それは〜だからです'],
    ],
  },
  {
    id: 'cafe',
    cat: 'general',
    title: 'カフェで注文',
    sub: '飲み物とサイズを選び、支払う',
    role: 'You are a barista at a busy coffee shop in New York. The learner is a customer. Take the order: drink, size, for here or to go, and payment.',
    goals: [
      ['飲み物を注文する', 'order a drink'],
      ['サイズと店内／持ち帰りを伝える', 'say the size and for here or to go'],
      ['支払い方法を伝える', 'say how they will pay'],
    ],    phrases: [
      ['Can I get a ___, please?', '〜をください'],
      ['For here, please. / To go, please.', '店内で／持ち帰りで'],
      ['Can I pay by card?', 'カードで払えますか'],
    ],
  },
  {
    id: 'intro',
    cat: 'general',
    title: '初対面の自己紹介',
    sub: '名前・仕事・出身・趣味を聞き合う',
    role: 'You meet the learner for the first time at a friendly international meetup. Introduce yourself briefly and ask about their name, job, hometown and hobbies.',
    goals: [
      ['名前と仕事を伝える', 'say their name and job'],
      ['出身と趣味を話す', 'talk about their hometown and hobbies'],
      ['相手に質問を返す', 'ask the partner a question back'],
    ],    phrases: [
      ['Nice to meet you. I\'m ___.', 'はじめまして、〜です'],
      ['I work as a ___.', '〜として働いています'],
      ['How about you?', 'あなたはどうですか'],
    ],
  },
  {
    id: 'weekend',
    cat: 'general',
    title: '週末の雑談',
    sub: '月曜の朝、同僚と週末の話',
    role: "You are the learner's coworker. It is Monday morning. Chat about what you both did on the weekend.",
    goals: [
      ['週末にしたことを話す', 'say what they did on the weekend'],
      ['感想を言う（It was …）', 'say how it was'],
      ['相手の週末を聞く', 'ask about the partner\'s weekend'],
    ],    phrases: [
      ['I went to ___ with ___.', '〜と〜に行きました'],
      ['It was really fun.', 'とても楽しかったです'],
      ['How was your weekend?', '週末はどうでしたか'],
    ],
  },
  {
    id: 'directions',
    cat: 'general',
    title: '道をたずねる',
    sub: '駅や観光地への行き方を聞く',
    role: 'You are a local person on a street in London. The learner is a tourist asking for directions. Give simple directions and check that they understood.',
    goals: [
      ['行きたい場所を伝える', 'say where they want to go'],
      ['行き方を聞き返して確かめる', 'check the directions by repeating them'],
      ['お礼を言う', 'thank the local person'],
    ],    phrases: [
      ['Excuse me, how can I get to ___?', 'すみません、〜へはどう行けばいいですか'],
      ['So I go straight and turn left?', 'まっすぐ行って左ですね？（確認）'],
      ['Thank you so much!', '本当にありがとう'],
    ],
  },
  {
    id: 'hotel',
    cat: 'general',
    title: 'ホテルのチェックイン',
    sub: '予約の確認・朝食・Wi-Fi・チェックアウト',
    role: 'You are a hotel receptionist. The learner is checking in. Confirm the reservation and answer questions about breakfast, Wi-Fi and check-out time.',
    goals: [
      ['名前と予約を伝える', 'give their name and reservation'],
      ['朝食か Wi-Fi について聞く', 'ask about breakfast or Wi-Fi'],
      ['チェックアウトの時間を確かめる', 'confirm the check-out time'],
    ],    phrases: [
      ['I have a reservation under ___.', '〜の名前で予約しています'],
      ['What time is breakfast?', '朝食は何時ですか'],
      ['What time is check-out?', 'チェックアウトは何時ですか'],
    ],
  },
  {
    id: 'restaurant',
    cat: 'general',
    title: 'レストランで注文',
    sub: 'おすすめを聞く・苦手なものを伝える',
    role: 'You are a server at a restaurant. Greet the learner, recommend dishes, ask about allergies, and take the order.',
    goals: [
      ['おすすめを聞く', 'ask for a recommendation'],
      ['苦手なもの・アレルギーを伝える', 'mention a food they cannot eat'],
      ['料理を注文する', 'order a dish'],
    ],    phrases: [
      ['What do you recommend?', 'おすすめは何ですか'],
      ['I can\'t eat ___.', '〜は食べられません'],
      ['I\'ll have the ___, please.', '〜にします'],
    ],
  },
  {
    id: 'doctor',
    cat: 'general',
    title: '病院で症状を伝える',
    sub: 'いつから・どこが・どのように',
    role: 'You are a doctor at a clinic. The learner is a patient. Ask about their symptoms: when it started, where it hurts, and how bad it is. Be kind.',
    goals: [
      ['症状を伝える', 'describe the symptom'],
      ['いつからかを伝える', 'say when it started'],
      ['痛みの程度を伝える', 'say how bad it is'],
    ],    phrases: [
      ['I have a headache.', '頭が痛いです'],
      ['It started two days ago.', '2日前からです'],
      ['It hurts a lot.', 'とても痛いです'],
    ],
  },
  {
    id: 'meeting',
    cat: 'business',
    title: '会議で意見を言う',
    sub: '提案に賛成・反対し、理由を伝える',
    role: "You are the learner's colleague leading a project meeting about launching a new product next quarter. Ask for the learner's opinion, and ask follow-up questions about their reasons.",
    goals: [
      ['賛成か反対かを言う', 'say if they agree or disagree'],
      ['理由を1つ挙げる', 'give one reason'],
      ['代わりの案を出す', 'suggest an alternative'],
    ],    phrases: [
      ['I agree with you because ___.', '〜なので賛成です'],
      ['I see your point, but ___.', 'おっしゃることは分かりますが、〜'],
      ['How about ___ instead?', '代わりに〜はどうでしょう'],
    ],
  },
  {
    id: 'interview',
    cat: 'business',
    title: '英語の面接',
    sub: '経歴・強み・志望理由を答える',
    role: 'You are a hiring manager interviewing the learner for a job at an international company. Ask one interview question at a time about their experience, strengths and motivation.',
    goals: [
      ['これまでの経験を話す', 'describe their experience'],
      ['強みを1つ挙げる', 'name one strength with an example'],
      ['志望理由を話す', 'explain why they want the job'],
    ],    phrases: [
      ['I have ___ years of experience in ___.', '〜の経験が〜年あります'],
      ['One of my strengths is ___.', '私の強みの一つは〜です'],
      ['I\'d like to work here because ___.', '〜なので御社で働きたいです'],
    ],
  },
  {
    id: 'phone',
    cat: 'business',
    title: '電話の取り次ぎ',
    sub: '名乗る・用件・伝言を残す',
    role: "You are calling the learner's company to speak with their manager, Mr. Smith, who is out of the office. The learner answers the phone. Leave a message.",
    goals: [
      ['名乗って会社名を言う', 'answer with their name and company'],
      ['不在を伝える', 'say that Mr. Smith is out'],
      ['伝言を聞いて復唱する', 'take the message and read it back'],
    ],    phrases: [
      ['Hello, this is ___ from ___.', 'はい、〜社の〜です'],
      ['I\'m afraid he\'s out of the office.', 'あいにく外出しております'],
      ['May I take a message?', 'ご伝言を承りましょうか'],
    ],
  },
  {
    id: 'incident',
    cat: 'it',
    title: '障害の報告',
    sub: '何が起きて、影響と対応はどうか',
    role: 'You are the engineering team lead. The learner is reporting a production incident in a stand-up meeting. Ask what happened, the impact on users, the cause, and the next steps.',
    goals: [
      ['何が起きたかを伝える', 'say what happened'],
      ['利用者への影響を伝える', 'explain the impact on users'],
      ['次の対応を伝える', 'say the next steps'],
    ],    phrases: [
      ['We had an outage in ___.', '〜で障害がありました'],
      ['About ___ users were affected.', '約〜人の利用者に影響がありました'],
      ['Next, we\'ll ___.', '次は〜します'],
    ],
  },
  {
    id: 'review',
    cat: 'it',
    title: 'コードレビュー',
    sub: '変更の意図を説明し、指摘に答える',
    role: "You are a senior engineer reviewing the learner's pull request. Ask about the purpose of the change, testing, and suggest one improvement politely.",
    goals: [
      ['変更の目的を説明する', 'explain the purpose of the change'],
      ['どうテストしたかを話す', 'say how they tested it'],
      ['指摘に答える', 'respond to the suggestion'],
    ],    phrases: [
      ['The purpose of this change is to ___.', 'この変更の目的は〜です'],
      ['I tested it by ___.', '〜で確認しました'],
      ['Good point. I\'ll fix it.', 'いい指摘です。直します'],
    ],
  },
  {
    id: 'track',
    cat: 'rail',
    title: '保線作業の打ち合わせ',
    sub: '夜間作業の段取り・安全・測定',
    role: 'You are a British track maintenance engineer planning an overnight possession with the learner, a Japanese track engineer. Discuss the work plan, safety, tamping and track geometry measurement.',
    goals: [
      ['作業の内容と時間を伝える', 'explain the work and the time'],
      ['安全の手配を確かめる', 'confirm the safety arrangements'],
      ['測定の段取りを話す', 'discuss the track geometry measurement'],
    ],    phrases: [
      ['We\'ll be working from ___ to ___.', '〜から〜まで作業します'],
      ['Have we arranged the lookouts?', '見張りの手配はできていますか'],
      ['We\'ll measure the track geometry after tamping.', 'つき固めのあとに軌道狂いを測ります'],
    ],
  },
]

/** AI に渡す場面の説明（役と、学習者がこの場面でやること） */
export function scenePrompt(s: ChatScene): string {
  return `${s.role} Goals for the learner: ${s.goals.map(([, en]) => en).join('; ')}.`
}

/** 学ぶコースに合う場面（一般はいつも） */
export function chatScenes(studyCats: Partial<Record<Category, boolean>>): ChatScene[] {
  return CHAT_SCENES.filter((s) => s.cat === 'general' || studyCats[s.cat])
}
