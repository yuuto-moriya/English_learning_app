# Eliza Patina — 英語学習と翻訳の PWA

> 話すほど、使うほど、あなたの英語に味が出る。

> **English summary**
> Eliza Patina is an English-learning and translation PWA for Japanese learners. The name joins Eliza Doolittle of *My Fair Lady* (who changes herself by practising how she speaks; the first chatbot, ELIZA, was named after her) and patina, the beauty that copper, leather and denim gain with use — like the green of Lady Liberty. It was — originally built for a railway track-maintenance (保線) and EAM professional — designed for iPhone (add to home screen).
> Learners choose and quickly switch modes (everyday / business / IT / rail maintenance) and study 5,716 words (general NGSL + CEFR-J / business BSL+TSL / IT / rail & EAM glossary) in an evidence-based session (retrieval practice + FSRS spaced repetition + interleaving).
> Practice modes include listening, dictation, shadowing, high-variability minimal-pair training, quick Japanese-to-English production, hands-free audio review, a timed "while you do chores" mode that cycles recall, repeat-after-me, spoken translation and role-play dialogues by ear and voice, Azure pronunciation assessment and 64 role-play dialogues.
> Speech uses Azure neural voices in eight English accents (US, UK, Australia, Canada, Ireland, India, New Zealand, South Africa), cached on the device and falling back to the device voice.
> The translator works as you type or speak, and a simultaneous-interpretation screen streams live transcripts and translations (Azure Speech translation via short-lived tokens), with a face-to-face conversation mode, sound cues and a guided tour for new users.
> Built with React 19, TypeScript, Vite, Tailwind CSS v4 and Dexie (all learning data stays on the device), hosted on Vercel (static site + Vercel Functions).
> A corgi guide, "Tetsu", and four animal friends are modeled procedurally in Blender.
> Code: MIT. Word-list data: CC BY-SA 4.0 (see [DATA_LICENSE.md](DATA_LICENSE.md)).

**名前の由来**：映画『マイ・フェア・レディ』で話し方の練習を重ねて自分を変えていくイライザ（**Eliza**＝話して変わる人、つまり学ぶあなた）と、銅や革・デニムが使い込むうちに帯びる経年変化の味＝**Patina**（ニューヨークの自由の女神の緑も、銅が年月で生んだパティーナ）。My Fair Lady と Lady Liberty、ふたりの「英語のレディ」を、ファッションのメゾンのように人の名前として組みました。ホーム画面の表示名は略称の「EliPati」。ロゴ文字は欧文セリフ体の大文字を字間を広くとって組む（`src/components/Brand.tsx`）。

一般・ビジネス・IT・鉄道保線（設備管理/EAM を含む）の英語を、**学習**から**実務での翻訳・同時通訳**までひとつで扱えるアプリです。
iPhone のホーム画面に追加して使うことを前提に作っています。案内役はコーギーのぬいぐるみ「テツ」で、いろいろな犬種のなかまたち（リスニング・発音のモカ＝トイプードル、ビジネスのスミ＝フレンチブルドッグ、保線のキナコ＝柴犬、学習法の解説のユキ先生＝サモエド、翻訳のショコラ＝ダックスフンド）が各画面を案内します。

---

## 目次

