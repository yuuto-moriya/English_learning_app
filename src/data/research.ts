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
    inApp: '単語は必ず「答える→確認」の順。間違えた語は数問後にもう一度出題し、セッション内で繰り返し想起させます。「耳で復習」も、答えの前に考える間を置いて想起を促します。',
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
    inApp: '選んだコース（一般会話・ビジネス・保線）の単語と、復習・新出語、選択・リスニング・スペルなどの出題形式を混ぜて出題します。',
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
    inApp: 'Azure Speechの発音評価で、文・単語・音ごと（米音はIPA表記）にスコアと誤りを表示。苦手な単語をタップして聞き直せます。',
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
    inApp: 'コーギーの「テツ」が場面に応じて案内・励ましを行います。正解時は努力を、不正解時は「思い出そうとしたこと」を肯定します。いろいろな犬種のなかまたち（リスニング・発音のモカ＝トイプードル、ビジネスのスミ＝フレンチブルドッグ、保線のキナコ＝柴犬、学習法の解説のユキ先生＝サモエド、翻訳のショコラ＝ダックスフンド）が各画面の案内を担当します。',
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
    inApp: '1日の目安（分）・連続学習日数・週の記録・12週間の学習記録だけのシンプルな仕組みにし、ランキングなどの競争要素は入れていません。',
    refs: [
      { cite: 'Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998–1009.' },
      { cite: 'Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. Educational Psychology Review, 32(1), 77–112.', url: 'https://doi.org/10.1007/s10648-019-09498-w' },
    ],
  },
  // ───── 2026-10 の改修で追加した機能の根拠 ─────
  {
    id: 'hvpt',
    title: '聞き分けトレーニング（高変動音声訓練：HVPT）',
    finding:
      '日本語話者が苦手な L と R などの対立を、多くの話者の声・多くの語で聞き分ける練習（HVPT）は、初めて聞く声や語にも効果が広がる。79研究のメタ分析でも、知覚への中〜大の効果と、効果の持続が報告された。単語学習でも、複数の話者の声で聞いた方が、聞いて語を思い出す成績が高かった。',
    inApp:
      '「聞き分け」で、L/R・B/V・S/TH など8種類の音の対立を、最小対語（light / right など）と複数の声で練習します。答えるとすぐ正誤が分かり、同じ声で聞き比べられます。リスニング問題も毎回ちがう声で再生できます（設定で切り替え）。',
    refs: [
      { cite: 'Logan, J. S., Lively, S. E., & Pisoni, D. B. (1991). Training Japanese listeners to identify English /r/ and /l/: A first report. The Journal of the Acoustical Society of America, 89(2), 874–886.', url: 'https://doi.org/10.1121/1.1894649' },
      { cite: 'Thomson, R. I. (2018). High variability [pronunciation] training (HVPT): A proven technique about which every language teacher and learner ought to know. Journal of Second Language Pronunciation, 4(2), 208–231.' },
      { cite: 'Uchihara, T., Karas, M., & Thomson, R. I. (2025). High variability phonetic training (HVPT): A meta-analysis of L2 perceptual training studies. Studies in Second Language Acquisition.', url: 'https://doi.org/10.1017/S0272263125100879' },
      { cite: 'Barcroft, J., & Sommers, M. S. (2005). Effects of acoustic variability on second language vocabulary learning. Studies in Second Language Acquisition, 27(3), 387–414.' },
    ],
  },
  {
    id: 'output',
    title: 'アウトプット（産出）の練習',
    finding:
      '言いたいことを自分で英語にしようとすると、知っていることと言えないことの差に気づき、文法や語の使い方に注意が向く（アウトプット仮説）。語彙も、意味が分かる練習（受容）だけでなく、自分で言う・書く練習（産出）をした方が、産出の力が伸びる。',
    inApp: '「瞬間英作文」で、学習した単語の例文を日本語から英語にすぐ言う練習をします。言えなかった文はその回の最後にもう一度出し、お手本の音声と発音チェックで確かめられます。',
    refs: [
      { cite: 'Swain, M. (1985). Communicative competence: Some roles of comprehensible input and comprehensible output in its development. In S. Gass & C. Madden (Eds.), Input in second language acquisition (pp. 235–253). Newbury House.' },
      { cite: 'Webb, S. (2009). The effects of receptive and productive learning of word pairs on vocabulary knowledge. RELC Journal, 40(3), 360–376.' },
    ],
  },
  {
    id: 'relearning',
    title: '連続再学習（正解できるまで → 間隔を空けてまた）',
    finding: '1回の学習の中で正しく思い出せるまで練習し、それを間隔を空けた別の日にも繰り返す方法（successive relearning）は、検索練習と分散学習の両方の利点を持ち、長期の保持に強い効果がある。',
    inApp: '単語学習では、間違えた語を同じ回の中でもう一度出題し、次の復習日は FSRS が決めます。瞬間英作文でも、言えなかった文を最後にもう一度出します。苦手な単語（忘れたことがある語）は単語帳から集中練習できます。',
    refs: [
      { cite: 'Rawson, K. A., & Dunlosky, J. (2022). Successive relearning: An underexplored but potent technique for obtaining and maintaining knowledge. Current Directions in Psychological Science, 31(4), 362–368.', url: 'https://doi.org/10.1177/09637214221100484' },
    ],
  },
  {
    id: 'audio',
    title: '音だけで思い出す復習',
    finding: '答えを見る前に思い出そうとすること（検索練習）が記憶を強める。音声だけの語学教材では、答えの前に考える間を置き、だんだん間隔を広げて思い出させる方法（段階的な間隔での想起）が古くから使われている。',
    inApp: '「耳で復習」で、忘れかけている単語から順に「和訳 → 考える間 → 英語 → 例文」と流します。画面を見なくても進み、再生中は画面が消えないようにします。',
    refs: [
      { cite: 'Pimsleur, P. (1967). A memory schedule. The Modern Language Journal, 51(2), 73–75.', url: 'https://doi.org/10.1111/j.1540-4781.1967.tb06700.x' },
      { cite: 'Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966–968.' },
    ],
  },
  {
    id: 'placement',
    title: 'レベルに合った語から学ぶ（レベル診断）',
    finding: '語彙の力は、頻度の段階ごとに知っている語の割合を調べることで見積もれる（語彙サイズテスト）。すでに知っている語や難しすぎる語に時間を使わず、今のレベルの次の語から学ぶのが効率的。',
    inApp: '最初の設定で、NGSL の各レベルから意味を問う短い診断を行い、身についているレベルの次から新出語を出します。保線用語は専門の基本語から順に出題します。',
    refs: [
      { cite: 'Nation, P., & Beglar, D. (2007). A vocabulary size test. The Language Teacher, 31(7), 9–13.' },
    ],
  },
  {
    id: 'intention',
    title: '「いつ・どこで」を決める（実行意図）',
    finding: '「〇〇のときに△△をする」と状況と行動を結びつけて決めておく（実行意図）と、目標の達成率が上がる。94の研究のメタ分析で中〜大の効果（d = 0.65）が報告された。',
    inApp: '最初の設定で、学習する時間帯（朝の通勤・昼休み・帰り道・寝る前など）と1日の目安の分数を決め、ホームに毎日表示します。',
    refs: [
      { cite: 'Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69–119.', url: 'https://doi.org/10.1016/S0065-2601(06)38002-1' },
    ],
  },
]

