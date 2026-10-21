import type { Scene } from '@/lib/types'

/** 社内・チーム（ビジネス）。同僚に頼む・休みの相談・初出社・新しい同僚・仕事を任せる・フィードバックする／もらう */
const scenes: Scene[] = [
  {
    id: 'b-ask-help',
    group: 'business',
    sub: 'office',
    title: '同僚に手伝いを頼む',
    titleEn: 'Asking a Colleague for Help',
    lv: 2,
    emoji: '🙋',
    goal: '同僚に事情と期限を伝えて手伝いを頼み、都合を調整できる',
    roles: [
      { id: 'A', name: 'Ben' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Sorry to bother you, but do you have a minute?',
        ja: 'お邪魔してすみません。少しお時間ありますか。',
        note: '相手の手を止めて話しかけるときの定番の前置き',
      },
      {
        en: 'Could you help me with this formula?',
        ja: 'この数式を手伝ってもらえますか。',
        note: 'help＋人＋with＋物。help this formula とは言わない',
      },
      { en: 'It keeps showing an error.', ja: '何度やってもエラーが出ます。', note: 'keep＋-ing で「〜し続ける」' },
      { en: 'The report is due at five today.', ja: 'レポートは今日の5時が締め切りです。', note: 'due は「期限が来る」' },
      {
        en: 'Can it wait until after lunch?',
        ja: 'お昼のあとでも大丈夫ですか。',
        note: '急ぎかどうかを確かめる言い方。頼まれる側になったときに',
      },
      { en: 'What time is good for you?', ja: '何時がご都合いいですか。' },
      { en: 'I owe you one.', ja: '借りができました。', note: '同僚どうしのくだけたお礼。「この借りは返すね」の気持ち' },
      {
        en: 'Let me know if you ever need a hand.',
        ja: '手伝いが必要なときは、いつでも言ってください。',
        note: 'need a hand は「手を貸してほしい」',
      },
    ],
    lines: [
      {
        sp: 'B',
        en: 'Hi Ben. Sorry to bother you, but do you have a minute?',
        ja: 'ベンさん、お邪魔してすみません。少しお時間ありますか。',
      },
      { sp: 'A', en: "Sure. What's up?", ja: 'いいですよ。どうしました？' },
      {
        sp: 'B',
        en: 'Could you help me with this formula? It keeps showing an error.',
        ja: 'この数式を手伝ってもらえますか。何度やってもエラーが出るんです。',
      },
      { sp: 'A', en: 'Which one? The total in column D?', ja: 'どれですか。D列の合計ですか。' },
      {
        sp: 'B',
        en: 'Yes. It should add up the monthly sales, but nothing I try works.',
        ja: 'はい。月ごとの売上を合計するはずなんですが、何を試してもうまくいかないんです。',
      },
      {
        sp: 'A',
        en: "OK, it's probably something small. When do you need it?",
        ja: 'なるほど、たぶんちょっとしたことですね。いつまでに必要ですか。',
      },
      {
        sp: 'B',
        en: "The report is due at five today, so it's a bit urgent.",
        ja: 'レポートの締め切りが今日の5時なので、少し急いでいるんです。',
      },
      {
        sp: 'A',
        en: 'Right. The thing is, I have a call in two minutes. Can it wait until after lunch?',
        ja: 'そうですか。実は2分後に電話会議があるんです。お昼のあとでも大丈夫ですか。',
      },
      { sp: 'B', en: "Sure, that's fine. What time is good for you?", ja: 'はい、大丈夫です。何時がご都合いいですか。' },
      { sp: 'A', en: "How about one thirty? I'll come to your desk.", ja: '1時半はどうですか。そちらの席に行きます。' },
      {
        sp: 'B',
        en: 'Great. That still gives me enough time before five.',
        ja: 'よかった。それでも5時までに十分時間があります。',
      },
      {
        sp: 'A',
        en: "In the meantime, check that the numbers aren't saved as text.",
        ja: 'それまでに、数字が文字列として保存されていないか確認してみてください。',
      },
      {
        sp: 'B',
        en: "Good idea, I'll check that now. Thanks so much, Ben.",
        ja: 'いい考えですね、今すぐ確認します。本当にありがとうございます、ベンさん。',
      },
      { sp: 'A', en: 'No problem. Happy to help.', ja: '気にしないでください。喜んで手伝いますよ。' },
      {
        sp: 'B',
        en: 'I owe you one. Let me know if you ever need a hand.',
        ja: '借りができましたね。手伝いが必要なときは、いつでも言ってください。',
      },
      {
        sp: 'A',
        en: 'Thanks! I might ask you to look at my slides next week.',
        ja: 'ありがとう！来週、私のスライドを見てもらうかもしれません。',
      },
    ],
    tip: '頼みごとは Sorry to bother you, but ~ で切り出し、困っていること（It keeps ~）と期限（It\'s due ~）を短く伝えると、相手も引き受けられるか判断しやすくなります。',
  },
  {
    id: 'b-day-off',
    group: 'business',
    sub: 'office',
    title: '休みを相談する',
    titleEn: 'Asking for Time Off',
    lv: 2,
    emoji: '📅',
    goal: '上司に休みを相談し、代わりの担当や引き継ぎを説明できる',
    roles: [
      { id: 'A', name: 'Karen' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "I'd like to take next Friday off.",
        ja: '次の金曜日に休みを取りたいのですが。',
        note: 'take＋日＋off で「〜を休む」。I want to より I\'d like to が丁寧',
      },
      {
        en: 'Do you mean this Friday or Friday next week?',
        ja: '今週の金曜日ですか、それとも来週の金曜日ですか。',
        note: 'あいまいな日付を確かめる',
      },
      { en: 'Is that a problem?', ja: 'それは問題になりますか。' },
      {
        en: "Who can cover your work while you're away?",
        ja: '休みの間、あなたの仕事は誰に代わってもらえますか。',
      },
      {
        en: "I've already asked Tom to cover for me.",
        ja: 'もうトムさんに代わりをお願いしてあります。',
        note: 'cover for＋人 で「〜の代わりに仕事をする」',
      },
      {
        en: "I'll set up an out-of-office message.",
        ja: '不在の自動返信を設定しておきます。',
        note: '休暇中の自動返信メールのこと',
      },
      { en: 'Will do.', ja: 'そうします。', note: '頼まれたことに「了解です」と返す短い言い方' },
    ],
    lines: [
      { sp: 'B', en: 'Hi Karen, can I ask you something quickly?', ja: 'カレンさん、ちょっとお聞きしてもいいですか。' },
      { sp: 'A', en: 'Of course. What is it?', ja: 'もちろん。どうしたの？' },
      {
        sp: 'B',
        en: "I'd like to take next Friday off, if that's OK. My sister is getting married.",
        ja: 'もし大丈夫なら、次の金曜日に休みを取りたいのですが。妹が結婚するんです。',
      },
      {
        sp: 'A',
        en: 'Oh, congratulations! Just to check, do you mean this Friday or Friday next week?',
        ja: 'わあ、おめでとう！念のため聞くけど、今週の金曜日？それとも来週の金曜日？',
      },
      { sp: 'B', en: 'Sorry, I mean next week. Friday the 14th.', ja: 'すみません、来週のほうです。14日の金曜日です。' },
      {
        sp: 'A',
        en: 'OK, let me check the team calendar. Hmm, Priya is off that day too.',
        ja: 'わかった、チームのカレンダーを見てみるね。うーん、その日はプリヤも休みだね。',
      },
      { sp: 'B', en: "Oh, I didn't know that. Is that a problem?", ja: 'あ、知りませんでした。それは問題になりますか。' },
      {
        sp: 'A',
        en: "It might be. Who can cover your work while you're away?",
        ja: 'なるかもしれないね。休みの間、仕事は誰に代わってもらえる？',
      },
      {
        sp: 'B',
        en: "I've already asked Tom to cover for me. He'll answer my customer emails.",
        ja: 'もうトムさんに代わりをお願いしてあります。私に来るお客様のメールには、彼が返信してくれます。',
      },
      {
        sp: 'A',
        en: 'Great, thanks for planning ahead. What about the weekly report?',
        ja: 'いいね、前もって手を打ってくれてありがとう。週報はどうする？',
      },
      {
        sp: 'B',
        en: "I'll finish it on Thursday and send it to you before I leave.",
        ja: '木曜日に仕上げて、帰る前にお送りします。',
      },
      {
        sp: 'A',
        en: 'Perfect. Could you also write up some quick notes for Tom?',
        ja: '完璧。トムに簡単な引き継ぎメモも書いてもらえる？',
      },
      {
        sp: 'B',
        en: "Sure. And I'll set up an out-of-office message, too.",
        ja: 'はい。それと、不在の自動返信も設定しておきます。',
      },
      {
        sp: 'A',
        en: "Then it's fine with me. Just add it to the team calendar.",
        ja: 'それなら大丈夫。チームのカレンダーに入れておいてね。',
      },
      { sp: 'B', en: 'Will do. Thank you so much, Karen.', ja: 'そうします。本当にありがとうございます、カレンさん。' },
      { sp: 'A', en: 'My pleasure. Enjoy the wedding!', ja: 'どういたしまして。結婚式、楽しんでね！' },
    ],
    tip: 'next Friday は「今週の金曜」の意味で使う人も「来週の金曜」の意味で使う人もいます。休みや締め切りの話では Friday the 14th のように日付を添えると確実です。',
  },
  {
    id: 'b-first-day',
    group: 'business',
    sub: 'office',
    title: '初出社のあいさつ',
    titleEn: 'Your First Day at Work',
    lv: 2,
    emoji: '🌱',
    goal: '初出社の日に自己紹介し、昼食や会議など職場のことを質問できる',
    roles: [
      { id: 'A', name: 'Marco' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "I'm really happy to be here.", ja: 'ここに来られて本当にうれしいです。', note: '初日のあいさつの定番' },
      {
        en: "I'm the new marketing assistant.",
        ja: '新しく入ったマーケティングアシスタントです。',
        note: 'the new＋職種 で「新しく来た〜」',
      },
      {
        en: 'I worked in sales for three years.',
        ja: '3年間営業の仕事をしていました。',
        note: 'work in＋分野。sales は「営業」',
      },
      {
        en: 'Sorry, did you say ten?',
        ja: 'すみません、10時とおっしゃいましたか。',
        note: '聞き取れた部分をくり返して確かめる',
      },
      { en: 'Who should I ask if I have questions?', ja: '質問があるときは誰に聞けばいいですか。' },
      {
        en: 'What do people usually do for lunch?',
        ja: 'みなさん、お昼は普段どうしていますか。',
        note: 'people は「ここの人たち」。職場の習慣を聞く',
      },
      { en: 'Is it in person or online?', ja: '対面ですか、オンラインですか。', note: 'in person は「対面で・直接」' },
    ],
    lines: [
      {
        sp: 'A',
        en: "You must be Aoi. Welcome! I'm Marco, the team lead.",
        ja: 'アオイさんですね。ようこそ！チームリーダーのマルコです。',
      },
      {
        sp: 'B',
        en: "Yes, hi! Nice to meet you, Marco. I'm really happy to be here.",
        ja: 'はい、こんにちは！はじめまして、マルコさん。ここに来られて本当にうれしいです。',
      },
      {
        sp: 'A',
        en: "We're happy to have you. Tell me a little about yourself.",
        ja: '来てくれてうれしいです。少し自己紹介してください。',
      },
      {
        sp: 'B',
        en: "Sure. I'm the new marketing assistant. Before this, I worked in sales for three years.",
        ja: 'はい。新しく入ったマーケティングアシスタントです。ここに来る前は、3年間営業の仕事をしていました。',
      },
      {
        sp: 'A',
        en: 'Great. Your laptop is on your desk, and IT will help you set it up at ten.',
        ja: 'いいですね。ノートパソコンは席に置いてあって、10時にIT担当が設定を手伝ってくれます。',
      },
      {
        sp: 'B',
        en: 'Sorry, did you say ten? I have an HR orientation then.',
        ja: 'すみません、10時とおっしゃいましたか。その時間は人事のオリエンテーションがあるんです。',
      },
      {
        sp: 'A',
        en: "Oh, right, I forgot. I'll ask IT to come at eleven instead.",
        ja: 'あ、そうでした、忘れていました。IT担当には、代わりに11時に来てもらうよう頼みますね。',
      },
      {
        sp: 'B',
        en: 'Thank you. And who should I ask if I have questions?',
        ja: 'ありがとうございます。それと、質問があるときは誰に聞けばいいですか。',
      },
      {
        sp: 'A',
        en: 'Ask me or Nina. She sits next to you, and she knows everything.',
        ja: '私かニーナに聞いてください。隣の席で、何でも知っていますよ。',
      },
      {
        sp: 'B',
        en: 'Great. What do people usually do for lunch?',
        ja: 'よかったです。みなさん、お昼は普段どうしていますか。',
      },
      {
        sp: 'A',
        en: 'Most of us eat in the break room. But today, the team is taking you out for lunch!',
        ja: 'たいていは休憩室で食べます。でも今日は、チームのみんなでランチに連れて行きますよ！',
      },
      {
        sp: 'B',
        en: "That's so kind of you! I'm really looking forward to it.",
        ja: 'わあ、ありがとうございます！すごく楽しみです。',
      },
      {
        sp: 'A',
        en: 'Oh, and we have a team meeting every Tuesday at nine thirty.',
        ja: 'あ、それと、毎週火曜の9時半にチームミーティングがあります。',
      },
      { sp: 'B', en: 'Is it in person or online?', ja: '対面ですか、オンラインですか。' },
      {
        sp: 'A',
        en: 'Both. Most people come to the meeting room, but some join by video.',
        ja: '両方です。ほとんどの人は会議室に来ますが、ビデオで参加する人もいます。',
      },
      {
        sp: 'B',
        en: "Got it, thanks for everything, Marco. I think I'm going to like it here.",
        ja: 'わかりました。いろいろありがとうございます、マルコさん。ここが気に入りそうです。',
      },
    ],
    tip: '初日の自己紹介は、役割（I\'m the new ~）と経歴（Before this, I worked in ~）の2文で十分です。そのあと「誰に聞けばいいか」を最初に確かめておくと、2日目から動きやすくなります。',
  },
  {
    id: 'b-welcome-colleague',
    group: 'business',
    sub: 'office',
    title: '新しい同僚を迎える',
    titleEn: 'Welcoming a New Colleague',
    lv: 3,
    emoji: '🤝',
    goal: '新しい同僚を迎えて社内を案内し、働き方を気さくに説明できる',
    roles: [
      { id: 'A', name: 'Wei' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'Welcome to the team!', ja: 'チームへようこそ！' },
      {
        en: 'What should I call you?',
        ja: '何とお呼びすればいいですか。',
        note: '名前の呼び方を確かめる。名字と名前の順が違う相手にも便利',
      },
      { en: 'Let me show you around.', ja: '社内を案内しますね。', note: 'show＋人＋around で「〜を案内して回る」' },
      { en: "That's completely normal.", ja: 'それはごく自然なことですよ。', note: '相手の不安を受け止める一言' },
      { en: 'Feel free to ask me anything.', ja: '何でも気軽に聞いてください。', note: 'Feel free to ~ は「遠慮なく〜してください」' },
      { en: 'We were all new once.', ja: 'みんな最初は新人でした。', note: '新人を安心させる一言' },
      {
        en: "Why don't we grab lunch together later?",
        ja: 'あとで一緒にお昼を食べに行きませんか。',
        note: 'grab lunch は「さっとお昼を食べる」のくだけた言い方',
      },
      { en: 'Thanks for making me feel so welcome.', ja: '温かく迎えてくれてありがとうございます。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "Hi, I'm Zhang Wei. I'm starting on the design team today.",
        ja: 'こんにちは、チャン・ウェイです。今日からデザインチームで働きます。',
      },
      {
        sp: 'B',
        en: "Welcome to the team! I'm Yuto. What should I call you, Zhang or Wei?",
        ja: 'チームへようこそ！ユウトです。チャンさんとウェイさん、どちらでお呼びすればいいですか。',
      },
      {
        sp: 'A',
        en: 'Wei, please. Zhang is my family name, and in Chinese it comes first.',
        ja: 'ウェイでお願いします。チャンは名字で、中国語では名字が先に来るんです。',
      },
      {
        sp: 'B',
        en: "It's the same in Japanese, so I totally get it. Let me show you around.",
        ja: '日本語も同じなので、すごくよくわかります。社内を案内しますね。',
      },
      {
        sp: 'A',
        en: "Thanks, I appreciate it. To be honest, I'm a little nervous.",
        ja: 'ありがとうございます、助かります。正直、少し緊張しています。',
      },
      {
        sp: 'B',
        en: "That's completely normal. Everyone here is really friendly.",
        ja: 'それはごく自然なことですよ。ここの人はみんな、とても気さくです。',
      },
      { sp: 'A', en: "That's good to hear. So, is this my desk?", ja: 'それを聞いて安心しました。ところで、ここが私の席ですか。' },
      {
        sp: 'B',
        en: 'Yes, right next to mine. The kitchen is over there, and the printer is by the window.',
        ja: 'はい、私の隣です。給湯室はあそこで、プリンターは窓のそばです。',
      },
      {
        sp: 'A',
        en: 'Great. How does the team usually work? Is everyone in the office every day?',
        ja: 'いいですね。チームは普段どんなふうに働いていますか。みなさん毎日出社しているんですか。',
      },
      {
        sp: 'B',
        en: 'Not really. Most of us come in Tuesday through Thursday and work from home on Mondays and Fridays.',
        ja: 'そうでもないです。ほとんどの人は火曜から木曜に出社して、月曜と金曜は在宅勤務です。',
      },
      {
        sp: 'A',
        en: 'OK. And if I have a quick question, should I send you an email?',
        ja: 'わかりました。ちょっとした質問があるときは、メールを送ればいいですか。',
      },
      {
        sp: 'B',
        en: 'Just message me on the team chat. Feel free to ask me anything.',
        ja: 'チームのチャットでメッセージをくれれば大丈夫です。何でも気軽に聞いてください。',
      },
      {
        sp: 'A',
        en: "Thanks, that's a relief. I was worried about asking too many questions.",
        ja: 'ありがとうございます、安心しました。質問しすぎないか心配だったんです。',
      },
      {
        sp: 'B',
        en: "Don't worry, we were all new once. Why don't we grab lunch together later?",
        ja: '心配いりませんよ、みんな最初は新人でしたから。あとで一緒にお昼を食べに行きませんか。',
      },
      {
        sp: 'A',
        en: "I'd love that. Thanks for making me feel so welcome.",
        ja: 'ぜひ。温かく迎えてくれてありがとうございます。',
      },
      {
        sp: 'B',
        en: "Of course! I'll introduce you to a few more people at lunch.",
        ja: 'いえいえ！お昼に、ほかにも何人か紹介しますね。',
      },
    ],
    tip: '中国・韓国・日本などの人は、名字を先に名乗ることがあります。どちらが名前か迷ったら What should I call you? と聞くのがいちばん確実で、失礼にもなりません。',
  },
  {
    id: 'b-delegate',
    group: 'business',
    sub: 'office',
    title: '仕事を任せる',
    titleEn: 'Delegating a Task',
    lv: 4,
    emoji: '📋',
    goal: '背景と期限を伝えて仕事を任せ、相手の負担に合わせて優先順位を調整できる',
    roles: [
      { id: 'A', name: 'Ana' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "There's something I'd like you to take on.",
        ja: '引き受けてほしい仕事があります。',
        note: 'take on は「（仕事・責任を）引き受ける」',
      },
      { en: 'What exactly would that involve?', ja: '具体的にはどんな作業になりますか。', note: '任される側が中身を確かめる質問' },
      {
        en: 'You know this data better than anyone.',
        ja: 'このデータはあなたが誰よりも詳しいです。',
        note: '任せる理由を一言添えると、相手が前向きになりやすい',
      },
      { en: "How's your workload at the moment?", ja: '今の仕事量はどうですか。', note: '頼む前に相手の状況を確かめる' },
      {
        en: "Honestly, it's a bit tight.",
        ja: '正直、ちょっと厳しいです。',
        note: 'No と言わずに難しさを伝える、やわらかい言い方',
      },
      { en: "I don't want to overload you.", ja: '負担をかけすぎたくありません。' },
      { en: 'If it helps, I can ask Raj to do the charts.', ja: 'もし助かるなら、グラフはラージさんに頼めます。' },
      {
        en: "Let's check in on Friday at ten.",
        ja: '金曜の10時に一度、進み具合を確認しましょう。',
        note: 'check in は途中で様子を確かめること。任せっぱなしにしない',
      },
    ],
    lines: [
      {
        sp: 'B',
        en: "Hi Ana, got a minute? There's something I'd like you to take on.",
        ja: 'アナさん、ちょっといいですか。引き受けてほしい仕事があるんです。',
      },
      { sp: 'A', en: "Of course. What's it about?", ja: 'もちろんです。どんな件ですか。' },
      {
        sp: 'B',
        en: "The client wants a summary of last quarter's survey results before their board meeting.",
        ja: 'お客様が、取締役会の前に前四半期のアンケート結果のまとめを欲しいとのことなんです。',
      },
      { sp: 'A', en: 'OK. What exactly would that involve?', ja: 'なるほど。具体的にはどんな作業になりますか。' },
      {
        sp: 'B',
        en: 'Basically, a five-page report on the key findings, with a few charts. You know this data better than anyone.',
        ja: '要するに、主な結果をまとめた5ページのレポートで、グラフも何点か入れます。このデータは、アナさんが誰よりもよく分かっていますから。',
      },
      {
        sp: 'A',
        en: "That's kind of you to say. What's the deadline?",
        ja: 'そう言ってもらえるとうれしいです。締め切りはいつですか。',
      },
      {
        sp: 'B',
        en: "They need it by Thursday next week, so ideally I'd like a draft by Tuesday. How's your workload at the moment?",
        ja: '来週の木曜日までに必要なので、できれば火曜日までに下書きが欲しいです。今の仕事量はどうですか。',
      },
      {
        sp: 'A',
        en: "Honestly, it's a bit tight. I'm still working on the pricing analysis for Daniel, and that's due this Friday.",
        ja: '正直、ちょっと厳しいです。ダニエルさんの価格分析がまだ終わっていなくて、それが今週の金曜日締め切りなんです。',
      },
      {
        sp: 'B',
        en: "Understood. I don't want to overload you. What if I ask Daniel whether the pricing analysis can wait?",
        ja: 'わかりました。負担をかけすぎたくはありません。価格分析を待ってもらえないか、私からダニエルさんに聞いてみるのはどうでしょう。',
      },
      {
        sp: 'A',
        en: 'That would really help. I think it could be pushed back a week without any problems.',
        ja: 'それはとても助かります。価格分析なら、1週間延ばしても問題ないと思います。',
      },
      {
        sp: 'B',
        en: "Great, I'll talk to him this afternoon. And if it helps, I can ask Raj to do the charts.",
        ja: 'よかった、今日の午後に彼と話します。それと、もし助かるなら、グラフはラージさんに頼めますよ。',
      },
      { sp: 'A', en: "That'd be great. Is there a template I should use?", ja: 'それはありがたいです。使うべきテンプレートはありますか。' },
      {
        sp: 'B',
        en: "Yes, use the one from the March report. I'll send you the link right after this.",
        ja: 'はい、3月のレポートのものを使ってください。このあとすぐにリンクを送ります。',
      },
      {
        sp: 'A',
        en: 'OK. Would you like to see an outline before I start writing?',
        ja: 'わかりました。書き始める前に、構成案を見ておきますか。',
      },
      {
        sp: 'B',
        en: "Yes, let's check in on Friday at ten and go over it together.",
        ja: 'ええ、金曜の10時に一度確認して、一緒に目を通しましょう。',
      },
      {
        sp: 'A',
        en: "Sounds good. I'll have the outline ready by then.",
        ja: 'いいですね。それまでに構成案を用意しておきます。',
      },
    ],
    tip: '仕事を任せるときは、背景（なぜ）→ 内容 → 期限 → 相手の状況の確認、の順に話すと伝わります。難色を示されたら押し切らず、優先順位を一緒に組み替えて手助けを申し出ましょう。',
  },
  {
    id: 'b-give-feedback',
    group: 'business',
    sub: 'office',
    title: '後輩にフィードバックする',
    titleEn: 'Giving Feedback',
    lv: 4,
    emoji: '💡',
    goal: '後輩の良い点を具体的に褒め、改善点を伝えて次の行動を相談できる',
    roles: [
      { id: 'A', name: 'Leo' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'How do you think the presentation went?',
        ja: 'プレゼンはどうだったと思いますか。',
        note: 'まず本人の自己評価を聞く',
      },
      {
        en: 'It went really well for your first one.',
        ja: '初めてにしては、とてもよかったです。',
        note: 'for ~ で「〜にしては」',
      },
      {
        en: 'Was there anything I could have done better?',
        ja: 'もっとうまくできたところはありましたか。',
        note: '自分が助言を求めるときにも使える',
      },
      {
        en: "One thing I'd work on is the level of detail.",
        ja: '改善するとしたら、情報の細かさです。',
        note: '改善点をやわらかく伝える言い方',
      },
      { en: 'I can see why.', ja: 'そう考えた理由はわかります。', note: '相手の考えをいったん認めてから意見を言う' },
      {
        en: 'We ran about ten minutes over.',
        ja: '10分ほど時間をオーバーしました。',
        note: 'run over は「予定の時間を超える」',
      },
      {
        en: 'What do you think would help?',
        ja: 'どうすればいいと思いますか。',
        note: '答えを押しつけず、本人に考えてもらう質問',
      },
      {
        en: "Let's do a quick run-through on Thursday.",
        ja: '木曜日に軽くリハーサルをしましょう。',
        note: 'run-through は「通し練習」',
      },
    ],
    lines: [
      {
        sp: 'B',
        en: 'Hi Leo, got a few minutes? How do you think the presentation went?',
        ja: 'レオ、少し時間ある？プレゼン、どうだったと思う？',
      },
      {
        sp: 'A',
        en: 'Pretty well, I think, but I was really nervous. Was it OK?',
        ja: 'わりとうまくいったと思います。でも、すごく緊張しました。大丈夫でしたか。',
      },
      {
        sp: 'B',
        en: "Honestly, it went really well for your first one. Your opening story got the client's attention right away.",
        ja: '正直、初めてにしてはすごくよかったよ。冒頭のエピソードで、お客様をすぐに引きつけていたね。',
      },
      {
        sp: 'A',
        en: "Thanks, that's a relief. I spent a lot of time on that part.",
        ja: 'ありがとうございます、ほっとしました。そこにはかなり時間をかけたんです。',
      },
      {
        sp: 'B',
        en: 'It showed. You also stayed calm when they pushed back on the price.',
        ja: 'それが伝わってきたよ。価格に難色を示されたときも、落ち着いていたね。',
      },
      {
        sp: 'A',
        en: 'I appreciate that. Was there anything I could have done better?',
        ja: 'そう言っていただけてうれしいです。もっとうまくできたところはありましたか。',
      },
      {
        sp: 'B',
        en: "One thing I'd work on is the level of detail. The technical slides were a bit much for this audience.",
        ja: '改善するとしたら、情報の細かさかな。技術的なスライドは、今回の聞き手には少し多すぎたね。',
      },
      {
        sp: 'A',
        en: "Really? I thought they'd want to see all the specs.",
        ja: 'そうですか。仕様は全部見たいだろうと思っていました。',
      },
      {
        sp: 'B',
        en: "I can see why. But they're managers, so what they really care about is cost and timing.",
        ja: 'そう考えた理由はわかるよ。でも相手は管理職だから、本当に気にしているのはコストと時期なんだ。',
      },
      {
        sp: 'A',
        en: 'That makes sense. Now that you mention it, a few people did seem a bit lost.',
        ja: 'なるほど。そう言われてみると、何人か話についてこられていない様子でした。',
      },
      {
        sp: 'B',
        en: 'Also, we ran about ten minutes over, so the Q&A felt rushed. What do you think would help?',
        ja: 'それに、10分ほど時間をオーバーして、質疑応答が駆け足になったね。どうすればいいと思う？',
      },
      {
        sp: 'A',
        en: 'Maybe I could move the technical details to an appendix and just mention them briefly.',
        ja: '技術的な詳細は付録に回して、軽く触れるだけにしてもいいかもしれません。',
      },
      {
        sp: 'B',
        en: 'Good idea. That way, the details are still there if anyone asks.',
        ja: 'いいアイデアだね。そうすれば、誰かに聞かれても詳細はちゃんと残っている。',
      },
      {
        sp: 'A',
        en: 'Great. Could you look over my slides before the next client meeting?',
        ja: 'よかった。次のお客様との打ち合わせの前に、スライドに目を通していただけますか。',
      },
      {
        sp: 'B',
        en: "Of course. Send me a draft by Wednesday, and let's do a quick run-through on Thursday.",
        ja: 'もちろん。水曜日までに下書きを送って。木曜日に軽くリハーサルをしよう。',
      },
      {
        sp: 'A',
        en: "OK, I'll get it to you by Wednesday. This was really helpful, thanks.",
        ja: 'わかりました、水曜日までにお送りします。とても参考になりました、ありがとうございます。',
      },
    ],
    tip: 'フィードバックは、本人の自己評価を聞く → 具体的な良い点 → 改善点を1つ → 本人の案を聞く、の順に。改善点は You were ~ より The slides were ~ のように「もの」を主語にすると角が立ちません。',
  },
  {
    id: 'b-one-on-one',
    group: 'business',
    sub: 'office',
    title: '1on1 でフィードバックをもらう',
    titleEn: 'Getting Feedback in a 1:1',
    lv: 4,
    emoji: '💬',
    goal: '良い点と改善点を受け止め、例を聞いて次の行動を確認できる',
    roles: [
      { id: 'A', name: 'Rachel' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "I'm glad it paid off.", ja: '報われてうれしいです。', note: 'pay off は「（努力が）報われる」' },
      { en: 'Could you give me an example?', ja: '例を挙げていただけますか。' },
      {
        en: "That's fair.",
        ja: 'おっしゃるとおりです。',
        note: '指摘を素直に認める言い方。You\'re right より落ち着いた響き',
      },
      {
        en: "I wasn't sure it was my place to bring it up.",
        ja: '自分が言い出していいことなのか分かりませんでした。',
        note: 'my place は「自分の立場・出る幕」',
      },
      {
        en: "Just to make sure I understand, you'd like me to raise issues right away?",
        ja: '確認させてください。すぐに問題を伝えてほしいということですね。',
      },
      { en: "I'll raise concerns as soon as I notice them.", ja: '気づいたらすぐに懸念を伝えます。' },
      {
        en: 'Clearer priorities each week would help me a lot.',
        ja: '毎週の優先順位がもっとはっきりしていると、とても助かります。',
        note: '上司への要望は would help me で控えめに',
      },
      {
        en: 'I appreciate the feedback.',
        ja: 'フィードバックをありがとうございます。',
        note: 'Thank you for the feedback. よりやや改まった言い方',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Thanks for making time, Yuto. How are you feeling about the project so far?',
        ja: '時間を作ってくれてありがとう、ユウト。ここまで、プロジェクトについてどう感じている？',
      },
      {
        sp: 'B',
        en: "Overall, pretty good. It's been busy, but I'm learning a lot.",
        ja: '全体的には、かなりいい感じです。ずっと忙しいですが、学ぶことがたくさんあります。',
      },
      {
        sp: 'A',
        en: 'Glad to hear it. One thing you did really well was handling that difficult customer last week.',
        ja: 'それはよかった。すごくよくできていたことの一つが、先週のあの難しいお客様への対応だね。',
      },
      {
        sp: 'B',
        en: "Thank you. I called him back every day that week, so I'm glad it paid off.",
        ja: 'ありがとうございます。その週は毎日折り返し電話をしたので、報われてうれしいです。',
      },
      {
        sp: 'A',
        en: 'It really did. One area to work on, though, is speaking up earlier in team meetings.',
        ja: '本当にね。ただ、取り組んでほしい点が一つあって、それはチーム会議でもっと早く発言することなんだ。',
      },
      {
        sp: 'B',
        en: 'I see. Could you give me an example of when that would have helped?',
        ja: 'なるほど。早く発言していれば役立った場面の例を挙げていただけますか。',
      },
      {
        sp: 'A',
        en: 'Sure. You spotted the risk to the delivery date, but you only mentioned it after the meeting.',
        ja: 'もちろん。納期のリスクに気づいていたのに、それを言ったのは会議が終わってからだったよね。',
      },
      {
        sp: 'B',
        en: "That's fair. To be honest, I wasn't sure it was my place to bring it up.",
        ja: 'おっしゃるとおりです。正直に言うと、自分が言い出していいことなのか分からなかったんです。',
      },
      {
        sp: 'A',
        en: "I get that, but it's always your place to flag a risk. We'd much rather hear about problems early.",
        ja: 'わかるよ。でも、リスクを指摘するのに遠慮はいらないよ。問題は早めに聞けたほうがずっといいから。',
      },
      {
        sp: 'B',
        en: "Just to make sure I understand, you'd like me to raise issues right away, even if I'm not completely sure?",
        ja: '確認させてください。確信がなくても、すぐに問題を伝えてほしいということですね。',
      },
      {
        sp: 'A',
        en: "Exactly. You can always start with 'I might be wrong, but...'",
        ja: 'そのとおり。「間違っているかもしれませんが」と前置きすればいいんだから。',
      },
      {
        sp: 'B',
        en: "That's really helpful. Next time, I'll raise concerns as soon as I notice them.",
        ja: 'とても参考になります。次からは、気づいたらすぐに懸念を伝えます。',
      },
      {
        sp: 'A',
        en: "That's all I'm asking. Now, do you have any feedback for me?",
        ja: 'お願いしたいのはそれだけ。じゃあ、私に対して何かフィードバックはある？',
      },
      {
        sp: 'B',
        en: 'Actually, yes. Clearer priorities each week would help me a lot.',
        ja: '実は、あります。毎週の優先順位がもっとはっきりしていると、とても助かります。',
      },
      {
        sp: 'A',
        en: "Good point. Let's go over priorities together every Monday morning.",
        ja: 'いい指摘だね。毎週月曜の朝に、一緒に優先順位を確認しよう。',
      },
      {
        sp: 'B',
        en: 'That would be great. I appreciate the feedback, Rachel.',
        ja: 'そうしていただけるとありがたいです。フィードバックをありがとうございます、レイチェルさん。',
      },
    ],
    tip: '英語圏の職場では、確信がなくても懸念は早めに伝えるほうが歓迎されます。I might be wrong, but ... と前置きすれば、遠慮しすぎずに言えます。',
  },
]

export default scenes
