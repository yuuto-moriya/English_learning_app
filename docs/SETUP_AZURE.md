# Azure（翻訳・発音評価）の設定手順

Eliza Patina の **翻訳**・**発音評価**・**音声入力**・**高品質な読み上げ（ニューラル音声）**・**同時通訳** は、Microsoft Azure の
**Azure AI Translator** と **Azure AI Speech** を、Vercel Functions（`/api/*`）経由で呼び出しています。
この手順書では、両サービスを **無料枠（Free F0）** で作成し、Vercel に設定するまでを説明します。

> 料金・上限・画面の名称は 2026年10月時点で確認した内容です（末尾の参考資料を参照）。
> Azure の AI サービスは現在「Foundry Tools」というブランドの下にまとめられており、ポータルの表示名が変わることがあります。

## 0. なぜ Azure なのか

- 当初の候補だった **DeepL API Free は、新規に申し込めなくなりました**（DeepL のサポートページに
  「The DeepL API Free plan can no longer be purchased.」と記載）。
- Azure は **翻訳（月200万文字）と音声認識（月5時間）の両方に無料枠** があり、1つのクラウドで両方をまかなえます。
- Azure Speech の **発音評価（Pronunciation Assessment）** は、文・単語・音素ごとのスコアと誤りの種類を返すため、
  発音練習のフィードバックに向いています。

## 全体の構成

```
iPhone（PWA） ──HTTPS──▶ Vercel Functions（/api/*） ──▶ Azure AI Translator / Azure AI Speech
                          └ APIキーはここ（Vercel の環境変数）にだけ保存。端末には送らない
```

| 環境変数 | 必須 | 内容 | 例 |
|---|---|---|---|
| `AZURE_TRANSLATOR_KEY` | 翻訳に必須 | Translator リソースのキー | `abc123…` |
| `AZURE_TRANSLATOR_REGION` | 翻訳に必須 | Translator リソースの場所（リージョン） | `japaneast` |
| `AZURE_TRANSLATOR_ENDPOINT` | 任意 | 翻訳エンドポイント。既定は `https://api.cognitive.microsofttranslator.com` | — |
| `AZURE_SPEECH_KEY` | 音声に必須 | Speech リソースのキー | `def456…` |
| `AZURE_SPEECH_REGION` | 音声に必須※ | Speech リソースの場所（リージョン）。**同時通訳・リアルタイムの音声入力には必須** | `japaneast` |
| `AZURE_SPEECH_ENDPOINT` | 任意※ | Speech リソースのエンドポイント。指定するとリージョンより優先 | `https://<resource>.cognitiveservices.azure.com` |
| `APP_ACCESS_TOKEN` | 任意（推奨） | 設定すると `/api/*` の利用に `X-App-Token` ヘッダーが必要になる | 長いランダム文字列 |

※ `AZURE_SPEECH_REGION` と `AZURE_SPEECH_ENDPOINT` はどちらか一方があれば動きます。

## 最短の手順（チェックリスト）