export const CREDITS: { name: string; desc: string; url?: string }[] = [
  { name: 'NGSL 1.2 / BSL 1.2 / TSL 1.2', desc: 'Browne, Culligan & Phillips — CC BY-SA 4.0（単語リスト）', url: 'https://www.newgeneralservicelist.com/' },
  { name: 'ipa-dict (en_US)', desc: 'open-dict-data, MIT License（cmudict-ipa由来の米音IPA）', url: 'https://github.com/open-dict-data/ipa-dict' },
  { name: 'TSI INF Appendix S', desc: 'Commission Regulation (EU) No 1299/2014 の用語定義を要約（保線用語の定義の参考）', url: 'https://www.legislation.gov.uk/eur/2014/1299/annex/appendix/S' },
  { name: 'ts-fsrs', desc: 'open-spaced-repetition, MIT License（復習スケジューラ）', url: 'https://github.com/open-spaced-repetition/ts-fsrs' },
  { name: 'Newsreader', desc: 'Production Type — SIL Open Font License 1.1（英語の見出し語・例文の書体）', url: 'https://github.com/productiontype/Newsreader' },
  { name: 'テツとなかまたち（犬のぬいぐるみ）', desc: 'Blender（bpy）でプロシージャルにモデリング・レンダリングしたオリジナルキャラクター（scripts/blender/）' },
]