- [主な機能](#主な機能)
- [UI の決まり](#ui-の決まり)
- [技術スタック](#技術スタック)
- [ディレクトリ構成](#ディレクトリ構成)
- [ローカル開発](#ローカル開発)
- [テスト・品質チェック](#テスト品質チェック)
- [デプロイ（Vercel）](#デプロイvercel)
- [Azure（翻訳・発音評価）の設定](#azure翻訳発音評価の設定)
- [iPhone のホーム画面に追加する](#iphone-のホーム画面に追加する)
- [データパイプラインと単語の追加](#データパイプラインと単語の追加)
- [キャラクターの再生成（Blender）](#キャラクターの再生成blender)
- [ライセンス](#ライセンス)
- [ドキュメント](#ドキュメント)

## 主な機能

### 単語（5,716語）

| カテゴリ（モード） | 語数 | 出典 | レベル |
|---|---|---|---|
| 一般 | 4,142 | NGSL 1.2（一般英語の約92%をカバーする高頻度語）2,847語 ＋ NGSL にない CEFR-J の語（日本人学習者向けの語彙表）1,295語 | A1〜B2 |
| ビジネス | 904 | BSL 1.2 / TSL 1.2（ビジネス・TOEIC 頻出語） | B1〜C1 |
| IT | 248 | IT の現場でよく使う用語を独自に編集（パソコン操作・開発・運用・セキュリティ・データ・AI） | B1〜C1 |
| 鉄道（保線） | 422 | EN 規格・TSI・JIS の用語体系から独自に編集（設備管理/EAM・SAP 用語を含む） | B2〜専門 |

- すべての語に **和訳・米音 IPA・例文（英日）**。一般・ビジネス・IT は例文が2つ（2つ目は新しい単語のカードに出さず、問題で「はじめて見る文」として使う）。保線用語は **英音 IPA、英国表記／米国表記、JIS 用語、解説、出典タグ** 付き
- 一般・ビジネス・IT の動詞には **変化形（三単現・過去形・過去分詞・-ing）** を単語カードと単語帳に表示（`lemminflect` でビルド時に生成。過去形・過去分詞が不規則な動詞は色と「不規則」で目立たせる。変化形ごとの別カードは作らない）
- レベルは 6 段階：入門（A1）／初級（A2）／中級（B1）／中上級（B2）／上級（C1）／専門
- 初回起動時に **学ぶコース（一般・ビジネス・IT・鉄道（保線））**、レベル（目安から選ぶか、2分のレベル診断）、学習プラン（いつ・1日の目安 5分〜2時間）を選択
- **モードの切り替え**：ホームと練習の画面上部の「一般／ビジネス／IT／鉄道」をタップすると、そのモードだけに切り替わります。「すべて」で全コース、「組み合わせる」で好きなコースを足したり外したりできます。いまのモードは塗りつぶし、出題に含まれるコースは色とチェックで示し、下の一文（例：「一般＋鉄道から出題」）でも伝えます。外したコースに復習の時期が来た単語があれば、その数も出します
- 新出語・復習・練習の例文・シーンの最初のタブは、選んだモードに合わせます（鉄道を選ばなければ保線用語は出ません）。IT・鉄道は専門のコースなので、レベルの設定に関係なく基本の語から出題
- 単語帳では「苦手（忘れたことがある語）」「保存した単語（★）」で絞り込み、その語だけを集中練習できます

### 学習セッション（エビデンスに基づく設計）

- **検索練習**：必ず「答える → 確認」。間違えた語はセッション内で数問後に再出題
- **分散学習（FSRS）**：ts-fsrs で単語ごとに次回の復習日を決定。目標保持率（85/90/95%）を設定可能
- **段階的な難易度**：記憶の安定度に応じて出題形式を上げ、同じ段階の中では形式を混ぜる（`src/lib/session.ts` の `chooseType`）
  - 覚えはじめ：意味を選ぶ
  - 7日未満：カード（自己評価）・聞いて意味を選ぶ・**和訳から英語を選ぶ**
  - 21日未満：スペル入力・例文の穴埋め・**使い分け**・聞いて選ぶ・英語を選ぶ
  - 定着（21日以上）：**使い分け**・スペル・穴埋め・**不規則動詞の変化形**・**並べかえ**・聞いて選ぶ
- **使い分け**（`src/lib/quiz.ts`）：はじめて見る例文の空所に入る語を、意味の近い語（同じ品詞・例文と同じ形：過去形・複数形）の中から選ぶ。和訳を一緒に見せるので答えは1つに決まる。答え合わせのあと、選ばなかった語の意味も見せる。空所の前の a / an が手がかりにならないよう、選択肢に両方が混ざるときは a(n) にする
- **不規則動詞の変化形**：過去形・過去分詞を、取り違え（chose / chosen）・規則変化のまちがい（choosed）の中から選ぶ
- **並べかえ**：例文の語をタップして正しい順に（4〜9語の文）
- **まぎらわしい選択肢**：選択問題のまちがいの選択肢に、綴りが似た語（adapt / adopt）・同じ分野の語・聞こえた英文と同じ単語を含む例文を混ぜる。混ぜる数は学習者のレベルとその語の覚え具合（リスニングは選んだレベルと正解の続き具合）で「やさしい・ふつう・むずかしい」に変わり、問題の右上に表示。意味が重なる語（類義語・同じ語の仲間）は「どちらも正解」に見えないよう除外。人の属性を表す語（gay など）はまちがいの選択肢に使わない（`src/lib/distractors.ts`）
- **インターリーブ**：カテゴリや復習／新出語を混ぜて出題
- 終わったら、正答率・覚えた語・まちがえた語のまとめを表示
- 1日の目安（分）・連続学習日数・12週間の学習記録と、7日先までの復習予定（ランキング等の競争要素なし）

根拠となる研究と実装の対応は [docs/RESEARCH.md](docs/RESEARCH.md) にまとめています（アプリ内の「学習法の根拠」画面と同じ内容）。

### リスニング・スピーキング

- **読み上げ**：Azure のニューラル音声。**発音（国・地域）を8つから選べます**（アメリカ・イギリス・オーストラリア・カナダ・アイルランド・インド・ニュージーランド・南アフリカ。各国2人以上の声）。鉄道は別に設定でき、はじめはイギリス。一度聞いた音声は端末に保存して次からはすぐ・オフラインでも再生。未設定・オフライン時は端末の声（その国の声がなければ近い発音の声）。品詞で読みが変わる語（live, record など）は、その品詞の発音で読みます
- **定着チェック**（`/study?mode=check`）：定着した（安定度21日以上）はずの単語を、1語に2問（使い分け＋和訳から英語を選ぶ・書く）で確かめる。どちらかをまちがえたら「定着していなかった」として FSRS に「もう一度」を記録して覚え直しに戻し、両方正解なら「確かめた」日時を記録（正解しても復習の間隔は延ばさない）。まだ確かめていない語から出す
- **使い分け**（`/practice/usage`、`src/data/confusables.ts`）：borrow / lend / rent、say / tell / speak / talk、make / do、lose / miss、cheap / low など、日本語では同じ言葉になる英語の組 73組（前置詞の at / on / in・by / with / in、語法の used to / be used to、make / let なども）（ビジネスの組はビジネスを選んだとき）。文の形か和訳で答えが1つに決まる問題だけにし、答え合わせのあとに違いの解説を出す
- **リスニングクイズ**、**ディクテーション**（毎回ちがう声で聞く・いろいろな国の英語を混ぜて聞くことも可能）
- **聞き分け**：L/R・B/V・S/TH・F/H・語末の N/NG・work/walk の母音・子音の連続（sport/support）など、日本語話者が苦手な13種類の音の対立（144組の最小対語）を複数の声で（高変動音声訓練：HVPT）。選択肢に単語の意味、回答後に両方の語の例文（英・和）と聞き比べを表示。形式は「単語」「例文（文の中で聞き分け）」「同じ？ちがう？」の3つ
- **瞬間英作文**：学習した単語の例文を、日本語から英語ですぐ言う。言えなかった文はもう一度
- **耳で復習**：「和訳 → 考える間 → 英語 → 例文」を流す、画面を見ない復習（通勤中など）
- **ながら練習**：家事や身支度をしながら、耳と声だけで練習（`src/pages/Handsfree.tsx`・`src/lib/handsfree.ts`）。はじめに時間（5分〜1時間）・内容・考える間（ゆっくり／ふつう／はやめ）・日本語の案内を選ぶと、「単語を思い出す（5問）→ まねして言う（4文）→ 日本語から英語で言う（3文）→ 会話を聞く（1場面。あなたの台詞は間を置いてまねして言う）」を順番に流しっぱなしにする。言う間は文の長さに合わせて変わる。時間になったら1問の区切りで終わり、「あと5分」でのばせる。画面は消えないようにし（Wake Lock）、ほかのアプリに切り替えると一時停止。答え合わせはしないので復習の予定（FSRS）は変えず、練習した時間を今日の学習に記録する
- **シャドーイング**：「聞く → つぶやく → 意味確認 → 同時読み → シャドーイング」の 5 ステップコーチ
- **AIと会話**（`/practice/chat`、`src/pages/Conversation.tsx`・`server/chat.ts`）：場面（自由に話す・カフェ・自己紹介・会議・面接・障害報告など、学ぶコースに合わせて14場面）と相手のレベル（A1〜C1）を選ぶと、AI が相手役で話しかける。話した英語（声かキーボード。声は話し終えて少し黙ると自動で送る）に返事をし、より自然な言い方と日本語の説明を添える。「ヒント」で返事の例、相手の発言は聞く・和訳。場面ごとの「やること」3つ、返事は生成しながら表示して読み上げ（stream）、ゆっくり再生、ヒントでは日本語で言いたいことを英語に。会話中の直しは押すと開く小さなボタン。終わると「まず自分で言い直してから答えを見る」振り返り（発音チェック・★で保存。保存した言い方は最初の画面に、この端末だけ）。返事と直しは別々に同時にたのむ（返事は速いモデル、直しと解説は先生役 `/api/tutor` で日本語の説明が得意なモデル）。始める前の準備（やること・使える言い方）、相手の発言の「解説」「まねする」、自分の発言の「詳しく」、ヒントの「先生に質問」（日本語で）、困ったときの決まり文句、直しの種類の記録（最近多い間違い）。AI は Cloudflare Workers AI → Groq の順に試す（どちらも無料プラン。枠を超えたら止まるだけ）。会話の中身はサーバーに保存しない。端末ごとに1日200回まで
- **発音チェック**：Azure AI Speech の発音評価で、文・単語・音素ごとのスコアと誤りを表示
  - Azure 未設定時は、Safari のタブでは端末の音声認識による簡易判定、ホーム画面アプリ（iOS では SpeechRecognition 非対応）では録音して聞き比べる自己評価に切り替え

### シーン別会話（64本）

- 一般 22・ビジネス 18・IT 12・鉄道 12（追加分は `src/data/scenes-more.ts`）。「この場面のゴール」→ キーフレーズ → 聞いて理解 → ロールプレイ
- 一般・ビジネスは身近な場面（自己紹介・ホテル・会議・交渉・苦情対応など）。IT では、ヘルプデスクへの問い合わせ、朝会、コードレビュー、障害報告、要件の聞き取り、技術をやさしく説明する、不審なメールの報告、クラウド移行の打ち合わせ。鉄道では、作業前の安全ミーティング、指令への線路閉鎖の連絡、軌道検測データのレビュー、EN 規格と JIS の違いの議論、EAM 導入ワークショップ、夜間工事の苦情対応など実務に直結する場面
- 話者ごとに声を変えて読み上げます（1人目は設定の発音、相手役は米・英のもう一方）。英国が舞台の場面は英国の発音

### 翻訳・同時通訳

- Azure AI Translator による日英・英日翻訳。**入力しながら翻訳**（手を止めると自動で訳す。1,000文字まで）
- 画面の作り（Google 翻訳・DeepL・Apple 翻訳などの型にそろえた）：上に **「日本語 ⇄ 英語」の1行**（入力した文の言語を自動で見分け、真ん中の矢印で訳を入力欄に移して逆向きに）、その下に入力欄、**すぐ下に訳**（キーボードを出したままでも見える位置・大きめの文字・色の付いたカード）
- 訳の下に **聞く・コピー・保存・拡大** を1行で。拡大は相手に見せる全画面表示。**元の言語に戻して確かめる**（逆翻訳。押したときだけ API を使う）。訳か原文が単語帳にある1〜3語の英語なら、その語の意味と例文へのリンク
- 履歴は入力欄の下に一覧で、「すべて／保存した訳」で切り替え。翻訳の設定（入力しながら翻訳・話したあと訳を読み上げる）は画面のいちばん下
- **音声入力**：話しているそばから入力欄に文字が出ます（Azure Speech のリアルタイム認識。なければ Safari・Chrome の音声認識、それもなければ録音して文字起こし）。止めると訳を読み上げます
- **同時通訳**（翻訳 → 同時通訳）：話している途中から文字起こしと訳が流れます（Azure の音声翻訳）。日本語→英語・英語→日本語に加え、日本語と英語のボタンを交互に押す**会話モード**（話し終えると訳を読み上げ）。マイクの開始・終了は効果音でお知らせ。画面は消えません
- 訳の読み上げ：英語は設定の発音（国・地域）、日本語も読み上げ
- **保線用語の自動検出**：原文・訳文に含まれる専門用語を、英国表記／米国表記／JIS 日本語で並べて表示（オフラインで動作）
- 規格英語の **shall / should / may** の使い分けのヒント

### 起動時のオープニング

アプリを開くたびに、約5.5秒のブランドの演出を出します（`src/components/Opening.tsx`）。
エンブレムは、ヴィンテージの真鍮・エナメル看板の組み方で作った 3D の銅の板です（`public/opening/`）。
外周に「ELIZA PATINA」「ENGLISH ≡ ATELIER」とスピード線、内側は緑青色のエナメルに銅の二重線、中央に仕立て屋のトルソー（銅の面に緑青の衿ぐり・前中心・ウエストのテープ。「ENGLISH ATELIER」＝英語を一着ずつ仕立てるアトリエ）、その左右に「ESTD」「2026」。
磨いたばかりの銅のエンブレムが斜めから正面へ回り込み、年月を経た姿（くすみ・酸化の斑点）が広がり、光がひと筋流れて、ひとことが出ます。ひとことを読める間だけ止まってから、アプリに切り替わります。設定の「このアプリについて」にも同じエンブレムを出しています。
動きは GSAP（起動時に読み込む）。タップで飛ばせ、iPhone の「視差効果を減らす」がオンのときは動かさずに短く見せます。設定の「表示 → 起動時のオープニング」でオフにできます。
JavaScript の読み込み前から同じ色の幕を出し（`index.html`）、白い画面がちらつかないようにしています。自動テスト（webdriver）では出しません（`?opening` を付けたときだけ）。

### その他

- **使い方ガイド**：はじめての人に、モードの切り替え・学習・単語帳・練習・シーン・翻訳と同時通訳・設定を順番に案内（暗くして説明する場所だけを照らすツアー）。設定の「使い方ガイド」と翻訳画面の「？」からいつでも見直せます
- **効果音**：正解・不正解・回の終わり・録音の開始と終了（音声ファイルを使わず合成。設定でオフ可）
- 学習データはすべて **端末内（IndexedDB）** に保存。設定画面から JSON で書き出し・読み込み（機種変更時のバックアップ）
- ダークモード、オフライン対応（Service Worker）
- Azure を設定しなくても、単語学習・リスニング・ディクテーション・シャドーイング・聞き分け・瞬間英作文・耳で復習・シーン会話・保線用語チェックは利用可能（読み上げは端末の音声）

## UI の決まり

どの画面でも同じ意味のものは同じ見た目・同じ言葉にそろえます。新しい画面を作るときもこれに従ってください。

| 意味 | アイコン・部品 | 言葉 |
|---|---|---|
| 英文・単語を聞く（読み上げ） | `Volume2`（スピーカー）。小さいものは `SpeakButton`、聞き取りの問題の大きなボタンは `ListenButton` | 聞く・もう一度聞く・お手本・読み上げ |
| ゆっくり聞く | `Snail`（カタツムリ）、速さは `SLOW_RATE`（0.6倍） | ゆっくり |
| 録音・連続再生のプレーヤー | `Play` / `Pause`（自分の声の再生、耳で復習、会話を通して聞く） | 再生・一時停止 |
| 録音・音声入力 | `Mic`、止めるのは `Square` | 停止 |
| 練習の1回分をやめる | 左上の `X`（`SessionShell`） | やめる |
| 前の画面へ | `ChevronLeft` | 戻る |
| 別の画面へ移る文字リンク | `ChevronRight`（`MoreLink`）、外部サイトは `ArrowUpRight` | すべて・単語帳 など |
| 練習を始める・進む | アイコンなしの主ボタン | はじめる・次へ・結果を見る |
| 同じ練習をもう一回 | `RotateCcw` | もう一度 |
| 正解・不正解 | 丸いバッジの `Check` / `X`（`Verdict`・`FeedbackBar`） | 正解・不正解 |
| ヒント・答え | `Lightbulb` / `Eye` | ヒント・答えを見る・答え合わせ |
| 保存 | `Star` | 保存・保存を取り消す |
| 注意・エラー | `TriangleAlert`（`Notice`） | |
| 翻訳・出題の向き | 矢印は文字ではなく `ArrowRight`（`Direction`） | 日本語 → 英語 |
| 米国・英国の表記 | `Tag` | 米・英 |
| 単語の覚え具合（パティーナ） | 学習中＝銅色（`copper`）、定着＝緑青色（`verdigris`）の点・`PatinaBar`。必ず `PatinaLegend` か「学習中・定着」の言葉と並べる。正解・不正解の色（`ok`・`ng`）は覚え具合に使わない | 未学習・学習中・定着 |
| 時間で区切る練習の残り時間 | `SessionShell` の `label`（「12:05」） | あと5分 |

- 練習の1回分は `src/components/Session.tsx` の部品で組み立てる：`SessionShell`（× でやめる・進み具合「3 / 10」・その間はタブバーを隠す）、`ChoiceButton`（選択肢）、`FeedbackBar`（回答後の「正解／不正解」と「次へ」）、`ResultCard`（最後の結果と終わりの効果音）
- 練習メニューの名前・アイコン・説明は `src/components/PracticeMenu.tsx` の1か所で持ち、ホームと練習の画面で共有する
- 数え方は「10問中8問正解」「3 / 10」、速さは「0.85×」「1.0×」（`formatRate`）、読み込み中の表示は「読み込み中…」

## 技術スタック

| 分類 | 使用技術 |
|---|---|
| フロントエンド | React 19, TypeScript 7, Vite 8, React Router 8 |
| スタイル・動き | Tailwind CSS v4（アニメーションは CSS のみ、View Transitions）, lucide-react, Newsreader（英語の書体。同梱） |
| PWA | vite-plugin-pwa（Workbox, 更新はアプリ内の通知から） |
| データ保存 | Dexie（IndexedDB）, zustand（設定） |
| 復習スケジューラ | ts-fsrs（FSRS） |
| ホスティング・API | Vercel（静的配信 + Vercel Functions `/api`） |
| 外部 API | Azure AI Translator, Azure AI Speech（発音評価・音声認識・ニューラル音声の読み上げ・リアルタイムの音声認識と音声翻訳。ブラウザ側は Speech SDK を同時通訳のときだけ読み込む） |
| テスト | Vitest, fake-indexeddb, Playwright（スクリーンショット・E2E スクリプト） |
| データ生成 | Python 3（`scripts/build_vocab.py`） |
| キャラクター | Blender（bpy）+ Pillow |
| CI | GitHub Actions（typecheck / test / build） |

## ディレクトリ構成

```
.
├── .github/workflows/ci.yml   # CI（Node 22: npm ci → typecheck → test → build）
├── data-src/                  # 単語データの元ファイル（ここを編集する）
│   ├── lists/                 #   NGSL / BSL / TSL の語彙リスト（CSV, CC BY-SA 4.0）
│   ├── vocab/                 #   一般・ビジネス・IT 語の和訳と例文（general-1..4.txt, business-3..4.txt, it-3..5.txt）
│   ├── rail/                  #   保線・EAM 用語集（11 サブカテゴリ）
│   └── ipa/                   #   （任意）米音 IPA 辞書の置き場所
├── docs/                      # ドキュメント
├── api/                      # Vercel Functions（エントリポイントのみ。処理は server/）
│   ├── health.ts              #   GET  /api/health（Azure の設定状況）
│   ├── translate.ts           #   POST /api/translate（Azure Translator）
│   ├── pronunciation.ts       #   POST /api/pronunciation（Azure Speech 発音評価）
│   ├── stt.ts                 #   POST /api/stt（音声入力の文字起こし）
│   ├── tts.ts                 #   GET  /api/tts（ニューラル音声の読み上げ。MP3 を長期キャッシュ）
│   ├── speech-token.ts        #   GET  /api/speech-token（同時通訳・リアルタイム音声入力用の10分の一時トークン）
│   └── tsconfig.json          #   API 用の型チェック設定
├── public/
│   ├── guide/                 # キャラクターの表情・ポーズ画像（WebP）
│   └── icons/                 # PWA アイコン
├── scripts/
│   ├── build_vocab.py         # data-src → src/data/vocab/*.json
│   ├── blender/               # キャラクターのモデリング・レンダリング（kit / corgi / cast / render / postprocess）
│   ├── screenshots.mjs        # iPhone サイズの画面スクリーンショット（ライト/ダーク）
│   └── e2e-flow.mjs           # 主要フローの E2E 確認
├── server/                    # API の処理本体（Web 標準の Request/Response のみ使用）
│   ├── handlers.ts            #   各 API の処理、APP_ACCESS_TOKEN のチェック
│   ├── shared.ts              #   Azure 呼び出し・レスポンス正規化
│   └── env.ts                 #   環境変数の読み込み
├── src/
│   ├── components/            # 共通 UI（練習の画面の部品 Session.tsx、練習メニュー、ガイド、発音チェック、単語情報など）
│   ├── assets/fonts/          # Newsreader（英語の書体、OFL）
│   ├── data/                  # 単語 JSON（生成物）、シーン会話、聞き分けの最小対語と語の意味・例文、学習法の根拠
│   ├── lib/                   # 学習セッション、FSRS、DB、用語検出、音声、設定、ながら練習（handsfree）
│   ├── pages/                 # 画面（はじめての設定、ホーム、学習、単語帳、練習、聞き分け、瞬間英作文、耳で復習、ながら練習、学習記録、シーン、翻訳、同時通訳、設定…）
│   └── styles/
├── tests/                     # Vitest（データ整合性、学習ロジック、FSRS、用語検出、API）
├── .env.example               # 環境変数の例（ローカルは .env.local にコピー）
├── vercel.json                # Vercel 設定（SPA のルーティング、キャッシュ）
├── LICENSE                    # MIT
└── DATA_LICENSE.md            # データ・素材のライセンス
```

## ローカル開発

Node.js 22 以上を推奨します（CI は Node 22）。

```bash
npm install
npm run dev            # http://localhost:5173
```

`npm run dev`（Vite）では `/api/*`（翻訳・発音評価）は動きません。未設定でも単語学習・リスニング・シャドーイング・用語チェックは使えます。
API を含めて試すときは Vercel CLI を使います（初回のみログインとプロジェクトのリンクが必要）。

```bash
cp .env.example .env.local     # Azure のキー等を記入（.env.local は .gitignore 済み）
npx vercel login
npx vercel link                # Vercel 上のプロジェクトと関連付け
npm run dev:vercel             # = vercel dev（http://localhost:3000、/api も動く）
```

Vercel に登録済みの環境変数を手元に取り込む場合は `npx vercel env pull .env.local` を使います。

## テスト・品質チェック

```bash
npm run typecheck   # アプリ（tsconfig.json）と API（api/tsconfig.json）の型チェック
npm test            # Vitest（tests/*.test.ts）
npm run build       # 型チェック + 本番ビルド（dist/）
```

画面確認用のスクリプト（Playwright。Chromium の場所は `CHROMIUM_PATH` で指定可能）:

```bash
npm run build
npx vite preview --port 4173 &
node scripts/screenshots.mjs screenshots      # 主要画面を iPhone サイズで撮影（ライト/ダーク）
node scripts/e2e-flow.mjs e2e-out             # オンボーディング → 学習 → 単語帳 → シーン → 翻訳の用語検出
```

GitHub に push / Pull Request を作ると、`.github/workflows/ci.yml` で typecheck・test・build が実行されます。

## デプロイ（Vercel）

### 初回の設定

1. [vercel.com](https://vercel.com) に GitHub アカウントでログイン
2. **Add New… → Project** → **Import Git Repository** で `yuuto-moriya/English_learning_app` を選んで **Import**
   （一覧に出ない場合は「Adjust GitHub App Permissions」で、このリポジトリへのアクセスを許可）
3. 設定はそのままで構いません（`vercel.json` で指定済み）

   | 項目 | 値 |
   |---|---|
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

4. **Environment Variables** に Azure のキーなどを入れて **Deploy**
   （あとから入れる場合は **Settings → Environment Variables** で追加し、**Deployments** から **Redeploy**。詳しくは [docs/SETUP_AZURE.md](docs/SETUP_AZURE.md)）

### 以降の更新

`main` にマージするたびに自動で本番にデプロイされます。`stg` ブランチは検証環境で、push のたびにプレビュー用の固定 URL（`english-learning-app-git-stg-<チーム名>.vercel.app`）にデプロイされます。ほかのブランチや Pull Request にもプレビュー用の URL が作られます。

#### ブランチ運用

```
main (本番)   ──●───────────────●──   stg からの PR のみ（Merge commit）
                ↑               ↑
stg  (検証)   ──●──●──●──●──●──●──   機能ブランチからの PR のみ（Squash merge）
                   ↑  ↗
feature/*          ●──●
```

| ブランチ | 役割 | デプロイ先 | 変更方法 |
|---|---|---|---|
| `main` | 本番 | Production | `stg` からの PR（Merge commit） |
| `stg` | 検証 | Preview（固定 URL） | 作業ブランチからの PR（Squash merge） |
| `feature/*` `fix/*` `docs/*` `chore/*` | 個別の作業 | PR ごとの Preview | `stg` から切って `stg` へ PR |
| `hotfix/*` | 本番の緊急修正 | PR ごとの Preview | `main` から切って `main` へ PR。マージ後に `main` を `stg` へ戻す |

- 作業は必ず `stg` から切ります。`main` と `stg` へ直接 push しません。
- 作業ブランチ → `stg` は **Squash merge**（1 機能 1 コミット）、`stg` → `main` は **Merge commit**（履歴がずれないように squash しない）。
- マージ済みのブランチは削除します（GitHub の「Automatically delete head branches」を有効にする）。
- リリースしたら `main` にタグ（`v1.2.0` など）を付けます。

- `api/*.ts` は Vercel Functions（Node.js）として自動でデプロイされます。処理本体は `server/` にあります。
- `vercel.json` で、`/api/` 以外のパスをすべて `index.html` に送っています（React Router の画面を直接開いても 404 にならないように）。
- アプリは新しいバージョンを検知すると「更新」ボタンを表示します。学習中は表示しません。

### コマンドでデプロイする場合

```bash
npx vercel login
npx vercel          # プレビュー環境へ
npx vercel --prod   # 本番へ
```

> Vercel の Hobby プラン（無料）は個人・非商用の利用が対象です。業務で使う場合は Pro プランを検討してください。

## Azure（翻訳・発音評価）の設定

翻訳・発音評価・音声入力・高品質な読み上げには Azure AI Translator と Azure AI Speech（どちらも無料の F0 プランあり）を使います。読み上げは Speech と同じキーで動きます。
キーは Vercel の環境変数（サーバー側）にだけ保存され、端末には送られません。

| 環境変数 | 必須 | 内容 |
|---|---|---|
| `AZURE_TRANSLATOR_KEY` / `AZURE_TRANSLATOR_REGION` | 翻訳に必須 | Translator リソースのキーとリージョン（例: `japaneast`） |
| `AZURE_TRANSLATOR_ENDPOINT` | 任意 | 既定 `https://api.cognitive.microsofttranslator.com` |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | 音声に必須 | Speech リソースのキーとリージョン（同時通訳・リアルタイムの音声入力にはリージョンが必要） |
| `AZURE_SPEECH_ENDPOINT` | 任意 | 例 `https://<resource>.cognitiveservices.azure.com` |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_AI_TOKEN` | AI と会話に（どちらか） | Cloudflare Workers AI のアカウント ID と API トークン（無料プラン） |
| `GROQ_API_KEY` | AI と会話に（どちらか） | Groq の API キー（無料プラン。Cloudflare の予備） |
| `CLOUDFLARE_MODEL` / `GROQ_MODEL` | 任意 | 既定 `@cf/meta/llama-3.1-8b-instruct-fp8-fast` / `openai/gpt-oss-20b` |
| `CLOUDFLARE_TUTOR_MODEL` / `GROQ_TUTOR_MODEL` | 任意 | 先生役（直し・解説・質問）のモデル。既定 `@cf/google/gemma-4-26b-a4b-it` / `openai/gpt-oss-120b`（使えなければ会話と同じモデル） |
| `APP_ACCESS_TOKEN` | 任意（推奨） | 設定すると `/api/*` に `X-App-Token` が必要。アプリの設定画面で入力 |

リソースの作り方・無料枠・確認方法は **[docs/SETUP_AZURE.md](docs/SETUP_AZURE.md)** を参照してください。
AI と会話の設定（Cloudflare・Groq のアカウントとキー、料金がかからない理由）は **[docs/SETUP_AI.md](docs/SETUP_AI.md)** を参照してください。
設定後は `https://<project>.vercel.app/api/health` か、アプリの **設定 → クラウド機能 →「接続を確認」** で確認できます。

## iPhone のホーム画面に追加する

1. iPhone の **Safari** でアプリの URL（例: `https://<project>.vercel.app`）を開く
2. 共有ボタン（四角から上向き矢印）→ **ホーム画面に追加**（見当たらない場合は共有メニューを下にスクロール）
3. 名前（「EliPati」）を確認して **追加**。以降はホーム画面のアイコンから全画面で起動します

使い方のポイント:

- 初回起動でコース・レベル・学習プランを選ぶと学習を始められます。単語データはアプリに同梱されているので、オフラインでも学習できます
- 発音チェック・音声入力ではマイクの使用を許可してください
- Azure Speech を設定していれば、読み上げは自動でニューラル音声になります。端末の音声を使うとき（未設定・オフライン）は、iPhone の「設定 → アクセシビリティ（視覚サポート）→ リーダーと読み上げ → 声 → 英語 → 声」（古い iOS では「読み上げコンテンツ」）で高品質（拡張・プレミアム）音声をダウンロードすると自然になります。和訳や案内を読む日本語の声も「声 → 日本語 → 声」で同じように入れ、設定の「日本語の声」で選べます（高品質音声のときは Nanami・Keita から選べる。iPhone の「Siri」の声は、Apple の仕様でアプリ・Web からは使えません）
- 学習データはその端末内にだけ保存されます。**Safari のタブとホーム画面のアプリでは保存先が別** なので、普段使う方（ホーム画面）で学習してください
- 機種変更や念のためのバックアップは、**設定 → データ → 書き出し**（JSON）→ 新しい端末で **読み込み**
- `APP_ACCESS_TOKEN` を設定している場合は、ホーム画面のアプリの設定画面でトークンを入力します

## データパイプラインと単語の追加

```
data-src/lists/*.csv          NGSL / BSL / TSL（見出し語・頻度順位、CC BY-SA 4.0）
data-src/vocab/*.txt          一般・ビジネス・IT 語の和訳と例文
data-src/vocab/more/*.txt     2つ目の例文（lemma|品詞|例文(英)|例文(和)。同じファイル名の語に足す）
data-src/rail/*.txt           保線・EAM 用語集
scripts/.cache/en_US.txt      米音 IPA 辞書（ipa-dict, MIT）
data-src/neighbors.tsv        意味の近い語（WordNet 3.0 から生成。選択問題のまぎらわしい選択肢）
data-src/near-extra.tsv       WordNet で見つからなかった語（形容詞・副詞・ビジネス・IT の用語など）の意味の近い語
        │
        ▼  npm run data:build（scripts/build_vocab.py）
src/data/vocab/general.json   一般 4,142語
src/data/vocab/business.json  ビジネス 904語
src/data/vocab/it.json        IT 248語
src/data/vocab/rail.json      保線 422語
```

### 初回の準備（IPA 辞書）

米音 IPA は [open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict) の `en_US.txt` から生成します。
辞書ファイルは容量が大きいためリポジトリに含めていません（`scripts/.cache/` は .gitignore 済み）。

```bash
mkdir -p scripts/.cache
curl -L -o scripts/.cache/en_US.txt \
  https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_US.txt
npm run data:build
# => general=<語数> business=<語数> rail=<語数> total=<合計> warnings=<件数>
```

`scripts/.cache/en_US.txt` がない場合は `data-src/ipa/en_US.tsv`（同じタブ区切り形式）を読み込みます。

辞書に発音が複数あるときは、くだけた発音（around /ɝˈaʊn/、twenty /ˈtwɛni/）より、子音を落とさない・弱い母音を ɪ で書く丁寧な発音を選びます（`best_variant`）。
強勢記号の位置（community /kəˈmjuːnɪti/）、語頭や語末の余分な第2強勢（important、company）、r の位置（correct /kəˈrɛkt/）も整えます。
辞書の最初の発音が品詞と合わない語（live の動詞 /lɪv/、record の名詞 /ˈrɛkɚd/ など）や、強調形・旧来形の発音（which の /hw/ など）は、
`scripts/build_vocab.py` の `OVERRIDE_POS`（品詞ごと）と `OVERRIDE_US` で直しています。品詞で読みが変わる語には `say`（その品詞の発音）を付け、
単語だけをニューラル音声で読むときに発音を指定します。

### 意味の近い語（選択問題のまぎらわしい選択肢）

選択問題のまちがいの選択肢に使う「意味の近い語」（犬 → 猫・馬、月曜日 → 火曜日、安い → 高価な）を、
[Princeton WordNet 3.0](https://wordnet.princeton.edu/) から `data-src/neighbors.tsv` に書き出し、ビルドで各語の `near` に入れます。
同じ意味の語（同じ synset）や上位語・下位語（犬と動物）、和訳の意味が重なる語は「どちらも正解」になるので入れません。
WordNet で近い語が見つからなかった語（約1,250語。感情や評価の形容詞、頻度の副詞、ビジネス・IT の用語など）は、同じコース・同じ品詞の語から「意味が近いがはっきり別の語」を選んで `data-src/near-extra.tsv` に書いています（headset → webcam・charger、previous → current・subsequent）。
単語を追加・修正したら、ネットワークにつながる環境で作り直してください（nltk と WordNet のデータが必要）。

動詞の変化形は `npm run data:build` が `lemminflect` で作ります（`pip install lemminflect`。入っていなければ変化形なしで作られるので注意）。

```bash
python3 -m venv .venv && .venv/bin/pip install nltk lemminflect
mkdir -p nltk_data/corpora && curl -L -o nltk_data/corpora/wordnet.zip \
  https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip
npm run data:build                       # 先に単語データを作る
NLTK_DATA=nltk_data .venv/bin/python scripts/build_neighbors.py
npm run data:build                       # near を入れる
```

### 一般語・ビジネス語を追加・修正する

`data-src/vocab/*.txt` に 1 行 1 語、5 列のパイプ区切りで書きます（`#` で始まる行はコメント）。

```
lemma|品詞|和訳|例文(英)|例文(和)
reservation|n|予約|I have a *reservation* under the name Moriya.|守屋の名前で予約しています。
```

- 例文の見出し語は `*アスタリスク*` で囲みます（囲み忘れはビルド時に活用形を探して自動で囲み、見つからなければ警告）
- 2つ目の例文は `data-src/vocab/more/` の同じ名前のファイルに `lemma|品詞|例文(英)|例文(和)` で書きます（lemma と品詞が同じ行の語に足されます）。和訳の最初の意味で、1つ目とは別の場面の文にします
- レベルはファイルで決まります：`general-N.txt` → NGSL のグループ N、`general-N-plus.txt` → NGSL にない CEFR-J の語（N は CEFR-J のレベル。頻度の順位がないので、同じレベルの NGSL の語の間に均等に混ぜる）（一般語は、これを `data-src/lists/cefrj.csv`（CEFR-J）のレベルとの中間に補正して `lv` にします。bread・cat のような身近な語が上級に、government のような語が入門に偏らないように）、`business-3/4.txt`・`business-3/4-plus.txt`（BSL/TSL の追加語） → レベル 3/4
  （`business-4.txt` のうち BSL の順位が 300 より低い語はレベル 5 に）
- 一般語とビジネス語で重複した語は警告を出してスキップされます。NGSL/BSL/TSL にない語の頻度順位は 9999 になります
- ID は見出し語から作られます（`g-<語>` / `b-<語>`）。**見出し語を変えると、その語の学習履歴は引き継がれません**

### IT 用語を追加・修正する

`data-src/vocab/it-3.txt` / `it-4.txt` / `it-5.txt`（数字がレベル）に、一般語と同じ 5 列で書きます。
辞書にない語（`malware` など）は 6 列目に米音 IPA を書きます。`API`・`VPN` のような略語は、1文字ずつ読む IPA を自動で付けます。

```
lemma|品詞|和訳|例文(英)|例文(和)[|米音IPA]
phishing|n|フィッシング（偽のメールなどで情報を盗む詐欺）|Do not click links in *phishing* emails.|フィッシングメールのリンクはクリックしないでください。|ˈfɪʃɪŋ
```

- 一般・ビジネス・鉄道と同じ見出し語は入れられません（ビルドで警告してスキップ）。ID は `i-<語>`
- 用語の選定・和訳・例文は本プロジェクトのオリジナル（[DATA_LICENSE.md](DATA_LICENSE.md)）

### 保線・EAM 用語を追加・修正する

`data-src/rail/*.txt` に 10 列（`en|us|ja|lv|ipa_uk|ipa_us|refs|note|example_en|example_ja`）で書きます。
編集方針・出典タグの意味・書式の詳細は **[docs/RAIL_GLOSSARY.md](docs/RAIL_GLOSSARY.md)** を参照してください。

### 反映

```bash
npm run data:build   # [WARN]（列数・重複・例文の対象語）と [INFO]（IPA なし）を確認
npm test             # データの整合性テスト
```

`data-src/` と、生成された `src/data/vocab/*.json` の両方をコミットします（Vercel のビルドでは Python を使わず、JSON をそのまま使います）。

## キャラクターの再生成（Blender）

案内役のテツ（コーギー）と、なかまたち（モカ＝トイプードル、スミ＝フレンチブルドッグ、キナコ＝柴犬、ユキ先生＝サモエド、ショコラ＝ミニチュアダックス）は、どれも犬のぬいぐるみです。Blender（bpy）を Python モジュールとして使い、プロシージャルにモデリングし、起毛はヘアパーティクルで表現しています。

| ファイル | 内容 |
|---|---|
| `scripts/blender/kit.py` | 共通部品（楕円体・カプセル・目・メガネ・起毛など）、ぬいぐるみの布地、ライト・カメラ、レンダリング設定 |
| `scripts/blender/dogs.py` | 犬のぬいぐるみ。犬種・毛色・小物（CHARACTERS）でテツ（8ポーズ）となかまたち（各4ポーズ）を作り分け |
| `scripts/blender/render.py` | レンダリングの実行（透過 PNG） |
| `scripts/blender/postprocess.py` | WebP・アプリアイコンへの変換 |
| `scripts/blender/emblem_art.py` | オープニングのエンブレムの図案（外周の文字・スピード線・中央のトルソー・ESTD 2026）を描き、エナメルの部分のマスクにする |
| `scripts/blender/logo.py` | エンブレムを 3D の銅の板（緑青色のエナメルを埋め込み）にしてレンダリング。磨いたばかりの銅が回り込む連番と、年月を経た姿 |
| `scripts/blender/postprocess_logo.py` | 3D ロゴを `public/opening/*.webp` に変換 |

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install bpy pillow        # bpy は対応する Python のバージョンが限られます（PyPI の bpy のページで確認）

# 1) レンダリング（透過 PNG: <キャラ>-<ポーズ>.png と tetsu-icon.png）
python scripts/blender/render.py render-out --size 768 --samples 64
#    一部だけ: --only tetsu-happy,moka-greet

# 2) アプリ用アセットに変換
python scripts/blender/postprocess.py render-out
#    → public/guide/<キャラ>-<ポーズ>.webp（384px, 透過）
#    → public/icons/icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png, public/favicon.png

# 3D のエンブレム（起動時のオープニング）。文字は幾何学的なサンセリフ Jost（OFL。npm の @fontsource/jost）を TTF にしてから
npm pack @fontsource/jost && tar xzf fontsource-jost-*.tgz
python -c "from fontTools.ttLib import TTFont; f=TTFont('package/files/jost-latin-600-normal.woff2'); f.flavor=None; f.save('Jost-600.ttf')"
python scripts/blender/emblem_art.py emblem-out --font Jost-600.ttf --size 2048    # 図案のマスク
python scripts/blender/logo.py logo-out --mask emblem-out/emblem-mask.png --size 640 --samples 96 --frames 14
python scripts/blender/postprocess_logo.py logo-out    # → public/opening/*.webp（透過）
```

画面での使い分け（どのキャラが話すか）は `src/lib/characters.ts` と各ページの `<Guide who="…">` で決めています。

## ライセンス

| 対象 | ライセンス |
|---|---|
| ソースコード | [MIT](LICENSE)（© 2026 yuuto-moriya） |
| CEFR-J Vocabulary Profile（一般語のレベルの補正） | 研究・商用に無料、出典の明記が条件（東京外国語大学 CEFR-J プロジェクト, <http://www.cefr-j.org/>） |
| NGSL / BSL / TSL と、それに基づく一般・ビジネス語データ | CC BY-SA 4.0（Browne, Culligan & Phillips, <https://www.newgeneralservicelist.com/>） |
| 米音 IPA | MIT（open-dict-data/ipa-dict、cmudict-ipa 由来） |
| 英語の書体 Newsreader | SIL Open Font License 1.1（Production Type） |
| 保線・EAM 用語集 | 本プロジェクトのオリジナル編集物（MIT）。規格本文は転載していません |
| キャラクターの画像・アイコン | 本プロジェクトのオリジナル（MIT） |

詳しくは [DATA_LICENSE.md](DATA_LICENSE.md) を参照してください。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | オーナーの要件と決定事項（機能追加・変更の前に読む） |
| [docs/SETUP_AZURE.md](docs/SETUP_AZURE.md) | Azure Translator / Speech の作成、Vercel への設定、アクセストークン、動作確認 |
| [docs/SETUP_AI.md](docs/SETUP_AI.md) | AI と会話（Cloudflare Workers AI / Groq）のアカウント・キー、無料枠、Vercel への設定 |
| [docs/RESEARCH.md](docs/RESEARCH.md) | 学習法のエビデンス（文献）と、アプリでの実装 |
| [docs/RAIL_GLOSSARY.md](docs/RAIL_GLOSSARY.md) | 保線用語集の編集方針・出典タグ・著作権・追加方法 |
| [DATA_LICENSE.md](DATA_LICENSE.md) | データ・素材のライセンスと出典 |