1. Azure アカウントを作る（[1](#1-azure-アカウントを用意する)）
2. Translator を **Free F0** で作り、キーとリージョンを控える（[2](#2-azure-ai-translator翻訳を作成する)）
3. Speech を **Free F0** で作り、キーとリージョンを控える（[3](#3-azure-ai-speech発音評価音声入力読み上げを作成する)）
4. 料金がかからないことを確かめ、予算のアラートを付ける（[4](#4-料金がかからないようにする)）
5. Vercel に環境変数を入れて Redeploy（[5](#5-vercel-に環境変数を設定する)）
6. アクセストークンを決めて、Vercel とアプリの両方に入れる（[6](#6-アクセストークンapp_access_tokenを設定する)）
7. アプリの **設定 → クラウド機能 → 接続を確認** でチェックが付けば完了（[7](#7-動作を確認する)）

## 1. Azure アカウントを用意する

1. <https://portal.azure.com/> にサインインします（Microsoft アカウントで Azure のサブスクリプションを作成）。
   アカウント作成時には、本人確認（電話番号・クレジットカードなど）を求められることがあります。
   F0 の範囲で使う限り、料金は発生しません（[4](#4-料金がかからないようにする)）。
   - **Azure の無料アカウント**（クレジット付き・30日）で始めた場合、30日後かクレジットを使い切ったときに
     「従量課金制へのアップグレード」をしないとサブスクリプションが無効になり、F0 のリソースも使えなくなります。
     アップグレードしても **F0 のリソースは0円のまま** です（料金がかかるのは、F0 以外の有料のリソースを作ったときだけ）。
   - 最初から従量課金制のサブスクリプションを作っても、F0 だけを使う限り請求は0円です。
   - サインイン後に「操作が必要」「AADSTS16000 … does not exist in tenant 'Microsoft Services'」と出るのは、
     その Microsoft アカウントにまだ Azure のサブスクリプション（とディレクトリ）がないときです。
     <https://azure.microsoft.com/ja-jp/free/> の「無料で始める」から、同じアカウントで申し込みを最後まで済ませてください。
     申し込み済みなら、ポータル右上の歯車 → **ディレクトリとサブスクリプション** で **既定のディレクトリ（Default Directory）** に切り替えます。
     仕事用と個人用のアカウントが混ざっているときは、InPrivate ウィンドウで個人用だけでサインインします。
2. 以降の手順で作るリソースは、まとめて1つの **リソースグループ**（例: `rg-michi`）に入れておくと、
   不要になったときにグループごと削除できます。

## 2. Azure AI Translator（翻訳）を作成する

1. Azure ポータルで Translator の作成画面を開きます。
   - 直接リンク: <https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation>
   - またはポータル上部の検索で「Translator」と入力し、**Translator**（Azure AI Translator）を選んで「作成」
2. 「基本」タブを入力します。

   | 項目 | 設定 |
   |---|---|
   | サブスクリプション | 自分のサブスクリプション |
   | リソースグループ | `rg-michi`（新規作成可） |
   | リージョン | **Japan East**（推奨）。Global も選べます |
   | 名前 | 例: `tetsu-translator`（世界で一意） |
   | 価格レベル | **Free F0** |

3. 「確認と作成」→「作成」。デプロイ完了後「リソースに移動」を押します。
4. 左メニューの **リソース管理 → キーとエンドポイント** を開き、次の値を控えます。
   - **キー 1** → `AZURE_TRANSLATOR_KEY`
   - **場所/リージョン**（例: `japaneast`）→ `AZURE_TRANSLATOR_REGION`
     （Global で作成した場合は `global`）
   - テキスト翻訳のエンドポイントは既定の `https://api.cognitive.microsofttranslator.com` を使うので、
     `AZURE_TRANSLATOR_ENDPOINT` は通常 **設定不要** です。

> **注意: Foundry（マルチサービス）リソースではなく、単体の Translator リソースを作ってください。**
> Microsoft のドキュメントは LLM 翻訳向けに Foundry リソースを推奨していますが、Foundry リソースは
> 無料の F0 がなく、最初のリクエストから課金されます（Microsoft Q&A の回答）。
> このアプリは従来のニューラル機械翻訳（Translator API v3.0）を使うため、単体の Translator（F0）で十分です。

### 翻訳の無料枠と上限

| 項目 | 値 |
|---|---|
| Free F0 の無料枠 | **月200万文字**（標準翻訳とカスタム翻訳の学習の合計） |
| F0 の時間あたり上限 | 200万文字/時（目安として毎分約33,300文字以下で使う） |
| 1リクエストの上限（Azure） | 50,000文字（翻訳先の言語数を掛けた合計） |
| 1リクエストの上限（このアプリ） | 5,000文字（`server/shared.ts` の `MAX_TEXT_CHARS`） |

無料枠を超えると Azure が 403（403001）を返し、アプリには「今月の翻訳の無料枠（200万文字）を使い切りました。料金はかからず、来月また使えます」と表示されます。時間あたりの上限を超えたときは 429 で、「少し待ってから」と表示します。

## 3. Azure AI Speech（発音評価・音声入力・読み上げ）を作成する

1. ポータル上部の検索で「Speech」と入力し、Marketplace の **Speech**（音声サービス / Azure AI Speech）を選んで「作成」。
   - **「Foundry」「AI Services」と書かれたマルチサービスのリソースは選ばないでください**（F0 がありません）。
2. 「基本」タブを入力します。

   | 項目 | 設定 |
   |---|---|
   | リソースグループ | `rg-michi` |
   | リージョン | **Japan East**（推奨） |
   | 名前 | 例: `tetsu-speech` |
   | 価格レベル | **Free F0** |

3. 「確認と作成」→「作成」→「リソースに移動」。
4. **リソース管理 → キーとエンドポイント** で次の値を控えます。
   - **キー 1** → `AZURE_SPEECH_KEY`
   - **場所/リージョン**（例: `japaneast`）→ `AZURE_SPEECH_REGION`
   - **エンドポイント**（`https://<resource>.cognitiveservices.azure.com/` 形式のもの）→ `AZURE_SPEECH_ENDPOINT`（任意）

アプリは `AZURE_SPEECH_ENDPOINT` があれば
`<エンドポイント>/stt/speech/recognition/conversation/cognitiveservices/v1` を、なければ
`https://<リージョン>.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1` を呼び出します
（音声テキスト変換の **REST API for short audio**）。リージョンの指定で 401 / 404 になる場合は、エンドポイントを設定してください。

**読み上げ（`GET /api/tts`）も同じキーで動きます。** 追加の設定は不要です。
`AZURE_SPEECH_ENDPOINT` があれば `<エンドポイント>/tts/cognitiveservices/v1` を、なければ
`https://<リージョン>.tts.speech.microsoft.com/cognitiveservices/v1` を呼び出します（テキスト読み上げの REST API）。

- 声はサーバーの許可リスト（`server/handlers.ts` の `TTS_VOICES`）にあるものだけ使えます：
  米国 Ava / Andrew / Emma / Brian / Jenny / Guy、英国 Sonia / Ryan / Libby、日本語 Nanami（「耳で復習」の和訳）
- 1回の読み上げは 400 文字まで。速度は −50〜+50% を 5% 刻み（同じ文・声・速度なら同じ音声になり、キャッシュが効く）
- 返す音声は MP3（24kHz・48kbps）。`Cache-Control: immutable` を付けるので Vercel の CDN と端末（Cache Storage）に保存され、
  同じ文の2回目以降は Azure を呼びません。品詞で読みが変わる語（live, record など）は発音（IPA）を指定して読ませます
- サーバーに送るのは読み上げる英文だけです（学習の記録は送りません）。Azure が使えないとき・オフラインのときは、自動で端末の音声合成に切り替わります
- 声はアメリカ・イギリス・オーストラリア・カナダ・アイルランド・インド・ニュージーランド・南アフリカの8つの発音から選べます（アプリの 設定 → 音声）

**同時通訳・リアルタイムの音声入力（`GET /api/speech-token`）も同じキーで動きます。** `AZURE_SPEECH_REGION` を必ず設定してください。

- サーバーが `https://<リージョン>.api.cognitive.microsoft.com/sts/v1.0/issueToken`（カスタムドメインがあれば `<エンドポイント>/sts/v1.0/issueToken`）から
  **有効期限10分の一時トークン**を取得してアプリに渡します。キーそのものは端末に渡しません
- アプリはそのトークンで、ブラウザの Speech SDK から Azure に直接つなぎ、話している途中から文字起こしと訳（音声翻訳）を受け取ります。音声は Vercel を通りません。長く話し続けるときはトークンを途中で更新します
- リージョンが未設定（カスタムドメインだけ）のときは、同時通訳は「端末の音声認識＋翻訳 API」（Safari のタブ・Chrome）か「録音して文字起こし」で動きます

### 音声の無料枠と上限

| 項目 | 値 |
|---|---|
| Free F0 の無料枠 | 音声テキスト変換（リアルタイム）**月5時間**（Standard と Custom で共有。バッチは対象外） |
| 発音評価の課金 | 別メーターではなく、音声テキスト変換の音声時間として数えられます（Microsoft Q&A の回答。料金ページで最新を確認） |
| F0 の同時リクエスト数 | 1（変更不可） |
| REST API for short audio の音声長 | 最大60秒 |
| 発音評価の音声長 | **30秒以内** |
| 読み上げ（ニューラル音声）の無料枠 | **月50万文字**（Free F0。料金ページで最新を確認） |
| 同時通訳（音声翻訳）・リアルタイム音声入力 | 音声の時間で数えます（Free F0 の無料枠は料金ページで確認。会話の合間はマイクを止めると節約できます） |
| 読み上げの回数制限（F0） | 短い時間に多く呼ぶと 429 になります（クォータと制限のページで確認）。アプリは先読みを 12 件までに抑え、一度取得した音声は再利用します |
| このアプリの録音上限 | 28秒・2MB（`src/lib/recorder.ts` の `MAX_SECONDS`、`server/shared.ts` の `MAX_AUDIO_BYTES`） |

目安として、1回5秒の発音チェックなら月5時間で約3,600回使えます。
読み上げは、単語（約8文字）と例文（約50文字）を1語あたり約60文字とすると、月50万文字で約8,000語分です（聞いたことのある音声は端末と CDN のキャッシュから再生されるので、実際の消費はもっと少なくなります）。
無料枠を超えると「音声APIの無料枠または回数制限に達しました」と表示されます。

> F0 のリソースは、作成済み・削除済み（論理削除で残っているもの）があると新しく作れないことがあります。
> 作成できない場合は、既存の F0 リソースや「削除済みリソースの管理（Purge）」を確認してください。

## 4. 料金がかからないようにする

### しくみ：F0 は上限で止まるだけで、勝手に有料にならない

- **Free F0 は料金0円の価格レベル** です。月の無料枠を使い切ると、Azure がその月の残りのリクエストを
  エラー（翻訳は 403、コード 403001）で断るだけで、**自動で有料の S0 に切り替わることはありません**。翌月になると、また使えます。
- アプリは、翻訳の無料枠を使い切ったときに「今月の翻訳の無料枠（200万文字）を使い切りました。料金はかからず、来月また使えます」と表示します。
  読み上げは端末の音声合成に、発音チェックは端末の判定か自己評価に、自動で切り替わります。
- 料金が発生するのは、次のどれかを **自分で** したときだけです。
  1. リソースを **S0（Standard）** で作った、または作ったあとで価格レベルを S0 に変えた
  2. F0 のない種類のリソース（**Foundry**・**AI Services**（マルチサービス）・Azure OpenAI など）を作った
  3. このアプリと関係のない有料のリソース（仮想マシンなど）を作った

### 確かめること（作成後に1回）

1. Translator・Speech それぞれのリソースの **概要** で、**価格レベル（Pricing tier）が Free F0** になっていること
   （**リソース管理 → 価格レベル** の画面で、F0 が選ばれていること。S0 を選んで「選択」を押さない）
2. ポータル上部の **Cloud Shell**（`>_` のボタン）で、次のコマンドを実行して、`Sku` がすべて `F0` であること
   ```bash
   az cognitiveservices account list --query "[].{Name:name, Kind:kind, Sku:sku.name}" -o table
   ```
   `Kind` は `TextTranslation`（Translator）と `SpeechServices`（Speech）の2つだけのはずです。
   ほかの種類（`AIServices`・`OpenAI` など）があれば、使っていないなら削除してください。

### 予算のアラートを付ける（万一のときにすぐ気づく）

料金が1円でも発生したらメールが届くようにしておきます（予算そのものは無料です）。

1. ポータル上部の検索で **コストの管理と請求**（Cost Management + Billing）→ **コストの管理** → **予算** → **追加**
2. スコープは自分のサブスクリプション。名前は例: `no-charge`、リセット期間は **毎月**、予算額は **100**（円）
3. **アラートの条件** で、種類 **実際** ・ **予算の割合 1%**（＝1円）を追加し、**アラートの受信者（メール）** に自分のアドレスを入れて **作成**

> 予算のアラートは **知らせるだけで、利用を止める機能ではありません**（止めるのは F0 の上限です）。
> また、料金のデータは数時間〜1日ほど遅れて反映されます。メールが届いたら **コストの分析** で何に料金がかかったかを確かめ、
> そのリソースを削除するか F0 に戻してください。

### ふだんの確認

- 月に1回ほど、**コストの管理 → コストの分析** で今月の金額が **0円** になっていることを確かめる
- アプリの API を他人に使われて無料枠を使い切られないよう、`APP_ACCESS_TOKEN` を設定する（[6](#6-アクセストークンapp_access_tokenを設定する)）
  - これは無料枠を守るためのものです。F0 なら、他人に使われても料金はかかりません
- Vercel の Hobby プラン（無料）は、上限を超えると止まるだけで料金はかかりません（[9](#9-料金上限のまとめvercel-側)）

## 5. Vercel に環境変数を設定する

### ダッシュボードで設定（推奨）

1. Vercel ダッシュボードでプロジェクトを開き、**Settings → Environment Variables**
2. 変数名（Key）と値（Value）を入力します。APIキーとトークンは種類を **Secret** にします（保存後は値を表示できなくなります）
3. 適用する環境（**Production** / **Preview** / **Development**）を選んで **Save**
4. 環境変数の変更は **新しいデプロイにだけ反映** されます。**Deployments** から最新のデプロイを **Redeploy** するか、新しいコミットを push してください

初回の Import 時（**Configure Project** 画面の **Environment Variables**）に入力しておけば、最初のデプロイから使えます。

### コマンドで設定（Vercel CLI）

```bash
npx vercel login
npx vercel link                                    # プロジェクトと関連付け（初回のみ）
npx vercel env add AZURE_TRANSLATOR_KEY production # 値は対話形式で入力
npx vercel env add AZURE_TRANSLATOR_REGION production
npx vercel env add AZURE_SPEECH_KEY production
npx vercel env add AZURE_SPEECH_REGION production
npx vercel env add APP_ACCESS_TOKEN production     # 任意
```

> キーはリポジトリに **コミットしないでください**。`vercel.json` にも書きません。

### ローカル開発

```bash
cp .env.example .env.local   # 値を書き換える（.env.local は .gitignore 済み）
npx vercel dev               # http://localhost:3000（/api も動く）
```

Vercel に登録した Development 用の値を使う場合、`vercel dev` は自動で読み込みます（`.env.local` は不要）。

## 6. アクセストークン（`APP_ACCESS_TOKEN`）を設定する

`/api/*` は公開 URL なので、URL を知っている人なら誰でも呼び出せ、無料枠を消費されるおそれがあります。
`APP_ACCESS_TOKEN` を設定すると、`X-App-Token` ヘッダーが一致しないリクエストは 401 で拒否されます
（`/api/health` だけは確認用に除外）。

1. 長いランダム文字列を作ります。
   ```bash
   openssl rand -base64 32
   # または
   node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
   ```
2. Vercel に `APP_ACCESS_TOKEN` として **Secret** で登録し、Redeploy します。
3. iPhone のアプリで **設定 → クラウド機能（翻訳・発音評価）→ アクセストークン** に同じ文字列を入力します
   （トークンが必要な場合だけ入力欄が表示されます）。
   - トークンはその端末内（ブラウザのストレージ）に保存されます。ホーム画面に追加したアプリと Safari のタブでは保存先が
     別なので、実際に使う方（通常はホーム画面のアプリ）で入力してください。

> これは「共有の合言葉」による簡易的な保護で、ユーザー認証ではありません。
> トークンが漏れた場合は値を変更して Redeploy してください。

## 7. 動作を確認する

### `/api/health`

```bash
curl https://<your-project>.vercel.app/api/health
# => {"translator":true,"speech":true,"tts":true,"realtime":true,"tokenRequired":true}
```

`translator` / `speech` / `tts` / `realtime` が `false` の場合は、変数名の誤り・未設定・再デプロイ忘れを確認してください（`tts` は Speech のキーがあれば `true`、`realtime` はキーとリージョンの両方があれば `true`）。

### 同時通訳のトークン

```bash
curl -H 'X-App-Token: <APP_ACCESS_TOKEN>' https://<your-project>.vercel.app/api/speech-token
# => {"token":"eyJ…","region":"japaneast","expiresIn":540}
```

### 読み上げ API

```bash
curl -o hello.mp3 -H 'X-App-Token: <APP_ACCESS_TOKEN>' \
  'https://<your-project>.vercel.app/api/tts?v=en-US-AvaNeural&r=0&t=Hello'
```

### 翻訳 API

```bash
curl -X POST https://<your-project>.vercel.app/api/translate \
  -H 'Content-Type: application/json' \
  -H 'X-App-Token: <APP_ACCESS_TOKEN>' \
  -d '{"text":"軌道狂いを整正する","to":"en"}'
```

### アプリの設定画面

1. **設定 → クラウド機能（翻訳・発音評価）** で「接続を確認」を押す
2. 「翻訳（Azure Translator）」「発音評価・音声入力（Azure Speech）」「高品質音声（Azure ニューラル音声）」にチェックが付けば OK
3. **練習 → 発音チェック** で、採点方式が「Azure発音評価（単語・音素ごとに採点）」になっていることを確認
4. **設定 → 音声** の「読み上げ」が「高品質を優先」になっていれば、単語・例文・会話がニューラル音声で読み上げられます
5. **翻訳 → 同時通訳** で、空欄の説明に「Azure の音声翻訳で、話している途中から訳します」と出ていれば、リアルタイムの音声翻訳が使えます

### よくあるエラー

| 表示・ステータス | 原因と対処 |
|---|---|
| 503「翻訳API（Azure Translator）が未設定です」 | 環境変数が未設定、または設定後に再デプロイしていない |
| 401「アクセストークンが正しくありません」 | アプリの設定画面のトークンが `APP_ACCESS_TOKEN` と一致していない |
| 502「翻訳APIエラー (401)」など | キーの誤り、またはリージョンがリソースの場所と一致していない |
| 502「今月の翻訳の無料枠（200万文字）を使い切りました…」 | F0 の月の無料枠を使い切った。料金はかからず、翌月にまた使える |
| 502「翻訳の回数制限に達しました…」 | F0 の時間あたりの上限。少し待ってからもう一度 |
| 502「音声APIの無料枠または回数制限に達しました」 | 音声の月の無料枠・回数制限・同時リクエスト数（F0 は1）の上限に達した |
| 422「音声を認識できませんでした」 | 無音・雑音が多い。静かな場所で、マイクに近づいてもう一度 |
| 「サーバーに接続できません」 | オフライン、または `npm run dev`（API なし）で起動している |

## 8. Azure を設定しない場合

Azure がなくても、次の機能はそのまま使えます。

- 単語学習（FSRS）、単語帳、リスニングクイズ、ディクテーション、シャドーイング、聞き分け、瞬間英作文、耳で復習（読み上げは端末の音声合成）
- シーン別会話・ロールプレイ
- 保線用語グロッサリー（オフラインの用語検出）

発音チェックは、Safari のタブで開いている場合は **端末の音声認識による簡易判定** に、
ホーム画面に追加したアプリ（iOS のホーム画面 Web アプリでは SpeechRecognition が使えない）では
**録音して聞き比べる自己評価** に切り替わります。翻訳と音声入力は使えません。

## 9. 料金・上限のまとめ（Vercel 側）

Hobby プラン（無料）の主な上限（1か月あたり）です。

| 項目 | 上限 |
|---|---|
| Function Invocations（`/api/*` の呼び出し） | 1,000,000 回 |
| Active CPU | 4 CPU 時間 |
| Fast Data Transfer | 100 GB |
| Function の最大実行時間 | 300 秒（このアプリは発音評価・音声入力を 30 秒、読み上げを 15 秒、一時トークンを 10 秒に設定） |

上限を超えると、その機能は 30 日経過するまで使えなくなります。
Hobby プランは **個人・非商用の利用に限られます**。業務で使う場合は Pro プランにしてください。

個人の学習用途であれば、Vercel・Azure ともに無料枠の範囲で運用できる想定です。

## 参考資料（2026年10月に確認）

- DeepL API Free（DeepL Help Center）: <https://support.deepl.com/hc/en-us/articles/360021200939-DeepL-API-Free>
- Azure AI Translator 価格: <https://azure.microsoft.com/en-in/pricing/details/cognitive-services/translator/>
- Translator のサービス制限: <https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits>
- Translator リソースの作成: <https://learn.microsoft.com/en-us/azure/ai-services/translator/how-to/create-translator-resource>
- Translator の認証（リージョンヘッダー）: <https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/authentication>
- Translator Text API 2026-06-06 への移行: <https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/how-to/migrate-to-2026-06-06>
- Azure AI Speech 価格: <https://azure.microsoft.com/pricing/details/speech/>
- Speech の REST API for short audio（60秒／発音評価30秒）: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short>
- Speech のクォータと制限: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits>
- Speech のクイックスタート（キーとエンドポイント）: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text>
- テキスト読み上げの REST API: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech>
- 音声翻訳（Speech SDK・JavaScript）: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-translation>
- 一時トークン（issueToken）での認証: <https://learn.microsoft.com/en-us/azure/ai-services/authentication>
- SSML の発音指定（phoneme）: <https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-pronunciation>
- 発音評価の課金（Microsoft Q&A）: <https://learn.microsoft.com/en-us/answers/questions/5608069/pricing-and-usage-of-pronunciation-assessment-feat>
- Foundry リソースと F0（Microsoft Q&A）: <https://learn.microsoft.com/en-us/answers/questions/5644473/how-to-use-free-tier-requests-with-microsoft-found>
- Vercel の環境変数: <https://vercel.com/docs/environment-variables>
- Vercel Functions（Node.js ランタイム）: <https://vercel.com/docs/functions/runtimes/node-js>
- Vercel Hobby プランの上限: <https://vercel.com/docs/plans/hobby>
- Azure 無料アカウント（30日後のアップグレード）: <https://azure.microsoft.com/en-us/pricing/offers/ms-azr-0017g/>
- 料金がかからないようにする方法（Microsoft Q&A）: <https://learn.microsoft.com/en-us/answers/questions/2263766/how-do-i-make-sure-im-not-paying-for-azure-service>
- Cost Management の予算: <https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets>
