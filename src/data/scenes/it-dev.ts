import type { Scene } from '@/lib/types'

/** 開発チーム（IT）。朝会・ペアプロ・コードレビュー・スプリント計画・振り返り・設計レビュー */
const scenes: Scene[] = [
  {
    id: 'i-standup',
    group: 'it',
    sub: 'dev',
    title: '朝会で進捗を報告する',
    titleEn: 'Daily Stand-Up',
    lv: 3,
    emoji: '⏱️',
    goal: '昨日やったこと・今日やること・困っていることを短く報告できる',
    roles: [
      { id: 'A', name: 'Daniel' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'Yesterday I finished the login screen.', ja: '昨日はログイン画面を仕上げました。' },
      { en: "Today I'm going to write unit tests.", ja: '今日は単体テストを書きます。' },
      {
        en: 'Could someone take a look at it today?',
        ja: '今日どなたか見ていただけますか。',
        note: 'take a look at は「ちょっと見てみる・確認する」。レビューや調査を頼むときの定番',
      },
      {
        en: "I'm blocked by an API issue.",
        ja: 'APIの問題で作業が止まっています。',
        note: 'blocked は「ほかの原因で先に進めない」。朝会では Any blockers?（妨げはある？）とよく聞かれる',
      },
      {
        en: 'Sorry, you cut out for a second.',
        ja: 'すみません、一瞬音声が途切れました。',
        note: "オンライン会議の定番。You're breaking up.（音声が途切れています）とも言う",
      },
      {
        en: 'Can we talk about it after the stand-up?',
        ja: 'その件は朝会のあとで相談できますか。',
        note: '朝会では深い議論をせず、関係者だけであとで話すのが一般的',
      },
      { en: "That's all from me.", ja: '私からは以上です。', note: "That's it for me. とも言う" },
    ],
    lines: [
      { sp: 'A', en: 'Morning, everyone. Yuto, do you want to start?', ja: 'おはようございます。ユウトさん、最初にお願いできますか。' },
      {
        sp: 'B',
        en: 'Sure. Yesterday I finished the login screen and opened a pull request.',
        ja: 'はい。昨日はログイン画面を仕上げて、プルリクエストを出しました。',
      },
      { sp: 'A', en: 'Nice. Has anyone reviewed it yet?', ja: 'いいですね。もう誰かレビューしましたか。' },
      { sp: 'B', en: 'Not yet. Could someone take a look at it today?', ja: 'まだです。今日どなたか見ていただけますか。' },
      {
        sp: 'A',
        en: "I can review it after lunch. What's your plan for today?",
        ja: 'お昼のあとに私がレビューしますよ。今日は何をする予定ですか。',
      },
      {
        sp: 'B',
        en: "Today I'm going to write unit tests for the payment feature.",
        ja: '今日は支払い機能の単体テストを書きます。',
      },
      { sp: 'A', en: 'Okay. Any blockers?', ja: '分かりました。何か作業の妨げになっていることはありますか。' },
      {
        sp: 'B',
        en: "Yes, I'm blocked by an API issue. The staging server keeps returning an error.",
        ja: 'はい、APIの問題で作業が止まっています。ステージングサーバーがエラーを返し続けるんです。',
      },
      {
        sp: 'A',
        en: 'Sorry, you cut out for a second. Which server did you say?',
        ja: 'すみません、一瞬音声が途切れました。どのサーバーと言いましたか。',
      },
      {
        sp: 'B',
        en: "The staging server. Since yesterday's deployment, the orders API has been returning a 500 error.",
        ja: 'ステージングサーバーです。昨日のデプロイ以降、注文APIが500エラーを返しています。',
      },
      { sp: 'A', en: "That's not good. Do you know what's causing it?", ja: 'それは困りましたね。原因は分かっていますか。' },
      {
        sp: 'B',
        en: 'Not yet, but it might be a config problem. Can we talk about it after the stand-up?',
        ja: 'まだですが、設定の問題かもしれません。その件は朝会のあとで相談できますか。',
      },
      {
        sp: 'A',
        en: "Sure. Let's get Priya to join us, since she handled yesterday's deployment.",
        ja: 'もちろん。プリヤさんにも入ってもらいましょう。昨日のデプロイを担当したのは彼女なので。',
      },
      {
        sp: 'B',
        en: "Thanks. In the meantime, I'll use a mock API so I can keep writing tests.",
        ja: 'ありがとうございます。それまでは、モックのAPIを使ってテストを書き進めます。',
      },
      { sp: 'A', en: 'Good idea. Anything else?', ja: 'いい考えですね。ほかには？' },
      { sp: 'B', en: "No, that's all from me.", ja: 'いいえ、私からは以上です。' },
    ],
    tip: '朝会は「昨日 → 今日 → blocker（作業を止めているもの）」を1人1〜2分で。原因の調査など込み入った話は「after the stand-up」に回すと、全員の時間を守れます。',
  },
  {
    id: 'i-pair-programming',
    group: 'it',
    sub: 'dev',
    title: 'ペアプログラミング',
    titleEn: 'Pair Programming',
    lv: 3,
    emoji: '👥',
    goal: 'ペアプロで画面を一緒に見ながら、提案や指摘を気軽に伝えることができる',
    roles: [
      { id: 'A', name: 'Wei' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: "I'll drive first, and you navigate.",
        ja: '最初は私がドライバーをやるので、ナビゲーターをお願いします。',
        note: 'drive＝キーボードで入力する役、navigate＝全体を見て方向を示す役',
      },
      {
        en: "Why don't we write the test first?",
        ja: '先にテストを書きませんか。',
        note: "Why don't we 〜? は「〜しませんか」という提案。理由を聞く質問ではない",
      },
      {
        en: "How about calling it 'getPage' instead?",
        ja: '代わりに「getPage」という名前はどうですか。',
        note: '名前の提案は How about calling it 〜? で。命令形より角が立たない',
      },
      { en: "There's a typo on line 12.", ja: '12行目にタイプミスがあります。' },
      { en: 'Good catch.', ja: 'よく気づきましたね。', note: 'ミスを見つけてもらったときのお礼。Nice catch. とも言う' },
      { en: 'Can you scroll up a bit?', ja: '少し上にスクロールしてもらえますか。', note: '画面を見ながら話すときの定番。下なら scroll down' },
      {
        en: "It's an off-by-one error.",
        ja: 'off-by-one エラー（1つずれ）です。',
        note: '境界が1つずれるバグ。< と <= の取り違えや、0始まりと1始まりの混同で起きやすい',
      },
      { en: 'Do you want to switch roles?', ja: '役割を交代しませんか。' },
    ],
    lines: [
      {
        sp: 'A',
        en: "So, we're adding pagination to the search results. I'll drive first and you navigate, okay?",
        ja: 'さて、検索結果にページ分けを付けるんですよね。最初は私がドライバーで、あなたがナビゲーターでいいですか。',
      },
      { sp: 'B', en: "Sounds good. Why don't we write the test first?", ja: 'いいですよ。先にテストを書きませんか。' },
      {
        sp: 'A',
        en: 'Sure. With 25 results and 10 per page, page 3 should show five, right?',
        ja: 'そうしましょう。結果が25件で1ページ10件なら、3ページ目は5件になるはずですよね。',
      },
      {
        sp: 'B',
        en: "Exactly, results 21 to 25. Let's check the count and the first result.",
        ja: 'そのとおり、21件目から25件目です。件数と最初の結果を確かめましょう。',
      },
      {
        sp: 'A',
        en: "Okay, the test's done. For now, I'll call the function 'split'.",
        ja: 'よし、テストは書けました。関数の名前は、とりあえず「split」にしておきます。',
      },
      {
        sp: 'B',
        en: "How about calling it 'getPage' instead? It returns one page, so it's clearer.",
        ja: '代わりに「getPage」という名前はどうですか。1ページ分を返すので、そのほうが分かりやすいです。',
      },
      {
        sp: 'A',
        en: "Good point. Okay, getPage is done, so let's run the test.",
        ja: 'たしかに。よし、getPage ができたので、テストを実行しましょう。',
      },
      {
        sp: 'B',
        en: "Wait, there's a typo on line 12. You wrote 'lenght' instead of 'length'.",
        ja: '待ってください、12行目にタイプミスがあります。「length」が「lenght」になっています。',
      },
      {
        sp: 'A',
        en: 'Good catch. Hmm, now the test fails: zero results instead of five.',
        ja: 'よく気づきましたね。うーん、今度はテストが失敗します。5件のはずが0件です。',
      },
      {
        sp: 'B',
        en: 'Can you scroll up a bit? I want to see how the start index is calculated.',
        ja: '少し上にスクロールしてもらえますか。開始インデックスをどう計算しているか見たいんです。',
      },
      {
        sp: 'A',
        en: 'Sure. Here: start equals page times page size.',
        ja: 'はい、ここです。start は page かける pageSize です。',
      },
      {
        sp: 'B',
        en: "Found it. It's an off-by-one error: page 3 starts at index 30, not 20.",
        ja: '見つけました。off-by-one エラーです。3ページ目がインデックス20ではなく30から始まっています。',
      },
      {
        sp: 'A',
        en: 'Oh, because page numbers start at 1. With page minus one... it passes!',
        ja: 'あ、ページ番号は1から始まるからですね。page から1を引くと……通りました！',
      },
      {
        sp: 'B',
        en: "Nice! It's been 25 minutes, so do you want to switch roles?",
        ja: 'やりましたね。25分たったので、役割を交代しませんか。',
      },
      {
        sp: 'A',
        en: "Sure, you drive and I'll navigate. Let's do the page buttons next.",
        ja: 'いいですよ。今度はあなたがドライバーで、私がナビゲーターです。次はページボタンをやりましょう。',
      },
      {
        sp: 'B',
        en: "Okay, pass me the keyboard. I'll start with the 'Next' button.",
        ja: '了解です。キーボードをこちらにください。「次へ」ボタンから始めます。',
      },
    ],
    tip: 'ナビゲーターは命令形を避け、How about 〜? / Can you 〜? / Why don\'t we 〜? のような提案・質問の形で話すと、相手の集中を切らさずに伝えられます。役割は25分ほどでこまめに交代しましょう。',
  },
  {
    id: 'i-code-review',
    group: 'it',
    sub: 'dev',
    title: 'コードレビューで意見を伝える',
    titleEn: 'Giving Code Review Feedback',
    lv: 4,
    emoji: '🔍',
    goal: '指摘に理由と代案を添え、重要度を分けてやわらかく伝えることができる',
    roles: [
      { id: 'A', name: 'Kofi' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Overall, it looks good.',
        ja: '全体的に良さそうです。',
        note: '先に良い点を伝えてから指摘に入ると、受け入れてもらいやすい',
      },
      {
        en: 'What happens if a customer has no orders?',
        ja: '注文が1件もない顧客の場合はどうなりますか。',
        note: 'What happens if 〜? は相手に自分で気づいてもらう聞き方。「バグがあります」と言うよりやわらかい',
      },
      { en: 'Could you add a check and a test for it?', ja: 'そのチェックとテストを追加してもらえますか。' },
      {
        en: "I'd go with a dash.",
        ja: '私ならダッシュにします。',
        note: "I'd go with 〜. は「私なら〜にします」。押しつけずに意見を言える",
      },
      {
        en: 'That could get slow with a lot of customers.',
        ja: '顧客が多いと遅くなるかもしれません。',
        note: 'could で「〜かもしれない」とやわらげる。will だと断定的に聞こえる',
      },
      {
        en: "That one's just a nit.",
        ja: 'それは細かい指摘です。',
        note: 'nit（nitpick）＝直さなくてもよい細かい指摘。コメントの頭に「nit:」と付けることも多い',
      },
      { en: "It's not a blocker.", ja: 'マージを止めるほどではありません。' },
      { en: "I'll approve it once those two are fixed.", ja: 'その2つが直ったら承認します。' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Hey, thanks for reviewing my pull request so quickly. Got a minute to go over your comments?',
        ja: 'プルリクエストをすぐにレビューしてくれてありがとう。コメントについて少し話せますか。',
      },
      {
        sp: 'B',
        en: 'Sure. Overall, it looks good, and the logic is easy to follow.',
        ja: 'もちろん。全体的に良さそうですし、ロジックも追いやすいです。',
      },
      { sp: 'A', en: 'Thanks. I saw you had a few concerns, though.', ja: 'ありがとう。でも、気になる点がいくつかあったみたいですね。' },
      {
        sp: 'B',
        en: 'Just two main ones. First, what happens if a customer has no orders?',
        ja: '大きいのは2つだけです。まず、注文が1件もない顧客の場合はどうなりますか。',
      },
      {
        sp: 'A',
        en: 'Then the count is zero, so it divides by zero. I completely missed that edge case.',
        ja: 'それだと件数が0なので、0で割ってしまいますね。そのエッジケースは完全に見落としていました。',
      },
      {
        sp: 'B',
        en: 'Right, and the dashboard would show NaN. Could you add a check and a test for it?',
        ja: 'そうなんです。ダッシュボードに NaN と表示されてしまいます。チェックとテストを追加してもらえますか。',
      },
      {
        sp: 'A',
        en: 'Sure. What should we show instead, zero or a dash?',
        ja: 'もちろん。代わりに何を表示しましょう。0ですか、それともダッシュですか。',
      },
      {
        sp: 'B',
        en: "I'd go with a dash. Zero might look like real data.",
        ja: '私ならダッシュにします。0だと実際のデータに見えるかもしれないので。',
      },
      { sp: 'A', en: "Makes sense. What's the second one?", ja: 'なるほど。2つ目は何ですか。' },
      {
        sp: 'B',
        en: "You're running a query for each customer inside the loop. That could get slow with a lot of customers.",
        ja: 'ループの中で、顧客ごとにクエリを実行していますよね。顧客が多いと遅くなるかもしれません。',
      },
      {
        sp: 'A',
        en: 'Ah, the classic N+1 problem. So, one query for everything instead?',
        ja: 'ああ、よくある N+1 問題ですね。じゃあ、代わりに全部を1回のクエリで取るということですか。',
      },
      {
        sp: 'B',
        en: "Yes, I'd use a single query with GROUP BY and let the database do the work. What do you think?",
        ja: 'はい、GROUP BY を使った1回のクエリにして、集計はデータベースに任せるのがいいと思います。どうですか。',
      },
      {
        sp: 'A',
        en: 'Agreed. And your comment on the date formatting, do I need to fix that too?',
        ja: '賛成です。それと、日付の書式についてのコメントですが、あれも直したほうがいいですか。',
      },
      {
        sp: 'B',
        en: "No, that one's just a nit. It's not a blocker, so feel free to leave it for another PR.",
        ja: 'いいえ、あれは細かい指摘です。マージを止めるほどではないので、別のプルリクエストに回してもらってかまいません。',
      },
      { sp: 'A', en: "Perfect. I'll push the fixes this afternoon.", ja: 'よかった。今日の午後に修正をプッシュします。' },
      { sp: 'B', en: "Thanks. I'll approve it once those two are fixed.", ja: 'ありがとう。その2つが直ったら承認します。' },
    ],
    tip: 'レビューでは、必ず直してほしい点（blocker）と好みの範囲の細かい点（nit）を分けて伝えると、相手が優先順位をつけやすくなります。指摘には「That could get slow」のように理由を添えましょう。',
  },
  {
    id: 'i-sprint-planning',
    group: 'it',
    sub: 'dev',
    title: 'スプリント計画で見積もる',
    titleEn: 'Sprint Planning',
    lv: 4,
    emoji: '🗓️',
    goal: '見積もりと使える作業量を数字で示し、スプリントに入れる範囲を相談できる',
    roles: [
      { id: 'A', name: 'Elena' },
      { id: 'B', name: 'You (developer)' },
    ],
    phrases: [
      {
        en: 'Is that part of the sprint goal?',
        ja: 'それはスプリントの目標に含まれますか。',
        note: '優先度を確かめる質問。迷ったら「スプリントの目標に沿うか」で判断する',
      },
      {
        en: 'We estimated it at 13 story points.',
        ja: 'それは13ストーリーポイントと見積もりました。',
        note: 'estimate A at B で「AをBと見積もる」。ポイントは時間ではなく相対的な大きさ',
      },
      { en: "I'm afraid not.", ja: '残念ながら、できません。', note: 'No. だけより丁寧。すぐあとに理由を続ける' },
      { en: "That's too big for one sprint.", ja: '1スプリントには大きすぎます。' },
      {
        en: 'Can we split it into smaller stories?',
        ja: 'もっと小さいストーリーに分けられますか。',
        note: '分けるときは「それだけで使える機能」の単位で切るのが基本',
      },
      { en: 'The backend is the same either way.', ja: 'バックエンドはどちらでも同じです。', note: 'either way＝どちらにしても' },
      {
        en: 'We can commit to that.',
        ja: 'それなら約束できます。',
        note: 'commit to 〜 で「〜をやり遂げると約束する」。スプリント計画の決まり文句',
      },
      { en: "Let's leave that for a later sprint.", ja: 'それは後のスプリントに回しましょう。' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Okay, everyone. The goal for this sprint is to let users sign in with their phone number.',
        ja: 'では皆さん、今回のスプリントの目標は、ユーザーが電話番号でサインインできるようにすることです。',
      },
      {
        sp: 'B',
        en: 'Got it. The password reset page is also on the list. Is that part of the sprint goal?',
        ja: '了解です。リストにはパスワード再設定の画面も入っていますね。それもスプリントの目標に含まれますか。',
      },
      {
        sp: 'A',
        en: "No, that's a nice-to-have. Phone sign-in is the top priority.",
        ja: 'いいえ、そちらは「できれば」程度です。電話番号でのサインインが最優先です。',
      },
      {
        sp: 'B',
        en: 'Okay. We estimated it at 13 story points.',
        ja: '分かりました。電話番号でのサインインは、13ストーリーポイントと見積もりました。',
      },
      {
        sp: 'A',
        en: "Thirteen? That's more than I expected. What makes it so big?",
        ja: '13ですか。思ったより大きいですね。なぜそんなに大きいんですか。',
      },
      {
        sp: 'B',
        en: 'We need to send codes by text, handle errors like expired codes, and test on both the website and the app.',
        ja: 'SMSでコードを送り、コードの期限切れなどのエラーに対応して、Webサイトとアプリの両方でテストする必要があるんです。',
      },
      { sp: 'A', en: 'I see. Can we fit all of that into this sprint?', ja: 'なるほど。それを全部、今回のスプリントに入れられますか。' },
      {
        sp: 'B',
        en: "I'm afraid not. With Ken on vacation and some leftover work from last sprint, we only have about 10 points.",
        ja: '残念ながら、できません。ケンさんが休暇で、前回のスプリントの残りの作業もあるので、10ポイントほどしかないんです。',
      },
      {
        sp: 'A',
        en: "Then that's too big for one sprint. Can we split it into smaller stories?",
        ja: 'それなら1スプリントには大きすぎますね。もっと小さいストーリーに分けられますか。',
      },
      {
        sp: 'B',
        en: 'Yes. We could do the backend and the website first, about 8 points, and the app next sprint.',
        ja: 'はい。まずバックエンドとWebサイトをやって（8ポイントほど）、アプリは次のスプリントにできます。',
      },
      {
        sp: 'A',
        en: 'Hmm, most of our users are on the app, though. Could we do the app first?',
        ja: 'うーん、でもユーザーの大半はアプリを使っているんです。アプリを先にできませんか。',
      },
      {
        sp: 'B',
        en: "Sure, that works. The backend is the same either way, so it's still about 8 points.",
        ja: 'もちろん、それで大丈夫です。バックエンドはどちらでも同じなので、やはり8ポイントほどです。',
      },
      {
        sp: 'A',
        en: 'Great. So can the team commit to the backend and the app?',
        ja: 'よかった。では、チームはバックエンドとアプリの分を約束できますか。',
      },
      {
        sp: 'B',
        en: "Yes, we can commit to that. As for the password page, let's leave that for a later sprint.",
        ja: 'はい、それなら約束できます。パスワードの画面は、後のスプリントに回しましょう。',
      },
      {
        sp: 'A',
        en: "Agreed. I'll put it and the website at the top of the backlog.",
        ja: '賛成です。パスワードの画面とWebサイトの分は、バックログの一番上に置いておきます。',
      },
      {
        sp: 'B',
        en: "Thanks. I'll break the stories into tasks after this meeting.",
        ja: 'ありがとうございます。この会議のあとで、ストーリーをタスクに分けます。',
      },
    ],
    tip: 'スプリント計画では、見積もり（points）とチームが使える量（capacity）を数字で示すと話が早く進みます。入りきらないときは断るだけでなく、「分ける」「順番を入れ替える」といった代案を出しましょう。',
  },
  {
    id: 'i-retro',
    group: 'it',
    sub: 'dev',
    title: '振り返りで改善を話す',
    titleEn: 'Sprint Retrospective',
    lv: 4,
    emoji: '🔄',
    goal: 'うまくいった点と課題を人を責めずに話し、改善策と担当を決めることができる',
    roles: [
      { id: 'A', name: 'Fatima' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      { en: 'What went well this sprint?', ja: '今回のスプリントでうまくいったことは何ですか。' },
      {
        en: "What didn't go so well?",
        ja: 'あまりうまくいかなかったことは何ですか。',
        note: 'What went badly? より、こちらのほうがやわらかい',
      },
      {
        en: "I'm not pointing fingers.",
        ja: '誰かを責めるつもりはありません。',
        note: 'point fingers＝特定の人を責める。振り返りでは人ではなく出来事やプロセスを話題にする',
      },
      { en: "It's a process problem, not a people problem.", ja: '人ではなく、プロセスの問題です。' },
      {
        en: 'Any change after planning should go through the product owner.',
        ja: '計画のあとの変更は、どれもプロダクトオーナーを通すべきです。',
      },
      {
        en: 'A few UI tests fail at random.',
        ja: 'いくつかのUIテストが、ときどき理由もなく失敗します。',
        note: 'こうしたテストを flaky test（不安定なテスト）と呼ぶ',
      },
      {
        en: 'Could we make that an action item?',
        ja: 'それをアクションアイテムにできませんか。',
        note: 'action item＝次回までに誰かが実行する具体的な改善策',
      },
      {
        en: "I'll take the flaky tests.",
        ja: '不安定なテストは私が引き受けます。',
        note: "I'll take 〜. で「〜は私が担当します」。期限（by next Friday）も添えると明確になる",
      },
    ],
    lines: [
      {
        sp: 'A',
        en: "Okay, let's get started. First, what went well this sprint?",
        ja: 'では、始めましょう。まず、今回のスプリントでうまくいったことは何ですか。',
      },
      {
        sp: 'B',
        en: 'Pairing on the payment feature went really well. We caught a lot of bugs early.',
        ja: '支払い機能をペアで進めたのは、とてもうまくいきました。バグを早い段階でたくさん見つけられました。',
      },
      { sp: 'A', en: "Great to hear. What didn't go so well?", ja: 'それはよかったです。では、あまりうまくいかなかったことは？' },
      {
        sp: 'B',
        en: 'The checkout requirements changed twice in the final week, so we had to redo a lot of work.',
        ja: '購入手続きの要件が最後の週に2回変わったので、多くの作業をやり直すことになりました。',
      },
      {
        sp: 'A',
        en: 'That sounds frustrating. Do you know how that happened?',
        ja: 'それは大変でしたね。どうしてそうなったか分かりますか。',
      },
      {
        sp: 'B',
        en: "I'm not pointing fingers, but changes kept coming in through chat after planning.",
        ja: '誰かを責めるつもりはないのですが、計画のあとも変更がチャットでどんどん入ってきたんです。',
      },
      {
        sp: 'A',
        en: "Right, so it's a process problem, not a people problem. What could we change?",
        ja: 'なるほど、人ではなくプロセスの問題ですね。何を変えられるでしょう。',
      },
      {
        sp: 'B',
        en: 'Maybe any change after planning should go through the product owner first.',
        ja: '計画のあとの変更は、どれもまずプロダクトオーナーを通すようにしてはどうでしょう。',
      },
      {
        sp: 'A',
        en: 'I like that. Anything else that slowed us down?',
        ja: 'いいですね。ほかに、作業が遅れる原因になったことはありますか。',
      },
      {
        sp: 'B',
        en: 'Yes, flaky tests. A few UI tests fail at random, so people just rerun the pipeline.',
        ja: 'はい、不安定なテストです。いくつかのUIテストがときどき理由もなく失敗するので、みんなパイプラインを再実行して済ませています。',
      },
      {
        sp: 'A',
        en: "And then we start ignoring real failures. That's risky.",
        ja: 'そうなると、本当の失敗まで見過ごすようになりますね。それは危険です。',
      },
      {
        sp: 'B',
        en: 'Exactly. Could we make that an action item this time?',
        ja: 'そうなんです。今回はそれをアクションアイテムにできませんか。',
      },
      {
        sp: 'A',
        en: 'Definitely. That gives us two action items, so who wants to own them?',
        ja: 'ぜひ。これでアクションアイテムが2つになりますね。誰が担当しますか。',
      },
      {
        sp: 'B',
        en: "I'll take the flaky tests. I'll fix the worst three by next Friday.",
        ja: '不安定なテストは私が引き受けます。来週の金曜までに、特にひどいものを3つ直します。',
      },
      {
        sp: 'A',
        en: "Thanks. I'll talk to the product owner about handling changes. Let's review both at the next retro.",
        ja: 'ありがとう。変更の扱い方については、私がプロダクトオーナーと話します。次の振り返りで2つとも確認しましょう。',
      },
    ],
    tip: '振り返りでは人を主語にせず、「changes kept coming in」のように出来事やプロセスを主語にして話すのが blameless（人を責めない）の基本です。改善策には担当者と期限を付け、次回に結果を確かめます。',
  },
  {
    id: 'i-design-review',
    group: 'it',
    sub: 'dev',
    title: '設計レビューで説明する',
    titleEn: 'Presenting a Design for Review',
    lv: 5,
    emoji: '🏗️',
    goal: '設計案の利点とトレードオフを説明し、レビューでの質問に答えることができる',
    roles: [
      { id: 'A', name: 'Tom' },
      { id: 'B', name: 'You' },
    ],
    phrases: [
      {
        en: 'Let me walk you through it.',
        ja: '順を追って説明します。',
        note: 'walk 人 through 物 で「（人に）〜を順を追って説明する」。発表の切り出しの定番',
      },
      {
        en: "I'm proposing we publish an event to a message queue.",
        ja: 'メッセージキューにイベントを発行することを提案します。',
        note: 'propose (that) we のあとは動詞の原形。suggest より正式な提案の響き',
      },
      {
        en: 'I think the extra complexity is worth it.',
        ja: '複雑さが増しても、それだけの価値はあると思います。',
        note: 'トレードオフを認めたうえで主張する言い方',
      },
      {
        en: "We'll make the worker idempotent.",
        ja: 'ワーカーを冪等にします。',
        note: 'idempotent（冪等）＝何回実行しても結果が同じ。at-least-once（少なくとも1回）の配信では重複を前提にする',
      },
      { en: 'What kind of volume are we expecting?', ja: '想定している量はどのくらいですか。' },
      {
        en: "We'd alert on queue depth.",
        ja: 'キューにたまった件数にアラートを設定します。',
        note: 'queue depth＝処理待ちのメッセージ数。増え続けたら処理が追いついていない合図',
      },
      {
        en: "I'm still a bit wary of the extra moving parts.",
        ja: '構成要素が増えることには、まだ少し慎重です。',
        note: 'wary of 〜＝〜を警戒している。反対とまでは言わずに懸念を示せる',
      },
      { en: "I'll build a prototype and load-test it.", ja: 'プロトタイプを作って負荷テストをします。' },
    ],
    lines: [
      {
        sp: 'A',
        en: 'Thanks for sending the design doc ahead of time. Do you want to walk us through it?',
        ja: '設計ドキュメントを前もって送ってくれてありがとう。順を追って説明してもらえますか。',
      },
      {
        sp: 'B',
        en: 'Sure, let me walk you through it. Right now, checkout sends the confirmation email synchronously, so a slow email service slows down the whole request.',
        ja: 'はい、順を追って説明します。現在、購入手続きでは確認メールを同期的に送っているので、メールサービスが遅いとリクエスト全体が遅くなります。',
      },
      {
        sp: 'A',
        en: 'Right, we saw that during the summer sale. Some checkouts took over ten seconds.',
        ja: 'そうですね、夏のセールのときにそれが起きました。購入手続きに10秒以上かかったものもありました。',
      },
      {
        sp: 'B',
        en: "Exactly. So I'm proposing we publish an event to a message queue and let a separate worker send the email.",
        ja: 'そうなんです。そこで、メッセージキューにイベントを発行し、メールは別のワーカーに送らせることを提案します。',
      },
      {
        sp: 'A',
        en: "I see the appeal, but that's more moving parts. Did you consider just sending it on a background thread?",
        ja: '利点は分かりますが、構成要素が増えますよね。単にバックグラウンドのスレッドで送ることは検討しましたか。',
      },
      {
        sp: 'B',
        en: "We did, but if a server restarts, any emails still in memory are lost. That's why I think the extra complexity is worth it.",
        ja: '検討しましたが、サーバーが再起動すると、メモリ上に残っているメールは失われます。だから、複雑さが増しても価値があると考えています。',
      },
      {
        sp: 'A',
        en: 'Fair enough. What happens if the email provider is down for, say, an hour?',
        ja: 'なるほど。たとえばメール配信サービスが1時間止まったら、どうなりますか。',
      },
      {
        sp: 'B',
        en: 'The worker retries with exponential backoff for up to two hours. After that, the message goes to a dead-letter queue and we get alerted.',
        ja: 'ワーカーが間隔を指数的に延ばしながら、最大2時間再試行します。それでもだめなら、メッセージはデッドレターキューに移り、アラートが届きます。',
      },
      {
        sp: 'A',
        en: 'Okay. But with retries, a customer could get the same email twice, right?',
        ja: 'なるほど。でも再試行があると、お客様に同じメールが2回届く可能性がありますよね。',
      },
      {
        sp: 'B',
        en: "Good point. Delivery is at-least-once, so we'll make the worker idempotent by recording which order IDs we've already emailed.",
        ja: 'ご指摘のとおりです。配信は「少なくとも1回」なので、メール送信済みの注文IDを記録して、ワーカーを冪等にします。',
      },
      {
        sp: 'A',
        en: "And ordering? A cancellation email shouldn't arrive before the confirmation.",
        ja: '順序はどうですか。キャンセルのメールが確認メールより先に届いてはまずいですよね。',
      },
      {
        sp: 'B',
        en: "Right now it's only confirmations, so ordering isn't an issue. If we add cancellations, we'd use a FIFO queue keyed by order ID.",
        ja: '今は確認メールだけなので、順序は問題になりません。キャンセルを追加するなら、注文IDをキーにしたFIFOキューを使います。',
      },
      {
        sp: 'A',
        en: 'What kind of volume are we expecting, and how will we monitor it?',
        ja: '想定している量はどのくらいですか。それと、どうやって監視しますか。',
      },
      {
        sp: 'B',
        en: "About 30,000 orders a day, peaking at maybe 200 a minute. We'd alert on queue depth, the age of the oldest message, and the dead-letter queue.",
        ja: '1日に約3万件、ピーク時は1分に200件ほどです。キューにたまった件数、最も古いメッセージの経過時間、デッドレターキューにアラートを設定します。',
      },
      {
        sp: 'A',
        en: "That's well within what a managed queue can handle. I'm still a bit wary of the extra moving parts, so let's see a prototype first.",
        ja: 'その量ならマネージドのキューで十分さばけますね。ただ、構成要素が増えることにはまだ少し慎重なので、まずプロトタイプを見てみましょう。',
      },
      {
        sp: 'B',
        en: "Sounds fair. I'll build a prototype and load-test it at peak volume by the end of next week.",
        ja: '妥当だと思います。来週中にプロトタイプを作って、ピーク時の量で負荷テストをします。',
      },
    ],
    tip: '設計の説明は「現状の問題 → 提案 → 検討した代案 → トレードオフ → 数字（量・監視）」の順に。弱点を自分から認めたうえで「the extra complexity is worth it」と言うと、説得力が増します。',
  },
]

export default scenes
