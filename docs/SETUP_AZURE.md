# Azure（翻訳・発音評価）の設定手順

Tetsu English の **翻訳**・**発音評価**・**音声入力** は、Microsoft Azure の
**Azure AI Translator** と **Azure AI Speech** を、Cloudflare Pages Functions 経由で呼び出しています。
この手順書では、両サービスを **無料枠（Free F0）** で作成し、Cloudflare Pages に設定するまでを説明します。

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
iPhone（PWA） ──HTTPS──▶ Cloudflare Pages Functions（/api/*） ──▶ Azure AI Translator / Azure AI Speech
                          └ APIキーはここ（暗号化された環境変数）にだけ保存。端末には送らない
```

| 環境変数 | 必須 | 内容 | 例 |
|---|---|---|---|
| `AZURE_TRANSLATOR_KEY` | 翻訳に必須 | Translator リソースのキー | `abc123…` |
| `AZURE_TRANSLATOR_REGION` | 翻訳に必須 | Translator リソースの場所（リージョン） | `japaneast` |
| `AZURE_TRANSLATOR_ENDPOINT` | 任意 | 翻訳エンドポイント。既定は `https://api.cognitive.microsofttranslator.com` | — |
| `AZURE_SPEECH_KEY` | 音声に必須 | Speech リソースのキー | `def456…` |
| `AZURE_SPEECH_REGION` | 音声に必須※ | Speech リソースの場所（リージョン） | `japaneast` |
| `AZURE_SPEECH_ENDPOINT` | 任意※ | Speech リソースのエンドポイント。指定するとリージョンより優先 | `https://<resource>.cognitiveservices.azure.com` |
| `APP_ACCESS_TOKEN` | 任意（推奨） | 設定すると `/api/*` の利用に `X-App-Token` ヘッダーが必要になる | 長いランダム文字列 |

※ `AZURE_SPEECH_REGION` と `AZURE_SPEECH_ENDPOINT` はどちらか一方があれば動きます。

## 1. Azure アカウントを用意する

1. <https://portal.azure.com/> にサインインします（Microsoft アカウントで Azure のサブスクリプションを作成）。
   アカウント作成時には、本人確認（電話番号・クレジットカードなど）を求められることがあります。
   F0 の範囲で使う限り、料金は発生しません。
2. 以降の手順で作るリソースは、まとめて1つの **リソースグループ**（例: `rg-tetsu-english`）に入れておくと、
   不要になったときにグループごと削除できます。

## 2. Azure AI Translator（翻訳）を作成する

1. Azure ポータルで Translator の作成画面を開きます。
   - 直接リンク: <https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation>
   - またはポータル上部の検索で「Translator」と入力し、**Translator**（Azure AI Translator）を選んで「作成」
2. 「基本」タブを入力します。

   | 項目 | 設定 |
   |---|---|
   | サブスクリプション | 自分のサブスクリプション |
   | リソースグループ | `rg-tetsu-english`（新規作成可） |
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

無料枠を超えると Azure が 403 / 429 を返し、アプリには「翻訳APIの無料枠または回数制限に達しました」と表示されます。

## 3. Azure AI Speech（発音評価・音声入力）を作成する

1. ポータル上部の検索で「Speech」と入力し、Marketplace の **Speech**（音声サービス / Azure AI Speech）を選んで「作成」。
   - **「Foundry」「AI Services」と書かれたマルチサービスのリソースは選ばないでください**（F0 がありません）。
2. 「基本」タブを入力します。

   | 項目 | 設定 |
   |---|---|
   | リソースグループ | `rg-tetsu-english` |
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

### 音声の無料枠と上限

| 項目 | 値 |
|---|---|
| Free F0 の無料枠 | 音声テキスト変換（リアルタイム）**月5時間**（Standard と Custom で共有。バッチは対象外） |
| 発音評価の課金 | 別メーターではなく、音声テキスト変換の音声時間として数えられます（Microsoft Q&A の回答。料金ページで最新を確認） |
| F0 の同時リクエスト数 | 1（変更不可） |
| REST API for short audio の音声長 | 最大60秒 |
| 発音評価の音声長 | **30秒以内** |
| このアプリの録音上限 | 28秒・2MB（`src/lib/recorder.ts` の `MAX_SECONDS`、`server/shared.ts` の `MAX_AUDIO_BYTES`） |

目安として、1回5秒の発音チェックなら月5時間で約3,600回使えます。
無料枠を超えると「音声APIの無料枠または回数制限に達しました」と表示されます。

> F0 のリソースは、作成済み・削除済み（論理削除で残っているもの）があると新しく作れないことがあります。
> 作成できない場合は、既存の F0 リソースや「削除済みリソースの管理（Purge）」を確認してください。

## 4. Cloudflare Pages に環境変数を設定する

### ダッシュボードで設定（推奨）

1. Cloudflare ダッシュボード → **Workers & Pages** → プロジェクト（`tetsu-english`）を選択
2. **Settings → Variables and Secrets → Add**
3. 変数名と値を入力し、**Encrypt** を選んで **Save**（APIキーとトークンは必ず暗号化＝シークレットにする）
4. 必要に応じて **Production** と **Preview** の両方に設定します
5. シークレットは「それを使うデプロイより前に」設定する必要があります。設定後に **再デプロイ** してください
   （Deployments から最新のデプロイを再実行するか、新しいコミットを push）

### コマンドで設定（Wrangler）

```bash
npx wrangler login
npx wrangler pages secret put AZURE_TRANSLATOR_KEY    --project-name tetsu-english
npx wrangler pages secret put AZURE_TRANSLATOR_REGION --project-name tetsu-english
npx wrangler pages secret put AZURE_SPEECH_KEY        --project-name tetsu-english
npx wrangler pages secret put AZURE_SPEECH_REGION     --project-name tetsu-english
npx wrangler pages secret put APP_ACCESS_TOKEN        --project-name tetsu-english   # 任意
```

> リポジトリの `wrangler.toml` には **秘密情報を書かないでください**（`[vars]` は平文でコミットされます）。
> Wrangler 設定ファイルを使う Pages プロジェクトでは、ファイルに書いた項目はダッシュボードで編集できなくなります
> （ファイルが正）。このリポジトリでは `name` / `pages_build_output_dir` / `compatibility_date` だけを書き、
> 環境変数はすべてシークレットとして登録する運用にしています。

### ローカル開発

```bash
cp .dev.vars.example .dev.vars   # 値を書き換える（.dev.vars は .gitignore 済み）
npm run build
npx wrangler pages dev dist      # http://localhost:8788
```

## 5. アクセストークン（`APP_ACCESS_TOKEN`）を設定する

`/api/*` は公開 URL なので、URL を知っている人なら誰でも呼び出せ、無料枠を消費されるおそれがあります。
`APP_ACCESS_TOKEN` を設定すると、`X-App-Token` ヘッダーが一致しないリクエストは 401 で拒否されます
（`/api/health` だけは確認用に除外）。

1. 長いランダム文字列を作ります。
   ```bash
   openssl rand -base64 32
   # または
   node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
   ```
2. Cloudflare Pages に `APP_ACCESS_TOKEN` として **Encrypt** で登録し、再デプロイします。
3. iPhone のアプリで **設定 → クラウド機能（翻訳・発音評価）→ アクセストークン** に同じ文字列を入力します
   （トークンが必要な場合だけ入力欄が表示されます）。
   - トークンはその端末内（ブラウザのストレージ）に保存されます。ホーム画面に追加したアプリと Safari のタブでは保存先が
     別なので、実際に使う方（通常はホーム画面のアプリ）で入力してください。

> これは「共有の合言葉」による簡易的な保護で、ユーザー認証ではありません。
> トークンが漏れた場合は値を変更して再デプロイしてください。

## 6. 動作を確認する

### `/api/health`

```bash
curl https://<your-project>.pages.dev/api/health
# => {"translator":true,"speech":true,"tokenRequired":true}
```

`translator` / `speech` が `false` の場合は、変数名の誤り・未設定・再デプロイ忘れを確認してください。

### 翻訳 API

```bash
curl -X POST https://<your-project>.pages.dev/api/translate \
  -H 'Content-Type: application/json' \
  -H 'X-App-Token: <APP_ACCESS_TOKEN>' \
  -d '{"text":"軌道狂いを整正する","to":"en"}'
```

### アプリの設定画面

1. **設定 → クラウド機能（翻訳・発音評価）** で「接続を確認」を押す
2. 「翻訳（Azure Translator）」「発音評価・音声入力（Azure Speech）」の両方にチェックが付けば OK
3. **練習 → 発音チェック** で、採点方式が「Azure発音評価（単語・音素ごとに採点）」になっていることを確認

### よくあるエラー

| 表示・ステータス | 原因と対処 |
|---|---|
| 503「翻訳API（Azure Translator）が未設定です」 | 環境変数が未設定、または設定後に再デプロイしていない |
| 401「アクセストークンが正しくありません」 | アプリの設定画面のトークンが `APP_ACCESS_TOKEN` と一致していない |
| 502「翻訳APIエラー (401)」など | キーの誤り、またはリージョンがリソースの場所と一致していない |
| 502「…無料枠または回数制限に達しました」 | F0 の月間無料枠・時間あたり上限・同時リクエスト数の上限に達した |
| 422「音声を認識できませんでした」 | 無音・雑音が多い。静かな場所で、マイクに近づいてもう一度 |
| 「サーバーに接続できません」 | オフライン、または `npm run dev`（Functions なし）で起動している |

## 7. Azure を設定しない場合

Azure がなくても、次の機能はそのまま使えます。

- 単語学習（FSRS）、単語帳、リスニングクイズ、ディクテーション、シャドーイング（読み上げは端末の音声合成）
- シーン別会話・ロールプレイ
- 保線用語グロッサリー（オフラインの用語検出）

発音チェックは、Safari のタブで開いている場合は **端末の音声認識による簡易判定** に、
ホーム画面に追加したアプリ（iOS のホーム画面 Web アプリでは SpeechRecognition が使えない）では
**録音して聞き比べる自己評価** に切り替わります。翻訳と音声入力は使えません。

## 8. 料金・上限のまとめ（Cloudflare 側）

| 項目 | 値 |
|---|---|
| Pages Functions の課金 | Workers のリクエストとして数える |
| 無料プランのリクエスト上限 | 1日100,000リクエスト（Workers と合算。毎日 0:00 UTC にリセット） |
| 静的アセット（HTML/JS/画像） | 無料・無制限（Functions を呼ばないリクエスト） |

個人利用であれば、Cloudflare・Azure ともに無料枠の範囲で運用できる想定です。

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
- 発音評価の課金（Microsoft Q&A）: <https://learn.microsoft.com/en-us/answers/questions/5608069/pricing-and-usage-of-pronunciation-assessment-feat>
- Foundry リソースと F0（Microsoft Q&A）: <https://learn.microsoft.com/en-us/answers/questions/5644473/how-to-use-free-tier-requests-with-microsoft-found>
- Cloudflare Pages Functions の環境変数・シークレット: <https://developers.cloudflare.com/pages/functions/bindings/>
- Cloudflare Pages の Wrangler 設定: <https://developers.cloudflare.com/pages/functions/wrangler-configuration/>
- Cloudflare Pages Functions の料金: <https://developers.cloudflare.com/pages/functions/pricing/>
