# AI と会話（Cloudflare Workers AI / Groq）の設定手順

練習の **「AIと会話」** は、あなたが話した英語に、AI が場面の相手として返事をし、より自然な言い方を教えてくれる機能です。
返事を作る AI は、サーバー（Vercel Functions の `/api/chat`）から呼びます。キーは Vercel の環境変数にだけ置き、端末には送りません。

> 料金・上限・画面の名称は 2026年10月時点で調べた内容です。公式ページを直接開けず、検索結果の公式の抜粋と二次情報で確かめた項目があります（末尾の参考資料）。
> 使う前に、各サービスの画面で無料枠と規約を確かめてください。

## 全体の流れ

```
話す → Azure Speech で文字に（既存の設定） → /api/chat → Cloudflare Workers AI（だめなら Groq）
                                                      ↓
                    返事・より自然な言い方・返事の例  ←
                    返事は Azure の声で読み上げ（既存の設定）
```

- **Cloudflare を先に、Groq を予備に** 使います。どちらか一方だけでも動きます。
- 返事は生成しながら端末に送ります（stream）。返事の行を書き終えた時点で読み上げを始めるので、待ち時間が短くなります。stream で何も届かなかったときは、同じサービスにふつうの形でたのみ直します。
- Cloudflare には会話ごとの ID（`x-session-affinity`）を付けて送り、同じ会話の前の部分の計算を使い回してもらいます（プロンプトキャッシュ。効き方はモデルによります）。
- **返事と直しは別々に同時にたのみます。** 返事は速いモデル（既定 `@cf/meta/llama-3.1-8b-instruct-fp8-fast`）で、返事と返事の例だけを書かせます。直し・解説・先生への質問は先生役（`/api/tutor`）で、日本語の説明が得意なモデル（既定 `@cf/google/gemma-4-26b-a4b-it`。考える過程は `chat_template_kwargs.enable_thinking=false` で切る）を使い、使えなければ会話と同じモデルに切り替えます。モデルは `CLOUDFLARE_TUTOR_MODEL` / `GROQ_TUTOR_MODEL` で変えられます。1往復あたりの消費は、返事（約7 Neurons）＋直し（約6 Neurons）で、1日 約700往復の見込み（2026年10月の料金表から試算）。
- **関数は東京（hnd1）で動かします**（`vercel.json` の `regions`。Hobby プランでも1つのリージョンを選べます）。iPhone・Azure（東日本）との往復が短くなります。
- 会話の中身はサーバーに保存しません（届いた会話をそのまま AI に渡して、返事を返すだけ）。振り返りで★を付けた言い方だけ、端末（localStorage）に残ります。
- 端末ごとに 1日 200 回までに抑えています（`src/pages/Conversation.tsx` の `DAILY_LIMIT`）。

## 料金がかからない理由

| | Cloudflare Workers AI | Groq |
|---|---|---|
| 使うプラン | Workers Free（無料） | Free（無料） |
| クレジットカード | 登録しない | 登録しない |
| 無料枠 | 1日 10,000 Neurons（毎日 0時 UTC＝日本時間 9時にリセット）。この機能なら 1日 約900〜1,300往復の見込み | モデルごとに 1日の回数・トークン数の上限（`openai/gpt-oss-20b` で 1日 約200往復の見込み） |
| 枠を超えたら | エラー（429）で止まる。課金されない | エラー（429）で止まる。課金されない |
| 入力が AI の学習に使われるか | 使わない（公式の「Data usage」に明記） | 既定で入力・出力を保持しない（公式「Your Data in GroqCloud」）。学習に使わない条項は利用規約にあるとされるが、条文は未確認 |

有料プラン（Workers Paid・Groq Developer）に **自分でアップグレードしない限り**、請求は起きません。
**クレジットカードを登録しない・アップグレードしない** ことだけ守ってください。

## 1. Cloudflare Workers AI（メイン）

1. <https://dash.cloudflare.com/sign-up> でアカウントを作る（メールアドレスとパスワード。カードは不要）
2. **アカウント ID を控える**
   - ダッシュボードの左メニュー **AI → Workers AI** を開くと、画面に Account ID が出ます（アカウントのホームの右側にも表示されます）
   - → `CLOUDFLARE_ACCOUNT_ID`
