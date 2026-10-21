import type { Scene } from '@/lib/types'

/** 国際・対外（鉄道）。視察の案内・近隣の方への苦情対応・規格の議論・国際会議の質疑・海外案件の打ち合わせ */
const scenes: Scene[] = [
  {
    id: 'r-site-visit',
    group: 'rail',
    sub: 'global',
    title: '海外技術者の現場案内',
    titleEn: 'Hosting a Site Visit',
    lv: 4,
    emoji: '🧭',
    goal: '日本の軌道構造や保守方法を英語で説明できる',
    roles: [
      { id: 'A', name: 'Mr. Becker' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Before we go out, please put on this helmet and hi-vis vest.',
        ja: '外に出る前に、このヘルメットと安全ベストを着用してください。',
        note: 'hi-vis は high-visibility（高視認性）の略。英国の現場の定番語',
      },
      {
        en: 'Our conventional lines are narrow gauge, 1,067 millimetres.',
        ja: '在来線は狭軌で、1,067mmです。',
        note: '在来線は conventional line。新幹線の標準軌は standard gauge（1,435mm）',
      },
      { en: 'What do you call it in Europe?', ja: '欧州では何と呼びますか。', note: '用語の違いを確かめる定番の聞き方' },
      {
        en: 'We chose it mainly to cut down on maintenance.',
        ja: '主に保守の省力化のために採用しました。',
        note: 'cut down on ~ ＝〜を減らす。「省力化」はこう言うと伝わる',
      },
      { en: 'We do a little every night instead of closing the line for days.', ja: '何日も線路を止める代わりに、毎晩少しずつ作業します。' },
      {
        en: "In Japan we call it a 'multiple tie tamper'.",
        ja: '日本ではマルチプルタイタンパと呼んでいます。',
        note: '欧州では tamping machine または tamper。日本独自の呼び名は一般名と一緒に伝える',
      },
      {
        en: "I'm afraid we can't walk across the tracks.",
        ja: '申し訳ありませんが、線路を横断することはできません。',
        note: "I'm afraid ~ で丁寧に断る。安全に関わることは理由とともにはっきり言う",
      },
      { en: 'Please follow me along the walkway.', ja: '通路に沿ってついてきてください。' },
    ],
    lines: [
      {
        sp: 'B',
        en: 'Welcome to our maintenance depot. Before we go out, please put on this helmet and hi-vis vest.',
        ja: '保線基地へようこそ。外に出る前に、このヘルメットと安全ベストを着用してください。',
      },
      {
        sp: 'A',
        en: "Thank you. Is that the Shinkansen on the viaduct over there? I assume it's standard gauge.",
        ja: 'ありがとうございます。あちらの高架橋を走っているのが新幹線ですか。標準軌ですよね。',
      },
      {
        sp: 'B',
        en: "That's right, 1,435 millimetres. Our conventional lines are narrow gauge, 1,067 millimetres.",
        ja: 'そのとおりです、1,435mmです。在来線は狭軌で、1,067mmです。',
      },
      { sp: 'A', en: 'And is the track up there slab track, or ballasted?', ja: 'あの上の軌道はスラブ軌道ですか、それともバラスト軌道ですか。' },
      {
        sp: 'B',
        en: "It's slab track. We use it on most of our Shinkansen viaducts and in tunnels. What do you call it in Europe?",
        ja: 'スラブ軌道です。新幹線の高架橋やトンネルの大半で使っています。欧州では何と呼びますか。',
      },
      {
        sp: 'A',
        en: "In the EN standards it's 'ballastless track', but most of us say 'slab track' as well.",
        ja: 'EN規格では「ballastless track」ですが、たいていは「slab track」とも言います。',
      },
      {
        sp: 'B',
        en: 'Good to know. We chose it mainly to cut down on maintenance, because our night-time windows are so short.',
        ja: '勉強になります。夜間の保守間合がとても短いので、主に保守の省力化のために採用しました。',
      },
      { sp: 'A', en: 'How short are we talking?', ja: '具体的にはどのくらい短いのですか。' },
      {
        sp: 'B',
        en: "No trains run from midnight to six, but once we've set up and cleared away, we often get under four hours of real work.",
        ja: '0時から6時までは列車が走りませんが、準備と片付けを除くと、実際に作業できるのは4時間未満のことが多いです。',
      },
      {
        sp: 'A',
        en: "That's tight. In Germany we often get longer possessions, sometimes a whole weekend.",
        ja: 'それは厳しいですね。ドイツではもっと長い線路閉鎖をとることが多く、週末まるごとということもあります。',
      },
      {
        sp: 'B',
        en: "That's the big difference. We do a little every night instead of closing the line for days.",
        ja: 'そこが大きな違いです。何日も線路を止める代わりに、毎晩少しずつ作業するんです。',
      },
      { sp: 'A', en: 'Is that one of your tamping machines on the siding?', ja: '側線にあるのは、御社のつき固め機械ですか。' },
      {
        sp: 'B',
        en: "Yes. In Japan we call it a 'multiple tie tamper', or 'maltai' for short.",
        ja: 'はい。日本ではマルチプルタイタンパ、略して「マルタイ」と呼んでいます。',
      },
      { sp: 'A', en: 'Can we walk over and take a closer look?', ja: '近くまで歩いて行って、よく見てもいいですか。' },
      {
        sp: 'B',
        en: "I'm afraid we can't walk across the tracks. Please follow me along the walkway instead.",
        ja: '申し訳ありませんが、線路を横断することはできません。代わりに通路に沿ってついてきてください。',
      },
      { sp: 'A', en: 'Of course. Safety first. After you.', ja: 'もちろんです。安全第一ですね。お先にどうぞ。' },
    ],
    tip: '1,067mm は英国式に one thousand and sixty-seven millimetres と and を入れて読みます。この軌間は英語圏では Cape gauge（3 ft 6 in）とも呼ばれます。gauge の発音は「ゲイジ」です。',
  },
  {
    id: 'r-complaint',
    group: 'rail',
    sub: 'global',
    title: '夜間工事の苦情への対応',
    titleEn: 'Responding to a Noise Complaint',
    lv: 4,
    emoji: '🙇',
    goal: '近隣の方に謝罪し、工事の理由と今後の対応を説明できる',
    roles: [
      { id: 'A', name: 'Ms. Reyes' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "I'm very sorry for the inconvenience.",
        ja: 'ご迷惑をおかけして大変申し訳ありません。',
        note: 'inconvenience ＝迷惑・不便。おわびの定番',
      },
      {
        en: "I completely understand why you're upset.",
        ja: 'お怒りはごもっともです。',
        note: '説明の前に、まず相手の気持ちを受け止める',
      },
      { en: 'Let me explain what happened.', ja: '何があったかご説明させてください。' },
      { en: "It's only safe to work after the last train.", ja: '安全に作業できるのは終電の後だけです。' },
      {
        en: "We'll deliver a notice to your home at least a week in advance.",
        ja: '少なくとも1週間前にご自宅へお知らせをお届けします。',
      },
      { en: "We'll try to keep the noise down.", ja: '騒音はできるだけ抑えるようにします。', note: 'keep ~ down ＝（音などを）抑える' },
      {
        en: 'Thank you for letting us know.',
        ja: 'お知らせいただきありがとうございます。',
        note: '苦情を伝えてくれたことへのお礼で締めると印象がよい',
      },
      { en: 'Please call us on this number.', ja: 'この番号にお電話ください。', note: '英国は call us on ~、米国は call us at ~' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Hello, I live right next to the tracks near Aoba Station. Was it your team working there last night?',
        ja: 'もしもし、青葉駅の近くで線路のすぐ隣に住んでいる者です。昨夜あそこで工事をしていたのは、そちらのチームですか。',
      },
      {
        sp: 'B',
        en: 'Yes, it was. This is Sato from the track maintenance office. How can I help?',
        ja: 'はい、そうです。保線区の佐藤です。どうされましたか。',
      },
      {
        sp: 'A',
        en: 'Well, the noise kept me awake until four in the morning, and nobody warned us!',
        ja: 'あの、騒音で朝の4時まで眠れなかったんです。それに、誰も前もって知らせてくれませんでしたよね！',
      },
      {
        sp: 'B',
        en: "I'm very sorry for the inconvenience. I completely understand why you're upset.",
        ja: 'ご迷惑をおかけして大変申し訳ありません。お怒りはごもっともです。',
      },
      { sp: 'A', en: 'So what was so urgent that it couldn\'t wait?', ja: 'それで、待てないほど急ぎの作業って何だったんですか。' },
      {
        sp: 'B',
        en: 'Let me explain what happened. One of the rails had cracked, and we had to fix it before the first train.',
        ja: '何があったかご説明させてください。レールの1本にひびが入っていて、始発までに直さなければならなかったんです。',
      },
      {
        sp: 'A',
        en: "Oh, I see. But why can't you do that kind of work during the day?",
        ja: 'ああ、そうだったんですね。でも、そういう作業はなぜ昼間にできないんですか。',
      },
      {
        sp: 'B',
        en: "Trains run every few minutes during the day, so it's only safe to work after the last train.",
        ja: '昼間は数分おきに列車が走っているので、安全に作業できるのは終電の後だけなんです。',
      },
      { sp: 'A', en: 'OK, that makes sense. So is it going to happen again tonight?', ja: 'なるほど、それなら分かります。で、今夜もあるんですか。' },
      {
        sp: 'B',
        en: "Not tonight. The temporary repair is finished, but we'll need to do a permanent repair within the next month.",
        ja: '今夜はありません。応急の補修は終わりましたが、1か月以内に本格的な補修をする必要があります。',
      },
      {
        sp: 'A',
        en: 'Seriously? Another night like that? I have to get up at six for work.',
        ja: '本当ですか？またあんな夜があるんですか？こっちは仕事で6時に起きなきゃいけないんですよ。',
      },
      {
        sp: 'B',
        en: "I'm sorry. This time it's planned, so we'll deliver a notice to your home at least a week in advance.",
        ja: '申し訳ありません。今回は計画工事ですので、少なくとも1週間前にご自宅へお知らせをお届けします。',
      },
      { sp: 'A', en: 'And is there anything you can do about the noise?', ja: 'それと、騒音について何かしてもらえることはありますか。' },
      {
        sp: 'B',
        en: "We'll try to keep the noise down. For example, we'll switch off engines when they're not in use and point the lights away from homes.",
        ja: '騒音はできるだけ抑えるようにします。たとえば、使っていないエンジンは止め、照明は住宅に向けないようにします。',
      },
      {
        sp: 'A',
        en: 'All right. Thanks for explaining. I feel a bit better about it now.',
        ja: '分かりました。説明してくれてありがとう。少し気持ちが落ち着きました。',
      },
      {
        sp: 'B',
        en: "Thank you for letting us know. If it's ever too noisy during the work, please call us on this number.",
        ja: 'お知らせいただきありがとうございます。工事中にうるさすぎることがあれば、この番号にお電話ください。',
      },
    ],
    tip: '近隣の方には専門用語を使わず、one of the rails had cracked、after the last train のように日常の言葉で説明します。順番は おわび → 理由 → 今後の対応 → お礼。理由を先に言うと言い訳に聞こえます。',
  },
  {
    id: 'r-standards',
    group: 'rail',
    sub: 'global',
    title: 'EN規格とJISの違いを議論',
    titleEn: 'Comparing EN and JIS Standards',
    lv: 5,
    emoji: '📐',
    goal: '規格の要求（shall）と推奨（should）を区別して議論できる',
    roles: [
      { id: 'A', name: 'Ms. Moreau' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'Would they be accepted as they are?', ja: 'このままで受け入れてもらえるでしょうか。', note: 'as they are ＝「現状のままで」' },
      {
        en: 'Is that a requirement, or more of a recommendation?',
        ja: 'それは要求事項ですか、それとも推奨に近いものですか。',
        note: '規格の要求の強さを確かめる質問',
      },
      {
        en: "The clause says 'shall', so it's a requirement.",
        ja: 'その箇条は「shall」なので要求事項です。',
        note: 'shall ＝要求、should ＝推奨、may ＝許容',
      },
      { en: "The figures can't be compared directly.", ja: '数値をそのまま比較することはできません。' },
      {
        en: 'I thought informative annexes were guidance rather than requirements.',
        ja: '参考附属書は指針であって、要求事項ではないと思っていました。',
        note: 'informative ＝参考（要求ではない）。normative ＝規定（要求）',
      },
      { en: 'Which edition are you working from?', ja: 'どの版をお使いですか。', note: '規格は改訂されるので、版の確認は欠かせない' },
      { en: 'Our copy may be out of date.', ja: 'こちらの手元の版は古いかもしれません。' },
      { en: "We'll check the latest edition.", ja: '最新版を確認します。' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Thanks for making time. As you know, the client requires full compliance with the TSI and the relevant EN standards.',
        ja: 'お時間をいただきありがとうございます。ご存じのとおり、顧客はTSIと関連するEN規格への完全な適合を求めています。',
      },
      {
        sp: 'B',
        en: 'Understood. Our rails are currently made to JIS E 1101. Would they be accepted as they are?',
        ja: '承知しました。当社のレールは現在JIS E 1101に準拠して製造しています。このままで受け入れてもらえるでしょうか。',
      },
      {
        sp: 'A',
        en: "Not as they are, I'm afraid. They'd need to meet EN 13674-1, including the steel grade.",
        ja: '残念ながら、このままでは無理です。鋼種も含めて、EN 13674-1を満たす必要があります。',
      },
      { sp: 'B', en: 'Is that a requirement, or more of a recommendation?', ja: 'それは要求事項ですか、それとも推奨に近いものですか。' },
      {
        sp: 'A',
        en: "The clause says 'shall', so it's a requirement. If it said 'should', you'd have some room for manoeuvre.",
        ja: 'その箇条は「shall」なので要求事項です。「should」なら、多少は融通がきくのですが。',
      },
      {
        sp: 'B',
        en: 'I see. The cross-section is another issue. Our 60 kg rail has a different profile from 60E1, so standard fastenings may not fit.',
        ja: 'なるほど。断面も問題です。当社の60kgレールは60E1と断面形状が違うので、標準的な締結装置が合わない可能性があります。',
      },
      { sp: 'A', en: "Good point. We'll need to check that with the fastening supplier.", ja: 'いい指摘ですね。締結装置のメーカーに確認する必要があります。' },
      {
        sp: 'B',
        en: "There's also the definition of track gauge. The TSI measures it up to 14 millimetres below the running surface, doesn't it?",
        ja: '軌間の定義の問題もあります。TSIでは、レール頭頂面から14mm下までの範囲で測りますよね。',
      },
      { sp: 'A', en: 'That\'s right. Is it different in Japan?', ja: 'そのとおりです。日本では違うのですか。' },
      {
        sp: 'B',
        en: "Yes, we measure at a slightly different depth, so the figures can't be compared directly.",
        ja: 'はい、測る位置の深さが少し違うので、数値をそのまま比較することはできません。',
      },
      {
        sp: 'A',
        en: "Then we'll need a comparison table. And the client also wants the informative annexes followed.",
        ja: 'それなら比較表が必要ですね。それと、顧客は参考附属書にも従うよう求めています。',
      },
      {
        sp: 'B',
        en: 'Really? I thought informative annexes were guidance rather than requirements.',
        ja: 'そうなんですか。参考附属書は指針であって、要求事項ではないと思っていました。',
      },
      {
        sp: 'A',
        en: "Normally, yes. But the client's specification makes them mandatory, so treat them as 'shall'.",
        ja: '通常はそうです。ただ、顧客の仕様書で必須とされているので、「shall」として扱ってください。',
      },
      {
        sp: 'B',
        en: 'Fair enough. Which edition are you working from? Our copy may be out of date.',
        ja: '分かりました。どの版をお使いですか。こちらの手元の版は古いかもしれません。',
      },
      {
        sp: 'A',
        en: "The current one, with the latest amendment. I'll email you the exact reference.",
        ja: '最新の追補を含んだ現行版です。正確な規格番号と版をメールでお送りします。',
      },
      {
        sp: 'B',
        en: "Thanks. We'll check the latest edition and send you a clause-by-clause comparison with JIS by Friday.",
        ja: 'ありがとうございます。最新版を確認し、金曜日までにJISとの箇条ごとの比較表をお送りします。',
      },
    ],
    tip: '規格英語では shall ＝要求、should ＝推奨、may ＝許容、can ＝可能。JIS も「〜しなければならない」「〜することが望ましい」「〜してもよい」で区別します。訳すときにこの区別を崩さないことが大切です。',
  },
  {
    id: 'r-conference',
    group: 'rail',
    sub: 'global',
    title: '国際会議で質問に答える',
    titleEn: 'Q&A at an International Conference',
    lv: 5,
    emoji: '🎤',
    goal: '質問の意図を確認し、根拠と限界を示して質疑に答えられる',
    roles: [
      { id: 'A', name: 'Dr. Lindgren' },
      { id: 'B', name: 'You (speaker)' },
    ],
    phrases: [
      {
        en: 'We have about five minutes for questions.',
        ja: '質問の時間が5分ほどあります。',
        note: '質疑の時間を示して始める。Any questions? だけより丁寧',
      },
      {
        en: 'Just to make sure I understand your question.',
        ja: 'ご質問を確認させてください。',
        note: '質問を言い換えて確かめる前置き。考える時間も稼げる',
      },
      { en: 'I think it would transfer quite well.', ja: 'かなりうまく応用できると思います。', note: 'I think ~ would で断定を避け、控えめに答える' },
      {
        en: 'The amount of tamping fell by about 20 per cent over three years.',
        ja: '3年間でつき固めの作業量が約20％減りました。',
        note: '英国は per cent、米国は percent。根拠は数字と期間をセットで',
      },
      { en: "That's a fair point.", ja: 'ごもっともなご指摘です。', note: '弱点を突かれたら、まず認める' },
      { en: "It's a limitation of our study.", ja: 'そこが今回の研究の限界です。' },
      {
        en: "I'd be happy to share our pilot data with you after the conference.",
        ja: '会議の後で、試行データを喜んで共有します。',
      },
      {
        en: "I'll need to get approval from my company first.",
        ja: 'まず社内の承認を得る必要があります。',
        note: 'その場で約束できないときの丁寧な保留',
      },
    ],
    lines: [
      {
        sp: 'B',
        en: 'Thank you for listening. We have about five minutes for questions. Yes, in the second row?',
        ja: 'ご清聴ありがとうございました。質問の時間が5分ほどあります。はい、2列目の方どうぞ。',
      },
      {
        sp: 'A',
        en: "Thanks, I'm Anna Lindgren from Sweden. Would your approach work in Europe, where possessions are usually much longer?",
        ja: 'ありがとうございます、スウェーデンのアンナ・リンドグレンです。線路閉鎖が一般にずっと長い欧州でも、この手法は通用するでしょうか。',
      },
      {
        sp: 'B',
        en: 'Thanks for that. Just to make sure I understand your question, do you mean the data analysis or the way we organise the night work?',
        ja: 'ありがとうございます。ご質問を確認させてください。データ分析のことでしょうか、それとも夜間作業の組み方のことでしょうか。',
      },
      {
        sp: 'A',
        en: 'Mainly the data side: how you decide where to tamp each night.',
        ja: '主にデータのほうです。毎晩どこをつき固めるかを、どう決めているのか。',
      },
      {
        sp: 'B',
        en: 'In that case, I think it would transfer quite well. It only needs regular geometry data, which most infrastructure managers in Europe already collect.',
        ja: 'それでしたら、かなりうまく応用できると思います。必要なのは定期的な軌道形状データだけで、欧州の大半のインフラ管理者はすでに収集しています。',
      },
      { sp: 'A', en: 'And is there any evidence that it actually saves money?', ja: 'では、実際に費用の削減につながるという根拠はありますか。' },
      {
        sp: 'B',
        en: 'Yes. On our pilot section, the amount of tamping fell by about 20 per cent over three years, with no loss of track quality.',
        ja: 'はい。試行区間では、軌道品質を落とすことなく、3年間でつき固めの作業量が約20％減りました。',
      },
      {
        sp: 'A',
        en: "That's impressive. But does your pilot section carry any heavy freight?",
        ja: '素晴らしいですね。ただ、その試行区間には重量貨物列車が走っていますか。',
      },
      {
        sp: 'B',
        en: "That's a fair point, and honestly, it's a limitation of our study. Our axle loads are relatively light, so we have no heavy-freight data yet.",
        ja: 'ごもっともなご指摘で、正直に申し上げると、そこが今回の研究の限界です。日本の軸重は比較的軽いため、重量貨物のデータはまだありません。',
      },
      { sp: 'A', en: 'Understood. And how much training did your staff need?', ja: '分かりました。それと、職員の教育はどの程度必要でしたか。' },
      {
        sp: 'B',
        en: 'Our planners needed about six months to get comfortable with the data. For the field teams, very little changed.',
        ja: '計画担当者がデータに慣れるまでに約6か月かかりました。現場の班については、ほとんど何も変わっていません。',
      },
      {
        sp: 'A',
        en: "That's encouraging. We're looking at something similar on one of our lines.",
        ja: '心強いですね。私たちも、ある線区で同じような取り組みを検討しているんです。',
      },
      {
        sp: 'B',
        en: "Then I'd be happy to share our pilot data with you after the conference.",
        ja: 'それでしたら、会議の後で、試行データを喜んで共有します。',
      },
      { sp: 'A', en: "That would be great. Here's my card.", ja: 'それはありがたいです。こちらが私の名刺です。' },
      {
        sp: 'B',
        en: "Thank you. I'll need to get approval from my company first, but I should be able to email you within two weeks.",
        ja: 'ありがとうございます。まず社内の承認を得る必要がありますが、2週間以内にはメールでお送りできると思います。',
      },
      { sp: 'A', en: 'Perfect. Thanks again for such a clear answer.', ja: '完璧です。分かりやすいご回答を本当にありがとうございました。' },
    ],
    tip: '質疑応答は ①質問を確認（Just to make sure I understand ~）②結論 ③根拠（数字と期間）④限界は正直に ⑤後日のフォロー の順に。推測で答えるより、it\'s a limitation と認めるほうが信頼されます。',
  },
  {
    id: 'r-overseas-project',
    group: 'rail',
    sub: 'global',
    title: '海外案件の技術打ち合わせ',
    titleEn: 'Technical Meeting on an Overseas Project',
    lv: 5,
    emoji: '🌏',
    goal: '保守支援の範囲や適用する基準、教育、予備品について確認し合意できる',
    roles: [
      { id: 'A', name: 'Mr. Tan' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Just to clarify, do you want us to carry out the work?',
        ja: '確認ですが、作業そのものを当社が行うということでしょうか。',
        note: '支援の範囲（作業か助言か）は最初にはっきりさせる',
      },
      {
        en: 'Which takes precedence if they conflict?',
        ja: '両者が食い違う場合は、どちらが優先されますか。',
        note: 'take precedence ＝優先される。契約・規格の議論の定番',
      },
      { en: "We'll write the maintenance manuals in English.", ja: '保守マニュアルは英語で作成します。' },
      { en: 'Could your team translate the field checklists?', ja: '現場用のチェックリストを御社で翻訳していただけますか。' },
      {
        en: "We'd suggest a train-the-trainer approach.",
        ja: '指導者を育成する方式をご提案します。',
        note: '先に指導者を育て、その人たちが残りの職員に教える方式',
      },
      { en: 'The lead time is about six months.', ja: 'リードタイムは約6か月です。', note: 'lead time ＝発注から納品までの期間' },
      {
        en: "We recommend keeping two years' worth of critical spares.",
        ja: '重要な予備品は2年分の在庫を持つことをお勧めします。',
        note: 'spares ＝ spare parts（予備品）。~ worth of で「〜分の」',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Thanks for coming all this way. Shall we start with the scope of your maintenance support?',
        ja: '遠いところお越しいただきありがとうございます。まず、御社の保守支援の範囲から始めましょうか。',
      },
      {
        sp: 'B',
        en: 'Sure. Just to clarify, do you want us to carry out the work, or to advise your own teams?',
        ja: 'はい。確認ですが、作業そのものを当社が行うのか、御社のチームに助言するのか、どちらをご希望ですか。',
      },
      {
        sp: 'A',
        en: "Mainly to advise. Our staff will do the work, but we'd like your engineers on site for the first two years after opening.",
        ja: '主に助言です。作業は当社の職員が行いますが、開業後の2年間は御社の技術者に現場にいてほしいのです。',
      },
      {
        sp: 'B',
        en: "That's in line with our proposal. Next, which standards will the maintenance follow: Japanese or local?",
        ja: 'それは当社の提案と一致しています。次に、保守は日本と現地のどちらの基準に従うことになりますか。',
      },
      {
        sp: 'A',
        en: 'The track was designed to Japanese standards, but our national regulations still apply.',
        ja: '軌道は日本の基準で設計されていますが、当国の法規制はやはり適用されます。',
      },
      {
        sp: 'B',
        en: 'Then which takes precedence if they conflict? For example, if the inspection intervals are different.',
        ja: 'では、両者が食い違う場合はどちらが優先されますか。たとえば、検査周期が違う場合です。',
      },
      {
        sp: 'A',
        en: "Our regulations, always. But where your standards are stricter, we're happy to follow them.",
        ja: '常に当国の法規制です。ただ、日本の基準のほうが厳しい点については、喜んでそちらに従います。',
      },
      {
        sp: 'B',
        en: "Understood. We'll write the maintenance manuals in English and highlight every point where the two differ.",
        ja: '承知しました。保守マニュアルは英語で作成し、両者が異なる点はすべて明示します。',
      },
      {
        sp: 'A',
        en: 'English is fine for our engineers, but many of our technicians would need the local language.',
        ja: '技術者は英語で問題ありませんが、現場の作業員の多くは現地語が必要です。',
      },
      {
        sp: 'B',
        en: "In that case, could your team translate the field checklists? We'd then check them for technical accuracy.",
        ja: 'それでしたら、現場用のチェックリストを御社で翻訳していただけますか。技術的に正しいかどうかは当社で確認します。',
      },
      {
        sp: 'A',
        en: "That's fine. Now, training. We have about 60 technicians who'll need it.",
        ja: 'それで結構です。では、教育について。教育が必要な作業員が約60人います。',
      },
      {
        sp: 'B',
        en: "We'd suggest a train-the-trainer approach. We'd train ten of your senior staff in Japan, and they'd train the rest locally.",
        ja: '指導者を育成する方式をご提案します。御社のベテラン職員10人を日本で教育し、その方々が残りの職員を現地で教育します。',
      },
      {
        sp: 'A',
        en: "Good. My other concern is spare parts. Some of the fastening components are only made in Japan, aren't they?",
        ja: 'いいですね。もう1つ気になるのは予備品です。締結装置の部品には、日本でしか作られていないものもありますよね。',
      },
      {
        sp: 'B',
        en: "Yes, and the lead time is about six months, so we recommend keeping two years' worth of critical spares.",
        ja: 'はい。リードタイムが約6か月なので、重要な予備品は2年分の在庫を持つことをお勧めします。',
      },
      {
        sp: 'A',
        en: 'Makes sense. The line opens next October, so could you send us a draft schedule and the spares list by the end of this month?',
        ja: 'なるほど。開業は来年10月ですので、スケジュール案と予備品リストを今月末までに送っていただけますか。',
      },
      {
        sp: 'B',
        en: "Certainly. We'd aim to start training in April, six months before opening. I'll send both documents by the 28th.",
        ja: '承知しました。研修は開業6か月前の4月に始めたいと考えています。28日までに両方の書類をお送りします。',
      },
    ],
    tip: '海外案件では、言葉の定義と優先順位を最初に確かめるのが鉄則です。support が作業か助言か、基準が食い違うときにどちらが優先か（take precedence）を曖昧にしたまま進めると、後で契約上のもめごとになります。',
  },
]

export default scenes
