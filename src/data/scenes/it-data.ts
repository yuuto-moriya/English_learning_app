import type { Scene } from '@/lib/types'

/** クラウド・データ・AI（IT）。分析結果の報告・生成AIの導入・クラウドの費用・クラウド移行・遅いデータベース */
const scenes: Scene[] = [
  {
    id: 'i-data-report',
    group: 'it',
    sub: 'data',
    title: '分析結果を説明する',
    titleEn: 'Presenting Data Insights',
    lv: 4,
    emoji: '📊',
    goal: '分析結果と注意点を説明し、次の施策を提案できる',
    roles: [
      { id: 'A', name: 'Ms. Bianchi' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Let me walk you through the main findings.',
        ja: '主な結果を順にご説明します。',
        note: 'walk 人 through ~ は「順を追って説明する」。報告の切り出しの定番',
      },
      {
        en: "Correlation doesn't necessarily mean causation.",
        ja: '相関があるからといって、因果関係があるとは限りません。',
        note: 'not necessarily で「必ずしも〜ない」。言い切りを避けられる',
      },
      {
        en: 'Did you break it down by plan?',
        ja: 'プラン別に分けて見ましたか。',
        note: 'break down by ~ で「〜別に分ける」。by region, by age なども',
      },
      { en: 'Most of the increase came from the basic plan.', ja: '増加の大部分はベーシックプランによるものです。' },
      { en: 'Is that difference statistically significant?', ja: 'その差は統計的に有意ですか。' },
      {
        en: 'One caveat is that we only have two months of data.',
        ja: 'ひとつ注意点があり、データが2か月分しかありません。',
        note: 'caveat は「但し書き・注意点」。分析の限界を自分から先に言うと信頼される',
      },
      { en: "It's too early to draw conclusions.", ja: '結論を出すにはまだ早いです。' },
      {
        en: "I'd recommend running an A/B test.",
        ja: 'A/B テストの実施をおすすめします。',
        note: 'recommend の後は動詞の -ing。recommend to run とは言わない',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: "Thanks for putting this together. So, what's the dashboard telling us?",
        ja: 'まとめてくれてありがとうございます。それで、ダッシュボードから何が分かりますか。',
      },
      {
        sp: 'B',
        en: 'Let me walk you through the main findings. Monthly churn went up from 2% to 3.5% after the price increase in March.',
        ja: '主な結果を順にご説明します。3月の値上げの後、月間の解約率が2%から3.5%に上がりました。',
      },
      {
        sp: 'A',
        en: "That's a big jump. So the price increase is driving customers away?",
        ja: '大きな上昇ですね。つまり、値上げで顧客が離れているということですか。',
      },
      {
        sp: 'B',
        en: "It might be. The timing lines up, but correlation doesn't necessarily mean causation.",
        ja: 'その可能性はあります。時期は一致していますが、相関があるからといって因果関係があるとは限りません。',
      },
      { sp: 'A', en: 'What else could explain it?', ja: 'ほかに何が原因として考えられますか。' },
      {
        sp: 'B',
        en: 'A competitor launched a cheaper plan in the same month, so some customers may have switched for that reason.',
        ja: '同じ月に競合他社がもっと安いプランを出したので、それが理由で乗り換えた顧客もいるかもしれません。',
      },
      { sp: 'A', en: 'Fair point. Did you break it down by plan?', ja: '確かにそうですね。プラン別に分けて見ましたか。' },
      {
        sp: 'B',
        en: 'Yes. Most of the increase came from the basic plan, where churn doubled from 3% to 6%, while premium stayed at about 1%.',
        ja: 'はい。増加の大部分はベーシックプランによるもので、解約率が3%から6%に倍増した一方、プレミアムは約1%のままでした。',
      },
      { sp: 'A', en: 'Is that difference statistically significant?', ja: 'その差は統計的に有意ですか。' },
      {
        sp: 'B',
        en: 'For the basic plan, yes. One caveat is that we only have two months of data since the increase.',
        ja: 'ベーシックプランについては、はい、有意です。ひとつ注意点があり、値上げ後のデータは2か月分しかありません。',
      },
      {
        sp: 'A',
        en: "So it's too early to draw conclusions. What would you suggest we do?",
        ja: 'では、結論を出すにはまだ早いということですね。どうするのがいいと思いますか。',
      },
      {
        sp: 'B',
        en: "I'd recommend running an A/B test. We'd randomly offer half of our basic-plan customers the old price for three months and compare churn.",
        ja: 'A/B テストの実施をおすすめします。ベーシックプランの顧客の半数を無作為に選んで3か月間旧価格で提供し、解約率を比べます。',
      },
      {
        sp: 'A',
        en: "That would separate the effect of the price from the competitor's new plan. How soon could we start?",
        ja: 'それなら、価格の影響と競合の新プランの影響を切り分けられますね。いつから始められますか。',
      },
      {
        sp: 'B',
        en: 'If you can approve the offer by Friday, we could start on the first of next month.',
        ja: '金曜日までに旧価格での提供を承認していただければ、来月1日から始められます。',
      },
      {
        sp: 'A',
        en: "Let's do it. Could you put the proposal on one page for the leadership meeting?",
        ja: 'やりましょう。経営会議用に、提案を1ページにまとめてもらえますか。',
      },
      {
        sp: 'B',
        en: "Sure. I'll send it to you by Wednesday, with the segment charts attached.",
        ja: '承知しました。水曜日までに、セグメント別のグラフを添付してお送りします。',
      },
    ],
    tip: 'データの報告は『結果 → 内訳 → 注意点（caveat）→ 提案』の順に。相関だけで原因と言い切らず、「The timing lines up, but ~」のように控えめに言うと信頼されます。',
  },
  {
    id: 'i-ai-adoption',
    group: 'it',
    sub: 'data',
    title: '生成AIの導入を相談する',
    titleEn: 'Discussing Generative AI at Work',
    lv: 4,
    emoji: '🤖',
    goal: '生成AIの用途とリスクを説明し、ルールと試験導入を提案できる',
    roles: [
      { id: 'A', name: 'Mr. Clarke' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Those are good use cases.',
        ja: 'どちらも良い活用例です。',
        note: 'use case は「用途・活用場面」。IT の会話で頻出',
      },
      {
        en: 'It can sound confident and still be wrong.',
        ja: '自信ありげでも、間違っていることがあります。',
        note: '生成AIの「もっともらしい誤り」を説明する言い方',
      },
      {
        en: 'Some free tools may use what you type to train their models.',
        ja: '無料のツールの中には、入力した内容をモデルの学習に使うおそれがあるものもあります。',
      },
      {
        en: "I wouldn't go that far.",
        ja: 'そこまでする必要はないと思います。',
        note: '相手の極端な案を、角を立てずに否定する',
      },
      {
        en: 'What kind of rules would you put in place?',
        ja: 'どんなルールを設けるといいでしょうか。',
        note: 'put ~ in place で「（ルール・仕組みを）導入する」',
      },
      { en: 'Have a person review everything before it goes out.', ja: '外に出す前に、人がすべて確認するようにしてください。' },
      {
        en: "I'd start with a pilot.",
        ja: '私ならまず試験導入から始めます。',
        note: 'pilot は「試験導入」。いきなり全体に広げない提案に',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: "A few people in my department want to start using generative AI. Do you think that's a good idea?",
        ja: '部署の何人かが生成AIを使い始めたいと言っています。いい考えだと思いますか。',
      },
      {
        sp: 'B',
        en: 'It can be, if we use it for the right tasks. What would they mainly use it for?',
        ja: '適した業務に使えば、いい考えになり得ます。主に何に使う予定ですか。',
      },
      {
        sp: 'A',
        en: 'Mostly drafting emails and summarizing meeting notes. Those eat up hours every week.',
        ja: '主にメールの下書きと議事録の要約です。それに毎週何時間も取られているので。',
      },
      {
        sp: 'B',
        en: "Those are good use cases. It's great for first drafts, but someone still needs to check the output.",
        ja: 'どちらも良い活用例です。たたき台作りには最適ですが、それでも出力は誰かが確認する必要があります。',
      },
      { sp: 'A', en: "Really? Isn't it usually accurate?", ja: 'そうなんですか。たいていは正確なのではないですか。' },
      {
        sp: 'B',
        en: 'Not always. It can sound confident and still be wrong, especially with numbers and names.',
        ja: 'いつもではありません。自信ありげでも間違っていることがあり、特に数字や名前で起きやすいです。',
      },
      {
        sp: 'A',
        en: 'I see. What about confidential information, like client data?',
        ja: 'なるほど。顧客データのような機密情報はどうですか。',
      },
      {
        sp: 'B',
        en: "That's the bigger risk. Some free tools may use what you type to train their models.",
        ja: 'そちらのほうが大きなリスクです。無料のツールの中には、入力した内容をモデルの学習に使うおそれがあるものもあります。',
      },
      {
        sp: 'A',
        en: "That's worrying. Should we just ban it, then?",
        ja: 'それは心配ですね。それなら、いっそ禁止したほうがいいでしょうか。',
      },
      {
        sp: 'B',
        en: "I wouldn't go that far. The company already has an approved AI tool that doesn't use our inputs for training.",
        ja: 'そこまでする必要はないと思います。会社にはすでに、入力内容を学習に使わない承認済みのAIツールがあります。',
      },
      {
        sp: 'A',
        en: 'Good to know. What kind of rules would you put in place?',
        ja: 'それはいいことを聞きました。どんなルールを設けるといいでしょうか。',
      },
      {
        sp: 'B',
        en: "Three simple ones: use only the approved tool, don't enter personal data, and have a person review everything before it goes out.",
        ja: '簡単なものを3つです。承認済みのツールだけを使うこと、個人情報を入力しないこと、外に出す前に人がすべて確認することです。',
      },
      {
        sp: 'A',
        en: 'That sounds reasonable. Should we roll it out to the whole department right away?',
        ja: '妥当ですね。すぐに部署全体に展開すべきでしょうか。',
      },
      {
        sp: 'B',
        en: "I'd start with a pilot. Let's try it with a team of five for a month and measure how much time it saves.",
        ja: '私ならまず試験導入から始めます。5人のチームで1か月試して、どれだけ時間を節約できるか測りましょう。',
      },
      {
        sp: 'A',
        en: 'Okay. Could you draft the guidelines and help me choose the pilot team?',
        ja: 'わかりました。ガイドラインの案を作って、試験導入のチーム選びを手伝ってもらえますか。',
      },
      {
        sp: 'B',
        en: "Of course. I'll send you a draft by Friday, and we can go over it together on Monday.",
        ja: 'もちろんです。金曜日までに案をお送りしますので、月曜日に一緒に確認しましょう。',
      },
    ],
    tip: "would を使った「I wouldn't go that far.」や「I'd start with ~」は、反対や提案を柔らかく伝える言い方です。上の立場の人に助言するときに便利です。",
  },
  {
    id: 'i-cost-review',
    group: 'it',
    sub: 'data',
    title: 'クラウドの費用を見直す',
    titleEn: 'Reviewing Cloud Costs',
    lv: 4,
    emoji: '💸',
    goal: '費用が増えた原因を説明し、削減策と再発防止を提案できる',
    roles: [
      { id: 'A', name: 'Olga' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'There are two main causes.', ja: '主な原因は2つあります。' },
      {
        en: 'How much is that costing us?',
        ja: 'その分で、いくらかかっているのですか。',
        note: '進行形で「いま実際にかかっている」費用を聞く',
      },
      {
        en: "I'll shut down the unused resources today.",
        ja: '使っていないリソースを今日中に停止します。',
        note: 'shut down は「（サーバーなどを）停止する」',
      },
      {
        en: 'Is there anything else we can do to bring costs down?',
        ja: 'ほかに費用を下げるためにできることはありますか。',
        note: 'bring down で「下げる」。cut costs も同じ意味',
      },
      {
        en: 'What does right-sizing mean?',
        ja: 'ライトサイジングとはどういう意味ですか。',
        note: '知らない用語は、遠慮せず What does ~ mean? で聞く',
      },
      {
        en: "The catch is that we pay even if we don't use them.",
        ja: '難点は、使わなくても料金を払うことです。',
        note: 'The catch is ~ は「ただし〜という落とし穴がある」。うまい話の条件を伝える',
      },
      {
        en: 'How do we stop this from happening again?',
        ja: '同じことが再び起きないようにするには、どうすればいいですか。',
        note: 'stop A from -ing で「A が〜するのを防ぐ」',
      },
      { en: "Let's tag every resource with its team and project.", ja: 'すべてのリソースに、チームとプロジェクトのタグを付けましょう。' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Our cloud bill jumped 40% last month, from $25,000 to $35,000. Do we know why?',
        ja: '先月、クラウドの請求額が2万5,000ドルから3万5,000ドルへと40%も跳ね上がりました。原因は分かっていますか。',
      },
      {
        sp: 'B',
        en: 'I looked into it, and there are two main causes. First, some test servers were left running after a load test.',
        ja: '調べたところ、主な原因は2つあります。1つ目は、負荷テストの後もテスト用のサーバーがいくつか動いたままになっていたことです。',
      },
      { sp: 'A', en: 'How much is that costing us?', ja: 'その分で、いくらかかっているのですか。' },
      {
        sp: 'B',
        en: "About $7,000 last month. I'll shut down the unused resources today, after checking with their owners.",
        ja: '先月は約7,000ドルです。担当者に確認したうえで、使っていないリソースを今日中に停止します。',
      },
      { sp: 'A', en: 'Please do. And the second cause?', ja: 'お願いします。2つ目の原因は？' },
      {
        sp: 'B',
        en: 'Data transfer. A new analytics job copies large amounts of data between regions every hour, which adds about $3,000 a month.',
        ja: 'データ転送です。新しい分析処理が1時間ごとに大量のデータをリージョン間でコピーしていて、それで月に約3,000ドル増えています。',
      },
      {
        sp: 'A',
        en: "I didn't realize moving data cost money. Can we fix that?",
        ja: 'データの移動にお金がかかるとは知りませんでした。直せますか。',
      },
      {
        sp: 'B',
        en: 'Yes. If we run the job in the same region as the data, most of that cost goes away.',
        ja: 'はい。データと同じリージョンでその処理を動かせば、その費用の大半はなくなります。',
      },
      {
        sp: 'A',
        en: 'Good. Is there anything else we can do to bring costs down?',
        ja: 'いいですね。ほかに費用を下げるためにできることはありますか。',
      },
      { sp: 'B', en: 'We could also right-size some servers.', ja: '一部のサーバーをライトサイジングすることもできます。' },
      { sp: 'A', en: 'Sorry, what does right-sizing mean?', ja: 'すみません、ライトサイジングとはどういう意味ですか。' },
      {
        sp: 'B',
        en: 'It means moving to smaller, cheaper servers that fit the actual load. Many of ours use less than 20% of their CPU.',
        ja: '実際の負荷に見合った、より小さく安いサーバーに切り替えることです。うちのサーバーの多くは、CPU 使用率が20%未満です。',
      },
      {
        sp: 'A',
        en: 'Makes sense. And the servers we need all the time?',
        ja: 'なるほど。では、常に必要なサーバーは？',
      },
      {
        sp: 'B',
        en: "For those, a one-year commitment discount could save about 30%. The catch is that we pay even if we don't use them.",
        ja: 'それらは1年間の利用を約束する割引で、約30%節約できます。難点は、使わなくても料金を払うことです。',
      },
      {
        sp: 'A',
        en: "That's fine for steady workloads. But how do we stop this from happening again?",
        ja: '安定して使う分なら問題ありませんね。でも、同じことが再び起きないようにするには、どうすればいいですか。',
      },
      {
        sp: 'B',
        en: "Let's tag every resource with its team and project, and set an alert at 80% of each team's budget. I'll have a plan ready by Thursday.",
        ja: 'すべてのリソースにチームとプロジェクトのタグを付け、各チームの予算の80%でアラートが出るようにしましょう。木曜日までに計画を用意します。',
      },
    ],
    tip: '費用の削減は『止める（使っていないものを停止）→ 小さくする（right-size）→ 約束して安くする（commitment）→ 見張る（タグと予算アラート）』の順に考えると、説明しやすくなります。',
  },
  {
    id: 'i-cloud-migration',
    group: 'it',
    sub: 'data',
    title: 'クラウド移行の打ち合わせ',
    titleEn: 'Planning a Cloud Migration',
    lv: 5,
    emoji: '☁️',
    goal: '移行の方針・リスク・切り替え計画を議論できる',
    roles: [
      { id: 'A', name: 'Cloud architect' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "I'd suggest migrating in phases.",
        ja: '段階的に移行することをおすすめします。',
        note: 'suggest の後は -ing か that 節（I\'d suggest that we migrate ~）。suggest to migrate は誤り',
      },
      { en: "What's the biggest risk?", ja: '最大のリスクは何ですか。' },
      {
        en: "We can't afford to lose a single record.",
        ja: '1件の記録も失うわけにはいきません。',
        note: "can't afford to ~ は「〜する余裕はない＝〜するわけにはいかない」",
      },
      { en: 'How long will the downtime be?', ja: '停止時間はどのくらいになりますか。' },
      {
        en: 'Are there any batch jobs or integrations we should know about?',
        ja: '把握しておくべきバッチ処理や連携はありますか。',
        note: '~ we should know about で「事前に知っておくべき〜」。前提の確認に幅広く使える',
      },
      {
        en: 'Glad you mentioned that.',
        ja: '言っていただいてよかったです。',
        note: '相手が大事な情報を出してくれたときの一言',
      },
      {
        en: "We'll prepare a rollback plan in case anything goes wrong.",
        ja: '何か問題があった場合に備えて、切り戻し計画を用意します。',
      },
      { en: 'Could you put all of this in a migration plan?', ja: 'ここまでの内容を移行計画にまとめていただけますか。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "I've gone through your current setup. What kind of timeline do you have in mind?",
        ja: '現在の構成は一通り拝見しました。どのようなスケジュールをお考えですか。',
      },
      {
        sp: 'B',
        en: 'We want to move our on-premises servers to the cloud by next spring, ideally without disrupting daily operations.',
        ja: '来年の春までに、できれば日々の業務に支障を出さずに、オンプレミスのサーバーをクラウドに移したいと考えています。',
      },
      {
        sp: 'A',
        en: "That's doable. I'd suggest migrating in phases, starting with the less critical systems.",
        ja: '実現できます。重要度の低いシステムから、段階的に移行することをおすすめします。',
      },
      {
        sp: 'B',
        en: 'Agreed. The maintenance management system is the most critical, so it should go last.',
        ja: '同感です。保守管理システムがいちばん重要なので、最後にすべきですね。',
      },
      {
        sp: 'A',
        en: "Makes sense. From your side, what's the biggest risk?",
        ja: '妥当ですね。そちらから見て、最大のリスクは何ですか。',
      },
      {
        sp: 'B',
        en: "Data migration, without a doubt. We have twenty years of data, and we can't afford to lose a single record.",
        ja: '間違いなくデータ移行です。20年分のデータがあり、1件の記録も失うわけにはいきません。',
      },
      {
        sp: 'A',
        en: "We'll replicate the data continuously and run both systems in parallel for a month, comparing record counts and checksums daily.",
        ja: 'データを継続的に複製し、1か月間は両方のシステムを並行稼働させて、件数とチェックサムを毎日照合します。',
      },
      {
        sp: 'B',
        en: "That's reassuring. How long will the downtime be for the final cutover?",
        ja: 'それなら安心です。最後の切り替えでの停止時間はどのくらいになりますか。',
      },
      {
        sp: 'A',
        en: 'About four hours, overnight. Before we set a date, are there any batch jobs or integrations we should know about?',
        ja: '夜間に約4時間です。日程を決める前に、把握しておくべきバッチ処理や他システムとの連携はありますか。',
      },
      {
        sp: 'B',
        en: 'Actually, yes. The maintenance system sends a file to the finance system every night at 2 a.m.',
        ja: '実はあります。保守管理システムが毎晩午前2時に、財務システムへファイルを送っています。',
      },
      {
        sp: 'A',
        en: "Glad you mentioned that. We'll either schedule the cutover around it or run that job manually afterwards.",
        ja: '言っていただいてよかったです。その処理を避けて切り替えの時間を組むか、切り替え後に手動で実行するかのどちらかにします。',
      },
      {
        sp: 'B',
        en: "Let's schedule around it, then. Could we start right after the 2 a.m. job finishes, early Sunday morning?",
        ja: 'では、避ける方向で組みましょう。日曜の早朝、午前2時の処理が終わった直後に始められますか。',
      },
      {
        sp: 'A',
        en: "That works. We'll prepare a rollback plan in case anything goes wrong, with a go/no-go decision at 5 a.m.",
        ja: 'それで大丈夫です。何か問題があった場合に備えて切り戻し計画を用意し、午前5時に続行か中止かを判断します。',
      },
      {
        sp: 'B',
        en: "Just to confirm, if the checks haven't all passed by 5 a.m., we switch back to the on-premises system?",
        ja: '確認ですが、午前5時までにチェックがすべて通っていなければ、オンプレミスのシステムに戻すということですね。',
      },
      {
        sp: 'A',
        en: "Exactly. And we'll keep the old servers on standby for two weeks after cutover, just to be safe.",
        ja: 'その通りです。それに念のため、切り替え後2週間は旧サーバーを待機させておきます。',
      },
      {
        sp: 'B',
        en: 'Great. Could you put all of this in a migration plan so I can take it to our steering committee?',
        ja: 'いいですね。ステアリングコミッティにかけられるよう、ここまでの内容を移行計画にまとめていただけますか。',
      },
    ],
    tip: '切り替えでは、続行か中止かを決める「go/no-go」の時刻を先に決めておくのが定番です。「in phases」（段階的に）「in parallel」（並行して）「in case ~」（〜に備えて）も計画の説明でよく使います。',
  },
  {
    id: 'i-slow-db',
    group: 'it',
    sub: 'data',
    title: 'データベースが遅い',
    titleEn: 'Fixing a Slow Database',
    lv: 5,
    emoji: '🐢',
    goal: '遅い原因を実行計画から説明し、対策と副作用を議論できる',
    roles: [
      { id: 'A', name: 'Viktor' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'How slow are we talking?',
        ja: 'どのくらい遅いのですか。',
        note: '口語で程度を聞く言い方。How much are we talking? なら金額',
      },
      { en: 'Have you looked at the execution plan?', ja: '実行計画は見ましたか。' },
      {
        en: "It's doing a full table scan.",
        ja: 'テーブルをフルスキャンしています。',
        note: '進行形で「実際にそう動いている」と説明する',
      },
      {
        en: "Indexes aren't free.",
        ja: 'インデックスにもコストはあります。',
        note: "~ aren't free は「タダではない＝代償がある」。トレードオフの指摘に",
      },
      {
        en: 'Caching would hide the problem, not fix it.',
        ja: 'キャッシュは問題を隠すだけで、解決にはなりません。',
        note: 'A, not B の形で、対比を短く言える',
      },
      { en: "Let's try it on staging first.", ja: 'まずステージングで試しましょう。' },
      {
        en: 'The query dropped from eight seconds to about 20 milliseconds.',
        ja: 'クエリが8秒から約20ミリ秒に短縮されました。',
        note: '改善の報告は from A to B で数字を並べると伝わる',
      },
      {
        en: "I'll keep an eye on write latency for a few days.",
        ja: '数日間、書き込みの遅延を注視します。',
        note: 'keep an eye on ~ は「〜を気にかけて見ておく」',
      },
    ],
    lines: [
      {
        sp: 'A',
        en: 'You mentioned the order history page is slow. How slow are we talking?',
        ja: '注文履歴のページが遅いと言っていましたね。どのくらい遅いのですか。',
      },
      {
        sp: 'B',
        en: 'It takes about nine seconds to load, and one query accounts for eight of them.',
        ja: '表示に約9秒かかっていて、そのうち8秒は1つのクエリによるものです。',
      },
      { sp: 'A', en: 'Have you looked at the execution plan?', ja: '実行計画は見ましたか。' },
      {
        sp: 'B',
        en: "Yes. It's doing a full table scan on the orders table, which has about 30 million rows.",
        ja: 'はい。注文テーブルをフルスキャンしていて、そのテーブルには約3,000万行あります。',
      },
      {
        sp: 'A',
        en: "So there's no index on the customer ID column?",
        ja: 'つまり、顧客 ID の列にインデックスがないということですか。',
      },
      {
        sp: 'B',
        en: "Right. I'd like to add a composite index on customer ID and order date, since we also sort by date.",
        ja: 'その通りです。日付で並べ替えもしているので、顧客 ID と注文日の複合インデックスを追加したいと思います。',
      },
      {
        sp: 'A',
        en: "Good thinking, but indexes aren't free. Every insert has to update the index too.",
        ja: 'いい考えですね。でも、インデックスにもコストはあります。挿入のたびに、インデックスも更新しなければなりません。',
      },
      {
        sp: 'B',
        en: 'I checked that. At peak, we insert about 50 orders a second, so the extra write cost should be small.',
        ja: 'それは確認しました。ピーク時で毎秒約50件の注文を挿入しているので、書き込みの負担の増加はわずかなはずです。',
      },
      {
        sp: 'A',
        en: 'Fair enough. Wouldn\'t it be quicker to just cache the page, though?',
        ja: 'なるほど。でも、ページをキャッシュするだけのほうが手っ取り早くないですか。',
      },
      {
        sp: 'B',
        en: 'Caching would hide the problem, not fix it. Besides, order history changes every time a customer buys something.',
        ja: 'キャッシュは問題を隠すだけで、解決にはなりません。それに、注文履歴はお客様が何かを買うたびに変わります。',
      },
      {
        sp: 'A',
        en: "Good point. Let's try it on staging first, but keep in mind that staging only has a fraction of production data.",
        ja: '確かに。まずステージングで試しましょう。ただ、ステージングには本番データのごく一部しかないことに注意してください。',
      },
      {
        sp: 'B',
        en: 'I thought of that. I loaded a masked copy of production data yesterday, so the results should be realistic.',
        ja: 'それは考えてありました。昨日、マスキングした本番データのコピーを入れたので、実際に近い結果が出るはずです。',
      },
      {
        sp: 'A',
        en: 'Nice. Go ahead and create the index, then run the query again.',
        ja: 'いいですね。インデックスを作成して、もう一度クエリを実行してみてください。',
      },
      {
        sp: 'B',
        en: 'Done. The query dropped from eight seconds to about 20 milliseconds, and the plan now shows an index scan.',
        ja: 'できました。クエリが8秒から約20ミリ秒に短縮され、実行計画もインデックススキャンになっています。',
      },
      {
        sp: 'A',
        en: 'So the page should load in about a second. In production, build the index online so it doesn\'t block writes.',
        ja: 'それならページは1秒ほどで表示されるはずですね。本番では、書き込みを止めないよう、インデックスはオンラインで作成してください。',
      },
      {
        sp: 'B',
        en: "Will do. I'll build it tonight after peak hours, and I'll keep an eye on write latency for a few days.",
        ja: '了解です。今夜、ピークの時間帯が過ぎてから作成し、数日間は書き込みの遅延を注視します。',
      },
    ],
    tip: "性能の相談は『どれだけ遅いか（数字）→ 原因（実行計画）→ 対策 → 副作用』の順に。「~ aren't free」や「hide the problem, not fix it」のように、トレードオフを短く言える表現が便利です。",
  },
]

export default scenes
