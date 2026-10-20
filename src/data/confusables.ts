import type { Category, Level } from '@/lib/types'

/**
 * 使い分け：日本語では同じ（または近い）言葉になり、日本人の学習者がまちがえやすい英語の組。
 * 1問ごとに「空所に入る語」は1つだけになるよう、文法（後ろの語・形）か和訳で決まる文にしている。
 * 選択肢 opts は空所に入れる形のまま（過去形・複数形・大文字で始まる形）。ans は opts のどれか。
 * 解説 note は答え合わせのあとに見せる（違いを言葉で確かめる）。
 */
export interface ConfusableItem {
  /** 空所を ___ にした英文 */
  en: string
  ja: string
  opts: string[]
  ans: string
}

export interface ConfusableSet {
  id: string
  /** 見出し（borrow / lend / rent） */
  title: string
  lv: Level
  cat: Extract<Category, 'general' | 'business'>
  note: string
  items: ConfusableItem[]
}

export const CONFUSABLES: ConfusableSet[] = [
  {
    id: 'borrow-lend',
    title: 'borrow / lend / rent',
    lv: 2,
    cat: 'general',
    note: 'borrow は「（無料で）借りる」、lend は「貸す」。お金を払って借りる・貸す（家・車）は rent。',
    items: [
      { en: 'Can I ___ your pen for a minute?', ja: 'ちょっとペンを借りてもいい？', opts: ['borrow', 'lend', 'rent'], ans: 'borrow' },
      { en: 'My brother ___ me his bike yesterday.', ja: '兄が昨日、自転車を貸してくれた。', opts: ['borrowed', 'lent'], ans: 'lent' },
      { en: 'We ___ a car at the airport and drove to the hotel.', ja: '空港でレンタカーを借りて、ホテルまで運転した。', opts: ['borrowed', 'lent', 'rented'], ans: 'rented' },
    ],
  },
  {
    id: 'say-tell',
    title: 'say / tell / speak / talk',
    lv: 2,
    cat: 'general',
    note: 'tell は「（人に）伝える」で後ろに人（tell me）。say は「（言葉を）言う」で後ろに言った内容。speak は「（言語を）話す」、talk は「（相手と）話し合う・おしゃべりする」（talk to / with）。',
    items: [
      { en: 'Can you ___ me the way to the station?', ja: '駅への行き方を教えてくれますか。', opts: ['say', 'tell', 'speak', 'talk'], ans: 'tell' },
      { en: 'She can ___ three languages.', ja: '彼女は3か国語を話せる。', opts: ['say', 'tell', 'speak', 'talk'], ans: 'speak' },
      { en: 'What did he ___ about the plan?', ja: '彼はその計画について何と言っていましたか。', opts: ['say', 'tell', 'speak'], ans: 'say' },
      { en: 'We ___ on the phone for an hour last night.', ja: '昨夜、電話で1時間おしゃべりした。', opts: ['said', 'told', 'talked'], ans: 'talked' },
    ],
  },
  {
    id: 'see-look-watch',
    title: 'see / look / watch',
    lv: 1,
    cat: 'general',
    note: 'see は「（自然に）目に入る・見える」、look は「（意識して）目を向ける」で look at、watch は「（動くものを）じっと見る」（テレビ・試合）。',
    items: [
      { en: '___ at this picture. Isn’t it beautiful?', ja: 'この写真を見て。きれいでしょう？', opts: ['See', 'Look', 'Watch'], ans: 'Look' },
      { en: 'I like to ___ TV after dinner.', ja: '夕食のあとにテレビを見るのが好きだ。', opts: ['see', 'look', 'watch'], ans: 'watch' },
      { en: 'I can’t ___ anything. It’s too dark.', ja: '何も見えない。暗すぎる。', opts: ['see', 'look', 'watch'], ans: 'see' },
    ],
  },
  {
    id: 'hear-listen',
    title: 'hear / listen',
    lv: 1,
    cat: 'general',
    note: 'hear は「（自然に）聞こえる」、listen は「（意識して）耳を傾ける」で listen to。',
    items: [
      { en: 'I like to ___ to music on the train.', ja: '電車で音楽を聴くのが好きだ。', opts: ['hear', 'listen'], ans: 'listen' },
      { en: 'Did you ___ that noise outside?', ja: '外のあの物音が聞こえた？', opts: ['hear', 'listen'], ans: 'hear' },
      { en: 'Please ___ carefully. I’ll say it only once.', ja: 'よく聞いてください。一度しか言いません。', opts: ['hear', 'listen'], ans: 'listen' },
    ],
  },
  {
    id: 'make-do',
    title: 'make / do',
    lv: 2,
    cat: 'general',
    note: 'make は「作る・生み出す」（make a mistake / a decision / a plan）、do は「行う・こなす」（do homework / the dishes / a favor）。決まった組み合わせで覚える。',
    items: [
      { en: 'Everyone ___ mistakes when learning a language.', ja: '言葉を学ぶとき、誰でもまちがえる。', opts: ['makes', 'does'], ans: 'makes' },
      { en: 'I have to ___ my homework before dinner.', ja: '夕食の前に宿題をしなければならない。', opts: ['make', 'do'], ans: 'do' },
      { en: 'We need to ___ a decision by Friday.', ja: '金曜までに決めなければならない。', opts: ['make', 'do'], ans: 'make' },
      { en: 'Could you ___ me a favor?', ja: 'お願いがあるのですが。', opts: ['make', 'do'], ans: 'do' },
    ],
  },
  {
    id: 'bring-take',
    title: 'bring / take',
    lv: 2,
    cat: 'general',
    note: 'bring は「（話し手・聞き手のいる所へ）持ってくる・連れてくる」、take は「（ほかの所へ）持っていく・連れていく」。',
    items: [
      { en: 'Please ___ your passport when you come to the office.', ja: '事務所に来るときはパスポートを持ってきてください。', opts: ['bring', 'take'], ans: 'bring' },
      { en: 'Can you ___ these letters to the post office?', ja: 'この手紙を郵便局に持っていってくれる？', opts: ['bring', 'take'], ans: 'take' },
      { en: 'I’ll ___ my kids to the zoo on Sunday.', ja: '日曜日に子どもたちを動物園に連れていく。', opts: ['bring', 'take'], ans: 'take' },
    ],
  },
  {
    id: 'remember-remind',
    title: 'remember / remind',
    lv: 3,
    cat: 'general',
    note: 'remember は「（自分が）覚えている・思い出す」、remind は「（人に）思い出させる」で remind 人 to 〜 / of 〜。',
    items: [
      { en: '___ me to call my mother tonight.', ja: '今夜母に電話するのを忘れないよう、声をかけて。', opts: ['Remember', 'Remind'], ans: 'Remind' },
      { en: 'I can’t ___ his name.', ja: '彼の名前が思い出せない。', opts: ['remember', 'remind'], ans: 'remember' },
      { en: 'This song ___ me of my school days.', ja: 'この歌を聞くと学生時代を思い出す。', opts: ['remembers', 'reminds'], ans: 'reminds' },
    ],
  },
  {
    id: 'learn-study',
    title: 'learn / study',
    lv: 2,
    cat: 'general',
    note: 'study は「（時間をかけて）勉強する」という行為、learn は「（勉強や経験で）身につける・知る」という結果。',
    items: [
      { en: 'I ___ English for two hours every night.', ja: '毎晩2時間英語を勉強する。', opts: ['learn', 'study'], ans: 'study' },
      { en: 'She ___ to swim when she was five.', ja: '彼女は5歳のときに泳げるようになった。', opts: ['learned', 'studied'], ans: 'learned' },
      { en: 'I was surprised to ___ that he quit his job.', ja: '彼が仕事を辞めたと知って驚いた。', opts: ['learn', 'study'], ans: 'learn' },
    ],
  },
  {
    id: 'wear-put-on',
    title: 'wear / put on',
    lv: 2,
    cat: 'general',
    note: 'wear は「身につけている（状態）」、put on は「身につける（動作）」。脱ぐのは take off。',
    items: [
      { en: 'She always ___ a hat in summer.', ja: '彼女は夏はいつも帽子をかぶっている。', opts: ['wears', 'puts on'], ans: 'wears' },
      { en: 'He ___ his shoes quickly and ran out.', ja: '彼はさっと靴をはいて飛び出した。', opts: ['wore', 'put on'], ans: 'put on' },
      { en: 'Do I have to ___ a suit to the party?', ja: 'パーティーにはスーツを着ていかないといけない？', opts: ['wear', 'put on'], ans: 'wear' },
    ],
  },
  {
    id: 'win-beat',
    title: 'win / beat',
    lv: 3,
    cat: 'general',
    note: 'win は「（試合・賞に）勝つ・取る」で後ろに試合や賞、beat は「（相手を）負かす」で後ろに相手。',
    items: [
      { en: 'Our team ___ the game 3 to 1.', ja: '私たちのチームは3対1で試合に勝った。', opts: ['won', 'beat'], ans: 'won' },
      { en: 'I always ___ my brother at chess.', ja: 'チェスではいつも弟に勝つ。', opts: ['win', 'beat'], ans: 'beat' },
      { en: 'She ___ first prize in the contest.', ja: '彼女はコンテストで1等賞を取った。', opts: ['won', 'beat'], ans: 'won' },
    ],
  },
  {
    id: 'rob-steal',
    title: 'steal / rob',
    lv: 3,
    cat: 'general',
    note: 'steal は「（物を）盗む」で後ろに盗んだ物、rob は「（人・場所を）襲って奪う」で後ろに人・場所（rob 人 of 物）。',
    items: [
      { en: 'Someone ___ my bike last night.', ja: '昨夜、誰かに自転車を盗まれた。', opts: ['stole', 'robbed'], ans: 'stole' },
      { en: 'Two men ___ the bank and ran away.', ja: '2人の男が銀行を襲って逃げた。', opts: ['stole', 'robbed'], ans: 'robbed' },
      { en: 'He was ___ of his wallet on the street.', ja: '彼は路上で財布を奪われた。', opts: ['stolen', 'robbed'], ans: 'robbed' },
    ],
  },
  {
    id: 'rise-raise',
    title: 'rise / raise',
    lv: 4,
    cat: 'general',
    note: 'rise は「上がる」（後ろに目的語なし：rise / rose / risen）、raise は「上げる」（後ろに目的語：raise / raised / raised）。',
    items: [
      { en: 'The sun ___ in the east.', ja: '太陽は東から昇る。', opts: ['rises', 'raises'], ans: 'rises' },
      { en: '___ your hand if you have a question.', ja: '質問がある人は手を挙げてください。', opts: ['Rise', 'Raise'], ans: 'Raise' },
      { en: 'The company ___ its prices last month.', ja: 'その会社は先月、値上げをした。', opts: ['rose', 'raised'], ans: 'raised' },
    ],
  },
  {
    id: 'lie-lay',
    title: 'lie / lay',
    lv: 4,
    cat: 'general',
    note: 'lie は「横になる・ある」（lie / lay / lain）、lay は「（物を）置く・横たえる」（lay / laid / laid。後ろに目的語）。lie の過去形が lay なのでまちがえやすい。',
    items: [
      { en: 'I’m tired. I need to ___ down for a while.', ja: '疲れた。しばらく横になりたい。', opts: ['lie', 'lay'], ans: 'lie' },
      { en: 'Please ___ the papers on my desk.', ja: '書類を私の机に置いてください。', opts: ['lie', 'lay'], ans: 'lay' },
      { en: 'Yesterday he ___ on the sofa all afternoon.', ja: '昨日、彼は午後ずっとソファで横になっていた。', opts: ['lay', 'laid'], ans: 'lay' },
    ],
  },
  {
    id: 'wait-expect',
    title: 'wait / expect',
    lv: 3,
    cat: 'general',
    note: 'wait (for) は「（来るのを）待つ」、expect は「（起こる・来ると）予想する・見込む」。',
    items: [
      { en: 'I’ll ___ for you at the station.', ja: '駅で待っているね。', opts: ['wait', 'expect'], ans: 'wait' },
      { en: 'We ___ sales to grow next year.', ja: '来年は売り上げが伸びると見込んでいる。', opts: ['wait', 'expect'], ans: 'expect' },
      { en: 'It’s colder than I ___.', ja: '思っていたより寒い。', opts: ['waited', 'expected'], ans: 'expected' },
    ],
  },
  {
    id: 'fun-funny',
    title: 'fun / funny / interesting',
    lv: 2,
    cat: 'general',
    note: 'fun は「楽しい」（It was fun.）、funny は「（笑えて）おかしい」、interesting は「（興味を引いて）おもしろい」。日本語の「おもしろい」はどれにもなる。',
    items: [
      { en: 'The trip was a lot of ___.', ja: '旅行はとても楽しかった。', opts: ['fun', 'funny', 'interesting'], ans: 'fun' },
      { en: 'He told us a ___ story, and everyone laughed.', ja: '彼がおかしな話をして、みんな笑った。', opts: ['fun', 'funny'], ans: 'funny' },
      { en: 'This book about history is very ___.', ja: 'この歴史の本はとても興味深い。', opts: ['fun', 'funny', 'interesting'], ans: 'interesting' },
      { en: 'I found the history museum very ___.', ja: 'その歴史博物館はとても興味深かった。', opts: ['fun', 'funny', 'interesting'], ans: 'interesting' },
    ],
  },
  {
    id: 'bored-boring',
    title: 'bored / boring・excited / exciting',
    lv: 2,
    cat: 'general',
    note: '-ed は「（人が）そういう気持ちになっている」（I’m bored. 退屈している）、-ing は「（物・事が）そういう気持ちにさせる」（a boring movie 退屈な映画）。tired / tiring も同じ。',
    items: [
      { en: 'The movie was so ___ that I fell asleep.', ja: '映画があまりに退屈で寝てしまった。', opts: ['bored', 'boring'], ans: 'boring' },
      { en: 'I’m ___. Let’s go out.', ja: '退屈だな。出かけよう。', opts: ['bored', 'boring'], ans: 'bored' },
      { en: 'The kids were ___ about the trip to the beach.', ja: '子どもたちは海への旅行にわくわくしていた。', opts: ['excited', 'exciting'], ans: 'excited' },
      { en: 'It was an ___ game until the last minute.', ja: '最後の1分まで目が離せない試合だった。', opts: ['excited', 'exciting'], ans: 'exciting' },
    ],
  },
  {
    id: 'hard-hardly',
    title: 'hard / hardly・late / lately',
    lv: 3,
    cat: 'general',
    note: 'hard は「一生懸命に・激しく」、hardly は「ほとんど〜ない」。late は「遅く」、lately は「最近」。-ly を付けると意味が変わる語。',
    items: [
      { en: 'She works very ___.', ja: '彼女はとても一生懸命働く。', opts: ['hard', 'hardly'], ans: 'hard' },
      { en: 'I can ___ hear you. Can you speak up?', ja: 'ほとんど聞こえない。大きな声で話してくれる？', opts: ['hard', 'hardly'], ans: 'hardly' },
      { en: 'I’ve been very busy ___.', ja: '最近とても忙しい。', opts: ['late', 'lately'], ans: 'lately' },
      { en: 'I got up ___ this morning.', ja: '今朝は遅く起きた。', opts: ['late', 'lately'], ans: 'late' },
    ],
  },
  {
    id: 'job-work',
    title: 'job / work',
    lv: 2,
    cat: 'general',
    note: 'work は「仕事（全体）・働くこと」で数えない（a work とは言わない）。job は「（ひとつの）仕事・勤め口」で数える（a job）。',
    items: [
      { en: 'I’m looking for a new ___.', ja: '新しい仕事を探している。', opts: ['job', 'work'], ans: 'job' },
      { en: 'I have a lot of ___ to do today.', ja: '今日はやることがたくさんある。', opts: ['jobs', 'work'], ans: 'work' },
      { en: 'What time do you finish ___?', ja: '何時に仕事が終わる？', opts: ['job', 'work'], ans: 'work' },
    ],
  },
  {
    id: 'trip-travel',
    title: 'trip / travel',
    lv: 2,
    cat: 'general',
    note: 'trip は「（行って帰ってくる）旅行」で数える（a trip / a business trip）。travel は「旅すること（全般）」で、ふつう動詞か数えない名詞。',
    items: [
      { en: 'How was your ___ to Kyoto?', ja: '京都への旅行はどうだった？', opts: ['trip', 'travel'], ans: 'trip' },
      { en: 'I want to ___ around the world someday.', ja: 'いつか世界中を旅したい。', opts: ['trip', 'travel'], ans: 'travel' },
      { en: 'We went on a business ___ to Osaka.', ja: '大阪に出張した。', opts: ['trip', 'travel'], ans: 'trip' },
    ],
  },
  {
    id: 'arrive-reach',
    title: 'arrive / reach',
    lv: 3,
    cat: 'general',
    note: 'arrive は後ろに at / in が必要（arrive at the station / arrive in Tokyo）。reach は直接、場所を続ける（reach the station）。get なら get to。',
    items: [
      { en: 'We ___ at the hotel at nine.', ja: '9時にホテルに着いた。', opts: ['arrived', 'reached'], ans: 'arrived' },
      { en: 'We finally ___ the top of the mountain.', ja: 'ついに山頂に着いた。', opts: ['arrived', 'reached'], ans: 'reached' },
      { en: 'What time does the train ___ in Osaka?', ja: 'その電車は何時に大阪に着く？', opts: ['arrive', 'reach'], ans: 'arrive' },
    ],
  },
  {
    id: 'lose-miss',
    title: 'lose / miss',
    lv: 2,
    cat: 'general',
    note: 'lose は「（物を）なくす・（試合に）負ける」。miss は「（乗り物に）乗り遅れる・（機会を）逃す・（人がいなくて）さびしく思う」。',
    items: [
      { en: 'Hurry up, or we’ll ___ the train.', ja: '急がないと電車に乗り遅れるよ。', opts: ['lose', 'miss'], ans: 'miss' },
      { en: 'I ___ my wallet somewhere in the station.', ja: '駅のどこかで財布をなくした。', opts: ['lost', 'missed'], ans: 'lost' },
      { en: 'I’ll ___ you when you move to Osaka.', ja: 'あなたが大阪に引っ越したらさびしくなる。', opts: ['lose', 'miss'], ans: 'miss' },
    ],
  },
  {
    id: 'forget-leave',
    title: 'forget / leave',
    lv: 2,
    cat: 'general',
    note: '置き忘れた場所を言うときは leave（I left my umbrella on the train.）。forget は「（持ってくる・することを）忘れる」で、場所はふつう言わない。',
    items: [
      { en: 'I ___ my umbrella on the train.', ja: '電車に傘を置き忘れた。', opts: ['forgot', 'left'], ans: 'left' },
      { en: 'Don’t ___ to lock the door.', ja: 'ドアの鍵をかけるのを忘れないで。', opts: ['forget', 'leave'], ans: 'forget' },
      { en: 'Oh no, I ___ to bring my lunch today.', ja: 'しまった、今日はお弁当を持ってくるのを忘れた。', opts: ['forgot', 'left'], ans: 'forgot' },
    ],
  },
  {
    id: 'during-while',
    title: 'during / while',
    lv: 3,
    cat: 'general',
    note: 'during の後ろは名詞（during the meeting）、while の後ろは主語と動詞（while I was sleeping）。どちらも「〜の間に」。',
    items: [
      { en: 'Please turn off your phone ___ the movie.', ja: '映画の間は携帯の電源を切ってください。', opts: ['during', 'while'], ans: 'during' },
      { en: 'Someone called ___ you were out.', ja: 'あなたが外出している間に電話があった。', opts: ['during', 'while'], ans: 'while' },
      { en: 'I fell asleep ___ the lecture.', ja: '講義中に寝てしまった。', opts: ['during', 'while'], ans: 'during' },
    ],
  },
  {
    id: 'by-until',
    title: 'by / until',
    lv: 3,
    cat: 'general',
    note: 'until は「〜までずっと（続く）」、by は「〜までに（終える）」。',
    items: [
      { en: 'Please send me the report ___ Friday.', ja: '金曜日までに報告書を送ってください。', opts: ['by', 'until'], ans: 'by' },
      { en: 'The store is open ___ 9 p.m.', ja: 'その店は夜9時まで開いている。', opts: ['by', 'until'], ans: 'until' },
      { en: 'I’ll wait here ___ you come back.', ja: 'あなたが戻るまでここで待っている。', opts: ['by', 'until'], ans: 'until' },
    ],
  },
  {
    id: 'for-since',
    title: 'for / since',
    lv: 3,
    cat: 'general',
    note: '「ずっと〜している」で、期間の長さを言うときは for（for ten years）、始まった時点を言うときは since（since 2019）。',
    items: [
      { en: 'I’ve lived here ___ ten years.', ja: 'ここに10年住んでいる。', opts: ['for', 'since'], ans: 'for' },
      { en: 'She has worked at this company ___ 2019.', ja: '彼女は2019年からこの会社で働いている。', opts: ['for', 'since'], ans: 'since' },
      { en: 'We haven’t seen each other ___ last summer.', ja: '去年の夏から会っていない。', opts: ['for', 'since'], ans: 'since' },
    ],
  },
  {
    id: 'ago-before',
    title: 'ago / before',
    lv: 3,
    cat: 'general',
    note: 'ago は「（今から）〜前に」（three years ago）。before は「（以前に）」「（ある時より）前に」で、現在完了の「前に〜したことがある」にも使う。',
    items: [
      { en: 'I moved to Tokyo three years ___.', ja: '3年前に東京に引っ越した。', opts: ['ago', 'before'], ans: 'ago' },
      { en: 'Have you been to this restaurant ___?', ja: 'このレストランに前に来たことある？', opts: ['ago', 'before'], ans: 'before' },
      { en: 'Please wash your hands ___ dinner.', ja: '夕食の前に手を洗ってね。', opts: ['ago', 'before'], ans: 'before' },
    ],
  },
  {
    id: 'already-yet-still',
    title: 'already / yet / still',
    lv: 3,
    cat: 'general',
    note: 'already は「もう（〜した）」、yet は否定文で「まだ（〜していない）」・疑問文で「もう（〜した？）」、still は「まだ（続いている）」。',
    items: [
      { en: 'I haven’t decided ___.', ja: 'まだ決めていない。', opts: ['already', 'yet', 'still'], ans: 'yet' },
      { en: 'I’ve ___ eaten, so I’m not hungry.', ja: 'もう食べたので、お腹はすいていない。', opts: ['already', 'yet', 'still'], ans: 'already' },
      { en: 'It’s ten o’clock, and he’s ___ sleeping.', ja: '10時なのに、彼はまだ寝ている。', opts: ['already', 'yet', 'still'], ans: 'still' },
    ],
  },
  {
    id: 'few-little',
    title: 'few / little',
    lv: 3,
    cat: 'general',
    note: 'few は数えられる名詞（a few friends）、little は数えられない名詞（a little money）。a が付くと「少しある」、付かないと「ほとんどない」。',
    items: [
      { en: 'I have a ___ friends in London.', ja: 'ロンドンに友だちが何人かいる。', opts: ['few', 'little'], ans: 'few' },
      { en: 'Could I have a ___ more milk?', ja: 'もう少し牛乳をもらえますか。', opts: ['few', 'little'], ans: 'little' },
      { en: 'There is ___ time left. Let’s hurry.', ja: '時間がほとんど残っていない。急ごう。', opts: ['few', 'little'], ans: 'little' },
    ],
  },
  {
    id: 'too-very',
    title: 'very / too',
    lv: 2,
    cat: 'general',
    note: 'very は「とても」。too は「〜すぎる」で、「だからできない・よくない」の意味を含む（too heavy to carry）。',
    items: [
      { en: 'This bag is ___ heavy to carry.', ja: 'このバッグは重すぎて運べない。', opts: ['very', 'too'], ans: 'too' },
      { en: 'Thank you ___ much.', ja: 'どうもありがとう。', opts: ['very', 'too'], ans: 'very' },
      { en: 'The coffee is ___ hot. I can’t drink it yet.', ja: 'コーヒーが熱すぎてまだ飲めない。', opts: ['very', 'too'], ans: 'too' },
    ],
  },
  {
    id: 'tall-high',
    title: 'tall / high',
    lv: 1,
    cat: 'general',
    note: 'tall は「（人・木・建物など縦に長いものが）背が高い」。high は「（位置・数値が）高い」（high price / high shelf）。',
    items: [
      { en: 'My brother is very ___.', ja: '兄はとても背が高い。', opts: ['tall', 'high'], ans: 'tall' },
      { en: 'The prices at this hotel are too ___.', ja: 'このホテルの値段は高すぎる。', opts: ['tall', 'high'], ans: 'high' },
      { en: 'The plane was flying very ___.', ja: '飛行機はとても高いところを飛んでいた。', opts: ['tall', 'high'], ans: 'high' },
    ],
  },
  {
    id: 'cheap-low',
    title: 'cheap / low',
    lv: 2,
    cat: 'general',
    note: 'cheap は「（物が）安い」。price（値段）・salary（給料）には low を使う（The price is low.）。高いも同じで、物は expensive、値段は high。',
    items: [
      { en: 'This shirt was really ___.', ja: 'このシャツはとても安かった。', opts: ['cheap', 'low'], ans: 'cheap' },
      { en: 'The price of this car is very ___.', ja: 'この車の値段はとても安い。', opts: ['cheap', 'low'], ans: 'low' },
      { en: 'Her salary is quite ___ for such hard work.', ja: '大変な仕事のわりに、彼女の給料はかなり安い。', opts: ['cheap', 'low'], ans: 'low' },
    ],
  },
  {
    id: 'house-home',
    title: 'house / home',
    lv: 1,
    cat: 'general',
    note: 'house は「（建物としての）家」、home は「（暮らす場所としての）家・家庭」。go home・at home のように使う（go to home とは言わない）。',
    items: [
      { en: 'I’m going ___ now.', ja: 'もう家に帰るね。', opts: ['house', 'home'], ans: 'home' },
      { en: 'Is your mother at ___?', ja: 'お母さんは家にいる？', opts: ['house', 'home'], ans: 'home' },
      { en: 'There is a small garden behind the ___.', ja: '家の裏に小さな庭がある。', opts: ['house', 'home'], ans: 'house' },
    ],
  },
  {
    id: 'clothes-cloth',
    title: 'clothes / cloth',
    lv: 2,
    cat: 'general',
    note: 'clothes は「服・衣類」（複数あつかい）、cloth は「布・布きれ」。',
    items: [
      { en: 'I need to buy some new ___ for work.', ja: '仕事用に新しい服を買わないと。', opts: ['clothes', 'cloth'], ans: 'clothes' },
      { en: 'Clean the table with a wet ___.', ja: 'ぬれた布でテーブルをふいて。', opts: ['clothes', 'cloth'], ans: 'cloth' },
      { en: 'Her ___ were wet from the rain.', ja: '彼女の服は雨でぬれていた。', opts: ['clothes', 'cloth'], ans: 'clothes' },
    ],
  },
  {
    id: 'most-almost',
    title: 'most / almost',
    lv: 3,
    cat: 'general',
    note: 'most は「ほとんどの・大部分の」で名詞の前に置く（most people）。almost は「ほとんど・もう少しで」で、名詞の前には直接置けない（almost all people）。',
    items: [
      { en: '___ people in this town have a car.', ja: 'この町のほとんどの人は車を持っている。', opts: ['Most', 'Almost'], ans: 'Most' },
      { en: 'I ___ missed the bus this morning.', ja: '今朝はもう少しでバスに乗り遅れるところだった。', opts: ['most', 'almost'], ans: 'almost' },
      { en: 'Dinner is ___ ready.', ja: '夕食はもうすぐできるよ。', opts: ['most', 'almost'], ans: 'almost' },
    ],
  },
  {
    id: 'other-another',
    title: 'another / other',
    lv: 3,
    cat: 'general',
    note: 'another は「（単数の）もう1つの・別の」（another cup）。other は複数の名詞の前（other people）や the の後（the other）で使う。',
    items: [
      { en: 'Can I have ___ cup of coffee?', ja: 'コーヒーをもう1杯もらえますか。', opts: ['another', 'other'], ans: 'another' },
      { en: 'Some people like tea, but ___ people prefer coffee.', ja: '紅茶が好きな人もいれば、コーヒーのほうが好きな人もいる。', opts: ['another', 'other'], ans: 'other' },
      { en: 'One of my sisters lives in Osaka, and the ___ lives in Tokyo.', ja: '姉妹の1人は大阪に、もう1人は東京に住んでいる。', opts: ['another', 'other'], ans: 'other' },
    ],
  },
  {
    id: 'agree-accept',
    title: 'agree / accept',
    lv: 3,
    cat: 'general',
    note: 'agree は「（意見に）賛成する・同意する」（agree with 人 / to 提案）。accept は「（申し出・招待・支払い方法を）受け入れる」。',
    items: [
      { en: 'I ___ with you.', ja: 'あなたに賛成です。', opts: ['agree', 'accept'], ans: 'agree' },
      { en: 'Do you ___ credit cards?', ja: 'クレジットカードは使えますか。', opts: ['agree', 'accept'], ans: 'accept' },
      { en: 'She ___ the job offer.', ja: '彼女はその仕事の申し出を受けた。', opts: ['agreed', 'accepted'], ans: 'accepted' },
    ],
  },
  {
    id: 'convenient-comfortable',
    title: 'convenient / comfortable',
    lv: 3,
    cat: 'general',
    note: 'convenient は「便利な・（時間の）都合がよい」、comfortable は「快適な・心地よい」。',
    items: [
      { en: 'This sofa is really ___.', ja: 'このソファは本当に座り心地がいい。', opts: ['convenient', 'comfortable'], ans: 'comfortable' },
      { en: 'Is 3 p.m. ___ for you?', ja: '午後3時はご都合いいですか。', opts: ['convenient', 'comfortable'], ans: 'convenient' },
      { en: 'The hotel is in a ___ location near the station.', ja: 'そのホテルは駅に近い便利な場所にある。', opts: ['convenient', 'comfortable'], ans: 'convenient' },
    ],
  },
  {
    id: 'customer-guest',
    title: 'customer / guest / passenger / client',
    lv: 3,
    cat: 'general',
    note: 'customer は「（店の）客」、guest は「（ホテル・招待の）客」、passenger は「（乗り物の）乗客」、client は「（専門家・取引先の）顧客・依頼人」。',
    items: [
      { en: 'The store was full of ___ during the sale.', ja: 'セール中、店はお客さんでいっぱいだった。', opts: ['customers', 'guests', 'passengers', 'clients'], ans: 'customers' },
      { en: 'All ___ must fasten their seat belts.', ja: '乗客の皆さまはシートベルトをお締めください。', opts: ['customers', 'guests', 'passengers', 'clients'], ans: 'passengers' },
      { en: 'Hotel ___ can use the pool for free.', ja: 'ホテルの宿泊客はプールを無料で使える。', opts: ['customers', 'guests', 'passengers', 'clients'], ans: 'guests' },
      { en: 'Our lawyer meets with ___ every afternoon.', ja: 'うちの弁護士は毎日午後に依頼人と会う。', opts: ['customers', 'guests', 'passengers', 'clients'], ans: 'clients' },
    ],
  },
  {
    id: 'price-fee-fare',
    title: 'price / fee / fare / cost',
    lv: 3,
    cat: 'general',
    note: 'price は「（品物の）値段」、fee は「（サービス・手続きの）料金・手数料」、fare は「（乗り物の）運賃」、cost は「（何かにかかる）費用」。',
    items: [
      { en: 'The bus ___ is 200 yen.', ja: 'バスの運賃は200円だ。', opts: ['price', 'fee', 'fare'], ans: 'fare' },
      { en: 'There is a small ___ for using the ATM.', ja: 'ATM の利用には少し手数料がかかる。', opts: ['price', 'fee', 'fare'], ans: 'fee' },
      { en: 'The ___ of this coat is too high for me.', ja: 'このコートの値段は私には高すぎる。', opts: ['price', 'fee', 'fare'], ans: 'price' },
      { en: 'The ___ of living in Tokyo is high.', ja: '東京の生活費は高い。', opts: ['fee', 'fare', 'cost'], ans: 'cost' },
    ],
  },
  {
    id: 'appointment-promise',
    title: 'appointment / meeting / promise',
    lv: 3,
    cat: 'general',
    note: 'appointment は「（人と会う・診察などの）約束・予約」、meeting は「会議・打ち合わせ」、promise は「（〜すると）約束すること」。会う約束に promise は使わない。',
    items: [
      { en: 'I have a dentist ___ at three.', ja: '3時に歯医者の予約がある。', opts: ['appointment', 'meeting', 'promise'], ans: 'appointment' },
      { en: 'The sales team has a ___ every Monday morning.', ja: '営業チームは毎週月曜の朝に会議がある。', opts: ['appointment', 'meeting', 'promise'], ans: 'meeting' },
      { en: 'He kept his ___ to call me every week.', ja: '彼は毎週電話するという約束を守った。', opts: ['appointment', 'meeting', 'promise'], ans: 'promise' },
    ],
  },
  {
    id: 'economic-economical',
    title: 'economic / economical',
    lv: 4,
    cat: 'general',
    note: 'economic は「経済の」（economic growth）、economical は「経済的な・お金や燃料の節約になる」（an economical car）。',
    items: [
      { en: 'The country’s ___ growth slowed last year.', ja: 'その国の経済成長は昨年鈍った。', opts: ['economic', 'economical'], ans: 'economic' },
      { en: 'This small car is very ___. It uses little gas.', ja: 'この小型車はとても経済的だ。ガソリンをあまり使わない。', opts: ['economic', 'economical'], ans: 'economical' },
      { en: 'The government announced new ___ policies.', ja: '政府は新しい経済政策を発表した。', opts: ['economic', 'economical'], ans: 'economic' },
    ],
  },
  {
    id: 'postpone-cancel',
    title: 'postpone / cancel',
    lv: 3,
    cat: 'business',
    note: 'postpone は「延期する（後の日にする）」、cancel は「中止する・取り消す（なくす）」。',
    items: [
      { en: 'The meeting was ___ until next Monday.', ja: '会議は来週の月曜日に延期された。', opts: ['postponed', 'canceled'], ans: 'postponed' },
      { en: 'Our flight was ___ because of the typhoon, so we stayed home.', ja: '台風で便が欠航になったので、家にいた。', opts: ['postponed', 'canceled'], ans: 'canceled' },
      { en: 'Can we ___ the call to Thursday?', ja: '電話会議を木曜日に延期できますか。', opts: ['postpone', 'cancel'], ans: 'postpone' },
    ],
  },
  {
    id: 'estimate-invoice',
    title: 'estimate / invoice / receipt',
    lv: 4,
    cat: 'business',
    note: 'estimate（quote）は「見積もり（支払い前の予定額）」、invoice は「請求書（支払いを求める書類）」、receipt は「領収書・レシート（支払った証明）」。',
    items: [
      { en: 'Could you send us an ___ before we place the order?', ja: '発注する前に見積もりを送っていただけますか。', opts: ['estimate', 'invoice'], ans: 'estimate' },
      { en: 'Please pay the ___ within 30 days.', ja: '請求書は30日以内にお支払いください。', opts: ['estimate', 'invoice', 'receipt'], ans: 'invoice' },
      { en: 'Keep the ___ in case you need to return the item.', ja: '返品する場合に備えて、レシートを取っておいてください。', opts: ['estimate', 'invoice', 'receipt'], ans: 'receipt' },
    ],
  },
  {
    id: 'effective-efficient',
    title: 'effective / efficient',
    lv: 4,
    cat: 'business',
    note: 'effective は「効果がある（目的を果たせる）」、efficient は「効率がよい（むだが少ない）」。',
    items: [
      { en: 'This medicine is very ___ for headaches.', ja: 'この薬は頭痛によく効く。', opts: ['effective', 'efficient'], ans: 'effective' },
      { en: 'The new machine is more ___ and uses less power.', ja: '新しい機械はより効率的で、電力も少なくてすむ。', opts: ['effective', 'efficient'], ans: 'efficient' },
      { en: 'We need a more ___ way to handle orders. It takes too long now.', ja: '注文をもっと効率よく処理する方法が必要だ。今は時間がかかりすぎる。', opts: ['effective', 'efficient'], ans: 'efficient' },
    ],
  },
]
