import type { Scene } from '@/lib/types'

/** 検査・測定（鉄道）。線路巡回の報告・手検測・分岐器の検査・超音波探傷・軌道検測データのレビュー */
const scenes: Scene[] = [
  {
    id: 'r-patrol',
    group: 'rail',
    sub: 'inspect',
    title: '線路巡回の結果を報告する',
    titleEn: 'Reporting Patrol Findings',
    lv: 4,
    emoji: '🚶',
    goal: '巡回で見つけた不良を緊急度の順に報告し、対応を相談できる',
    roles: [
      { id: 'A', name: 'Graham' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "I've got four things to report.", ja: '報告が4件あります。', note: '最初に件数を言う定番の切り出し。I have ～ より口語的' },
      { en: 'Give me the urgent ones first.', ja: '急ぎのものから聞かせてください。' },
      {
        en: 'Vegetation is blocking the view of signal 23.',
        ja: '23号信号機が草木に遮られて見えにくくなっています。',
        note: '信号機の見通し（signal sighting）の不良は列車の安全に直結するので最優先',
      },
      {
        en: 'I reported it to Control from site.',
        ja: '現場から指令に報告しました。',
        note: 'Control＝運行管理の指令。from site で「現場から（すぐに）」',
      },
      {
        en: "There's a real risk of trespass.",
        ja: '線路に人が立ち入るおそれが十分にあります。',
        note: 'trespass＝線路への無断立ち入り。境界柵（boundary fence）の破損は優先度の高い不良',
      },
      {
        en: 'Three sleepers in a row have a clip missing.',
        ja: '連続する3本のまくらぎで、クリップが1個ずつ欠けています。',
        note: 'in a row＝連続して。連続した欠落は1本だけの欠落より危険度が高い',
      },
      { en: 'I fitted them there and then.', ja: 'その場で取り付けました。', note: 'there and then＝その場ですぐに' },
      {
        en: 'The sleepers are pumping under traffic.',
        ja: '列車が通るとまくらぎが上下に動いています。',
        note: 'pump＝噴泥でまくらぎが上下に動くこと。wet bed（噴泥箇所）とセットで使う英国の現場表現',
      },
    ],
    lines: [
      { sp: 'A', en: "You're back early. How did the patrol go?", ja: '早かったですね。巡回はどうでしたか。' },
      {
        sp: 'B',
        en: "Mostly fine, but I've got four things to report, and two of them are urgent.",
        ja: 'おおむね問題ありませんが、報告が4件あります。そのうち2件は急ぎです。',
      },
      { sp: 'A', en: 'Right, give me the urgent ones first.', ja: 'わかりました。急ぎのものから聞かせてください。' },
      {
        sp: 'B',
        en: "First, vegetation is blocking the view of signal 23 on the down line. You can't see it until you're quite close.",
        ja: 'まず、下り線の23号信号機が草木に遮られて見えにくくなっています。かなり近づかないと見えません。',
      },
      { sp: 'A', en: 'Sorry, was that signal 23 or 33?', ja: 'すみません、23号でしたか、33号でしたか。' },
      {
        sp: 'B',
        en: "Twenty-three, two-three. I reported it to Control from site, and they're warning drivers until it's cut back.",
        ja: '23、に・さんです。現場から指令に報告してあり、伐採されるまでは指令が運転士に注意を促しています。',
      },
      {
        sp: 'A',
        en: "Good. I'll get the vegetation team out there first thing tomorrow. What's the other urgent one?",
        ja: 'よし。明日の朝一番に伐採班を向かわせます。もう1件の急ぎは？',
      },
      {
        sp: 'B',
        en: "Part of the boundary fence is down next to the school. There's a real risk of trespass.",
        ja: '学校の隣で境界柵の一部が倒れています。線路に人が立ち入るおそれが十分にあります。',
      },
      {
        sp: 'A',
        en: "That can't wait. I'll get the fencing contractor to do a temporary repair this afternoon.",
        ja: 'それは後回しにできませんね。今日の午後、柵の業者に応急修理をしてもらいます。',
      },
      {
        sp: 'B',
        en: 'Next, three sleepers in a row have a clip missing, about 200 metres past kilometre post 14.',
        ja: '次に、14kmのキロポストから約200m先で、連続する3本のまくらぎのクリップが1個ずつ欠けています。',
      },
      { sp: 'A', en: 'Three in a row? Did you have any spares on you?', ja: '3本連続ですか。予備は持っていましたか。' },
      {
        sp: 'B',
        en: 'I had two, so I fitted them there and then. Only one sleeper is still missing a clip.',
        ja: '2個持っていたので、その場で取り付けました。クリップが欠けたままのまくらぎは、あと1本だけです。',
      },
      {
        sp: 'A',
        en: "Fine. I'll ask the night shift to fit the last one. And the fourth?",
        ja: 'わかりました。残りの1本は夜勤の班に取り付けてもらいます。4件目は？',
      },
      {
        sp: 'B',
        en: "There's a wet bed at kilometre 15.6. The sleepers are pumping under traffic, but the top still looks reasonable.",
        ja: '15.6km地点に噴泥があります。列車が通るとまくらぎが上下に動いていますが、高低はまだそれほど悪くないようです。',
      },
      {
        sp: 'A',
        en: "Let's monitor it and get the drainage checked. Can you put all four in the defect log, with photos?",
        ja: '経過を見ながら、排水を点検してもらいましょう。4件とも写真付きで不良箇所の記録に入れてもらえますか。',
      },
      {
        sp: 'B',
        en: "Will do. I'll include the exact locations and what's been done so far, and send it over by four.",
        ja: '承知しました。正確な位置とここまでの対応も書いて、4時までに送ります。',
      },
    ],
    tip: '報告は最初に件数と緊急度（four things, two urgent）を伝え、急ぐものから話すと、聞き手がすぐ手配を決められます。1件ずつは「何が → どこで → 何をしたか」の順に。',
  },
  {
    id: 'r-hand-measure',
    group: 'rail',
    sub: 'inspect',
    title: '軌間と水準を手で測る',
    titleEn: 'Taking Manual Measurements',
    lv: 4,
    emoji: '📐',
    goal: '軌間・水準の測定値を正確に読み上げて復唱し、限度値と比較できる',
    roles: [
      { id: 'A', name: 'Tom' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: "I'll read each one back to you.", ja: '1つずつ復唱します。', note: 'read back＝復唱する。数値の聞き違いを防ぐ基本' },
      {
        en: 'Was that sixty or sixteen?',
        ja: '60でしたか、16でしたか。',
        note: '-ty と -teen は聞き違えやすい。答える側は six-zero のように1桁ずつ言い直す',
      },
      { en: 'Can you take it again?', ja: 'もう一度測ってもらえますか。', note: 'take a reading＝測定値を取る。測り直しは re-measure / take another reading とも言う' },
      {
        en: 'The twist is seven millimetres over three metres.',
        ja: '平面性は3mで7mmです。',
        note: 'twist（平面性）は基長とセットで言う。日本の在来線は基長5mが一般的なので、3m基長などの海外の値と比べるときは注意',
      },
      { en: "That's still within our limit for this line speed.", ja: 'この線路最高速度での限度値には、まだ収まっています。' },
      { en: "I'd flag it for the tamping list.", ja: 'つき固めの候補リストに載せておきたいです。', note: "flag＝要注意の印を付ける。I'd ～ は控えめな提案" },
      { en: "Let's double-check the numbers before we sign the sheet.", ja: '記録表にサインする前に、数値をダブルチェックしましょう。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "Right, we'll take gauge and cross level every three metres through the curve, starting at the joint. I'll read, you write?",
        ja: 'よし、継目から始めて、曲線内を3mごとに軌間と水準を測りましょう。私が読むので、記録をお願いできますか。',
      },
      {
        sp: 'B',
        en: "Sure. Give me the gauge first, then the cant, and I'll read each one back to you.",
        ja: 'いいですよ。軌間、カントの順に言ってください。1つずつ復唱します。',
      },
      {
        sp: 'A',
        en: 'Position one, at the joint: gauge fourteen thirty-eight, cant seventy-two.',
        ja: '1点目、継目の位置。軌間1438、カント72。',
      },
      {
        sp: 'B',
        en: 'Position one: fourteen thirty-eight, so three mil wide, and cant seventy-two.',
        ja: '1点目、1438で3mmの拡大、カント72。',
      },
      {
        sp: 'A',
        en: 'Position two: fourteen thirty-nine, cant seventy. Position three: fourteen forty, cant sixty.',
        ja: '2点目、1439、カント70。3点目、1440、カント60。',
      },
      {
        sp: 'B',
        en: 'Position two, fourteen thirty-nine and seventy. Position three, fourteen forty, and was that sixty or sixteen?',
        ja: '2点目は1439とカント70。3点目は1440で、カントは60でしたか、16でしたか。',
      },
      { sp: 'A', en: 'Six-zero. Sixty.', ja: 'ろく、ゼロ。60です。' },
      {
        sp: 'B',
        en: "That's a ten-mil drop in three metres. Can you take it again, in case there's a stone under the gauge?",
        ja: '3mで10mmも下がっています。ゲージの下に石が挟まっているかもしれないので、もう一度測ってもらえますか。',
      },
      {
        sp: 'A',
        en: 'Good shout. There was a bit of ballast on the low rail... Right, cant sixty-three.',
        ja: 'いい指摘ですね。内軌側のレールにバラストのかけらが乗っていました。…よし、カント63。',
      },
      {
        sp: 'B',
        en: "Sixty-three, so the twist is seven millimetres over three metres. That's still within our limit for this line speed.",
        ja: '63ですね。すると平面性は3mで7mmです。この線路最高速度での限度値には、まだ収まっています。',
      },
      {
        sp: 'A',
        en: "True, but it's quite a sharp change on a curve like this. Should we do anything about it?",
        ja: '確かに。でも、こういう曲線では、かなり急な変化です。何か手を打ったほうがいいですかね。',
      },
      {
        sp: 'B',
        en: "I'd flag it for the tamping list and measure it again next week, in case it's getting worse.",
        ja: 'つき固めの候補リストに載せて、悪化していないか来週もう一度測るのがいいと思います。',
      },
      {
        sp: 'A',
        en: 'Makes sense. Will you note that we re-measured position three?',
        ja: 'そうですね。3点目を測り直したことを記録しておいてもらえますか。',
      },
      {
        sp: 'B',
        en: "Yes, I'll write 'ballast on rail head, re-measured' in the remarks column and initial it.",
        ja: 'はい、備考欄に「レール頭部にバラスト、再測定」と書いて、イニシャルを入れておきます。',
      },
      { sp: 'A', en: 'Great. Nine more positions to the end of the curve. Ready?', ja: 'よし。曲線の終わりまで、あと9点です。準備はいいですか。' },
      {
        sp: 'B',
        en: "Ready. And let's double-check the numbers before we sign the sheet.",
        ja: '大丈夫です。それと、記録表にサインする前に数値をダブルチェックしましょう。',
      },
    ],
    tip:
      '数値は聞き違えにくい言い方で。軌間1438は fourteen thirty-eight と2桁ずつ、sixty と sixteen のように紛らわしい数は six-zero と1桁ずつ言い直します。英国の現場では mm を mil と言うこともあります。',
  },
  {
    id: 'r-switch-inspection',
    group: 'rail',
    sub: 'inspect',
    title: '分岐器を検査する',
    titleEn: 'Inspecting a Set of Points',
    lv: 5,
    emoji: '🔀',
    goal: '分岐器の検査結果を説明し、信号担当と調整して補修を計画できる',
    roles: [
      { id: 'A', name: 'Ravi' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'The most serious is a chip on the left-hand switch rail.',
        ja: '最も深刻なのは、左のトングレールの欠けです。',
        note: '所見が複数あるときは最も重いものから。chip＝欠け',
      },
      { en: "It's within the limit, but only just.", ja: '限度値内ですが、ぎりぎりです。', note: 'but only just＝かろうじて。英国でよく使う' },
      {
        en: 'Sorry, at the back drive or at the toe?',
        ja: 'すみません、バックドライブの位置ですか、先端ですか。',
        note: 'A or B? の形で聞き返すと、相手は一言で答えられる',
      },
      {
        en: "I'd rather not touch it until the signalling technician has checked detection.",
        ja: '信号の技術者が検知を確認するまでは、手を付けないでおきたいです。',
        note: "I'd rather not ～＝できれば～したくない。慎重な判断を丁寧に伝える",
      },
      {
        en: 'Any back drive adjustment has to be a joint job with signalling.',
        ja: 'バックドライブの調整は、必ず信号との合同作業です。',
        note: 'バックドライブはトングレールの密着と転てつ機の検知に関わるため、保線と信号が一緒に調整する',
      },
      {
        en: 'The flangeway has opened up by about four mil.',
        ja: 'フランジウェイが約4mm広がっています。',
        note: 'mil は millimetre の口語（英国）。open up＝（すき間が）広がる',
      },
      { en: 'That should bring it back to nominal.', ja: 'それで基準寸法に戻るはずです。' },
      { en: "I'd recommend a weld repair before it starts cracking.", ja: 'き裂が出始める前に、溶接補修をお勧めします。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "So, you've had a good look at the points at Northgate Junction. What have we got?",
        ja: 'さて、ノースゲート分岐点の分岐器をよく見てもらいましたね。どうでしたか。',
      },
      {
        sp: 'B',
        en: 'A few things. The most serious is a chip on the left-hand switch rail, about 400 millimetres from the toe.',
        ja: 'いくつかあります。最も深刻なのは左のトングレールの欠けで、先端から約400mmの位置です。',
      },
      {
        sp: 'A',
        en: "How bad is it? If a flange can climb it, we're looking at a derailment risk.",
        ja: 'どの程度ですか。フランジが乗り上がれるようなら、脱線の危険があります。',
      },
      {
        sp: 'B',
        en: "It's about three mil deep with rounded edges. Measured with the damage gauge, it's within the limit, but only just.",
        ja: '深さは約3mmで、縁は丸くなっています。損傷ゲージで測ると限度値内ですが、ぎりぎりです。',
      },
      {
        sp: 'A',
        en: "Then let's get it dressed with a grinder and check it weekly. What's next?",
        ja: 'では、グラインダーで整形して、毎週確認しましょう。次は？',
      },
      {
        sp: 'B',
        en: "The right-hand switch rail isn't closing fully against the stock rail at the back drive. There's a gap of about five millimetres.",
        ja: '右のトングレールが、バックドライブの位置で基本レールに完全に密着していません。約5mmのすき間があります。',
      },
      {
        sp: 'A',
        en: 'Sorry, at the back drive or at the toe? That makes a big difference for detection.',
        ja: 'すみません、バックドライブの位置ですか、先端ですか。密着検知にとっては大違いです。',
      },
      {
        sp: 'B',
        en: "At the back drive, not the toe. I'd rather not touch it until the signalling technician has checked detection.",
        ja: '先端ではなく、バックドライブの位置です。信号の技術者が検知を確認するまでは、手を付けないでおきたいです。',
      },
      {
        sp: 'A',
        en: "Agreed, any back drive adjustment has to be a joint job with signalling. I'll ask Kwame to check detection today.",
        ja: 'そうですね。バックドライブの調整は、必ず信号との合同作業です。今日中にクワメに検知を確認してもらいます。',
      },
      {
        sp: 'B',
        en: 'Thanks. Next, the check rail is worn on the face, so the flangeway has opened up by about four mil.',
        ja: 'ありがとうございます。次に、ガードレールの当たり面が摩耗して、フランジウェイが約4mm広がっています。',
      },
      {
        sp: 'A',
        en: "So it isn't keeping the wheels off the crossing nose properly. Can we pack it out?",
        ja: 'それでは、車輪をクロッシングのノーズからきちんと離せていませんね。調整板を入れて詰められますか。',
      },
      {
        sp: 'B',
        en: "I think so. There's room for a four-mil shim, and that should bring it back to nominal.",
        ja: 'できると思います。4mmの調整板を入れる余地があるので、それで基準寸法に戻るはずです。',
      },
      {
        sp: 'A',
        en: 'Good. And the crossing nose? The last report mentioned some lipping.',
        ja: 'よし。クロッシングのノーズはどうですか。前回の報告では、リッピングが指摘されていました。',
      },
      {
        sp: 'B',
        en: "It's got worse: there's more lipping, and about six mil of wear on the nose. I'd recommend a weld repair before it starts cracking.",
        ja: '悪化しています。リッピングが進み、ノーズに約6mmの摩耗もあります。き裂が出始める前に、溶接補修をお勧めします。',
      },
      {
        sp: 'A',
        en: "Fine. Let's do the lot on Thursday night, so we only need one possession.",
        ja: 'わかりました。全部木曜の夜にまとめてやって、線路閉鎖を1回で済ませましょう。',
      },
      {
        sp: 'B',
        en: "Good idea. I'll write up the findings with photos and send the work plan to you and Kwame by tomorrow.",
        ja: 'いいですね。写真付きで検査結果をまとめて、明日までに作業計画をあなたとクワメさんに送ります。',
      },
    ],
    tip:
      '英国の現場では分岐器を points（a set of points）と呼ぶことが多く、トングレール先端は toe、クロッシング先端は nose。トングレールの密着やバックドライブは信号の検知に関わるため、調整は信号担当と合同で行うのが原則です。',
  },
  {
    id: 'r-ultrasonic',
    group: 'rail',
    sub: 'inspect',
    title: '超音波探傷の結果',
    titleEn: 'Ultrasonic Test Results',
    lv: 5,
    emoji: '🔍',
    goal: '探傷で見つかったきずの位置・分類を確認し、緊急の措置を決定できる',
    roles: [
      { id: 'A', name: 'Sean' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'It looks like a transverse defect in the head.',
        ja: '頭部の横裂のようです。',
        note: 'transverse＝横方向。頭部の横裂は折損につながりやすく、最も警戒すべききずの1つ',
      },
      {
        en: 'Is it in the weld itself or in the parent rail?',
        ja: '溶接部そのものですか、それとも母材ですか。',
        note: 'parent rail＝母材。溶接部か母材かで UIC 712 の分類（4xx か 2xx か）が変わる',
      },
      { en: 'Have you confirmed it with a second scan?', ja: '2回目の探傷で確認しましたか。' },
      {
        en: "I'll ask Control for an emergency speed restriction.",
        ja: '指令に緊急速度制限を依頼します。',
        note: 'ESR（emergency speed restriction）は突発の緊急速度制限。計画的なものは TSR',
      },
      {
        en: 'Will standard fishplates clear the weld collar?',
        ja: '普通の継目板は、溶接部の余盛りに当たらずに付けられますか。',
        note: 'clear＝ぶつからずに収まる。weld collar＝溶接部の余盛り。当たるときは余盛りをよける段付きの joggled fishplates を使う',
      },
      { en: 'How long do we have to get the rail out?', ja: 'レールの撤去まで、どれくらい猶予がありますか。' },
      { en: "The restriction stays on until the rail's replaced.", ja: 'レールを交換するまで、速度制限は継続します。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "I need to flag something. We've got an indication in the rail head on the down line, close to a thermite weld.",
        ja: '報告しておきたいことがあります。下り線のレール頭部、テルミット溶接部の近くで、きずエコーが出ました。',
      },
      {
        sp: 'B',
        en: 'OK. Can you give me the exact location and how far it is from the weld?',
        ja: 'わかりました。正確な位置と、溶接部からの距離を教えてもらえますか。',
      },
      {
        sp: 'A',
        en: 'Left rail at 32.418 kilometres, about 200 millimetres from the weld. It looks like a transverse defect in the head.',
        ja: '左レール、32.418km、溶接部から約200mmです。頭部の横裂のようです。',
      },
      {
        sp: 'B',
        en: 'How big is it, and is it in the weld itself or in the parent rail?',
        ja: '大きさはどれくらいですか。それと、溶接部そのものですか、それとも母材ですか。',
      },
      {
        sp: 'A',
        en: "Parent rail, well clear of the collar. I'd class it as a UIC two-one-one, about 20 millimetres across.",
        ja: '母材で、余盛りからは十分離れています。UIC の211に分類します。大きさは約20mmです。',
      },
      {
        sp: 'B',
        en: "That's a significant defect. Have you confirmed it with a second scan?",
        ja: '重大なきずですね。2回目の探傷で確認しましたか。',
      },
      {
        sp: 'A',
        en: 'Yes, I re-scanned it by hand with a 70-degree probe from both directions. Same result.',
        ja: 'はい、70度探触子で、両方向から手で再探傷しました。結果は同じです。',
      },
      {
        sp: 'B',
        en: "Right. I'll ask Control for an emergency speed restriction of 30 km/h over the site straight away.",
        ja: 'わかりました。すぐに指令に、この箇所に時速30kmの緊急速度制限をかけるよう依頼します。',
      },
      {
        sp: 'A',
        en: "Good. Shall we fit emergency fishplates while we're on site?",
        ja: '了解です。現場にいるうちに、応急の継目板を取り付けましょうか。',
      },
      {
        sp: 'B',
        en: 'Yes, please. Will standard fishplates clear the weld collar, or do we need joggled ones?',
        ja: 'はい、お願いします。普通の継目板は溶接部の余盛りに当たらずに付けられますか。それとも段付きの継目板が必要ですか。',
      },
      {
        sp: 'A',
        en: "Not at 200 mil, they won't. We've got joggled fishplates and clamps in the van, so we'll use those.",
        ja: '200mmだと当たってしまいます。車に段付きの継目板とクランプがあるので、それを使います。',
      },
      { sp: 'B', en: 'Great. How long do we have to get the rail out?', ja: '助かります。そのレールの撤去まで、どれくらい猶予がありますか。' },
      {
        sp: 'A',
        en: "Our company standard gives us 72 hours for a defect this size. The restriction stays on until the rail's replaced.",
        ja: 'この大きさのきずなら、社内基準では72時間以内です。レールを交換するまで、速度制限は継続します。',
      },
      {
        sp: 'B',
        en: "Then let's cut it out in tomorrow night's possession and take the old weld out with it.",
        ja: 'では、明日の夜の線路閉鎖で切り取って、古い溶接部も一緒に撤去しましょう。',
      },
      {
        sp: 'A',
        en: "Agreed. I've paint-marked the rail, and I'll upload the scan traces and photos to the defect database tonight.",
        ja: '同感です。レールにはペンキで印を付けました。探傷波形と写真は、今夜損傷データベースに登録します。',
      },
      {
        sp: 'B',
        en: 'Thanks, Sean. So, to confirm: a two-one-one at 32.418, left rail, 30 km/h now, fishplates on today, and the rail out tomorrow night.',
        ja: 'ありがとうございます、ショーンさん。確認します。32.418km、左レールの211、今から時速30km制限、今日中に継目板取付け、明日の夜にレール撤去ですね。',
      },
    ],
    tip: '探傷結果は「位置（キロ程・左右）→ 部位（頭部か、溶接部か母材か）→ 大きさ・分類 → 再探傷の有無」の順に確認します。最後に So, to confirm: で措置を復唱すると、聞き違いを防げます。',
  },
  {
    id: 'r-recording-review',
    group: 'rail',
    sub: 'inspect',
    title: '軌道検測データのレビュー',
    titleEn: 'Reviewing Track Recording Data',
    lv: 5,
    emoji: '📈',
    goal: '軌道狂いの値と限界値を比較し、対応を議論できる',
    roles: [
      { id: 'A', name: 'Marta' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'It exceeds the intervention limit.', ja: '介入限界を超えています。', note: 'exceed＝超える。「下回っている」は be below' },
      { en: "It's still below the immediate action limit.", ja: '即時対応限界はまだ下回っています。' },
      {
        en: 'It shows up in the same place on the last three runs.',
        ja: '直近3回の走行で同じ位置に出ています。',
        note: 'データの異常値（spike）ではないことを示す根拠の言い方',
      },
      { en: 'The standard deviation has been rising steadily since spring.', ja: '標準偏差は春から着実に上がっています。' },
      { en: 'We should check the drainage at this location.', ja: 'この箇所の排水を確認すべきです。' },
      {
        en: "Tamping alone won't last if the formation is wet.",
        ja: '路盤が湿っていたら、つき固めだけでは長持ちしません。',
        note: 'formation（路盤）は英国の用語。米国では subgrade',
      },
      {
        en: 'Could we use hand-held tampers as a stopgap?',
        ja: 'つなぎとして、タイタンパで補修できませんか。',
        note: 'stopgap＝本格的な対応までのつなぎ・応急策',
      },
      { en: "Let's re-check it on the next recording run.", ja: '次の検測走行で再確認しましょう。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "Shall we go through last night's recording run? The main concern is a twist fault on the down line at 45.2 kilometres.",
        ja: '昨夜の検測走行を見ていきましょうか。一番の懸念は、下り線45.2km地点の平面性狂いです。',
      },
      {
        sp: 'B',
        en: "I saw that. It exceeds the intervention limit, but it's still below the immediate action limit.",
        ja: '見ました。介入限界は超えていますが、即時対応限界はまだ下回っています。',
      },
      {
        sp: 'A',
        en: "So no speed restriction yet. But are we sure it's real, and not just a spike in the data?",
        ja: 'では、まだ速度制限は不要ですね。でも、データのノイズではなく、本当に狂いがあると言い切れますか。',
      },
      {
        sp: 'B',
        en: "Fairly sure. It shows up in the same place on the last three runs, and it's slightly worse each time.",
        ja: 'かなり確かです。直近3回の走行で同じ位置に出ていて、毎回少しずつ悪くなっています。',
      },
      { sp: 'A', en: 'Right. And the longitudinal level around there?', ja: 'なるほど。その付近の高低はどうですか。' },
      {
        sp: 'B',
        en: 'For that 200-metre section, the standard deviation has been rising steadily since spring.',
        ja: 'その200m区間では、標準偏差が春から着実に上がっています。',
      },
      {
        sp: 'A',
        en: 'That often points to a drainage problem. Has anyone reported a wet bed there?',
        ja: 'それは排水の問題であることが多いですね。そこで噴泥の報告はありましたか。',
      },
      {
        sp: 'B',
        en: 'Yes, the patrol reported mud on the sleepers last month. We should check the drainage at this location.',
        ja: 'はい、先月の巡回で、まくらぎの上に泥が上がっていると報告がありました。この箇所の排水を確認すべきです。',
      },
      {
        sp: 'A',
        en: "Agreed. Tamping alone won't last if the formation is wet.",
        ja: '同感です。路盤が湿っていたら、つき固めだけでは長持ちしません。',
      },
      {
        sp: 'B',
        en: "Exactly. Let's clean out the track drain first and schedule tamping within two weeks.",
        ja: 'その通りです。まず線路排水溝を清掃して、2週間以内につき固めを予定しましょう。',
      },
      {
        sp: 'A',
        en: "Two weeks is tight. The tamper's booked elsewhere until the 20th.",
        ja: '2週間は厳しいですね。マルタイは20日まで別の現場で予定が埋まっています。',
      },
      {
        sp: 'B',
        en: "In that case, let's confirm it by hand first. Could we use hand-held tampers as a stopgap?",
        ja: 'それなら、まず手検測で確かめましょう。つなぎとして、タイタンパで補修できませんか。',
      },
      {
        sp: 'A',
        en: "That should keep it below the immediate action limit until the machine's free. Can you raise the work orders?",
        ja: 'それなら、機械が空くまで即時対応限界を超えずに済むはずです。作業指示を起票してもらえますか。',
      },
      {
        sp: 'B',
        en: "Sure. I'll raise three: drain cleaning, hand tamping this week, and machine tamping after the 20th.",
        ja: 'はい。排水溝の清掃、今週のタイタンパによるつき固め、20日以降のマルタイによるつき固めの3件を起票します。',
      },
      {
        sp: 'A',
        en: "And let's re-check it on the next recording run to make sure the repair has held.",
        ja: 'それと、次の検測走行で、補修がもっているか再確認しましょう。',
      },
      {
        sp: 'B',
        en: "Absolutely. I'll put it on the watch list and report back after the next run.",
        ja: 'もちろんです。要注意リストに入れて、次の走行の後に報告します。',
      },
    ],
    tip:
      'EN 13848-5 の3段階：AL（超えたら状態を分析し、保守計画に反映）、IL（次の検査までに IAL に達しないよう補修）、IAL（速度制限・運転中止などで直ちに対処）。この区別を押さえると、海外の技術者との議論がかみ合います。',
  },
]

export default scenes
