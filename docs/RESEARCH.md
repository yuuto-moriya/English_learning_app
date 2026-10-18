# 学習法のエビデンスと実装

Eliza Patina の学習機能は、認知心理学・第二言語習得研究で効果が確認されている学習法をもとに設計しています。
このドキュメントは、アプリ内の「学習法の根拠」画面（`/research`）と同じ内容を、実装箇所とあわせてまとめたものです。

> 内容の正本は [`src/data/research.ts`](../src/data/research.ts) です。文献を追加・修正するときは、まず `research.ts` を更新し、このファイルにも反映してください（アプリの画面は `research.ts` から表示されます）。
> 13〜19 は 2026-10 の改修（コース選択・聞き分け・瞬間英作文・耳で復習・レベル診断・学習プラン・国ごとの発音）で追加した項目です。

## 一覧

| # | 学習法 | アプリでの主な機能 |
|---|---|---|
| 1 | [分散学習（間隔を空けた復習）](#1-spacing) | FSRSで単語ごとに復習日を決め、期限の来た語から出題 |
| 2 | [記憶モデルに基づく復習スケジューラ（FSRS）](#2-fsrs) | ts-fsrs、目標保持率85/90/95%、評価ボタンに次回間隔を表示 |
| 3 | [検索練習（テスト効果）](#3-retrieval) | 必ず「答える→確認」。間違えた語は数問後に再テスト |
| 4 | [望ましい困難（段階的な難易度）](#4-difficulty) | 選択 → 音声だけ → 自己評価 → スペル・穴埋めへ段階的に。選択肢の難しさもレベルと覚え具合で調整 |
| 5 | [インターリーブ（混ぜて練習）](#5-interleave) | 選んだコースの単語・復習/新出語・出題形式を混ぜて出題 |
| 6 | [高頻度語から学ぶ（語彙リスト）](#6-wordlists) | NGSL / BSL / TSL の頻度順＋規格ベースの保線用語 |
| 7 | [産出効果・マルチモーダル学習](#7-production) | 全語に発音記号と米英の音声、新出語で例文の音読 |
| 8 | [シャドーイング](#8-shadowing) | 5ステップのシャドーイングコーチ |
| 9 | [音声認識による発音フィードバック](#9-asr) | Azure発音評価（文・単語・音素スコア） |
| 10 | [タスク中心の言語指導（TBLT）](#10-tblt) | 場面ゴール付きのシーン会話40本とロールプレイ |
| 11 | [学習を支えるキャラクター（教育エージェント）](#11-agent) | コーギー「テツ」が努力・プロセスをほめる |
| 12 | [習慣化とゲーミフィケーション](#12-habit) | 1日の目安・連続日数・12週間の記録のみ（競争要素なし） |
| 13 | [聞き分けトレーニング（高変動音声訓練：HVPT）](#13-hvpt) | 「聞き分け」：8種類の音の対立を、最小対語と複数の声で |
| 14 | [アウトプット（産出）の練習](#14-output) | 「瞬間英作文」：日本語を見て英語ですぐ言う |
| 15 | [連続再学習（正解できるまで → 間隔を空けてまた）](#15-relearning) | 間違えた語・文を同じ回で再出題、苦手な単語の集中練習 |
| 16 | [音だけで思い出す復習](#16-audio) | 「耳で復習」：和訳 → 考える間 → 英語 → 例文。「ながら練習」：時間を決めて、想起・リピート・瞬間英作文・会話を流す |
| 17 | [レベルに合った語から学ぶ（レベル診断）](#17-placement) | 最初の設定で2分のレベル診断 |
| 18 | [「いつ・どこで」を決める（実行意図）](#18-intention) | 学習する時間帯と1日の分数を決めてホームに表示 |
| 19 | [いろいろな話し方に慣れる（多様なアクセント）](#19-accents) | 8つの国・地域の発音から選べる。リスニングで国の発音を混ぜる |

<a id="1-spacing"></a>
## 1. 分散学習（間隔を空けた復習）

**研究で分かっていること**

同じ回数の学習でも、まとめて行う（集中学習）より間隔を空けた方が長期記憶に残る。第二言語学習でも分散練習の効果がメタ分析で確認され、オンライン学習の追試でも、間隔を空けた群が集中学習群を上回った。

**アプリでの実装**

復習のタイミングをFSRSアルゴリズムで単語ごとに最適化。「忘れかけた頃」に自動で出題します（ホーム → 学習をはじめる）。

実装箇所: `src/lib/srs.ts`（`dueCards`） / `src/lib/session.ts`（`buildSession`：期限の来た復習を優先）

**文献**

- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.
- Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. Language Learning, 72(1), 269–319. <https://doi.org/10.1111/lang.12479>
- Rogers, J., Nakata, T., & Chiu, M. M. (2025). Optimizing distributed practice online: A conceptual replication of Cepeda et al. (2009). Studies in Second Language Acquisition, 47(1), 417–439. <https://doi.org/10.1017/S0272263124000706>

<a id="2-fsrs"></a>
## 2. 記憶モデルに基づく復習スケジューラ（FSRS）

**研究で分かっていること**

大規模な学習ログ（約2.2億件）から長期記憶をモデル化し、復習コストを最小化するスケジューリング手法が提案され、従来手法より性能が向上したと報告されている。FSRSはこの研究を基にしたオープンソースのアルゴリズム。

**アプリでの実装**

ts-fsrsを採用。目標保持率（85/90/95%）を設定でき、各評価ボタンに次回復習までの間隔を表示します。

実装箇所: `src/lib/srs.ts`（`scheduler`, `previewIntervals`） / `src/pages/Settings.tsx`（目標保持率）

**文献**

- Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. Proceedings of KDD 2022, 4381–4390. <https://doi.org/10.1145/3534678.3539081>

<a id="3-retrieval"></a>
## 3. 検索練習（テスト効果）

**研究で分かっていること**

答えを見直すより、記憶から思い出す（テストする）方が長期保持に有効。学習技法のレビューでも「練習テスト」と「分散学習」が最も有用性が高いと評価された。第二言語語彙では、1回の学習内で複数回思い出す方が、遅延テストの成績が高かった。

**アプリでの実装**

単語は必ず「答える→確認」の順。間違えた語は数問後にもう一度出題し、セッション内で繰り返し想起させます。「耳で復習」も、答えの前に考える間を置いて想起を促します。

実装箇所: `src/lib/session.ts`（`reinsert`：間違えた語を数問後に再出題） / `src/pages/Study.tsx`

**文献**

- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.
- Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966–968.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students’ learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4–58.
- Nakata, T. (2017). Does repeated practice make perfect? The effects of within-session repeated retrieval on second language vocabulary learning. Studies in Second Language Acquisition, 39(4), 653–679. <https://doi.org/10.1017/S0272263116000280>

<a id="4-difficulty"></a>
## 4. 望ましい困難（段階的な難易度）

**研究で分かっていること**

学習時に適度な困難（思い出す・生成する）を伴う方が長期的な定着につながる。語彙は「意味が分かる（受容）」から「自分で書ける・言える（産出）」まで段階がある。

**アプリでの実装**

記憶の安定度に応じて、選択問題 → 音声だけで答える → 自己評価カード → スペル入力・例文穴埋めへと難易度が上がります。

選択問題のまちがいの選択肢（ダミー）も、ランダムではなく「もっともらしいもの」を混ぜます。もっともらしい誤答の選択肢は、正解だけでなく関連する知識の想起も促すことが示されています（Little et al., 2012）。混ぜる数（3つのダミーのうち似た選択肢の数）は次のように決めます。

| 覚え具合＼学習者のレベル | 入門・初級（A1–A2） | 中級・中上級（B1–B2） | 上級・専門 |
|---|---|---|---|
| 覚えたて（安定度3日未満） | やさしい（1） | やさしい（1） | ふつう（2） |
| 定着しつつある | ふつう（2） | ふつう（2） | むずかしい（3） |
| 定着（21日以上） | ふつう（2） | むずかしい（3） | むずかしい（3） |

- 単語：綴り・音が似た語（adapt / adopt、quite / quiet）と、同じ分野（保線の分類）・同じ品詞で頻度が近い語。同じ回で出し直す問題は1段やさしく
- リスニング：聞こえた英文と同じ単語を含む例文・同じ単語や場面の例文。難しさは選んだレベルで決め、正解が3問続くと上げ、まちがえると下げる
- 「どちらも正解」に見える選択肢は作らない：和訳の意味のまとまりが同じ語、漢字・カタカナが2文字以上共通する語（影響する／影響力）、同じ語の仲間（decide / decision）、和訳が近すぎる例文は除外

実装箇所: `src/lib/session.ts`（`chooseType`：mc → listen / flip → spell / cloze）、`src/lib/distractors.ts`（`wordTier`・`wordDistractors`・`sentenceDistractors`）

**文献**

- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), Metacognition: Knowing about knowing (pp. 185–205). MIT Press.
- Little, J. L., Bjork, E. L., Bjork, R. A., & Angello, G. (2012). Multiple-choice tests exonerated, at least of some charges: Fostering test-induced learning and avoiding test-induced forgetting. Psychological Science, 23(11), 1337–1344. https://doi.org/10.1177/0956797612443370
- Webb, S. (2007). The effects of repetition on vocabulary knowledge. Applied Linguistics, 28(1), 46–65.

<a id="5-interleave"></a>
## 5. インターリーブ（混ぜて練習）

**研究で分かっていること**

種類の異なる問題を混ぜて練習すると、区別して使い分ける力が伸びやすい。第二言語の文法練習でも、混ぜて練習した方が長期保持に優れていた。

**アプリでの実装**

選んだコース（一般会話・ビジネス・保線）の単語と、復習・新出語、選択・リスニング・スペルなどの出題形式を混ぜて出題します。

実装箇所: `src/lib/srs.ts`（`interleave`） / `src/lib/session.ts`

**文献**

- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. Instructional Science, 35(6), 481–498.
- Nakata, T., & Suzuki, Y. (2019). Mixing grammar exercises facilitates long-term retention: Effects of blocking, interleaving, and increasing practice. The Modern Language Journal, 103(3), 629–647. <https://doi.org/10.1111/modl.12581>

<a id="6-wordlists"></a>
## 6. 高頻度語から学ぶ（語彙リスト）

**研究で分かっていること**

英語の理解には大量の語彙が必要だが、高頻度語から学ぶほど効率よく文章をカバーできる。NGSLは約2,800語で一般的な英文の約92%をカバーし、ビジネス語彙リスト（BSL）と合わせるとビジネス文書の最大97%をカバーするとされる。

**アプリでの実装**

一般語はNGSL、ビジネス語はBSL/TSL（TOEIC）から採用し、頻度順にレベル分け。保線用語はEN規格・TSI・JISの用語体系から独自に編集しました。

実装箇所: `data-src/lists/*.csv` / `scripts/build_vocab.py`

**文献**

- Nation, I. S. P. (2006). How large a vocabulary is needed for reading and listening? The Canadian Modern Language Review, 63(1), 59–82.
- Browne, C., Culligan, B., & Phillips, J. New General Service List 1.2 / Business Service List 1.2 / TOEIC Service List (CC BY-SA 4.0). <https://www.newgeneralservicelist.com/>

<a id="7-production"></a>
## 7. 産出効果・マルチモーダル学習

**研究で分かっていること**

声に出して読んだ語は、黙読した語より記憶に残りやすい（産出効果）。文字・音声・例文（文脈）を組み合わせると、記憶の手がかりが増える。

**アプリでの実装**

すべての単語・例文に発音記号と音声（米・英）を付け、新出語では例文の音読を促します。「ながら練習」では、英文のあとに文の長さに合わせた間を置き、声に出してまねして言えるようにしています。

実装箇所: `src/lib/tts.ts` / `src/components/WordInfo.tsx` / `src/lib/handsfree.ts`

**文献**

- MacLeod, C. M., Gopie, N., Hourihan, K. L., Neary, K. R., & Ozubko, J. D. (2010). The production effect: Delineation of a phenomenon. Journal of Experimental Psychology: Learning, Memory, and Cognition, 36(3), 671–685. <https://doi.org/10.1037/a0018785>

<a id="8-shadowing"></a>
## 8. シャドーイング

**研究で分かっていること**

日本人英語学習者を対象とした研究で、シャドーイングはリスニング理解力の向上に効果があり、特に音声知覚（ボトムアップ処理）が課題の学習者に有効とされる。

**アプリでの実装**

「聞く→つぶやく→意味確認→同時読み→シャドーイング」の5ステップで練習できます（練習 → シャドーイング）。

実装箇所: `src/pages/Speaking.tsx`（`?mode=shadow`）

**文献**

- Hamada, Y. (2016). Shadowing: Who benefits and how? Uncovering a booming EFL teaching technique for listening comprehension. Language Teaching Research, 20(1), 35–52.
- Kadota, S. (2019). Shadowing as a practice in second language acquisition: Connecting inputs and outputs. Routledge.

<a id="9-asr"></a>
## 9. 音声認識による発音フィードバック

**研究で分かっていること**

15研究のメタ分析で、自動音声認識（ASR）を使った発音学習は中程度の効果（g = 0.69）。明示的な誤りフィードバック、個々の音（分節音）、中〜長期の継続、成人・中級学習者で効果が大きかった。

**アプリでの実装**

Azure Speechの発音評価で、文・単語・音ごと（米音はIPA表記）にスコアと誤りを表示。苦手な単語をタップして聞き直せます。

実装箇所: `api/pronunciation.ts` → `server/handlers.ts` / `src/components/SpeakCheck.tsx` / `src/lib/localSpeech.ts`（端末内認識のフォールバック）

**文献**

- Ngo, T. T. N., Chen, H. H. J., & Lai, K. K. W. (2024). The effectiveness of automatic speech recognition in ESL/EFL pronunciation: A meta-analysis. ReCALL, 36(1), 4–21. <https://doi.org/10.1017/S0958344023000113>

<a id="10-tblt"></a>
## 10. タスク中心の言語指導（TBLT）

**研究で分かっていること**

実際の場面・目的のあるタスクを中心にした指導プログラムは、さまざまな学習成果に大きな効果（d = 0.93）を示した。

**アプリでの実装**

シーン会話は「この場面のゴール」を設定し、キーフレーズ → 聞いて理解 → ロールプレイの流れで練習します。IT の障害報告やコードレビュー、保線現場・規格の議論など、実務に直結する場面を用意しました。

実装箇所: `src/data/scenes.ts` / `src/pages/SceneDetail.tsx`

**文献**

- Bryfonski, L., & McKay, T. H. (2019). TBLT implementation and evaluation: A meta-analysis. Language Teaching Research, 23(5), 603–632. <https://doi.org/10.1177/1362168817744389>

<a id="11-agent"></a>
## 11. 学習を支えるキャラクター（教育エージェント）

**研究で分かっていること**

画面上の案内キャラクター（pedagogical agent）を用いた学習は、43研究のメタ分析で小さいながら有意な学習効果を示した。また、能力ではなく努力やプロセスをほめる方が、困難に直面した際の意欲を保ちやすい。

**アプリでの実装**

コーギーの「テツ」が場面に応じて案内・励ましを行います。正解時は努力を、不正解時は「思い出そうとしたこと」を肯定します。いろいろな犬種のなかまたち（リスニング・発音のモカ＝トイプードル、ビジネスのスミ＝フレンチブルドッグ、保線のキナコ＝柴犬、学習法の解説のユキ先生＝サモエド、翻訳のショコラ＝ダックスフンド）が各画面の案内を担当します。

実装箇所: `src/lib/guide.ts` / `src/lib/characters.ts` / `src/components/Guide.tsx`

**文献**

- Schroeder, N. L., Adesope, O. O., & Gilbert, R. B. (2013). How effective are pedagogical agents for learning? A meta-analytic review. Journal of Educational Computing Research, 49(1), 1–39.
- Mueller, C. M., & Dweck, C. S. (1998). Praise for intelligence can undermine children’s motivation and performance. Journal of Personality and Social Psychology, 75(1), 33–52.

<a id="12-habit"></a>
## 12. 習慣化とゲーミフィケーション

**研究で分かっていること**

新しい行動が自動化するまでの期間は個人差が大きく、中央値は約66日だった。ゲーミフィケーションは学習に小〜中程度の効果があるが、研究間のばらつきが大きく、過度な競争要素は必須ではない。

**アプリでの実装**

1日の目安（分）・連続学習日数・週の記録・12週間の学習記録だけのシンプルな仕組みにし、ランキングなどの競争要素は入れていません。

実装箇所: `src/pages/Home.tsx` / `src/pages/Stats.tsx` / `src/lib/db.ts`

**文献**

- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009.
- Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. Educational Psychology Review, 32(1), 77–112. <https://doi.org/10.1007/s10648-019-09498-w>

<a id="13-hvpt"></a>
## 13. 聞き分けトレーニング（高変動音声訓練：HVPT）

**研究で分かっていること**

日本語話者が苦手な L と R などの対立を、多くの話者の声・多くの語で聞き分ける練習（HVPT）は、初めて聞く声や語にも効果が広がる。79研究のメタ分析でも、知覚への中〜大の効果と、効果の持続が報告された。単語学習でも、複数の話者の声で聞いた方が、聞いて語を思い出す成績が高かった。

**アプリでの実装**

「聞き分け」で、L/R・B/V・S/TH など8種類の音の対立を、最小対語（light / right など）と複数の声で練習します。答えるとすぐ正誤が分かり、同じ声で聞き比べられます。リスニング問題も毎回ちがう声で再生できます（設定で切り替え）。

実装箇所: `src/data/minimalPairs.ts` / `src/pages/Sounds.tsx` / `src/lib/tts.ts`（`voice: 'random'`）

**文献**

- Logan, J. S., Lively, S. E., & Pisoni, D. B. (1991). Training Japanese listeners to identify English /r/ and /l/: A first report. The Journal of the Acoustical Society of America, 89(2), 874–886. <https://doi.org/10.1121/1.1894649>
- Thomson, R. I. (2018). High variability [pronunciation] training (HVPT): A proven technique about which every language teacher and learner ought to know. Journal of Second Language Pronunciation, 4(2), 208–231.
- Uchihara, T., Karas, M., & Thomson, R. I. (2025). High variability phonetic training (HVPT): A meta-analysis of L2 perceptual training studies. Studies in Second Language Acquisition. <https://doi.org/10.1017/S0272263125100879>
- Barcroft, J., & Sommers, M. S. (2005). Effects of acoustic variability on second language vocabulary learning. Studies in Second Language Acquisition, 27(3), 387–414.

<a id="14-output"></a>
## 14. アウトプット（産出）の練習

**研究で分かっていること**

言いたいことを自分で英語にしようとすると、知っていることと言えないことの差に気づき、文法や語の使い方に注意が向く（アウトプット仮説）。語彙も、意味が分かる練習（受容）だけでなく、自分で言う・書く練習（産出）をした方が、産出の力が伸びる。

**アプリでの実装**

「瞬間英作文」で、学習した単語の例文を日本語から英語にすぐ言う練習をします。言えなかった文はその回の最後にもう一度出し、お手本の音声と発音チェックで確かめられます。

実装箇所: `src/pages/Compose.tsx` / `src/lib/sentences.ts`

**文献**

- Swain, M. (1985). Communicative competence: Some roles of comprehensible input and comprehensible output in its development. In S. Gass & C. Madden (Eds.), Input in second language acquisition (pp. 235–253). Newbury House.
- Webb, S. (2009). The effects of receptive and productive learning of word pairs on vocabulary knowledge. RELC Journal, 40(3), 360–376.

<a id="15-relearning"></a>
## 15. 連続再学習（正解できるまで → 間隔を空けてまた）

**研究で分かっていること**

1回の学習の中で正しく思い出せるまで練習し、それを間隔を空けた別の日にも繰り返す方法（successive relearning）は、検索練習と分散学習の両方の利点を持ち、長期の保持に強い効果がある。

**アプリでの実装**

単語学習では、間違えた語を同じ回の中でもう一度出題し、次の復習日は FSRS が決めます。瞬間英作文でも、言えなかった文を最後にもう一度出します。苦手な単語（忘れたことがある語）は単語帳から集中練習できます。

実装箇所: `src/lib/session.ts`（`reinsert`, `buildDrill`） / `src/pages/Compose.tsx`

**文献**

- Rawson, K. A., & Dunlosky, J. (2022). Successive relearning: An underexplored but potent technique for obtaining and maintaining knowledge. Current Directions in Psychological Science, 31(4), 362–368. <https://doi.org/10.1177/09637214221100484>

<a id="16-audio"></a>
## 16. 音だけで思い出す復習

**研究で分かっていること**

答えを見る前に思い出そうとすること（検索練習）が記憶を強める。音声だけの語学教材では、答えの前に考える間を置き、だんだん間隔を広げて思い出させる方法（段階的な間隔での想起）が古くから使われている。

**アプリでの実装**

「耳で復習」で、忘れかけている単語から順に「和訳 → 考える間 → 英語 → 例文」と流します。画面を見なくても進み、再生中は画面が消えないようにします。家事や身支度のあいだに使う「ながら練習」では、単語の想起・まねして言う・日本語から英語で言う・会話を、時間を決めて順番に（混ぜて）流します。

実装箇所: `src/pages/AudioReview.tsx`

**文献**

- Pimsleur, P. (1967). A memory schedule. The Modern Language Journal, 51(2), 73–75. <https://doi.org/10.1111/j.1540-4781.1967.tb06700.x>
- Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966–968.

<a id="17-placement"></a>
## 17. レベルに合った語から学ぶ（レベル診断）

**研究で分かっていること**

語彙の力は、頻度の段階ごとに知っている語の割合を調べることで見積もれる（語彙サイズテスト）。すでに知っている語や難しすぎる語に時間を使わず、今のレベルの次の語から学ぶのが効率的。

**アプリでの実装**

最初の設定で、NGSL の各レベルから意味を問う短い診断を行い、身についているレベルの次から新出語を出します。保線用語は専門の基本語から順に出題します。

実装箇所: `src/pages/Welcome.tsx`（`LevelCheck`）

**文献**

- Nation, P., & Beglar, D. (2007). A vocabulary size test. The Language Teacher, 31(7), 9–13.

<a id="18-intention"></a>
## 18. 「いつ・どこで」を決める（実行意図）

**研究で分かっていること**

「〇〇のときに△△をする」と状況と行動を結びつけて決めておく（実行意図）と、目標の達成率が上がる。94の研究のメタ分析で中〜大の効果（d = 0.65）が報告された。

**アプリでの実装**

最初の設定で、学習する時間帯（朝の通勤・昼休み・帰り道・寝る前など）と1日の目安の分数を決め、ホームに毎日表示します。

実装箇所: `src/pages/Welcome.tsx` / `src/lib/settings.ts`（`planWhen`, `dailyMinutes`） / `src/pages/Home.tsx`

**文献**

- Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69–119. <https://doi.org/10.1016/S0065-2601(06)38002-1>

<a id="19-accents"></a>
## 19. いろいろな話し方に慣れる（多様なアクセント）

**研究で分かっていること**

英語を母語とする聞き手を対象とした研究で、訛りのある英語を複数の話者で聞いておくと、初めて聞く話者の同じ訛りも聞き取りやすくなった。いくつもの異なる訛りを聞いた場合は、聞いたことのない訛りにも慣れが広がった。英語は国や地域で発音が大きく違うため、学習者もさまざまな話し方に触れておくことが、実際の会話での聞き取りに役立つと考えられる。

**アプリでの実装**

読み上げの発音を、アメリカ・イギリス・オーストラリア・カナダ・アイルランド・インド・ニュージーランド・南アフリカから選べます（設定 → 音声）。リスニングで「いろいろな国の英語で聞く」をオンにすると、1問ごとに国の発音を変えて出題します。

実装箇所: `src/lib/accents.ts` / `src/components/AccentPicker.tsx` / `src/pages/Listening.tsx`（`mixAccents`）

**文献**

- Bradlow, A. R., & Bent, T. (2008). Perceptual adaptation to non-native speech. Cognition, 106(2), 707–729.
- Baese-Berk, M. M., Bradlow, A. R., & Wright, B. A. (2013). Accent-independent adaptation to foreign accented speech. The Journal of the Acoustical Society of America, 133(3), EL174–EL180.

---

## 設計上の方針

- **研究で効果が確認されたことだけを機能にする。** 根拠の弱い演出（ランキング、過度な報酬など）は入れていません。
- **1回の学習セッションに複数の学習法を重ねる。** 学習セッションは「分散学習（FSRS）＋検索練習＋段階的な難易度＋インターリーブ＋セッション内再テスト」を同時に満たすように組み立てています（`src/lib/session.ts` の冒頭コメント参照）。
- **学ぶ内容は利用者が選ぶ。** 最初に一般会話・ビジネス・保線からコースを選び、新出語・練習の例文・シーンの既定をそのコースに合わせます（関係のない語に時間を使わない）。
- **実務につながる場面を優先する。** 保線現場・規格の議論・設備管理（EAM）など、利用者が実際に英語を使う場面のタスクを用意しています（TBLT）。

## 関連ドキュメント

- データの出典とライセンス: [DATA_LICENSE.md](../DATA_LICENSE.md)
- 保線用語集の作り方: [RAIL_GLOSSARY.md](RAIL_GLOSSARY.md)
