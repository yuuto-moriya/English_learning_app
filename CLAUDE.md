# CLAUDE.md

英語学習・翻訳の PWA「Tetsu English」。主な利用者は iPhone で使う、鉄道保線・設備管理（EAM）に関わる日本人。

## 最初に読むもの

- `docs/REQUIREMENTS.md` — オーナーの要件と決定事項（**変更前に必ず読む**。方針から外れるときはオーナーに確認）
- `README.md` — 機能、ディレクトリ構成、開発・デプロイ手順
- `docs/RESEARCH.md` — 学習設計の根拠となる研究
- `docs/RAIL_GLOSSARY.md` — 保線用語データの方針
- `docs/SETUP_AZURE.md` — Azure と Vercel の環境変数

## 構成

- フロント: React 19 / TypeScript 7 / Vite 8 / Tailwind CSS v4 / React Router 8 / vite-plugin-pwa
- データ: Dexie（IndexedDB、学習データは端末内のみ）、zustand（設定）、ts-fsrs（復習）
- API: Vercel Functions `api/*.ts` → 処理本体 `server/handlers.ts`（Web 標準 API のみ）→ Azure Translator / Speech
- 単語データ: `data-src/` → `scripts/build_vocab.py` → `src/data/vocab/*.json`（生成物。手で編集しない）

## コマンド

```bash
npm run dev          # Vite（/api は動かない）
npm run build        # 型チェック（アプリ + api/）→ 本番ビルド
npm test             # Vitest
npm run data:build   # 単語データの再生成
npx vite preview --port 4173 &   # その後
node scripts/e2e-flow.mjs <出力先>      # 主要フローの E2E
node scripts/screenshots.mjs <出力先>   # iPhone 幅のスクリーンショット（ライト/ダーク）
```

Playwright の Chromium は `CHROMIUM_PATH` で指定できる。

## 作業のルール

- 変更後は `npm run build` と `npm test` を通し、画面に関わる変更は E2E とスクリーンショット（ライト/ダーク）で確認する
- 表示文言は日本語。E2E が使う文言を変えたら `scripts/e2e-flow.mjs` も直す
- iPhone 幅（390px）、safe-area、ダークモード、standalone 表示を壊さない。入力欄は 16px 以上
- API キー・トークンをコミットしない
- ブランチ運用: `main` = 本番、`staging` = 検証環境（プレビュー URL に自動デプロイ）。作業は **`staging` から切ったブランチ** で行い、PR は `staging` 向けに出す。確認後、`staging` → `main` の PR で本番に反映する（`main` への push は本番デプロイになる）。`main` へ直接 push・PR しない
