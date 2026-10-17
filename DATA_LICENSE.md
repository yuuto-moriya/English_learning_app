# データ・素材のライセンス

ソースコードは [LICENSE](LICENSE)（MIT License, © 2026 yuuto-moriya）で公開しています。
このファイルでは、コード以外のデータと素材のライセンスと出典を説明します。

| 対象 | ファイル | ライセンス |
|---|---|---|
| 一般語・ビジネス語の単語リスト（NGSL / BSL / TSL） | `data-src/lists/*.csv` | **CC BY-SA 4.0**（Browne, Culligan & Phillips） |
| 一般語・ビジネス語の和訳・例文と、それを含むビルド成果物 | `data-src/vocab/*.txt`, `src/data/vocab/general.json`, `src/data/vocab/business.json` | **CC BY-SA 4.0**（上記リストの派生データとして） |
| 米音IPA（発音記号） | ビルド時に `scripts/.cache/en_US.txt` から取り込み → `src/data/vocab/*.json` | **MIT**（open-dict-data/ipa-dict、cmudict-ipa 由来） |
| 意味の近い語（選択問題の選択肢） | `data-src/neighbors.tsv` → `src/data/vocab/*.json` の `near` | **WordNet License**（Princeton University、WordNet 3.0 から計算） |
| 保線・設備管理用語集 | `data-src/rail/*.txt`, `src/data/vocab/rail.json` | 本プロジェクトのオリジナル編集物（MIT） |
| IT 用語集 | `data-src/vocab/it-*.txt`, `src/data/vocab/it.json` | 本プロジェクトのオリジナル編集物（MIT）。外部の語彙リストは使っていません |
| 案内キャラクター「テツ」の画像・アイコン | `public/guide/*.webp`, `public/icons/*.png`, `public/favicon.png`, `scripts/blender/*` | 本プロジェクトのオリジナル（MIT） |
| シーン別会話・学習法の解説文・聞き分けの最小対語 | `src/data/scenes.ts`, `src/data/research.ts`, `src/data/minimalPairs.ts` | 本プロジェクトのオリジナル（MIT） |
| 英語の書体 Newsreader | `src/assets/fonts/*.woff2`, `src/assets/fonts/OFL.txt` | **SIL Open Font License 1.1**（Production Type） |

## NGSL / BSL / TSL（CC BY-SA 4.0）

- **New General Service List (NGSL) 1.2**
- **Business Service List (BSL) 1.2**
- **TOEIC Service List (TSL) 1.2**

著作者: Charles Browne, Brent Culligan, Joseph Phillips
出典: <https://www.newgeneralservicelist.com/>
ライセンス: Creative Commons Attribution-ShareAlike 4.0 International（<https://creativecommons.org/licenses/by-sa/4.0/>）

本アプリでは、見出し語の選定・頻度順位・レベル分けにこれらのリストを使用しています。
和訳・例文・品詞などは本プロジェクトで新たに作成したものですが、見出し語と順位がリストに基づくため、
`data-src/vocab/*.txt` と、そこから生成される `general.json` / `business.json` は
**CC BY-SA 4.0（継承）** の派生データとして扱います。
これらを再配布・改変する場合は、上記の著作者表示と、同一ライセンス（CC BY-SA 4.0）での提供が必要です。

## 発音記号（MIT）

米音IPAは [open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict) の `data/en_US.txt`
（[cmudict-ipa](https://github.com/lingz/cmudict-ipa) を改変したデータ）を元に、
`scripts/build_vocab.py` で学習者向けの表記に整形したものです。いずれも MIT License です。
保線用語の英音IPA（`ipa_uk`）と、辞書にない語の米音IPAは本プロジェクトで付与しました。

## 意味の近い語（WordNet License）

`data-src/neighbors.tsv` と各語の `near` は、`scripts/build_neighbors.py` が Princeton WordNet 3.0 の
上位語・反対語などの関係から計算したものです。

WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved.
THIS SOFTWARE AND DATABASE IS PROVIDED "AS IS" AND PRINCETON UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES,
EXPRESS OR IMPLIED. ライセンス全文: <https://wordnet.princeton.edu/license-and-commercial-use>

## 保線・設備管理用語集（オリジナル編集物）

`data-src/rail/*.txt` の訳語・解説・例文は、本プロジェクトが独自に編集・執筆したものです。
欧州規格（EN）・UIC・ISO・JIS などの **規格本文は転載していません**。規格番号・規格名は、
用語の出典・参照先を示す目的でのみ記載しています。解説は各資料を参考に要約・言い換えたもので、
規格の正式な定義ではありません。実務で使う場合は、必ず最新の正式な規格・法令を確認してください。

TSI INF（Commission Regulation (EU) No 1299/2014）Appendix S の用語定義を参考にしています。
EU 法令の再利用は Commission Decision 2011/833/EU に基づき認められており、
参照した legislation.gov.uk の掲載ページは Open Government Licence v3.0 で提供されています。

詳しくは [docs/RAIL_GLOSSARY.md](docs/RAIL_GLOSSARY.md) を参照してください。

## キャラクター画像（オリジナル）

コーギーの「テツ」となかまたちは、`scripts/blender/dogs.py`（共通部品は `kit.py`）で Blender（bpy）を使ってプロシージャルに
モデリング・レンダリングし、`scripts/blender/postprocess.py` で WebP / PNG に変換した
本プロジェクトのオリジナルキャラクターです。画像・生成スクリプトともに MIT License で提供します。

## 書体 Newsreader（SIL Open Font License 1.1）

英語の見出し語・例文に使っている書体 Newsreader（Production Type）は、ラテン文字のサブセット（可変フォント、標準・イタリック）を
WOFF2 でアプリに同梱しています。ライセンス全文は `src/assets/fonts/OFL.txt` にあります。
書体は改変しておらず、単体での販売はしていません。出典: <https://github.com/productiontype/Newsreader>

## 依存ライブラリ

npm パッケージ（React, Dexie, ts-fsrs ほか）は、それぞれのライセンスに従います。
各パッケージの `node_modules/<name>/LICENSE` を参照してください。

## 外部サービス

翻訳・音声認識・発音評価の結果と、高品質音声（ニューラル音声）の読み上げは Microsoft Azure（Azure AI Translator / Azure AI Speech）が生成します。
利用にあたっては Microsoft の利用規約・製品条件が適用されます。
