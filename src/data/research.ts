/** 学習法のエビデンスと、アプリへの反映内容 */
export interface Evidence {
  id: string
  title: string
  finding: string
  inApp: string
  refs: { cite: string; url?: string }[]
}

export const EVIDENCE: Evidence[] = [
  {
    id: 'spacing',
    title: '分散学習（間隔を空けた復習）',
    finding:
      '同じ回数の学習でも、まとめて行う（集中学習）より間隔を空けた方が長期記憶に残る。第二言語学習でも分散練習の効果がメタ分析で確認され、オンライン学習の追試でも、間隔を空けた群が集中学習群を上回った。',
    inApp: '復習のタイミングをFSRSアルゴリズムで単語ごとに最適化。「忘れかけた頃」に自動で出題します（ホーム → 学習をはじめる）。',
    refs: [
      { cite: 'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.' },
      { cite: 'Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. Language Learning, 72(1), 269–319.', url: 'https://doi.org/10.1111/lang.12479' },
      { cite: 'Rogers, J., Nakata, T., & Chiu, M. M. (2025). Optimizing distributed practice online: A conceptual replication of Cepeda et al. (2009). Studies in Second Language Acquisition, 47(1), 417–439.', url: 'https://doi.org/10.1017/S0272263124000706' },
    ],
  },
  {
    id: 'fsrs',
    title: '記憶モデルに基づく復習スケジューラ（FSRS）',
    finding:
      '大規模な学習ログ（約2.2億件）から長期記憶をモデル化し、復習コストを最小化するスケジューリング手法が提案され、従来手法より性能が向上したと報告されている。FSRSはこの研究を基にしたオープンソースのアルゴリズム。',
    inApp: 'ts-fsrsを採用。目標保持率（85/90/95%）を設定でき、各評価ボタンに次回復習までの間隔を表示します。',
    refs: [
      { cite: 'Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. Proceedings of KDD 2022, 4381–4390.', url: 'https://doi.org/10.1145/3534678.3539081' },
    ],
  },
  {
    id: 'retrieval',
    title: '検索練習（テスト効果）',
    finding:
      '答えを見直すより、記憶から思い出す（テストする）方が長期保持に有効。学習技法のレビューでも「練習テスト」と「分散学習」が最も有用性が高いと評価された。第二言語語彙では、1回の学習内で複数回思い出す方が、遅延テストの成績が高かった。',
    inApp: '単語は必ず「答える→確認」の順。間違えた語は数問後にもう一度出題し、セッション内で繰り返し想起させます。',
    refs: [
      { cite: 'Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.' },
      { cite: 'Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966–968.' },
      { cite: 'Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students’ learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4–58.' },
      { cite: 'Nakata, T. (2017). Does repeated practice make perfect? The effects of within-session repeated retrieval on second language vocabulary learning. Studies in Second Language Acquisition, 39(4), 653–679.', url: 'https://doi.org/10.1017/S0272263116000280' },
    ],
  },
  {
    id: 'difficulty',
    title: '望ましい困難（段階的な難易度）',
    finding:
      '学習時に適度な困難（思い出す・生成する）を伴う方が長期的な定着につながる。語彙は「意味が分かる（受容）」から「自分で書ける・言える（産出）」まで段階がある。',
    inApp: '記憶の安定度に応じて、選択問題 → 音声だけで答える → 自己評価カード → スペル入力・例文穴埋めへと難易度が上がります。',
    refs: [
      { cite: 'Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), Metacognition: Knowing about knowing (pp. 185–205). MIT Press.' },
      { cite: 'Webb, S. (2007). The effects of repetition on vocabulary knowledge. Applied Linguistics, 28(1), 46–65.' },
    ],
  },
  {
    id: 'interleave',
    title: 'インターリーブ（混ぜて練習）',
    finding: '種類の異なる問題を混ぜて練習すると、区別して使い分ける力が伸びやすい。第二言語の文法練習でも、混ぜて練習した方が長期保持に優れていた。',
    inApp: '一般・ビジネス・保線の単語、復習と新出語を交互に混ぜて出題します。',
    refs: [
      { cite: 'Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. Instructional Science, 35(6), 481–498.' },
      { cite: 'Nakata, T., & Suzuki, Y. (2019). Mixing grammar exercises facilitates long-term retention: Effects of blocking, interleaving, and increasing practice. The Modern Language Journal, 103(3), 629–647.', url: 'https://doi.org/10.1111/modl.12581' },
    ],
  },
  {
    id: 'wordlists',
    title: '高頻度語から学ぶ（語彙リスト）',
    finding:
      '英語の理解には大量の語彙が必要だが、高頻度語から学ぶほど効率よく文章をカバーできる。NGSLは約2,800語で一般的な英文の約92%をカバーし、ビジネス語彙リスト（BSL）と合わせるとビジネス文書の最大97%をカバーするとされる。',
    inApp: '一般語はNGSL、ビジネス語はBSL/TSL（TOEIC）から採用し、頻度順にレベル分け。保線用語はEN規格・TSI・JISの用語体系から独自に編集しました。',
    refs: [
      { cite: 'Nation, I. S. P. (2006). How large a vocabulary is needed for reading and listening? The Canadian Modern Language Review, 63(1), 59–82.' },
      { cite: 'Browne, C., Culligan, B., & Phillips, J. New General Service List 1.2 / Business Service List 1.2 / TOEIC Service List (CC BY-SA 4.0).', url: 'https://www.newgeneralservicelist.com/' },
    ],
  },
  {
    id: 'production',
    title: '産出効果・マルチモーダル学習',
    finding: '声に出して読んだ語は、黙読した語より記憶に残りやすい（産出効果）。文字・音声・例文（文脈）を組み合わせると、記憶の手がかりが増える。',
    inApp: 'すべての単語・例文に発音記号と音声（米・英）を付け、新出語では例文の音読を促します。',
    refs: [
      { cite: 'MacLeod, C. M., Gopie, N., Hourihan, K. L., Neary, K. R., & Ozubko, J. D. (2010). The production effect: Delineation of a phenomenon. Journal of Experimental Psychology: Learning, Memory, and Cognition, 36(3), 671–685.', url: 'https://doi.org/10.1037/a0018785' },
    ],
  },
  {
    id: 'shadowing',
    title: 'シャドーイング',
    finding: '日本人英語学習者を対象とした研究で、シャドーイングはリスニング理解力の向上に効果があり、特に音声知覚（ボトムアップ処理）が課題の学習者に有効とされる。',
    inApp: '「聞く→つぶやく→意味確認→同時読み→シャドーイング」の5ステップで練習できます（練習 → シャドーイング）。',
    refs: [
      { cite: 'Hamada, Y. (2016). Shadowing: Who benefits and how? Uncovering a booming EFL teaching technique for listening comprehension. Language Teaching Research, 20(1), 35–52.' },
      { cite: 'Kadota, S. (2019). Shadowing as a practice in second language acquisition: Connecting inputs and outputs. Routledge.' },
    ],
  },
  {
    id: 'asr',
    title: '音声認識による発音フィードバック',
    finding:
      '15研究のメタ分析で、自動音声認識（ASR）を使った発音学習は中程度の効果（g = 0.69）。明示的な誤りフィードバック、個々の音（分節音）、中〜長期の継続、成人・中級学習者で効果が大きかった。',
    inApp: 'Azure Speechの発音評価で、文・単語・音素ごとにスコアと誤りを表示。苦手な単語をタップして聞き直せます。',
    refs: [
      { cite: 'Ngo, T. T. N., Chen, H. H. J., & Lai, K. K. W. (2024). The effectiveness of automatic speech recognition in ESL/EFL pronunciation: A meta-analysis. ReCALL, 36(1), 4–21.', url: 'https://doi.org/10.1017/S0958344023000113' },
    ],
  },
  {
    id: 'tblt',
    title: 'タスク中心の言語指導（TBLT）',
    finding: '実際の場面・目的のあるタスクを中心にした指導プログラムは、さまざまな学習成果に大きな効果（d = 0.93）を示した。',
    inApp: 'シーン会話は「この場面のゴール」を設定し、キーフレーズ → 聞いて理解 → ロールプレイの流れで練習します。保線現場・規格の議論など実務に直結する場面を用意しました。',
    refs: [
      { cite: 'Bryfonski, L., & McKay, T. H. (2019). TBLT implementation and evaluation: A meta-analysis. Language Teaching Research, 23(5), 603–632.', url: 'https://doi.org/10.1177/1362168817744389' },
    ],
  },
  {
    id: 'agent',
    title: '学習を支えるキャラクター（教育エージェント）',
    finding: '画面上の案内キャラクター（pedagogical agent）を用いた学習は、43研究のメタ分析で小さいながら有意な学習効果を示した。また、能力ではなく努力やプロセスをほめる方が、困難に直面した際の意欲を保ちやすい。',
    inApp: 'コーギーの「テツ」が場面に応じて案内・励ましを行います。正解時は努力を、不正解時は「思い出そうとしたこと」を肯定します。リスニング・発音はインコの「ピコ」、ビジネスはペンギンの「ペンタ」、保線はビーバーの「ボルト」、学習法の解説はフクロウの「ホー先生」が担当します。',
    refs: [
      { cite: 'Schroeder, N. L., Adesope, O. O., & Gilbert, R. B. (2013). How effective are pedagogical agents for learning? A meta-analytic review. Journal of Educational Computing Research, 49(1), 1–39.' },
      { cite: 'Mueller, C. M., & Dweck, C. S. (1998). Praise for intelligence can undermine children’s motivation and performance. Journal of Personality and Social Psychology, 75(1), 33–52.' },
    ],
  },
  {
    id: 'habit',
    title: '習慣化とゲーミフィケーション',
    finding:
      '新しい行動が自動化するまでの期間は個人差が大きく、中央値は約66日だった。ゲーミフィケーションは学習に小〜中程度の効果があるが、研究間のばらつきが大きく、過度な競争要素は必須ではない。',
    inApp: '1日の目標・連続学習日数・進捗のみのシンプルな仕組みにし、ランキング等の競争要素は入れていません。',
    refs: [
      { cite: 'Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009.' },
      { cite: 'Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. Educational Psychology Review, 32(1), 77–112.', url: 'https://doi.org/10.1007/s10648-019-09498-w' },
    ],
  },
]

export const CREDITS: { name: string; desc: string; url?: string }[] = [
  { name: 'NGSL 1.2 / BSL 1.2 / TSL 1.2', desc: 'Browne, Culligan & Phillips — CC BY-SA 4.0（単語リスト）', url: 'https://www.newgeneralservicelist.com/' },
  { name: 'ipa-dict (en_US)', desc: 'open-dict-data, MIT License（cmudict-ipa由来の米音IPA）', url: 'https://github.com/open-dict-data/ipa-dict' },
  { name: 'TSI INF Appendix S', desc: 'Commission Regulation (EU) No 1299/2014 の用語定義を要約（保線用語の定義の参考）', url: 'https://www.legislation.gov.uk/eur/2014/1299/annex/appendix/S' },
  { name: 'ts-fsrs', desc: 'open-spaced-repetition, MIT License（復習スケジューラ）', url: 'https://github.com/open-spaced-repetition/ts-fsrs' },
  { name: 'テツとなかまたち（コーギー・インコ・ペンギン・ビーバー・フクロウ）', desc: 'Blender（bpy）でプロシージャルにモデリング・レンダリングしたオリジナルキャラクター（scripts/blender/）' },
]
