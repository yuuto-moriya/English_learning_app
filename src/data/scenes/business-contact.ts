import type { Scene } from '@/lib/types'

/** 電話・メール・日程（ビジネス）。名前と番号を伝える・電話応対・日程調整・予定の変更・アポ取り・留守電・メールの定型表現 */
const scenes: Scene[] = [
  {
    id: 'b-spelling',
    group: 'business',
    sub: 'contact',
    title: '名前と番号を正確に伝える',
    titleEn: 'Spelling Names and Numbers',
    lv: 2,
    emoji: '🔤',
    goal: 'つづり・メールアドレス・国際電話番号を正確に伝え、相手の番号を復唱できる',
    roles: [
      { id: 'A', name: 'Receptionist' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Could you spell your last name for me?',
        ja: '名字のつづりを教えていただけますか。',
        note: '米国では family name より last name がふつう',
      },
      {
        en: "That's M as in Mike.",
        ja: 'Mike の M です。',
        note: 'M と N、B と V など聞き違えやすい文字は as in で単語を添える。Alpha、Bravo などの NATO 式が確実',
      },
      {
        en: 'Was that an underscore or a hyphen?',
        ja: 'アンダースコアでしたか、ハイフンでしたか。',
        note: '@ は at、. は dot、_ は underscore、- は hyphen（dash とも）と読む',
      },
      {
        en: "It's all lowercase.",
        ja: 'すべて小文字です。',
        note: '大文字は capital letters（uppercase）',
      },
      {
        en: 'From abroad, you drop the first zero.',
        ja: '海外からは最初の0を取ります。',
      },
      {
        en: 'Let me read that back.',
        ja: '復唱させてください。',
        note: '聞き取った名前や番号は、読み上げて確かめる',
      },
      {
        en: 'Could you say that more slowly?',
        ja: 'もう少しゆっくり言っていただけますか。',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Good afternoon, Lakeside Parts. How can I help you?',
        ja: 'こんにちは。レイクサイド・パーツです。どのようなご用件でしょうか。',
      },
      {
        sp: 'B',
        en: 'Hi, this is Ken Imai from Minato Tech in Tokyo. Could you send me your new price list?',
        ja: 'もしもし、東京のミナト・テックの今井健と申します。新しい価格表を送っていただけますか。',
      },
      {
        sp: 'A',
        en: 'Of course. Could you spell your last name for me?',
        ja: 'かしこまりました。名字のつづりを教えていただけますか。',
      },
      {
        sp: 'B',
        en: "Sure. It's Imai, I-M-A-I. That's M as in Mike.",
        ja: 'はい。今井で、I-M-A-I です。M は Mike の M です。',
      },
      {
        sp: 'A',
        en: "Thank you, Mr. Imai. And what's your email address?",
        ja: 'ありがとうございます、今井様。それから、メールアドレスを教えていただけますか。',
      },
      {
        sp: 'B',
        en: "It's ken, underscore, imai, at minato, hyphen, tech, dot, J-P.",
        ja: 'ken_imai@minato-tech.jp です。',
      },
      {
        sp: 'A',
        en: "Sorry, after 'ken', was that an underscore or a hyphen?",
        ja: 'すみません、ken のあとはアンダースコアでしたか、ハイフンでしたか。',
      },
      {
        sp: 'B',
        en: "An underscore. And it's all lowercase.",
        ja: 'アンダースコアです。それと、すべて小文字です。',
      },
      {
        sp: 'A',
        en: 'Got it. Can I also get a phone number?',
        ja: '分かりました。お電話番号も伺えますか。',
      },
      {
        sp: 'B',
        en: "Sure. It's plus eight one, nine zero, four eight one seven, two two six five.",
        ja: 'はい。+81 90-4817-2265 です。',
      },
      {
        sp: 'A',
        en: 'Do I need a zero before the nine?',
        ja: '9の前に0は付けますか。',
      },
      {
        sp: 'B',
        en: 'No. In Japan it starts with zero nine zero, but from abroad, you drop the first zero.',
        ja: 'いいえ。日本国内では090で始まりますが、海外からは最初の0を取ります。',
      },
      {
        sp: 'A',
        en: 'Thanks. Diana Ruiz in sales will email you the list today. Her direct line is five zero three, five five five, zero one four eight.',
        ja: 'ありがとうございます。本日、営業のダイアナ・ルイスが価格表をメールでお送りします。ルイスの直通番号は503-555-0148です。',
      },
      {
        sp: 'B',
        en: 'Let me read that back: Diana Ruiz, five zero three, five five five, zero one four eight.',
        ja: '復唱させてください。ダイアナ・ルイスさん、503-555-0148ですね。',
      },
      {
        sp: 'A',
        en: "That's right. Is there anything else I can help you with?",
        ja: 'そのとおりです。ほかに何かございますか。',
      },
      {
        sp: 'B',
        en: "No, that's everything. Thanks for your help.",
        ja: 'いいえ、以上です。ご対応ありがとうございました。',
      },
    ],
    tip: '電話番号は1桁ずつ読み、3〜4桁ごとに区切ります。0は zero、くだけて oh とも読みます。日本の090や03は、海外の相手には最初の0を取って +81 90、+81 3 で始めます。',
  },
  {
    id: 'b-phone',
    group: 'business',
    sub: 'contact',
    title: '電話応対',
    titleEn: 'Taking a Phone Call',
    lv: 3,
    emoji: '📞',
    goal: '不在の同僚あての電話を受け、用件と連絡先を確かめて伝言を預かることができる',
    roles: [
      { id: 'A', name: 'Sarah Lee' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Sales Department, Moriya speaking.',
        ja: 'はい、営業部の守屋です。',
        note: '電話では I am ではなく、〜 speaking. や This is 〜. で名乗る',
      },
      {
        en: "May I ask who's calling?",
        ja: '失礼ですが、どちら様でしょうか。',
        note: 'Who are you? は失礼に聞こえる',
      },
      {
        en: "I'm afraid he's in a meeting right now.",
        ja: 'あいにくただいま会議中です。',
        note: "I'm afraid は残念な知らせをやわらげる前置き",
      },
      {
        en: 'He should be back around three.',
        ja: '3時ごろには戻る予定です。',
      },
      { en: 'Can I take a message?', ja: 'ご伝言を承りましょうか。' },
      {
        en: 'Would you like him to call you back?',
        ja: '折り返しお電話させましょうか。',
      },
      {
        en: 'Could I get your number, just in case?',
        ja: '念のため、お電話番号を伺ってもよろしいですか。',
      },
      {
        en: "I'll make sure he gets the message.",
        ja: '必ず申し伝えます。',
        note: '申し伝えるは、社外の人の伝言を社内の人に伝えるときのへりくだった言い方',
      },
    ],
    lines: [
      {
        sp: 'B',
        en: 'Sales Department, Moriya speaking.',
        ja: 'はい、営業部の守屋です。',
      },
      {
        sp: 'A',
        en: 'Hi, could I speak to Mr. Tanaka, please?',
        ja: 'もしもし、田中さんをお願いできますか。',
      },
      {
        sp: 'B',
        en: "Certainly. May I ask who's calling?",
        ja: 'かしこまりました。失礼ですが、どちら様でしょうか。',
      },
      {
        sp: 'A',
        en: 'This is Sarah Lee from BlueOak Systems.',
        ja: 'ブルーオーク・システムズのサラ・リーです。',
      },
      {
        sp: 'B',
        en: "Thank you, Ms. Lee. I'm afraid he's in a meeting right now. He should be back around three.",
        ja: 'ありがとうございます、リー様。あいにく田中はただいま会議中です。3時ごろには戻る予定です。',
      },
      {
        sp: 'A',
        en: "Oh, I see. It's a little urgent, actually.",
        ja: 'そうですか。実は少し急ぎなんです。',
      },
      {
        sp: 'B',
        en: 'Can I take a message, or would you like him to call you back?',
        ja: 'ご伝言を承りましょうか。それとも、田中から折り返しお電話させましょうか。',
      },
      {
        sp: 'A',
        en: "Could he call me as soon as he gets out of the meeting? It's about the delivery date for our order.",
        ja: '会議が終わりしだい、お電話をいただけますか。こちらの注文の納期の件です。',
      },
      {
        sp: 'B',
        en: 'Of course. Could I get your number, just in case?',
        ja: '承知しました。念のため、お電話番号を伺ってもよろしいですか。',
      },
      {
        sp: 'A',
        en: "Sure. It's zero three, six two zero five, four four one eight, extension two one two.",
        ja: 'はい。03-6205-4418、内線212です。',
      },
      {
        sp: 'B',
        en: 'Sorry, was that extension two one two or two two one?',
        ja: 'すみません、内線は212でしたか、221でしたか。',
      },
      {
        sp: 'A',
        en: 'Two one two. Thanks for checking.',
        ja: '212です。確かめていただいてありがとうございます。',
      },
      {
        sp: 'B',
        en: "Just to confirm, you'd like him to call you about the delivery date as soon as his meeting ends.",
        ja: '確認させてください。納期の件で、会議が終わりしだい田中からお電話を、ということですね。',
      },
      {
        sp: 'A',
        en: "That's right. Thanks so much.",
        ja: 'そのとおりです。どうもありがとうございます。',
      },
      {
        sp: 'B',
        en: "You're welcome. I'll make sure he gets the message.",
        ja: 'とんでもございません。田中に必ず申し伝えます。',
      },
    ],
    tip: '伝言は「誰から → 用件 → 連絡先 → 急ぎか」を聞き、Just to confirm で復唱します。社外の人に自社の人のことを言うとき、英語では「田中は」のように呼び捨てにせず、he や Mr. Tanaka と言います。',
  },
  {
    id: 'b-schedule',
    group: 'business',
    sub: 'contact',
    title: '日程調整',
    titleEn: 'Scheduling a Meeting',
    lv: 3,
    emoji: '📅',
    goal: '候補日の提案・都合の確認・確定ができる',
    roles: [
      { id: 'A', name: 'Carlos' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Are you available next Tuesday?',
        ja: '来週の火曜は空いていますか。',
      },
      {
        en: "I'm afraid I'm busy then.",
        ja: 'あいにくその日は予定があります。',
        note: "then は「その日・その時間」。断りは I'm afraid でやわらげる",
      },
      {
        en: 'Does Wednesday at 2 p.m. work for you?',
        ja: '水曜の午後2時はご都合いかがですか。',
        note: '〜 work for you? は日時の都合を聞く定番',
      },
      {
        en: 'Do you mean this Wednesday or Wednesday next week?',
        ja: '今週の水曜ですか、来週の水曜ですか。',
      },
      {
        en: 'How about Thursday morning instead?',
        ja: '代わりに木曜の午前はいかがですか。',
      },
      {
        en: "Why don't we do it from ten to eleven?",
        ja: '10時から11時にしませんか。',
        note: 'ten to eleven だけだと「11時10分前」とも取れるので from を付ける',
      },
      {
        en: 'Should we meet in person or online?',
        ja: '対面とオンライン、どちらにしましょうか。',
      },
      {
        en: "I'll send you both a calendar invite.",
        ja: 'お二人にカレンダーの招待を送ります。',
        note: '話し言葉では invitation より invite が多い',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Hi Yuto. We need to go over the sales figures with Aisha. Are you available next Tuesday?',
        ja: 'ユウトさん、アイシャさんと売上の数字を確認する必要があるんです。来週の火曜は空いていますか。',
      },
      {
        sp: 'B',
        en: "Let me check. Hmm, I'm afraid I'm busy then. I'm visiting clients all day.",
        ja: '確認しますね。うーん、あいにくその日は予定があります。一日中、顧客訪問なんです。',
      },
      {
        sp: 'A',
        en: 'Okay. Does Wednesday at 2 p.m. work for you?',
        ja: 'そうですか。水曜の午後2時はどうですか。',
      },
      {
        sp: 'B',
        en: 'Sorry, do you mean this Wednesday or Wednesday next week?',
        ja: 'すみません、今週の水曜ですか、来週の水曜ですか。',
      },
      {
        sp: 'A',
        en: 'Next week. The day after your client visits.',
        ja: '来週です。顧客訪問の翌日です。',
      },
      {
        sp: 'B',
        en: 'I have another meeting at two that day. How about Thursday morning instead?',
        ja: 'その日は2時に別の会議があります。代わりに木曜の午前はどうですか。',
      },
      {
        sp: 'A',
        en: "Thursday morning works for me, but I'm not sure about Aisha.",
        ja: '木曜の午前なら私は大丈夫ですが、アイシャさんはどうでしょう。',
      },
      {
        sp: 'B',
        en: "Let me pull up her calendar. It looks like she's free from ten to twelve.",
        ja: 'アイシャさんのカレンダーを開いてみますね。10時から12時まで空いているようです。',
      },
      {
        sp: 'A',
        en: "Great. How long do you think we'll need?",
        ja: 'よかった。どのくらい時間が必要だと思いますか。',
      },
      {
        sp: 'B',
        en: "An hour should be enough. Why don't we do it from ten to eleven?",
        ja: '1時間あれば足りると思います。10時から11時にしませんか。',
      },
      {
        sp: 'A',
        en: "Sounds good. Should we meet in person or online? I'm working from home that day.",
        ja: 'いいですね。対面とオンライン、どちらにしましょうか。その日は在宅勤務なんです。',
      },
      {
        sp: 'B',
        en: "Then let's do it online. I'll send you both a calendar invite with a meeting link.",
        ja: 'では、オンラインにしましょう。お二人に会議のリンク付きでカレンダーの招待を送ります。',
      },
      {
        sp: 'A',
        en: 'Perfect. Could you attach the latest sales report, too?',
        ja: 'ばっちりです。最新の売上報告書も添付してもらえますか。',
      },
      {
        sp: 'B',
        en: "Sure. I'll add it to the invite by the end of the day.",
        ja: 'はい。今日中に招待に添付しておきます。',
      },
      {
        sp: 'A',
        en: 'Thanks, Yuto. Glad we found a time.',
        ja: 'ありがとう、ユウトさん。時間が決まってよかったです。',
      },
    ],
    tip: 'next Tuesday は「来週の火曜」とも「次に来る火曜（今週）」とも取れ、ネイティブ同士でも食い違います。this Wednesday / Wednesday next week のように言い分けるか、日付（the 14th など）を添えると確実です。',
  },
  {
    id: 'b-reschedule',
    group: 'business',
    sub: 'contact',
    title: '予定の変更をお願いする',
    titleEn: 'Rescheduling a Meeting',
    lv: 3,
    emoji: '🔄',
    goal: 'おわびと理由を伝え、時差を確かめて新しい日時を提案できる',
    roles: [
      { id: 'A', name: 'Ms. Patel' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "I'm really sorry, but I need to reschedule our meeting.",
        ja: '大変申し訳ないのですが、打ち合わせの日程を変更しなければならなくなりました。',
        note: 'reschedule は日時を変えること。中止なら cancel',
      },
      {
        en: 'Something urgent has come up.',
        ja: '急用ができてしまいました。',
        note: '詳しい事情を言わなくても通じる定番',
      },
      {
        en: 'When would work better for you?',
        ja: 'いつならご都合がよろしいですか。',
      },
      {
        en: 'Would Friday at 10 a.m. or Monday at 4 p.m., Tokyo time, work for you?',
        ja: '東京時間で、金曜の午前10時か月曜の午後4時はいかがでしょうか。',
        note: '候補を2つ出すと相手が選びやすい',
      },
      {
        en: 'How about Monday at 3 p.m. your time?',
        ja: 'そちらの時間で、月曜の午後3時はいかがですか。',
        note: '相手の時間に直して言うと親切',
      },
      {
        en: "Just to confirm, that's Monday at 4 p.m. Tokyo time.",
        ja: '確認ですが、東京時間で月曜の午後4時ですね。',
      },
      {
        en: "I'll send you an updated invitation right away.",
        ja: 'すぐに変更後の招待をお送りします。',
      },
      {
        en: 'Sorry again for the short notice.',
        ja: '急なご連絡になり、改めて申し訳ありません。',
        note: 'short notice は「直前の連絡」',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Hello, Anjali Patel speaking.',
        ja: 'はい、アンジャリ・パテルです。',
      },
      {
        sp: 'B',
        en: "Hi, Ms. Patel. It's Yuto Nakamura from Kizuna Electronics. Do you have a minute?",
        ja: 'パテル様、キズナ電子の中村ユウトです。少しお時間よろしいでしょうか。',
      },
      {
        sp: 'A',
        en: 'Sure, Yuto. What can I do for you?',
        ja: 'ええ、ユウトさん。どうされましたか。',
      },
      {
        sp: 'B',
        en: "I'm really sorry, but I need to reschedule our meeting on Thursday.",
        ja: '大変申し訳ないのですが、木曜の打ち合わせの日程を変更しなければならなくなりました。',
      },
      {
        sp: 'A',
        en: "Oh, that's okay. Is everything all right?",
        ja: 'ああ、大丈夫ですよ。何かありましたか。',
      },
      {
        sp: 'B',
        en: 'Something urgent has come up with one of our shipments, and I need to be at the warehouse that day.',
        ja: '当社の出荷の一件で急な問題が起きて、その日は倉庫にいなければならないんです。',
      },
      {
        sp: 'A',
        en: 'I see. When would work better for you?',
        ja: 'なるほど。では、いつならご都合がいいですか。',
      },
      {
        sp: 'B',
        en: 'Would Friday at 10 a.m. or Monday at 4 p.m., Tokyo time, work for you?',
        ja: '東京時間で、金曜の午前10時か月曜の午後4時はいかがでしょうか。',
      },
      {
        sp: 'A',
        en: "So with the one-hour difference, that's 9 a.m. or 3 p.m. here. I have a weekly call on Friday mornings.",
        ja: '1時間の時差があるので、こちらでは午前9時か午後3時ですね。金曜の午前は毎週、定例の電話会議があるんです。',
      },
      {
        sp: 'B',
        en: 'Then how about Monday at 3 p.m. your time?',
        ja: 'では、そちらの時間で月曜の午後3時はいかがですか。',
      },
      {
        sp: 'A',
        en: 'That works for me. Should we still plan for an hour?',
        ja: 'それなら大丈夫です。時間は予定どおり1時間でいいですか。',
      },
      {
        sp: 'B',
        en: "Yes, an hour should be fine. Just to confirm, that's Monday at 4 p.m. Tokyo time, 3 p.m. Singapore time.",
        ja: 'はい、1時間で大丈夫だと思います。確認ですが、東京時間で月曜の午後4時、シンガポール時間で午後3時ですね。',
      },
      {
        sp: 'A',
        en: "Yes, that's right. Will we use the same meeting link?",
        ja: 'ええ、そうです。会議のリンクは同じものを使いますか。',
      },
      {
        sp: 'B',
        en: "Yes, the link won't change. I'll send you an updated invitation right away.",
        ja: 'はい、リンクは変わりません。すぐに変更後の招待をお送りします。',
      },
      {
        sp: 'A',
        en: 'Thanks. I hope everything goes smoothly with the shipment.',
        ja: 'ありがとうございます。出荷の件、うまくいくといいですね。',
      },
      {
        sp: 'B',
        en: 'Thank you. Sorry again for the short notice.',
        ja: 'ありがとうございます。急なご連絡になり、改めて申し訳ありません。',
      },
    ],
    tip: '予定変更の電話は「おわび → 理由（Something urgent has come up. で十分）→ 候補を2つ → 時差の確認 → 招待の送り直し」の順に。時差のある相手には、時刻に必ず Tokyo time や your time を添えましょう。',
  },
  {
    id: 'b-call-appointment',
    group: 'business',
    sub: 'contact',
    title: '電話でアポを取る',
    titleEn: 'Setting Up a Meeting by Phone',
    lv: 3,
    emoji: '☎️',
    goal: '初めての会社に電話して用件を短く伝え、面談の約束を取りつけることができる',
    roles: [
      { id: 'A', name: 'Nadia' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'May I ask what this is regarding?',
        ja: 'どのようなご用件でしょうか。',
        note: '受付や秘書が用件を尋ねる丁寧な言い方',
      },
      {
        en: "I'd like to set up a 30-minute meeting with Mr. Okafor.",
        ja: 'オカフォー様との30分の面談をお願いしたいのですが。',
        note: '時間を短く具体的に示すと受けてもらいやすい',
      },
      {
        en: 'We spoke briefly at the logistics expo in Chicago.',
        ja: 'シカゴの物流展示会で少しお話ししました。',
        note: '面識やきっかけを一言添えると取り次いでもらいやすい',
      },
      {
        en: 'Would Tuesday the 14th or Thursday the 16th work?',
        ja: '14日の火曜か16日の木曜はいかがですか。',
        note: '日付は the 14th のように序数で言う',
      },
      {
        en: 'Would he prefer to meet online or in person?',
        ja: 'オンラインと対面、どちらがご希望でしょうか。',
      },
      {
        en: "I'll put you down for Thursday the 16th at 2 p.m.",
        ja: '16日木曜の午後2時で予定に入れておきます。',
        note: 'put 人 down for 〜 は「人を〜の予定に入れる」',
      },
      {
        en: 'Could I email you to confirm?',
        ja: '確認のため、メールをお送りしてもよろしいですか。',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Good morning, Crestline Logistics. Nadia speaking.',
        ja: 'おはようございます。クレストライン・ロジスティクスのナディアです。',
      },
      {
        sp: 'B',
        en: "Good morning. My name is Daisuke Sato, and I'm calling from Hoshi Systems. Could I speak to Mr. Okafor, your operations manager?",
        ja: 'おはようございます。ホシ・システムズの佐藤大輔と申します。業務部長のオカフォー様をお願いできますか。',
      },
      {
        sp: 'A',
        en: "He's not available right now. May I ask what this is regarding?",
        ja: 'オカフォーはただいま電話に出られません。どのようなご用件でしょうか。',
      },
      {
        sp: 'B',
        en: "We make inventory software for warehouses, and I'd like to set up a 30-minute meeting with Mr. Okafor.",
        ja: '倉庫向けの在庫管理ソフトを作っておりまして、オカフォー様との30分の面談をお願いしたいのですが。',
      },
      {
        sp: 'A',
        en: 'I see. Is he expecting your call?',
        ja: 'そうですか。オカフォーは、このお電話のことを存じておりますか。',
      },
      {
        sp: 'B',
        en: 'Not exactly, but we spoke briefly at the logistics expo in Chicago last month.',
        ja: 'いえ、そういうわけではないのですが、先月シカゴの物流展示会で少しお話ししました。',
      },
      {
        sp: 'A',
        en: "Okay. I manage his calendar. He's traveling next week, though.",
        ja: '分かりました。オカフォーの予定は私が管理しています。ただ、来週は出張なんです。',
      },
      {
        sp: 'B',
        en: 'How about the week after? Would Tuesday the 14th or Thursday the 16th work?',
        ja: 'では、その翌週はどうでしょうか。14日の火曜か16日の木曜はいかがですか。',
      },
      {
        sp: 'A',
        en: "He's free on Thursday the 16th at 2 p.m. Would that work for you?",
        ja: '16日の木曜なら、午後2時が空いています。いかがですか。',
      },
      {
        sp: 'B',
        en: 'Yes, that works. Would he prefer to meet online or in person?',
        ja: 'はい、大丈夫です。オカフォー様は、オンラインと対面のどちらがご希望でしょうか。',
      },
      {
        sp: 'A',
        en: 'In person, if possible. Our office is in Oak Brook, just outside Chicago.',
        ja: 'できれば対面でお願いします。弊社のオフィスはシカゴ郊外のオークブルックにあります。',
      },
      {
        sp: 'B',
        en: "That's fine. I'll come to your office and give a short demo.",
        ja: '大丈夫です。御社に伺って、短いデモをお見せします。',
      },
      {
        sp: 'A',
        en: "Great. I'll put you down for Thursday the 16th at 2 p.m.",
        ja: '承知しました。16日木曜の午後2時で予定に入れておきます。',
      },
      {
        sp: 'B',
        en: 'Thank you. Could I email you to confirm?',
        ja: 'ありがとうございます。確認のため、メールをお送りしてもよろしいですか。',
      },
      {
        sp: 'A',
        en: "Please do. It's nadia at crestline logistics, all one word, dot com. I'll forward it to Mr. Okafor.",
        ja: 'ええ、お願いします。nadia@crestlinelogistics.com です（crestlinelogistics は続けて1語）。オカフォーに転送しておきます。',
      },
      {
        sp: 'B',
        en: "Perfect. I'll send it this afternoon. Thanks for your help, Nadia.",
        ja: '承知しました。今日の午後にお送りします。ご対応ありがとうございました、ナディアさん。',
      },
    ],
    tip: 'アポ取りの電話は「名乗る → 用件を1文で（何の会社か＋何をお願いしたいか）→ 30分など短い時間で依頼 → 日時と場所 → メールで確認」の順に。受付の人にも丁寧に話し、名前を呼んでお礼を言うと話が通りやすくなります。',
  },
  {
    id: 'b-voicemail',
    group: 'business',
    sub: 'contact',
    title: '留守電を残す・折り返す',
    titleEn: 'Leaving a Voicemail',
    lv: 3,
    emoji: '📲',
    goal: '留守電に名前・用件・番号を分かりやすく残し、折り返しの電話に対応できる',
    roles: [
      { id: 'A', name: 'Tom Becker' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'This is Aoi Kimura from Nishikaze Trading.',
        ja: '西風トレーディングの木村葵です。',
        note: '留守電は最初に名前と会社名を言う',
      },
      {
        en: "I'm calling about the samples for next month's trade show.",
        ja: '来月の展示会用のサンプルの件でお電話しました。',
        note: "I'm calling about 〜 で用件を一言で伝える",
      },
      {
        en: 'The best time to reach me is between two and five this afternoon, Tokyo time.',
        ja: '東京時間で、今日の午後2時から5時の間がいちばんつながりやすいです。',
        note: '時差のある相手には Tokyo time を添える',
      },
      {
        en: 'Please call me back when you get a chance.',
        ja: 'お手すきのときに折り返しお電話ください。',
      },
      { en: "I'm returning your call.", ja: '折り返しお電話しました。' },
      {
        en: 'Sorry I missed you earlier.',
        ja: '先ほどは出られなくてすみません。',
      },
      {
        en: 'Thanks for getting back to me.',
        ja: '折り返しありがとうございます。',
        note: 'メールの返信へのお礼にも使える',
      },
      {
        en: 'Did you say fifteen or fifty?',
        ja: '15ですか、50ですか。',
        note: '-teen と -ty は聞き違えやすい。答えるときは five zero と数字で言い直す',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: "Hi, you've reached Tom Becker at Brightwater Foods. I can't take your call right now, so please leave a message after the tone.",
        ja: 'ブライトウォーター・フーズのトム・ベッカーです。ただいま電話に出られませんので、発信音のあとにメッセージをどうぞ。',
      },
      {
        sp: 'B',
        en: "Hi Tom, this is Aoi Kimura from Nishikaze Trading. I'm calling about the samples for next month's trade show.",
        ja: 'トムさん、西風トレーディングの木村葵です。来月の展示会用のサンプルの件でお電話しました。',
      },
      {
        sp: 'B',
        en: 'Please call me back when you get a chance. My number is plus eight one, three, five five four two, eight one nine six.',
        ja: 'お手すきのときに折り返しお電話ください。番号は+81 3-5542-8196です。',
      },
      {
        sp: 'B',
        en: 'The best time to reach me is between two and five this afternoon, Tokyo time.',
        ja: '東京時間で、今日の午後2時から5時の間がいちばんつながりやすいです。',
      },
      {
        sp: 'B',
        en: 'Again, my number is plus eight one, three, five five four two, eight one nine six. Thanks, Tom.',
        ja: 'もう一度言います。番号は+81 3-5542-8196です。よろしくお願いします、トムさん。',
      },
      {
        sp: 'A',
        en: "Hi Aoi, Tom Becker here. I'm returning your call. Sorry I missed you earlier.",
        ja: 'もしもし、葵さん。トム・ベッカーです。折り返しお電話しました。先ほどは出られなくてすみません。',
      },
      {
        sp: 'B',
        en: 'Thanks for getting back to me, Tom. I just have a quick question.',
        ja: 'トムさん、折り返しありがとうございます。ちょっとお聞きしたいことがあるんです。',
      },
      {
        sp: 'A',
        en: 'Sure. Is it about the samples?',
        ja: 'ええ。サンプルの件ですか。',
      },
      {
        sp: 'B',
        en: "Yes. We're planning to send fifty units for the show. Will that be enough?",
        ja: 'はい。展示会用に50個お送りする予定です。それで足りますか。',
      },
      {
        sp: 'A',
        en: 'Sorry, did you say fifteen or fifty?',
        ja: 'すみません、15ですか、50ですか。',
      },
      { sp: 'B', en: "Fifty. That's five zero.", ja: '50です。5、0の50です。' },
      {
        sp: 'A',
        en: 'Great, fifty should be plenty. When will they arrive?',
        ja: 'よかった、50あれば十分です。いつ届きますか。',
      },
      {
        sp: 'B',
        en: "We'll ship them on Monday, so they should arrive by Wednesday.",
        ja: '月曜に発送しますので、水曜までには届くはずです。',
      },
      {
        sp: 'A',
        en: 'Perfect. Could you send me the tracking number when they ship?',
        ja: 'いいですね。発送したら、追跡番号を送ってもらえますか。',
      },
      {
        sp: 'B',
        en: "Of course. I'll email it to you as soon as they go out.",
        ja: 'もちろんです。発送したらすぐにメールでお送りします。',
      },
      {
        sp: 'A',
        en: 'Thanks, Aoi. Talk to you soon.',
        ja: 'ありがとう、葵さん。ではまた。',
      },
    ],
    tip: '留守電は「名前と会社 → 用件を一言 → 折り返し先の番号 → つながりやすい時間 → 最後に番号をもう一度」の順に、30秒ほどにまとめます。番号はゆっくり2回言うと、相手がメモを確かめられます。海外の相手には +81 と Tokyo time を添えましょう。',
  },
  {
    id: 'b-email',
    group: 'business',
    sub: 'contact',
    title: 'メールの定型表現',
    titleEn: 'Email Essentials',
    lv: 3,
    emoji: '✉️',
    goal: 'メールの書き出し・添付・期限つきの依頼・催促・結びを定型表現で書くことができる',
    roles: [
      { id: 'A', name: 'Priya' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'I hope this email finds you well.',
        ja: 'お元気でお過ごしのことと存じます。',
        note: "改まった書き出し。親しい相手には I hope you're doing well.",
      },
      {
        en: "I've attached the quotation.",
        ja: '見積書を添付しました。',
        note: 'I send you 〜 in the attachment. は不自然。米国では quote とも言う',
      },
      {
        en: 'Please find attached the quotation.',
        ja: '見積書を添付いたします。',
        note: 'やや改まった、古風な言い方',
      },
      {
        en: 'Could you please confirm the schedule by Friday, October 23?',
        ja: '10月23日（金）までに日程をご確認いただけますか。',
      },
      {
        en: 'Just a quick reminder about the project schedule.',
        ja: 'プロジェクトの日程の件で、念のためのご連絡です。',
        note: "I'm just following up on 〜 も同じように使える",
      },
      {
        en: 'Please let me know if you have any questions.',
        ja: 'ご不明な点があればお知らせください。',
      },
      {
        en: 'Best regards.',
        ja: 'よろしくお願いいたします（メールの結び）。',
        note: '米国でよく使う。英国では Kind regards も多い',
      },
      {
        en: 'Thanks for catching that.',
        ja: '気づいてくれてありがとうございます。',
        note: 'ミスを指摘してもらったときのお礼',
      },
    ],
    lines: [
      {
        sp: 'B',
        en: 'Priya, could you take a quick look at my email to Ms. Clarke before I send it?',
        ja: 'プリヤさん、クラーク様へのメールを送る前に、ちょっと見てもらえますか。',
      },
      {
        sp: 'A',
        en: 'Of course. Let me see. How does it start?',
        ja: 'もちろん。見せてください。書き出しは？',
      },
      {
        sp: 'B',
        en: "'Dear Ms. Clarke, I hope this email finds you well.' Is that too formal?",
        ja: '「クラーク様　お元気でお過ごしのことと存じます」。これは堅すぎますか。',
      },
      {
        sp: 'A',
        en: "Not for a client. For colleagues, 'I hope you're doing well' sounds friendlier.",
        ja: "お客様あてなら大丈夫です。同僚あてなら「I hope you're doing well」のほうが親しみやすいですね。",
      },
      {
        sp: 'B',
        en: "Next, I wrote, 'I send you the quotation in the attachment.' Does that sound natural?",
        ja: '次に「I send you the quotation in the attachment.」と書きました。自然に聞こえますか。',
      },
      {
        sp: 'A',
        en: "Not quite. Just say, 'I've attached the quotation.' 'Please find attached the quotation' also works, but it's more formal.",
        ja: "少し不自然ですね。「I've attached the quotation.」で十分です。「Please find attached the quotation」も使えますが、より改まった言い方です。",
      },
      {
        sp: 'B',
        en: 'I see. Then I ask her to confirm the project schedule. How can I add a deadline politely?',
        ja: 'なるほど。次に、プロジェクトの日程の確認をお願いしています。期限を丁寧に入れるにはどうすればいいですか。',
      },
      {
        sp: 'A',
        en: "Try 'Could you please confirm the schedule by Friday, October 23?' Giving both the day and the date avoids confusion.",
        ja: '「10月23日（金）までに日程をご確認いただけますか」はどうでしょう。曜日と日付の両方を書くと誤解がありません。',
      },
      {
        sp: 'B',
        en: "Thanks. And if she doesn't reply by then, how do I remind her without sounding pushy?",
        ja: 'ありがとうございます。それで、もしそれまでに返事がなかったら、しつこく聞こえないように催促するにはどうすればいいですか。',
      },
      {
        sp: 'A',
        en: "Send a short follow-up, like 'Just a quick reminder about the project schedule.'",
        ja: '「プロジェクトの日程の件で、念のためのご連絡です」のような短いメールを送るといいですよ。',
      },
      {
        sp: 'B',
        en: "Got it. For the closing, I have 'Please let me know if you have any questions. Best regards.'",
        ja: '分かりました。結びは「ご不明な点があればお知らせください。よろしくお願いいたします」にしています。',
      },
      {
        sp: 'A',
        en: "That's perfect. Oh, wait. The quotation isn't attached.",
        ja: 'それで完璧です。あ、待って。見積書が添付されていませんよ。',
      },
      {
        sp: 'B',
        en: "Oops! Thanks for catching that. I'll attach it now.",
        ja: 'しまった！気づいてくれてありがとうございます。今、添付します。',
      },
      {
        sp: 'A',
        en: 'It happens to everyone. Some people attach the file first, before writing anything.',
        ja: '誰にでもあることですよ。何か書く前に、先にファイルを添付する人もいます。',
      },
      {
        sp: 'B',
        en: "That's a good idea. I'll start doing that.",
        ja: 'それはいい考えですね。私もそうすることにします。',
      },
    ],
    tip: '日付は米国式で October 23、英国式で 23 October と書きます。10/11 のような数字だけの書き方は国によって10月11日とも11月10日とも読めるので、国際メールでは月を英語で書くと誤解がありません。',
  },
]

export default scenes