3. **API トークンを作る**
   - 右上の人のアイコン → **My Profile → API Tokens → Create Token**
   - テンプレートの **Workers AI** を選ぶ（または Custom token で、権限を **Account → Workers AI → Read** にする）
   - **Continue to summary → Create Token**。表示されたトークンを控える（この画面でしか見られません）
   - → `CLOUDFLARE_AI_TOKEN`

モデルは既定で `@cf/meta/llama-3.1-8b-instruct-fp8-fast` を使います（`@cf/meta/llama-3.1-8b-instruct` は 2026年5月で提供終了）。
変えるときは `CLOUDFLARE_MODEL` に指定します。2026年7月から、一部のモデル（glm-4.7-flash・gemma-4-26b など）は有料プランでしか使えません（無料で呼ぶと 403）。

## 2. Groq（予備・任意）

1. <https://console.groq.com> でアカウントを作る（Google アカウントかメール。カードは不要）
2. 左メニューの **API Keys → Create API Key**。表示されたキー（`gsk_` で始まる）を控える
   - → `GROQ_API_KEY`
3. 任意：**Settings → Data Controls** で、ログの保持をオフにできます

モデルは既定で `openai/gpt-oss-20b` を使います（`llama-3.1-8b-instant` は 2026年8月で無料プランの提供終了）。変えるときは `GROQ_MODEL` に指定します。
いまの無料枠は、コンソールの **Settings → Limits** で確かめられます。

## 3. Vercel に入れる

**Settings → Environment Variables**（Vercel の新しい画面では左メニューの **Environment Variables**）で、次を **Secret**、**Production と Preview** に入れて Save → **Redeploy**。

| Key | Value | 必須 |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare のアカウント ID | Cloudflare を使うなら |
| `CLOUDFLARE_AI_TOKEN` | Cloudflare の API トークン | Cloudflare を使うなら |
| `GROQ_API_KEY` | Groq の API キー | Groq を使うなら |
| `CLOUDFLARE_MODEL` / `GROQ_MODEL` | モデルを変えるときだけ | 任意 |

## 4. 確かめる

1. アプリの **設定 → クラウド機能 → 接続を確認** で「AI と会話（Cloudflare / Groq）」にチェックが付く
2. **練習 → AIと会話** で場面を選ぶと、相手が話しかけてくる

| 表示 | 原因と対処 |
|---|---|
| 「AI 会話（Cloudflare / Groq）が未設定です」 | 環境変数の名前・Redeploy を確かめる |
| 「AI に接続できませんでした」 | キー・トークン・アカウント ID の誤り、またはモデルが使えない（Vercel の Logs に `chat cloudflare 401` などが出る） |
| 「今日の AI 会話の無料枠を使い切りました…」 | 無料枠の上限。料金はかからず、時間がたつと（Cloudflare は日本時間 9時）また使える |

> Cloudflare では、2026年9〜10月にダッシュボードの使用量が 0 なのに 4006（無料枠切れ）が返るという報告が出ています。
> そのときは自動で Groq を試すので、Groq も入れておくと安心です。

## 参考資料（2026年10月に調べたもの）

- Workers AI の料金: <https://developers.cloudflare.com/workers-ai/platform/pricing/>
- Workers AI のデータの扱い: <https://developers.cloudflare.com/workers-ai/platform/data-usage/>
- Workers AI のモデルの提供終了（2026-05）: <https://developers.cloudflare.com/changelog/post/2026-05-08-planned-model-deprecations/>
- 有料プランが必要なモデル（2026-07）: <https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/>
- 4006 の報告（Cloudflare Community）: <https://community.cloudflare.com/t/workers-ai-429-error-4006-says-10k-neuron-quota-exhausted-while-dashboard-shows/954888>
- Groq のデータの扱い: <https://console.groq.com/docs/your-data>
- Groq のレート制限: <https://console.groq.com/docs/rate-limits>
- Groq のモデルの提供終了: <https://console.groq.com/docs/deprecations>
- Groq の利用規約: <https://console.groq.com/docs/legal/services-agreement>
