# Tetsu English — 英語学習＆翻訳 PWA

> **English summary**
> Tetsu English is an English-learning and translation PWA for a Japanese railway track-maintenance (保線) and EAM professional, designed for iPhone (add to home screen).
> It combines 3,824 words (general NGSL / business BSL+TSL / rail & EAM glossary) with an evidence-based study session (retrieval practice + FSRS spaced repetition + interleaving),
> listening, dictation, shadowing, Azure pronunciation assessment, 30 role-play dialogues, and an Azure-powered translator that flags rail terms (UK / US / JIS Japanese).
> Built with React 19, TypeScript, Vite, Tailwind CSS v4 and Dexie (all learning data stays on the device), hosted on Vercel (static site + Vercel Functions).
> A corgi guide, "Tetsu", and four animal friends are modeled procedurally in Blender.
> Code: MIT. Word-list data: CC BY-SA 4.0 (see [DATA_LICENSE.md](DATA_LICENSE.md)).

一般・ビジネス・鉄道保線（設備管理/EAM を含む）の英語を、**学習**から**実務での翻訳**までひとつで扱えるアプリです。
iPhone のホーム画面に追加して使うことを前提に作っています。案内役はコーギーの「テツ」で、リスニング・発音はインコの「ピコ」、ビジネスはペンギンの「ペンタ」、保線はビーバーの「ボルト」、学習法の解説はフクロウの「ホー先生」が担当します。

---

## 目次

