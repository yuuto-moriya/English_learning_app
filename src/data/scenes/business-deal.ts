import type { Scene } from '@/lib/types'

/** 交渉・トラブル対応（ビジネス）。見積もり依頼・期限の延長・価格交渉・苦情対応・おわび・契約条件の確認 */
const scenes: Scene[] = [
  {
    id: 'b-quote',
    group: 'business',
    sub: 'deal',
    title: '見積もりを依頼する',
    titleEn: 'Requesting a Quote',
    lv: 3,
    emoji: '🧾',
    goal: '単価・割引・納期・送料・有効期限を確かめて見積もりを依頼できる',
    roles: [
      { id: 'A', name: 'Mr. Chen' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "I'd like to request a quote for 500 units.", ja: '500台分の見積もりをお願いしたいのですが。' },
      {
        en: 'Sorry, was that 14 or 40?',
        ja: 'すみません、14ですか、40ですか。',
        note: '-teen は後ろ、-ty は前を強く読む。聞き取れない数字は二択で聞き返すと確実',
      },
      { en: 'Do you offer a volume discount?', ja: '数量割引はありますか。', note: 'volume discount＝まとめ買いの割引' },
      { en: "What's the lead time?", ja: '納品までどのくらいかかりますか。', note: 'lead time＝発注から納品までの期間' },
      { en: 'Is shipping included in the price?', ja: '送料は価格に含まれていますか。' },
      { en: 'How long is the quote valid?', ja: '見積もりの有効期限はどのくらいですか。', note: "答えは It's valid for 30 days. の形" },
      {
        en: 'Could you send it by Friday?',
        ja: '金曜日までにお送りいただけますか。',
        note: 'by は期限（〜までに）、until は継続（〜までずっと）。混同しやすい',
      },
      { en: 'Could you cc my manager?', ja: '上司にもCCで送っていただけますか。', note: 'cc は「CC に入れる」という動詞としても使う' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Good morning, this is Daniel Chen in Sales. How can I help you?',
        ja: 'おはようございます、営業のダニエル・チェンです。どのようなご用件でしょうか。',
      },
      {
        sp: 'B',
        en: "Hi, this is Aoi Mori from Kita Logistics. I'd like to request a quote for 500 units of your H5 headset.",
        ja: 'こんにちは、キタ・ロジスティクスの森あおいです。御社のヘッドセットH5を500台、見積もりをお願いしたいのですが。',
      },
      { sp: 'A', en: 'Certainly. The list price for the H5 is $40 per unit.', ja: 'かしこまりました。H5の定価は1台40ドルです。' },
      { sp: 'B', en: 'Sorry, was that 14 or 40? You broke up a little.', ja: 'すみません、14ドルですか、40ドルですか。少し音声が途切れてしまって。' },
      { sp: 'A', en: 'Forty. Four-zero.', ja: '40ドルです。「4・0」の40です。' },
      {
        sp: 'B',
        en: 'Got it. Do you offer a volume discount on an order that size?',
        ja: '分かりました。その規模の注文だと、数量割引はありますか。',
      },
      {
        sp: 'A',
        en: "Yes. For 500 units or more, we can take 5% off, so that's $38 per unit.",
        ja: 'はい。500台以上なら5%引きにできますので、1台38ドルになります。',
      },
      { sp: 'B', en: "That helps. And what's the lead time?", ja: '助かります。それと、納品までどのくらいかかりますか。' },
      {
        sp: 'A',
        en: 'We have 300 in stock, so those could ship right away. The other 200 would take about three weeks.',
        ja: '在庫が300台あるので、その分はすぐに出荷できます。残りの200台は3週間ほどかかります。',
      },
      {
        sp: 'B',
        en: "We'd prefer a single delivery, so three weeks is fine. Is shipping included in the price?",
        ja: '一度にまとめて納品していただきたいので、3週間なら問題ありません。送料は価格に含まれていますか。',
      },
      {
        sp: 'A',
        en: "No, shipping is extra. I'll list it separately on the quote.",
        ja: 'いいえ、送料は別です。見積書には別の項目として記載します。',
      },
      { sp: 'B', en: 'Okay. How long is the quote valid?', ja: '分かりました。見積もりの有効期限はどのくらいですか。' },
      { sp: 'A', en: "It's valid for 30 days from the date of issue.", ja: '発行日から30日間有効です。' },
      {
        sp: 'B',
        en: "Great. Could you send it by Friday? We need to get it approved at Monday's budget meeting.",
        ja: 'よかったです。金曜日までにお送りいただけますか。月曜日の予算会議で承認を取る必要があるので。',
      },
      {
        sp: 'A',
        en: "No problem. You'll have it by Thursday. Should I send it to you directly?",
        ja: '承知しました。木曜日までにはお手元に届くようにします。森様に直接お送りすればよろしいですか。',
      },
      {
        sp: 'B',
        en: 'Yes, please, and could you cc my manager, Ms. Ito? Thanks for your help.',
        ja: 'はい、お願いします。上司の伊藤にもCCで送っていただけますか。ご対応ありがとうございました。',
      },
    ],
    tip: "quote（quotation）はその価格で売ると約束する正式な見積もり、estimate は変わることもある概算です。数社を比べるときは We're getting quotes from three suppliers. のように言います。",
  },
  {
    id: 'b-extension',
    group: 'business',
    sub: 'deal',
    title: '締め切りの延長をお願いする',
    titleEn: 'Asking for a Deadline Extension',
    lv: 3,
    emoji: '⏳',
    goal: '理由を簡潔に説明し、延長を丁寧に頼んで合意できる',
    roles: [
      { id: 'A', name: 'Ms. Novak' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "I'm afraid I need to ask for an extension.",
        ja: '申し訳ないのですが、締め切りの延長をお願いしなければなりません。',
        note: "I'm afraid で「言いにくいのですが」と切り出す",
      },
      { en: 'The delay is due to a problem with the data.', ja: '遅れの原因はデータの問題です。', note: 'be due to ～＝～が原因だ' },
      {
        en: 'Would it be possible to push the deadline to Friday?',
        ja: '締め切りを金曜日まで延ばしていただくことは可能でしょうか。',
        note: 'push (back) the deadline＝締め切りを延ばす。extend the deadline も同じ意味',
      },
      {
        en: 'I can send you the key findings by Thursday morning.',
        ja: '主な調査結果を木曜日の朝までにお送りできます。',
        note: 'key findings＝主な調査結果',
      },
      { en: 'Would that give you enough time?', ja: 'それで時間は足りますか。', note: '相手の都合を気づかう確認' },
      {
        en: "You'll have it by 3 p.m. on Friday at the latest.",
        ja: '遅くとも金曜日の午後3時までにはお届けします。',
        note: 'at the latest＝遅くとも',
      },
      { en: "I'll send you a progress update tomorrow.", ja: '明日、進捗をご報告します。' },
      { en: 'Thank you for being so flexible.', ja: '柔軟にご対応いただきありがとうございます。' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Hi Ken, thanks for calling. Is the report still on schedule for Wednesday?',
        ja: 'ケンさん、お電話ありがとうございます。報告書は予定どおり水曜日に仕上がりそうですか。',
      },
      {
        sp: 'B',
        en: "That's actually why I'm calling. I'm afraid I need to ask for an extension.",
        ja: '実はその件でお電話しました。申し訳ないのですが、締め切りの延長をお願いしなければなりません。',
      },
      { sp: 'A', en: 'Oh, I see. What happened?', ja: 'そうですか。何があったんですか。' },
      {
        sp: 'B',
        en: 'The delay is due to a problem with the data from our research partner. We only got the corrected file this morning.',
        ja: '遅れの原因は、委託先の調査会社のデータに問題があったことです。修正版のファイルが今朝やっと届きました。',
      },
      { sp: 'A', en: 'How much more time do you need?', ja: 'あとどのくらい時間が必要ですか。' },
      {
        sp: 'B',
        en: 'Would it be possible to push the deadline to Friday afternoon?',
        ja: '締め切りを金曜日の午後まで延ばしていただくことは可能でしょうか。',
      },
      {
        sp: 'A',
        en: "Friday's a bit late. I have to present the results to my director on Thursday.",
        ja: '金曜日だと少し遅いですね。木曜日に部長へ結果を説明しなければならないので。',
      },
      {
        sp: 'B',
        en: 'I understand. In that case, I can send you the key findings by Thursday morning.',
        ja: '分かりました。それでしたら、主な調査結果を木曜日の朝までにお送りできます。',
      },
      {
        sp: 'A',
        en: "Hmm, that might work. My meeting's at 2:00, so I'd need them before noon.",
        ja: 'うーん、それなら何とかなるかもしれません。会議は2時からなので、正午より前に必要です。',
      },
      {
        sp: 'B',
        en: "No problem. I'll get them to you by 10 a.m. Would that give you enough time?",
        ja: '大丈夫です。午前10時までにお送りします。それで時間は足りますか。',
      },
      { sp: 'A', en: "Yes, that's plenty. And the full report?", ja: 'ええ、十分です。それで、報告書の全体は？' },
      {
        sp: 'B',
        en: "You'll have it by 3 p.m. on Friday at the latest.",
        ja: '遅くとも金曜日の午後3時までにはお届けします。',
      },
      { sp: 'A', en: 'All right, I can work with that.', ja: '分かりました、それで何とかします。' },
      {
        sp: 'B',
        en: "Thanks. And I'll send you a progress update tomorrow afternoon.",
        ja: 'ありがとうございます。それと、明日の午後に進捗をご報告します。',
      },
      {
        sp: 'A',
        en: 'Great. I appreciate the heads-up, Ken.',
        ja: '助かります。早めに知らせてくださってありがとうございます、ケンさん。',
      },
      {
        sp: 'B',
        en: 'Thank you for being so flexible, and sorry again for the trouble.',
        ja: '柔軟にご対応いただきありがとうございます。改めて、ご迷惑をおかけしてすみません。',
      },
    ],
    tip: '延長のお願いは「早めに・理由は短く・代案を出す」が基本。全部ではなく一部を先に出す提案は、相手の困りごとを減らします。',
  },
  {
    id: 'b-negotiate',
    group: 'business',
    sub: 'deal',
    title: '納期と価格の交渉',
    titleEn: 'Negotiating Delivery and Price',
    lv: 4,
    emoji: '⚖️',
    goal: '条件を提示し、譲歩と引き換えに合意できる',
    roles: [
      { id: 'A', name: 'Ms. Ortiz' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'We were hoping for something closer to 16,000.',
        ja: '16,000円に近い額を期待していました。',
        note: '過去進行形 were hoping で、希望額を控えめに示す',
      },
      {
        en: 'Is there any way you could meet us halfway?',
        ja: '間を取っていただくことはできませんか。',
        note: 'meet ～ halfway＝歩み寄る・間を取る',
      },
      {
        en: 'That could work, as long as the first 100 arrive by March 10th.',
        ja: '最初の100脚が3月10日までに届くなら、それでいけそうです。',
        note: 'as long as ～＝～という条件なら',
      },
      {
        en: 'Could you include assembly at no extra charge?',
        ja: '組み立てを追加料金なしで含めていただけますか。',
        note: 'at no extra charge＝追加料金なしで',
      },
      {
        en: "Just to confirm, that's 17,000 yen per chair?",
        ja: '確認ですが、1脚17,000円ということですね。',
        note: '合意の前に数字を言い直して確かめる',
      },
      { en: "That's the best we can do.", ja: 'これが精一杯です。', note: '「これ以上は譲れない」という最終提示のサイン' },
      { en: 'I think we have a deal.', ja: 'これで合意ですね。' },
      { en: 'Could you put that in writing?', ja: 'それを書面でいただけますか。' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'So for 200 of the ergonomic chairs, our price is 18,000 yen each, including delivery.',
        ja: 'では、エルゴノミクスチェア200脚で、配送込みで1脚18,000円になります。',
      },
      {
        sp: 'B',
        en: 'Thank you. To be honest, we were hoping for something closer to 16,000.',
        ja: 'ありがとうございます。正直なところ、16,000円に近い額を期待していました。',
      },
      {
        sp: 'A',
        en: "That's quite a gap. At 16,000, we'd barely cover our costs.",
        ja: 'かなり開きがありますね。16,000円では、原価をまかなうのがやっとです。',
      },
      {
        sp: 'B',
        en: 'I understand. Is there any way you could meet us halfway?',
        ja: '分かります。間を取っていただくことはできませんか。',
      },
      { sp: 'A', en: 'That depends. When do you need the chairs?', ja: '条件次第ですね。椅子はいつまでに必要ですか。' },
      {
        sp: 'B',
        en: 'By the end of March. Our new office opens on April 1st.',
        ja: '3月末までです。4月1日に新しいオフィスが開くので。',
      },
      {
        sp: 'A',
        en: 'March is tight for 200. But if you can take them in two deliveries, we could do 17,000.',
        ja: '3月に200脚は厳しいです。ただ、2回に分けての納品でよければ、17,000円にできます。',
      },
      {
        sp: 'B',
        en: 'That could work, as long as the first 100 arrive by March 10th.',
        ja: '最初の100脚が3月10日までに届くなら、それでいけそうです。',
      },
      {
        sp: 'A',
        en: 'That should be fine. The other 100 would arrive by the 27th.',
        ja: 'それは大丈夫だと思います。残りの100脚は27日までに届きます。',
      },
      {
        sp: 'B',
        en: 'And if we confirm the order this week, could you include assembly at no extra charge?',
        ja: 'それと、今週中に発注を確定したら、組み立てを追加料金なしで含めていただけますか。',
      },
      {
        sp: 'A',
        en: 'Assembly is normally 800 yen a chair, but for an order this size, I can include it.',
        ja: '組み立ては通常1脚800円ですが、この規模のご注文なら含められます。',
      },
      {
        sp: 'B',
        en: "Just to confirm, that's 17,000 yen per chair, including delivery and assembly?",
        ja: '確認ですが、1脚17,000円で、配送と組み立て込みということですね。',
      },
      {
        sp: 'A',
        en: "Correct. That comes to 3.4 million yen before tax, and that's the best we can do.",
        ja: 'そのとおりです。合計で税抜き340万円で、これが精一杯です。',
      },
      {
        sp: 'B',
        en: 'Then I think we have a deal. Could you put that in writing?',
        ja: 'では、これで合意ですね。書面でいただけますか。',
      },
      {
        sp: 'A',
        en: "Of course. I'll send you a revised quote this afternoon.",
        ja: 'もちろんです。今日の午後、修正した見積書をお送りします。',
      },
      {
        sp: 'B',
        en: "Thanks. Once I have it, I'll get the purchase order approved by Friday.",
        ja: 'ありがとうございます。届きしだい、金曜日までに発注書の承認を取ります。',
      },
    ],
    tip: '交渉では "If you can ～, we could ～." の条件文で譲歩を交換するのが基本形。値下げを一方的に求めず、こちらも納期や発注の時期で歩み寄ると合意しやすくなります。',
  },
  {
    id: 'b-complaint',
    group: 'business',
    sub: 'deal',
    title: '苦情・トラブル対応',
    titleEn: 'Handling a Complaint',
    lv: 4,
    emoji: '😤',
    goal: '顧客の苦情を受け止め、事実を確かめて解決策を提示できる',
    roles: [
      { id: 'A', name: 'Mr. Hassan' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'Could I have your order number, please?', ja: 'ご注文番号を教えていただけますか。' },
      {
        en: 'I completely understand your frustration.',
        ja: 'ご不満はごもっともです。',
        note: '相手の気持ちを言葉にして受け止める。I understand だけより共感が伝わる',
      },
      {
        en: 'Could I put you on hold while I look into it?',
        ja: 'お調べする間、保留にさせていただいてもよろしいですか。',
        note: 'put ～ on hold＝電話を保留にする',
      },
      {
        en: 'Thank you for holding.',
        ja: 'お待たせいたしました。',
        note: '保留から戻ったときの定番。Sorry for waiting は「自分が待ったこと」を謝るように聞こえて不自然。謝るなら Sorry to keep you waiting.',
      },
      { en: "I'm very sorry for the inconvenience.", ja: 'ご迷惑をおかけして大変申し訳ございません。' },
      {
        en: 'The express shipping is on us.',
        ja: '速達の料金は弊社で負担いたします。',
        note: 'be on us＝こちらが費用を持つ',
      },
      { en: "We'll make sure it doesn't happen again.", ja: '二度とこのようなことがないよう徹底いたします。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "Hi, I'm calling about our order. It was supposed to arrive last Friday, and it still hasn't come.",
        ja: 'もしもし、注文の件でお電話しました。先週の金曜日に届くはずだったのに、まだ届いていないんです。',
      },
      {
        sp: 'B',
        en: "I'm sorry to hear that. Could I have your order number, please?",
        ja: 'それは申し訳ございません。ご注文番号を教えていただけますか。',
      },
      {
        sp: 'A',
        en: "It's four-seven-one-nine. And nobody even told us it would be late!",
        ja: '4719です。しかも、遅れるという連絡すらなかったんですよ！',
      },
      {
        sp: 'B',
        en: 'I completely understand your frustration. Could I put you on hold while I look into it?',
        ja: 'ご不満はごもっともです。お調べする間、保留にさせていただいてもよろしいですか。',
      },
      {
        sp: 'A',
        en: 'Fine, but please hurry. We need those display stands for a trade show on Thursday.',
        ja: 'いいですけど、急いでください。木曜日の展示会でその展示用スタンドが必要なんです。',
      },
      {
        sp: 'B',
        en: "Thank you for holding. There was a problem at our warehouse, and I'm afraid the delay notice was never sent.",
        ja: 'お待たせいたしました。弊社の倉庫でトラブルがあり、申し訳ないことに遅延のお知らせが送られていませんでした。',
      },
      {
        sp: 'A',
        en: "So when will they arrive? If we don't have them by Wednesday, we'll have to cancel.",
        ja: 'それで、いつ届くんですか。水曜日までに届かなければ、キャンセルするしかありません。',
      },
      {
        sp: 'B',
        en: "I'm very sorry for the inconvenience. They went out by express this morning, so they should arrive tomorrow.",
        ja: 'ご迷惑をおかけして大変申し訳ございません。今朝、速達で発送しましたので、明日には届くはずです。',
      },
      {
        sp: 'A',
        en: "'Should'? We really can't afford another delay.",
        ja: '「はず」ですか？これ以上遅れたら本当に困るんです。',
      },
      {
        sp: 'B',
        en: "I understand. I'll email you the tracking number within the hour and check the delivery status myself first thing tomorrow.",
        ja: 'おっしゃることはよく分かります。1時間以内に追跡番号をメールでお送りし、明日の朝一番に私自身が配送状況を確認いたします。',
      },
      { sp: 'A', en: "Okay. But we're not paying for express shipping.", ja: '分かりました。でも、速達の料金は払いませんよ。' },
      {
        sp: 'B',
        en: "Of course not. The express shipping is on us, and we'll refund your original shipping fee as well.",
        ja: 'もちろん、その必要はございません。速達の料金は弊社で負担し、当初の送料も返金いたします。',
      },
      {
        sp: 'A',
        en: 'All right. I appreciate you sorting this out so quickly.',
        ja: '分かりました。すぐに対応していただき、感謝します。',
      },
      {
        sp: 'B',
        en: "Thank you for your patience, Mr. Hassan. We'll make sure it doesn't happen again.",
        ja: 'ハッサン様、辛抱強くお待ちいただきありがとうございます。二度とこのようなことがないよう徹底いたします。',
      },
    ],
    tip: '「should arrive（届くはず）」という見込みだけでは、怒っている相手は安心しません。「1時間以内に」「明日の朝一番に」のように、自分がいつ何をするかを具体的に約束しましょう。',
  },
  {
    id: 'b-apology',
    group: 'business',
    sub: 'deal',
    title: '自社のミスをおわびする',
    titleEn: 'Apologizing for a Mistake',
    lv: 4,
    emoji: '🙇',
    goal: '責任を認めて謝り、原因・対応・再発防止策を伝えることができる',
    roles: [
      { id: 'A', name: 'Ms. Reed' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "First of all, I'd like to apologize.", ja: 'まず、おわびを申し上げます。' },
      {
        en: "That's entirely our fault.",
        ja: '完全に弊社の責任です。',
        note: '責任をはっきり認める。続けて but ～ と言い訳をしない',
      },
      {
        en: 'It was a data entry error on our end.',
        ja: '弊社側の入力ミスでした。',
        note: '原因は一文で短く。on our end＝こちら側で',
      },
      { en: "I won't make excuses.", ja: '言い訳はいたしません。' },
      {
        en: 'Please disregard the original invoice.',
        ja: '元の請求書は破棄してください。',
        note: 'disregard＝（送った書類やメールを）無視・破棄する。訂正の連絡の定番',
      },
      {
        en: "As a gesture of goodwill, we'd like to offer you 5% off your next order.",
        ja: 'おわびのしるしとして、次回のご注文を5%お値引きさせていただきたいと思います。',
        note: 'as a gesture of goodwill＝誠意のしるしとして。補償を申し出る決まり文句',
      },
      {
        en: "I'll follow up with you on Friday.",
        ja: '金曜日に改めてご連絡します。',
        note: 'follow up＝後から確認の連絡をする',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Hi, Yuto. Thanks for getting back to me so quickly.',
        ja: 'ユウトさん、すぐに折り返していただいてありがとうございます。',
      },
      {
        sp: 'B',
        en: "First of all, I'd like to apologize. The invoice amount was wrong, and that's entirely our fault.",
        ja: 'まず、おわびを申し上げます。請求書の金額が誤っており、完全に弊社の責任です。',
      },
      {
        sp: 'A',
        en: 'We were billed $18,000 instead of $8,000. Our finance team nearly paid it.',
        ja: '8,000ドルのところを18,000ドルで請求されていました。経理があやうく支払うところでしたよ。',
      },
      { sp: 'B', en: "I'm truly sorry. It was a data entry error on our end.", ja: '誠に申し訳ありません。弊社側の入力ミスでした。' },
      {
        sp: 'A',
        en: 'Frankly, this is the second billing mistake this quarter.',
        ja: '正直に言って、請求のミスは今四半期で2回目です。',
      },
      {
        sp: 'B',
        en: "You're right, and I won't make excuses. We've let you down twice now.",
        ja: 'おっしゃるとおりで、言い訳はいたしません。これで2度もご期待を裏切ってしまいました。',
      },
      {
        sp: 'A',
        en: 'So what happens now? Do we need to do anything with the original invoice?',
        ja: 'それで、これからどうなりますか。元の請求書について、こちらで何かする必要はありますか。',
      },
      {
        sp: 'B',
        en: "No, please disregard the original invoice. You'll have a corrected one by 3 p.m. today.",
        ja: 'いいえ、元の請求書は破棄してください。訂正した請求書を本日午後3時までにお送りします。',
      },
      {
        sp: 'A',
        en: "And how are you going to make sure there isn't a third time?",
        ja: 'それで、3回目がないように、どうするおつもりですか。',
      },
      {
        sp: 'B',
        en: 'Starting this week, every invoice over $5,000 will be checked by a second person before it goes out.',
        ja: '今週から、5,000ドルを超える請求書はすべて、送る前に別の担当者が確認します。',
      },
      { sp: 'A', en: "Good. That's what I wanted to hear.", ja: 'いいですね。それが聞きたかったんです。' },
      {
        sp: 'B',
        en: "Also, as a gesture of goodwill, we'd like to offer you 5% off your next order.",
        ja: 'また、おわびのしるしとして、次回のご注文を5%お値引きさせていただきたいと思います。',
      },
      {
        sp: 'A',
        en: "That's generous of you. I'll let our finance team know.",
        ja: 'それはありがたいです。経理にも伝えておきます。',
      },
      {
        sp: 'B',
        en: "Thank you. I'll follow up with you on Friday to make sure everything's in order.",
        ja: 'ありがとうございます。金曜日に改めてご連絡し、すべて問題なく済んだか確認いたします。',
      },
      {
        sp: 'A',
        en: 'Thanks, Yuto. I appreciate you taking responsibility.',
        ja: 'ありがとうございます、ユウトさん。責任を持って対応していただき、感謝します。',
      },
      {
        sp: 'B',
        en: "Of course. Again, I'm very sorry for the trouble this has caused.",
        ja: '当然のことです。改めて、このたびはご迷惑をおかけして大変申し訳ありませんでした。',
      },
    ],
    tip: 'おわびの途中で because ～ や but ～ を重ねると言い訳に聞こえます。原因は一文で済ませ、「いつまでに直すか」「どう再発を防ぐか」に言葉を使いましょう。何度も謝るより、具体策のほうが誠意として伝わります。',
  },
  {
    id: 'b-contract',
    group: 'business',
    sub: 'deal',
    title: '契約条件を確認する',
    titleEn: 'Reviewing Contract Terms',
    lv: 5,
    emoji: '📝',
    goal: '控えめな言い方で条件を提案し、即答できない点は持ち帰ることができる',
    roles: [
      { id: 'A', name: 'Mr. Okafor' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "There are a few points we'd like to discuss.", ja: '話し合いたい点がいくつかあります。' },
      {
        en: "We'd prefer net 30.",
        ja: '弊社としては30日払いを希望します。',
        note: 'net 30＝請求日から30日以内の支払い。We want より控えめな言い方',
      },
      {
        en: 'Would you be open to net 45 as a compromise?',
        ja: '折衷案として、45日払いをご検討いただけないでしょうか。',
        note: 'Would you be open to ～?＝～はご検討いただけますか（押しつけない提案）',
      },
      {
        en: 'We could agree to 18 months, provided it covers manufacturing defects only.',
        ja: '製造上の欠陥に限るのであれば、18か月で合意できます。',
        note: 'provided ～＝～という条件で。if より改まった言い方',
      },
      {
        en: 'Just to clarify, do you mean per year or over the full term?',
        ja: '確認ですが、1年あたりですか、それとも契約期間全体ですか。',
      },
      {
        en: "I'm not in a position to agree to that today.",
        ja: '本日その点に合意できる立場にはありません。',
        note: '自分に権限がないことを角を立てずに伝える',
      },
      {
        en: "I'll need to run it by our legal team.",
        ja: '法務部に確認してもらう必要があります。',
        note: 'run ～ by 人＝～を人に見てもらう・相談する',
      },
      {
        en: "In principle, that's fine.",
        ja: '原則としては問題ありません。',
        note: '大筋で受け入れ、but で条件を足すときの前置き',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Thanks for making the time. Shall we go through the draft agreement point by point?',
        ja: 'お時間をいただきありがとうございます。契約書の草案を、項目ごとに確認していきましょうか。',
      },
      {
        sp: 'B',
        en: "Yes, let's. Most of it looks fine, but there are a few points we'd like to discuss.",
        ja: 'ええ、そうしましょう。大部分は問題ありませんが、いくつか話し合いたい点があります。',
      },
      {
        sp: 'A',
        en: 'Sure. Starting with payment, our standard terms are net 60.',
        ja: '分かりました。まず支払いですが、弊社の標準条件は請求後60日払いです。',
      },
      {
        sp: 'B',
        en: "We'd prefer net 30, since that's what we have with most of our partners. Would you be open to net 45 as a compromise?",
        ja: '弊社としては30日払いを希望します。ほとんどの取引先とはその条件ですので。折衷案として、45日でご検討いただけないでしょうか。',
      },
      {
        sp: 'A',
        en: "Net 45 works for us. Next, the warranty. We're asking for 24 months.",
        ja: '45日で問題ありません。次に保証ですが、こちらは24か月を求めています。',
      },
      {
        sp: 'B',
        en: "That's double our standard. We could agree to 18 months, provided it covers manufacturing defects only.",
        ja: '弊社の標準の2倍ですね。製造上の欠陥に限るのであれば、18か月で合意できます。',
      },
      {
        sp: 'A',
        en: "That seems reasonable. On liability, we'd like the cap set at the contract value.",
        ja: '妥当だと思います。責任については、損害賠償の上限を契約金額と同額にしたいと考えています。',
      },
      {
        sp: 'B',
        en: 'Just to clarify, do you mean per year or over the full term?',
        ja: '確認ですが、それは1年あたりですか、それとも契約期間全体ですか。',
      },
      {
        sp: 'A',
        en: 'Over the full three years, so roughly $1.5 million.',
        ja: '3年間全体です。ですから、およそ150万ドルですね。',
      },
      {
        sp: 'B',
        en: "I'm afraid I'm not in a position to agree to that today. I'll need to run it by our legal team.",
        ja: '申し訳ありませんが、本日その点に合意できる立場にはありません。法務部に確認してもらう必要があります。',
      },
      {
        sp: 'A',
        en: 'Understood. What about the late-delivery penalty of 2% per week?',
        ja: '承知しました。では、納期遅延のペナルティ、週2%についてはいかがですか。',
      },
      {
        sp: 'B',
        en: "In principle, that's fine, but we'd prefer a cap of 10% of the order value.",
        ja: '原則としては問題ありませんが、上限を注文額の10%にしていただきたいです。',
      },
      {
        sp: 'A',
        en: "I'd need to discuss that internally. Finally, either party can terminate with 30 days' notice.",
        ja: 'それは社内で相談する必要があります。最後に、解約はどちらからでも30日前の通知でできることになっています。',
      },
      {
        sp: 'B',
        en: "Would you be open to 90 days? We'd need time to adjust our production plans.",
        ja: '90日にすることはご検討いただけますか。生産計画を調整する時間が必要になりますので。',
      },
      {
        sp: 'A',
        en: 'Ninety days seems fair. So where does that leave us?',
        ja: '90日なら妥当ですね。では、ここまでをまとめるとどうなりますか。',
      },
      {
        sp: 'B',
        en: "That leaves two open points: the liability cap and the penalty cap. I'll email you a summary of today's points this afternoon.",
        ja: '未決の点は2つ、損害賠償の上限とペナルティの上限ですね。本日の論点をまとめて、午後にメールでお送りします。',
      },
    ],
    tip: "契約の場では We want ～ より We'd prefer ～ や Would you be open to ～? と控えめに提案します。その場で決められない点は無理に答えず、誰に確認していつ返事するかを伝え、最後に未決の点を言葉でまとめると行き違いを防げます。",
  },
]

export default scenes
