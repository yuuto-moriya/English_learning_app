import type { Scene } from '@/lib/types'

/** 補修・工事（鉄道）。請負業者への指示・マルタイ作業の段取り・レール交換・まくらぎ交換・溶接部の確認 */
const scenes: Scene[] = [
  {
    id: 'r-contractor',
    group: 'rail',
    sub: 'works',
    title: '請負業者への作業指示',
    titleEn: 'Briefing a Contractor',
    lv: 4,
    emoji: '👷',
    goal: '請負業者に作業範囲・品質の要求・完了の条件をはっきり指示できる',
    roles: [
      { id: 'A', name: 'Mike Brown' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "Tonight's scope of work includes replacing 60 metres of rail.",
        ja: '今夜の作業範囲には、レール60mの交換が含まれます。',
        note: 'scope of work＝作業範囲。契約や指示の基本語',
      },
      {
        en: 'All welds must be ultrasonically tested.',
        ja: 'すべての溶接部に超音波探傷が必要です。',
        note: '必須の条件は must で言い切る',
      },
      {
        en: "Who's your lead welder tonight?",
        ja: '今夜の溶接の責任者はどなたですか。',
        note: 'lead 〜＝〜の主任・まとめ役。lead engineer なども同じ',
      },
      {
        en: "We can't risk an overrun.",
        ja: '時間超過になるわけにはいきません。',
        note: 'overrun＝線路閉鎖の時間超過（解除の遅れ）。英国の現場の重要語',
      },
      { en: 'Is there another machine you could use?', ja: 'ほかに使える機械はありますか。' },
      { en: 'Please send us the test records within 24 hours.', ja: '試験記録は24時間以内に送ってください。' },
      {
        en: 'The work is complete only when the geometry has been checked.',
        ja: '軌道形状の確認が済んだ時点で作業完了とします。',
        note: 'only when 〜＝〜して初めて。完了の条件をはっきりさせる',
      },
      {
        en: 'Just leave it in the cess.',
        ja: '線路脇に置いておいてください。',
        note: 'cess＝線路脇のスペース（英国の現場用語）',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: "Evening. I'm Mike Brown, the site supervisor for tonight's job. Where would you like to start?",
        ja: 'こんばんは。今夜の作業の現場責任者、マイク・ブラウンです。どこから始めましょうか。',
      },
      {
        sp: 'B',
        en: "Thanks for coming, Mike. Tonight's scope of work includes replacing 60 metres of rail on the up line.",
        ja: '来ていただいてありがとうございます、マイクさん。今夜の作業範囲には、上り線のレール60mの交換が含まれます。',
      },
      { sp: 'A', en: 'Is that one rail or both?', ja: '片側のレールですか、それとも両側ですか。' },
      {
        sp: 'B',
        en: "Both rails, so that's four aluminothermic welds in total.",
        ja: '両側です。なので、テルミット溶接は合計4か所になります。',
      },
      {
        sp: 'A',
        en: 'Okay. Any particular requirements for the welds?',
        ja: '分かりました。溶接について、何か特別な要求はありますか。',
      },
      {
        sp: 'B',
        en: 'Yes. Welding must follow EN 14730, and all welds must be ultrasonically tested.',
        ja: 'はい。溶接は EN 14730 に従い、すべての溶接部に超音波探傷が必要です。',
      },
      {
        sp: 'A',
        en: 'No problem. All our welders are certified for that process.',
        ja: '問題ありません。うちの溶接士は全員、その工法の資格を持っています。',
      },
      {
        sp: 'B',
        en: "Good. Who's your lead welder tonight? I'll need a copy of their certificate.",
        ja: 'よかったです。今夜の溶接の責任者はどなたですか。資格証の写しが必要です。',
      },
      {
        sp: 'A',
        en: "It's Raj Patel, and I'll send it over now. The only thing is, our road-rail vehicle is running about 30 minutes late.",
        ja: 'ラージ・パテルです。すぐに送ります。ただ、うちの軌陸車が30分ほど遅れているんです。',
      },
      {
        sp: 'B',
        en: "That's a concern, because we can't risk an overrun. Is there another machine you could use?",
        ja: '時間超過になるわけにはいかないので、それは心配です。ほかに使える機械はありますか。',
      },
      {
        sp: 'A',
        en: "There's a spare one at our depot. I can have it here by 00:30.",
        ja: 'うちの基地に予備が1台あります。0時30分までにここへ持ってこられます。',
      },
      {
        sp: 'B',
        en: 'Please do. And please send us the test records within 24 hours.',
        ja: 'ぜひお願いします。それから、試験記録は24時間以内に送ってください。',
      },
      {
        sp: 'A',
        en: 'Will do. So when will you sign the job off?',
        ja: '分かりました。では、作業完了の承認はどの時点になりますか。',
      },
      {
        sp: 'B',
        en: "The work is complete only when the geometry has been checked and we've received all the test records.",
        ja: '軌道形状の確認が済み、試験記録がすべてこちらに届いた時点で作業完了とします。',
      },
      {
        sp: 'A',
        en: 'Fair enough. Do you want us to take the old rail away as well?',
        ja: '了解です。撤去した古いレールも、こちらで持ち帰りましょうか。',
      },
      {
        sp: 'B',
        en: "No, just leave it in the cess, and we'll collect it next week. See you on site.",
        ja: 'いいえ、線路脇に置いておいてください。来週こちらで回収します。では現場で。',
      },
    ],
    tip: '必須の条件は must、お願いは please と使い分けます。完了の条件は "The work is complete only when 〜" のように最初に示しておくと、引き渡しのときにもめません。',
  },
  {
    id: 'r-tamping-shift',
    group: 'rail',
    sub: 'works',
    title: 'マルタイ作業の段取り',
    titleEn: 'Planning a Tamping Shift',
    lv: 4,
    emoji: '🛤️',
    goal: '作業区間・設計値・すりつけ・速度制限・解除時刻をオペレーターと確認できる',
    roles: [
      { id: 'A', name: 'Andy' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'The worksite limits are 23.4 to 24.0 kilometres on the down line.',
        ja: '作業区間は下り線の23k400mから24k000mまでです。',
        note: 'worksite limits＝作業区域の境界。英国では標識で示す',
      },
      {
        en: 'Have the design lifts and slews come from the latest survey?',
        ja: '設計のこう上量と移動量は最新の測量に基づいていますか。',
        note: 'lift＝こう上量、slew＝通り整正の横移動量（英国の現場用語）',
      },
      { en: 'The maximum lift is 35 millimetres.', ja: '最大こう上量は35mmです。' },
      {
        en: 'The ballast was topped up on Tuesday night.',
        ja: '火曜の夜にバラストを補充しました。',
        note: 'top up＝補充する・継ぎ足す',
      },
      {
        en: 'Keep both run-outs inside the worksite limits.',
        ja: '両端のすりつけを作業区間の中に収めてください。',
        note: 'run-out＝すりつけ（こう上・移動をゼロに戻していく区間）',
      },
      { en: 'The speed restriction has to be 30 km/h.', ja: '速度制限は時速30kmにしなければなりません。' },
      { en: 'Please finish tamping by 04:30.', ja: '4時30分までにつき固めを終えてください。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "Hi, it's Andy, the tamper operator for tonight. Have you got five minutes to go through the job?",
        ja: 'もしもし、今夜のマルタイのオペレーターのアンディです。作業内容の確認に5分ほどいいですか。',
      },
      {
        sp: 'B',
        en: 'Sure. The worksite limits are 23.4 to 24.0 kilometres on the down line.',
        ja: 'はい。作業区間は下り線の23k400mから24k000mまでです。',
      },
      {
        sp: 'A',
        en: "So that's 600 metres. Have the design lifts and slews come from the latest survey?",
        ja: 'では600mですね。設計のこう上量と移動量は最新の測量に基づいていますか。',
      },
      {
        sp: 'B',
        en: 'Yes, we surveyed it last week. The maximum lift is 35 millimetres, at around 23.7.',
        ja: 'はい、先週測量しました。最大こう上量は23k700m付近で35mmです。',
      },
      {
        sp: 'A',
        en: "That's a fair lift. Will there be enough ballast?",
        ja: 'けっこうなこう上量ですね。バラストは足りますか。',
      },
      {
        sp: 'B',
        en: 'Yes, the ballast was topped up on Tuesday night, so there should be plenty.',
        ja: 'はい、火曜の夜にバラストを補充したので、十分あるはずです。',
      },
      {
        sp: 'A',
        en: 'Great. And how do you want the run-outs at each end?',
        ja: 'いいですね。それで、両端のすりつけはどうしますか。',
      },
      {
        sp: 'B',
        en: 'Please follow our standard for the gradient, and keep both run-outs inside the worksite limits.',
        ja: '勾配は当社基準に従い、両端のすりつけを作業区間の中に収めてください。',
      },
      {
        sp: 'A',
        en: "Will do. Bad news, though: the dynamic track stabiliser has broken down, so it won't be with us tonight.",
        ja: '了解です。ただ悪い知らせで、ダイナミックトラックスタビライザが故障したので、今夜は来ません。',
      },
      {
        sp: 'B',
        en: 'Ah, that changes things. Without the stabiliser, our standard says the speed restriction has to be 30 km/h, not 60.',
        ja: 'ああ、それだと話が変わります。スタビライザなしだと、当社基準では速度制限を時速60kmではなく30kmにしなければなりません。',
      },
      { sp: 'A', en: 'Sorry, was that thirty or forty?', ja: 'すみません、30ですか、40ですか。' },
      {
        sp: 'B',
        en: "Thirty, three-zero. I'll let Control know before we hand back.",
        ja: '30、さん・ぜろです。解除の前に指令に伝えておきます。',
      },
      {
        sp: 'A',
        en: 'Okay. What time do you need us off the worksite?',
        ja: '分かりました。何時までに作業区間から撤収すればいいですか。',
      },
      {
        sp: 'B',
        en: "Handback is at 05:10, so please finish tamping by 04:30. I'll need time to check the geometry.",
        ja: '解除は5時10分なので、4時30分までにつき固めを終えてください。軌道形状を確認する時間が必要です。',
      },
      {
        sp: 'A',
        en: 'Just to confirm: tamping finished by 04:30, for a 05:10 handback.',
        ja: '確認です。5時10分の解除に向けて、4時30分までにつき固めを終える、ですね。',
      },
      {
        sp: 'B',
        en: "That's right. See you at the access point at 23:30.",
        ja: 'その通りです。23時30分に線路への出入口で会いましょう。',
      },
    ],
    tip: '英国の現場では、こう上量を lift、通り整正の横移動量を slew と言い、設計値は "design lifts and slews" と呼びます。すりつけは run-out で、両端のすりつけまで作業区間の中に収めるのが基本です。',
  },
  {
    id: 'r-rail-change',
    group: 'rail',
    sub: 'works',
    title: 'レール交換の手順を確認する',
    titleEn: 'Planning a Rail Replacement',
    lv: 4,
    emoji: '🏗️',
    goal: 'レール交換の手順・使う機械・隣接線のリスクを順を追って確認できる',
    roles: [
      { id: 'A', name: 'Pete' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "What's the first step once we've got the possession?", ja: '線路閉鎖が取れたら、最初の手順は何ですか。' },
      {
        en: 'Then you cut out the old rail and lift the new one in?',
        ja: 'それから古いレールを切り取って、新しいレールを据え付けるんですね。',
        note: '平叙文を上がり調子で言うと「〜ですね？」という確認になる',
      },
      { en: 'The adjacent line will be open to traffic.', ja: '隣接線は列車が走っています。' },
      {
        en: 'The rail will be well below the stress-free temperature tonight.',
        ja: '今夜はレール温度が設定温度をかなり下回ります。',
        note: 'stress-free temperature＝設定温度（中立温度）。米国では neutral temperature',
      },
      {
        en: "I'd rather not.",
        ja: 'それは避けたいです。',
        note: '相手の提案をやんわり断る言い方。理由を続けると角が立たない',
      },
      {
        en: "If we leave it unstressed, there's a risk of a buckle next summer.",
        ja: '設定替をしないままだと、来年の夏に座屈のおそれがあります。',
        note: 'buckle＝座屈。米国では sun kink とも言う',
      },
      { en: "I'll check the gauge and cross level before we hand back.", ja: '解除の前に軌間と水準を確認します。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "Right, the new rail's already laid out in the cess. Shall we go through the sequence?",
        ja: 'さて、新しいレールはもう線路脇に並べてあります。手順をひととおり確認しましょうか。',
      },
      {
        sp: 'B',
        en: "Yes, please. What's the first step once we've got the possession?",
        ja: 'はい、お願いします。線路閉鎖が取れたら、最初の手順は何ですか。',
      },
      {
        sp: 'A',
        en: 'First we unclip the old rail, plus the extra length we need for stressing, and put it on rollers.',
        ja: 'まず古いレールの締結を外します。設定替に必要な範囲も外して、ローラーに載せます。',
      },
      {
        sp: 'B',
        en: 'Okay. Then you cut out the old rail and lift the new one in?',
        ja: '分かりました。それから古いレールを切り取って、新しいレールを据え付けるんですね。',
      },
      {
        sp: 'A',
        en: "That's right. We'll cut it with the rail saws, and the road-rail vehicle will do the lifting.",
        ja: 'そうです。レール切断機で切って、吊り上げは軌陸車でやります。',
      },
      {
        sp: 'B',
        en: "The adjacent line will be open to traffic, so the machine mustn't swing over it.",
        ja: '隣接線は列車が走っているので、機械が隣接線の上まで旋回しないようにしてください。',
      },
      {
        sp: 'A',
        en: "Agreed. We'll set the machine's swing limits and put a fence up in the six-foot.",
        ja: 'そうですね。機械の旋回範囲を制限して、線間に柵を立てます。',
      },
      {
        sp: 'B',
        en: 'Good. What about stressing? The rail will be well below the stress-free temperature tonight.',
        ja: 'よかったです。設定替はどうしますか。今夜はレール温度が設定温度をかなり下回ります。',
      },
      {
        sp: 'A',
        en: "To be honest, it'd be quicker to weld it as it is and stress it another night.",
        ja: '正直なところ、このまま溶接して、設定替は別の夜にやった方が早いんですが。',
      },
      {
        sp: 'B',
        en: "I'd rather not. If we leave it unstressed, there's a risk of a buckle next summer.",
        ja: 'それは避けたいです。設定替をしないままだと、来年の夏に座屈のおそれがあります。',
      },
      {
        sp: 'A',
        en: "Fair point. I'll bring the tensors, then, and work out the extension from the rail temperature.",
        ja: 'もっともです。では緊張器を持っていって、レール温度から伸ばす量を計算します。',
      },
      {
        sp: 'B',
        en: 'Thanks. Then you weld it with the tensors on, take out the rollers and re-clip?',
        ja: 'ありがとうございます。それから緊張器をかけたまま溶接して、ローラーを外し、締結し直すんですね。',
      },
      {
        sp: 'A',
        en: "Exactly. After that, it's over to you for the geometry check.",
        ja: 'その通りです。そのあとの軌道形状の確認はお任せします。',
      },
      {
        sp: 'B',
        en: "Sure. I'll check the gauge and cross level before we hand back at 04:50.",
        ja: '分かりました。4時50分の解除の前に、軌間と水準を確認します。',
      },
      {
        sp: 'A',
        en: "Sounds like a plan. I'll go through all this with the gang at the briefing.",
        ja: 'それでいきましょう。安全ミーティングで、作業班にこれを全部説明します。',
      },
    ],
    tip: '手順は First → Then → After that でつなぎます。相手の説明は "Then you 〜?" と上がり調子で言い直して確認すると自然です。英国では隣り合う線路の間を six-foot、線路脇を cess と言います。',
  },
  {
    id: 'r-sleeper',
    group: 'rail',
    sub: 'works',
    title: 'まくらぎを交換する',
    titleEn: 'Replacing Sleepers',
    lv: 4,
    emoji: '🧱',
    goal: '不良まくらぎの状態と交換本数、交換後の速度制限を相談できる',
    roles: [
      { id: 'A', name: 'Lena' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'We found 18 cracked concrete sleepers.', ja: 'コンクリートまくらぎのひび割れを18本見つけました。' },
      {
        en: 'Five of them are cracked right through.',
        ja: 'そのうち5本は完全に割れています。',
        note: 'right through＝（ひびが）端から端まで貫通して',
      },
      { en: 'Three of them are consecutive.', ja: 'そのうち3本が連続しています。', note: 'three in a row とも言う' },
      {
        en: "I'd suggest replacing the five broken ones now.",
        ja: '割れた5本を今交換することを提案します。',
        note: 'suggest のあとは動詞の -ing 形。suggest to replace は誤り',
      },
      {
        en: 'Will the new sleepers take the same clips?',
        ja: '新しいまくらぎにも同じクリップが使えますか。',
        note: 'take＝（部品などを）受け付ける・取り付けられる',
      },
      {
        en: "We'll pack the new sleepers and consolidate the ballast.",
        ja: '新しいまくらぎをつき固めて、道床を締め固めます。',
        note: 'pack＝（まくらぎ下を）つき固める',
      },
      {
        en: "I'll re-check the geometry before we lift the restriction.",
        ja: '制限を解除する前に軌道形状を再確認します。',
        note: 'lift＝（制限を）解除する',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: "Hi, I've read your inspection report. How bad are the sleepers near the level crossing?",
        ja: 'こんにちは、点検報告書を読みました。踏切付近のまくらぎはどのくらい悪いんですか。',
      },
      {
        sp: 'B',
        en: 'We found 18 cracked concrete sleepers. Five of them are cracked right through.',
        ja: 'コンクリートまくらぎのひび割れを18本見つけました。そのうち5本は完全に割れています。',
      },
      {
        sp: 'A',
        en: 'Are any of those five next to each other?',
        ja: 'その5本の中に、隣り合っているものはありますか。',
      },
      {
        sp: 'B',
        en: "Yes, three of them are consecutive, so there's a risk of gauge spread there.",
        ja: 'はい、そのうち3本が連続しているので、そこは軌間拡大のおそれがあります。',
      },
      {
        sp: 'A',
        en: "That's a priority, then. How many do you want to replace?",
        ja: 'それなら優先ですね。何本交換したいですか。',
      },
      {
        sp: 'B',
        en: "I'd suggest replacing the five broken ones now and monitoring the other 13 at each inspection.",
        ja: '割れた5本を今交換し、残りの13本は毎回の検査で経過を見ることを提案します。',
      },
      { sp: 'A', en: 'Agreed. What type of fastening do they have?', ja: '賛成です。締結装置はどのタイプですか。' },
      {
        sp: 'B',
        en: 'They have the older type of clip. Will the new sleepers take the same clips?',
        ja: '古いタイプのクリップです。新しいまくらぎにも同じクリップが使えますか。',
      },
      {
        sp: 'A',
        en: 'No, the ones in stock take a different clip, with their own pads and insulators.',
        ja: 'いいえ、在庫のまくらぎは別のクリップを使い、軌道パッドと絶縁材も専用のものです。',
      },
      {
        sp: 'B',
        en: 'Just to confirm, we need new clips, pads and insulators for all five?',
        ja: '確認ですが、5本すべてに新しいクリップ・軌道パッド・絶縁材が必要ということですね。',
      },
      {
        sp: 'A',
        en: "That's right. I'll check we've got enough in the stores.",
        ja: 'その通りです。倉庫に十分あるか確認します。',
      },
      {
        sp: 'B',
        en: "Thanks. After the change, we'll pack the new sleepers and consolidate the ballast.",
        ja: 'ありがとうございます。交換後は、新しいまくらぎをつき固めて、道床を締め固めます。',
      },
      {
        sp: 'A',
        en: "Good. You'll need a speed restriction until the ballast settles, won't you?",
        ja: 'いいですね。道床が落ち着くまで速度制限が必要ですよね。',
      },
      {
        sp: 'B',
        en: "Yes, 30 km/h, as our standard requires. I'll re-check the geometry before we lift the restriction.",
        ja: 'はい、当社基準どおり時速30kmです。制限を解除する前に軌道形状を再確認します。',
      },
      {
        sp: 'A',
        en: "Perfect. When's the next possession you could use?",
        ja: '完璧です。次に使える線路閉鎖はいつですか。',
      },
      {
        sp: 'B',
        en: "There's one next Tuesday night. I'll book the gang and order the materials today.",
        ja: '来週火曜の夜にあります。今日中に作業班を手配して、資材を発注します。',
      },
    ],
    tip: '本数は "five of them"（そのうち5本）、"three of them are consecutive"（そのうち3本が連続）のように言うと正確に伝わります。速度制限を「かける」は impose、「解除する」は lift です。',
  },
  {
    id: 'r-welding',
    group: 'rail',
    sub: 'works',
    title: '溶接部の仕上がりを確認する',
    titleEn: 'Checking a Weld',
    lv: 5,
    emoji: '🔥',
    goal: '溶接部の仕上がりを測って判定し、不合格の扱いと記録を確認できる',
    roles: [
      { id: 'A', name: 'Marek' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Can you talk me through how it went?',
        ja: '作業の経過を順に説明してもらえますか。',
        note: 'talk 人 through 〜＝〜を順を追って説明する',
      },
      { en: 'Were the rail ends dry?', ja: 'レール端は乾いていましたか。' },
      { en: "I'll check it with the one-metre straightedge.", ja: '1mの直定規で確認します。' },
      {
        en: "There's a peak of about 0.6 millimetres on the running surface.",
        ja: '頭頂面に約0.6mmの凸があります。',
        note: '凸は peak、凹みは dip',
      },
      { en: "That's outside our tolerance.", ja: '当社の許容差を超えています。', note: '範囲内なら within tolerance' },
      {
        en: 'What if it had been a dip instead?',
        ja: 'もし凹みだったらどうなっていましたか。',
        note: '仮定法過去完了で、起きなかった場合の扱いを確かめる',
      },
      { en: "What's the weld number?", ja: '溶接番号は何ですか。' },
      { en: "I'll re-check it and sign the record.", ja: 'もう一度確認して記録に署名します。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "That's the last weld done. Do you want to have a look before we pack up?",
        ja: 'これで最後の溶接が終わりました。片付ける前に見ておきますか。',
      },
      {
        sp: 'B',
        en: 'Yes, please. Can you talk me through how it went first?',
        ja: 'はい、お願いします。まず、作業の経過を順に説明してもらえますか。',
      },
      {
        sp: 'A',
        en: 'Sure. We set the gap at 25 millimetres, as the process specifies, and preheated for the full time.',
        ja: 'ええ。ギャップは工法の規定どおり25mmに合わせ、予熱も規定の時間しっかり行いました。',
      },
      {
        sp: 'B',
        en: 'Were the rail ends dry? It was drizzling earlier.',
        ja: 'レール端は乾いていましたか。さっき霧雨が降っていましたが。',
      },
      {
        sp: 'A',
        en: 'Bone dry. We kept a cover over the gap the whole time.',
        ja: '完全に乾いていました。ずっとギャップにカバーをかけていましたから。',
      },
      {
        sp: 'B',
        en: "Great. I'll check it with the one-metre straightedge now.",
        ja: 'よかったです。では1mの直定規で確認します。',
      },
      {
        sp: 'A',
        en: "Go ahead. We finished the profile grinding a while ago, so it's cooled right down.",
        ja: 'どうぞ。頭部の仕上げ研削はだいぶ前に終わったので、十分に冷えています。',
      },
      {
        sp: 'B',
        en: "The gauge face is fine, but there's a peak of about 0.6 millimetres on the running surface. That's outside our tolerance.",
        ja: 'ゲージ面は問題ありませんが、頭頂面に約0.6mmの凸があります。当社の許容差を超えています。',
      },
      {
        sp: 'A',
        en: "Fair enough, it's a touch high. Another pass with the grinder should take that down.",
        ja: '確かに少し高いですね。グラインダーをもう一度かければ下がるはずです。',
      },
      {
        sp: 'B',
        en: 'Please do. Just out of interest, what if it had been a dip instead?',
        ja: 'お願いします。参考までに、もし凹みだったらどうなっていましたか。',
      },
      {
        sp: 'A',
        en: "Then we'd have no choice but to reject it. You can't grind out a dip, so it'd have to be cut out.",
        ja: 'その場合は不合格にするしかありません。凹みは研削では直せないので、切り取ることになります。',
      },
      {
        sp: 'B',
        en: 'And replaced with a short length of rail and two new welds, I take it?',
        ja: 'そして短いレールを入れて、新たに2か所溶接するということですね。',
      },
      {
        sp: 'A',
        en: "Exactly. The same goes if tomorrow's ultrasonic test picks up a defect.",
        ja: 'その通りです。明日の超音波探傷で欠陥が見つかった場合も同じです。',
      },
      {
        sp: 'B',
        en: "Understood. What's the weld number? I'll need it for the weld record.",
        ja: '分かりました。溶接番号は何ですか。溶接記録に必要です。',
      },
      {
        sp: 'A',
        en: "It's W1427. It's marked on the rail web, and the record sheet is in the van.",
        ja: 'W1427です。レール腹部に書いてあり、記録用紙はバンの中にあります。',
      },
      {
        sp: 'B',
        en: "Thanks. Once it's been re-ground, I'll re-check it and sign the record.",
        ja: 'ありがとうございます。削り直しが済んだら、もう一度確認して記録に署名します。',
      },
    ],
    tip: '"〜, I take it?" は「〜ということですね」と自分の理解を確かめる言い方です。相手の文の続き（"And replaced with 〜"）として言うと、話をよく聞いていることも伝わります。',
  },
]

export default scenes