- [主な機能](#主な機能)
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

### 単語（3,824語）

| カテゴリ | 語数 | 出典 | レベル |
|---|---|---|---|
| 一般・日常 | 2,847 | NGSL 1.2（一般英語の約92%をカバーする高頻度語） | A1〜B2 |
| ビジネス | 555 | BSL 1.2 / TSL 1.2（ビジネス・TOEIC 頻出語） | B1〜C1 |
| 鉄道・保線 | 422 | EN 規格・TSI・JIS の用語体系から独自に編集（設備管理/EAM・SAP 用語を含む） | B2〜専門 |

- すべての語に **和訳・米音 IPA・例文（英日）**。保線用語は **英音 IPA、英国表記／米国表記、JIS 用語、解説、出典タグ** 付き
- レベルは 6 段階：入門（A1）／初級（A2）／中級（B1）／中上級（B2）／上級（C1）／専門
- 初回起動時のオンボーディングで、自分に合ったレベルを選択

### 学習セッション（エビデンスに基づく設計）

- **検索練習**：必ず「答える → 確認」。間違えた語はセッション内で数問後に再出題
- **分散学習（FSRS）**：ts-fsrs で単語ごとに次回の復習日を決定。目標保持率（85/90/95%）を設定可能
- **段階的な難易度**：記憶の安定度に応じて 選択問題 → 音声だけで答える → 自己評価カード → スペル入力・例文穴埋め
- **インターリーブ**：カテゴリや復習／新出語を混ぜて出題
- 1日の目標・連続学習日数・進捗のシンプルな習慣化（ランキング等の競争要素なし）

根拠となる研究と実装の対応は [docs/RESEARCH.md](docs/RESEARCH.md) にまとめています（アプリ内の「学習法の根拠」画面と同じ内容）。

### リスニング・スピーキング

- **リスニングクイズ**、**ディクテーション**（読み上げは端末の音声合成。米音・英音を選択可能）
- **シャドーイング**：「聞く → つぶやく → 意味確認 → 同時読み → シャドーイング」の 5 ステップコーチ
- **発音チェック**：Azure AI Speech の発音評価で、文・単語・音素ごとのスコアと誤りを表示
  - Azure 未設定時は、Safari のタブでは端末の音声認識による簡易判定、ホーム画面アプリ（iOS では SpeechRecognition 非対応）では録音して聞き比べる自己評価に切り替え

### シーン別会話（30本）

- 日常・ビジネス・保線の各 10 本。「この場面のゴール」→ キーフレーズ → 聞いて理解 → ロールプレイ
- 保線では、作業前の安全ミーティング、指令への線路閉鎖の連絡、軌道検測データのレビュー、EN 規格と JIS の違いの議論、EAM 導入ワークショップなど実務に直結する場面

### 翻訳

- Azure AI Translator による日英・英日翻訳（音声入力対応）
- **保線用語の自動検出**：原文・訳文に含まれる専門用語を、英国表記／米国表記／JIS 日本語で並べて表示（オフラインで動作）
- 規格英語の **shall / should / may** の使い分けのヒント

### その他

- 学習データはすべて **端末内（IndexedDB）** に保存。設定画面から JSON で書き出し・読み込み（機種変更時のバックアップ）
- ダークモード、オフライン対応（Service Worker）
- Azure を設定しなくても、単語学習・リスニング・ディクテーション・シャドーイング・シーン会話・保線用語チェックは利用可能

## 技術スタック

| 分類 | 使用技術 |
|---|---|
| フロントエンド | React 19, TypeScript 7, Vite 8, React Router 8 |
| スタイル・動き | Tailwind CSS v4（アニメーションは CSS のみ）, lucide-react |
| PWA | vite-plugin-pwa（Workbox, 更新はアプリ内の通知から） |
| データ保存 | Dexie（IndexedDB）, zustand（設定） |
| 復習スケジューラ | ts-fsrs（FSRS） |
| ホスティング・API | Vercel（静的配信 + Vercel Functions `/api`） |
| 外部 API | Azure AI Translator, Azure AI Speech（発音評価・音声認識） |
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
│   ├── vocab/                 #   一般・ビジネス語の和訳と例文（general-1..4.txt, business-3..4.txt）
│   ├── rail/                  #   保線・EAM 用語集（11 サブカテゴリ）
│   └── ipa/                   #   （任意）米音 IPA 辞書の置き場所
├── docs/                      # ドキュメント
├── api/                      # Vercel Functions（エントリポイントのみ。処理は server/）
│   ├── health.ts              #   GET  /api/health（Azure の設定状況）
│   ├── translate.ts           #   POST /api/translate（Azure Translator）
│   ├── pronunciation.ts       #   POST /api/pronunciation（Azure Speech 発音評価）
│   ├── stt.ts                 #   POST /api/stt（音声入力の文字起こし）
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
│   ├── components/            # 共通 UI（ガイド、発音チェック、単語情報など）
│   ├── data/                  # 単語 JSON（生成物）、シーン会話、学習法の根拠
│   ├── lib/                   # 学習セッション、FSRS、DB、用語検出、音声、設定
│   ├── pages/                 # 画面（ホーム、学習、単語帳、練習、シーン、翻訳、設定…）
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

`main` に push するたびに自動で本番にデプロイされます。`staging` ブランチは検証環境で、push のたびにプレビュー用の固定 URL にデプロイされます。ほかのブランチや Pull Request にもプレビュー用の URL が作られます。

ブランチ運用: 修正は `staging` から切ったブランチで行い、`staging` へ PR → 確認後に `staging` から `main` へ PR で本番へ反映します。

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

翻訳・発音評価・音声入力には Azure AI Translator と Azure AI Speech（どちらも無料の F0 プランあり）を使います。
キーは Vercel の環境変数（サーバー側）にだけ保存され、端末には送られません。

| 環境変数 | 必須 | 内容 |
|---|---|---|
| `AZURE_TRANSLATOR_KEY` / `AZURE_TRANSLATOR_REGION` | 翻訳に必須 | Translator リソースのキーとリージョン（例: `japaneast`） |
| `AZURE_TRANSLATOR_ENDPOINT` | 任意 | 既定 `https://api.cognitive.microsofttranslator.com` |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | 音声に必須 | Speech リソースのキーとリージョン |
| `AZURE_SPEECH_ENDPOINT` | 任意 | 例 `https://<resource>.cognitiveservices.azure.com` |
| `APP_ACCESS_TOKEN` | 任意（推奨） | 設定すると `/api/*` に `X-App-Token` が必要。アプリの設定画面で入力 |

リソースの作り方・無料枠・確認方法は **[docs/SETUP_AZURE.md](docs/SETUP_AZURE.md)** を参照してください。
設定後は `https://<project>.vercel.app/api/health` か、アプリの **設定 → クラウド機能 →「接続を確認」** で確認できます。

## iPhone のホーム画面に追加する

1. iPhone の **Safari** でアプリの URL（例: `https://<project>.vercel.app`）を開く
2. 共有ボタン（四角から上向き矢印）→ **ホーム画面に追加**（見当たらない場合は共有メニューを下にスクロール）
3. 名前を確認して **追加**。以降はホーム画面のアイコンから全画面で起動します

使い方のポイント:

- 初回起動でレベルを選ぶと学習を始められます。単語データはアプリに同梱されているので、オフラインでも学習できます
- 発音チェック・音声入力ではマイクの使用を許可してください
- より自然な読み上げには、iPhone の「設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 英語」で高品質（拡張・プレミアム）音声をダウンロードします
- 学習データはその端末内にだけ保存されます。**Safari のタブとホーム画面のアプリでは保存先が別** なので、普段使う方（ホーム画面）で学習してください
- 機種変更や念のためのバックアップは、**設定 → データ → 書き出し**（JSON）→ 新しい端末で **読み込み**
- `APP_ACCESS_TOKEN` を設定している場合は、ホーム画面のアプリの設定画面でトークンを入力します

## データパイプラインと単語の追加

```
data-src/lists/*.csv          NGSL / BSL / TSL（見出し語・頻度順位、CC BY-SA 4.0）
data-src/vocab/*.txt          一般・ビジネス語の和訳と例文
data-src/rail/*.txt           保線・EAM 用語集
scripts/.cache/en_US.txt      米音 IPA 辞書（ipa-dict, MIT）
        │
        ▼  npm run data:build（scripts/build_vocab.py）
src/data/vocab/general.json   一般 2,847語
src/data/vocab/business.json  ビジネス 555語
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

### 一般語・ビジネス語を追加・修正する

`data-src/vocab/*.txt` に 1 行 1 語、5 列のパイプ区切りで書きます（`#` で始まる行はコメント）。

```
lemma|品詞|和訳|例文(英)|例文(和)
reservation|n|予約|I have a *reservation* under the name Moriya.|守屋の名前で予約しています。
```

- 例文の見出し語は `*アスタリスク*` で囲みます（囲み忘れはビルド時に活用形を探して自動で囲み、見つからなければ警告）
- レベルはファイルで決まります：`general-N.txt` → レベル N（NGSL のグループ）、`business-3/4.txt` → レベル 3/4
  （`business-4.txt` のうち BSL の順位が 300 より低い語はレベル 5 に）
- 一般語とビジネス語で重複した語は警告を出してスキップされます。NGSL/BSL/TSL にない語の頻度順位は 9999 になります
- ID は見出し語から作られます（`g-<語>` / `b-<語>`）。**見出し語を変えると、その語の学習履歴は引き継がれません**

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

案内役のテツ（コーギー）と、なかまたち（ピコ＝インコ、ペンタ＝ペンギン、ボルト＝ビーバー、ホー先生＝フクロウ）は、Blender（bpy）を Python モジュールとして使い、プロシージャルにモデリング・レンダリングしています。

| ファイル | 内容 |
|---|---|
| `scripts/blender/kit.py` | 共通部品（楕円体・カプセル・目・ヘルメットなど）、ライト・カメラ、レンダリング設定 |
| `scripts/blender/corgi.py` | テツ（8ポーズ：greet / happy / celebrate / think / cheer / sleep / safety / oops） |
| `scripts/blender/cast.py` | なかまたち（各4ポーズ：greet / happy / think / cheer） |
| `scripts/blender/render.py` | レンダリングの実行（透過 PNG） |
| `scripts/blender/postprocess.py` | WebP・アプリアイコンへの変換 |

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install bpy pillow        # bpy は対応する Python のバージョンが限られます（PyPI の bpy のページで確認）

# 1) レンダリング（透過 PNG: <キャラ>-<ポーズ>.png と tetsu-icon.png）
python scripts/blender/render.py render-out --size 768 --samples 64
#    一部だけ: --only tetsu-happy,pico-greet

# 2) アプリ用アセットに変換
python scripts/blender/postprocess.py render-out
#    → public/guide/<キャラ>-<ポーズ>.webp（384px, 透過）
#    → public/icons/icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png, public/favicon.png
```

画面での使い分け（どのキャラが話すか）は `src/lib/characters.ts` と各ページの `<Guide who="…">` で決めています。

## ライセンス

| 対象 | ライセンス |
|---|---|
| ソースコード | [MIT](LICENSE)（© 2026 yuuto-moriya） |
| NGSL / BSL / TSL と、それに基づく一般・ビジネス語データ | CC BY-SA 4.0（Browne, Culligan & Phillips, <https://www.newgeneralservicelist.com/>） |
| 米音 IPA | MIT（open-dict-data/ipa-dict、cmudict-ipa 由来） |
| 保線・EAM 用語集 | 本プロジェクトのオリジナル編集物（MIT）。規格本文は転載していません |
| キャラクターの画像・アイコン | 本プロジェクトのオリジナル（MIT） |

詳しくは [DATA_LICENSE.md](DATA_LICENSE.md) を参照してください。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | オーナーの要件と決定事項（機能追加・変更の前に読む） |
| [docs/SETUP_AZURE.md](docs/SETUP_AZURE.md) | Azure Translator / Speech の作成、Vercel への設定、アクセストークン、動作確認 |
| [docs/RESEARCH.md](docs/RESEARCH.md) | 学習法のエビデンス（文献）と、アプリでの実装 |
| [docs/RAIL_GLOSSARY.md](docs/RAIL_GLOSSARY.md) | 保線用語集の編集方針・出典タグ・著作権・追加方法 |
| [DATA_LICENSE.md](DATA_LICENSE.md) | データ・素材のライセンスと出典 |
