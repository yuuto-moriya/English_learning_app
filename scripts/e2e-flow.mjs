// 主要フローの動作確認（はじめての設定 → 使い方ツアー → 学習セッション → 単語帳 → 練習 → シーン → 翻訳・同時通訳 → モード切り替え → 設定）
// 使い方: npx vite preview --port 4173 & CHROMIUM_PATH=... node scripts/e2e-flow.mjs <出力dir>
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? 'e2e-out'
const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const ctx = await browser.newContext({ ...devices['iPhone 15'], deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const check = (cond, msg) => {
  if (!cond) throw new Error('FAILED: ' + msg)
  console.log('✓', msg)
}

// はじめての起動：コース → レベル → 学習プラン
await page.goto(BASE + '/')
await page.getByText('何の英語を学びますか？').waitFor()
check(page.url().endsWith('/welcome'), '初回はコース選択の画面へ')
await page.getByRole('button', { name: /保線/ }).click()
await page.getByRole('button', { name: '次へ' }).click()
await page.getByRole('button', { name: /中級/ }).click()
await page.getByRole('button', { name: '次へ' }).click()
await page.getByRole('button', { name: '帰り道' }).click()
await page.getByRole('button', { name: 'はじめる', exact: true }).click()

// 使い方ツアー：最初の1回だけ表示。最後まで進める
await page.getByText('使い方を30秒でご案内します').waitFor()
check(true, '初回は使い方ツアーを表示')
let steps = 1
while (await page.getByRole('button', { name: '次へ' }).isVisible().catch(() => false)) {
  await page.getByRole('button', { name: '次へ' }).click()
  steps++
  await page.waitForTimeout(150)
}
check(steps >= 8 && (await page.getByText('準備OK！').isVisible()), `ツアーを最後まで進められる（${steps}ステップ）`)
await page.getByRole('dialog').getByRole('button', { name: 'はじめる' }).click()
check(await page.evaluate(() => JSON.parse(localStorage.getItem('tetsu-settings')).state.tourDone === true), 'ツアーを見終えたことが保存される')
await page.getByRole('button', { name: /学習をはじめる/ }).waitFor()
check(await page.getByText('帰り道に10分').isVisible(), 'ホームに学習プラン（実行意図）を表示')
const cats = await page.evaluate(() => JSON.parse(localStorage.getItem('tetsu-settings')).state.studyCats)
check(cats.general && cats.rail && !cats.business, '選んだコース（一般＋鉄道）が保存される')

// 学習セッション
await page.getByRole('button', { name: /学習をはじめる/ }).click()
await page.getByRole('button', { name: 'はじめる', exact: true }).click()
check(await page.getByText('新しい単語').first().isVisible(), '新出語の提示')
await page.screenshot({ path: `${OUT}/1-learn.png` })

// 新出語3語を提示 → 想起テスト
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '覚えた・次へ' }).click()
check(await page.getByText('意味を選ぼう').isVisible(), '提示後に選択式の想起テスト')
const options = page.locator('button[data-choice]')
await options.first().waitFor()
check(await page.getByText(/^(やさしい|ふつう|むずかしい)$/).first().isVisible(), '選択肢の難しさ（レベルと覚え具合）を表示')
await options.nth(1).click()
await page.waitForTimeout(400)
check(await page.getByRole('button', { name: '次へ' }).isVisible(), '回答後にフィードバックと次へボタン')
await page.screenshot({ path: `${OUT}/2-feedback.png` })
await page.getByRole('button', { name: '次へ' }).click()

// 単語帳の検索
await page.goto(BASE + '/words?cat=general')
await page.getByPlaceholder('英語・日本語で検索').fill('maintain')
await page.waitForTimeout(300)
check(await page.getByText('維持する；保守する').first().isVisible(), '単語帳の検索')

// 保線語の詳細（英米表記）と保存
await page.goto(BASE + '/words/r-sleeper')
await page.getByText('tie', { exact: true }).first().waitFor({ timeout: 5000 })
check(await page.getByText('tie', { exact: true }).first().isVisible(), '保線語の米国表記（sleeper/tie）')
await page.getByRole('button', { name: '単語を保存' }).click()
// 保存（IndexedDB への書き込み）が終わってから移動する
await page.getByRole('button', { name: '保存を取り消す' }).waitFor()
await page.goto(BASE + '/words?cat=rail&status=marked')
await page.getByText('sleeper', { exact: true }).waitFor({ timeout: 5000 })
check(await page.getByRole('button', { name: /保存した単語を練習する/ }).isVisible(), '保存した単語の一覧と集中練習')
await page.screenshot({ path: `${OUT}/3-marked.png` })

// 聞き分け（HVPT）：意味つきの選択肢、回答後に聞き比べと例文。練習中はタブバーを隠す
await page.goto(BASE + '/practice/sounds')
await page.getByRole('button', { name: /L と R/ }).click()
await page.getByText('どちらが聞こえた？').waitFor()
check(!(await page.getByRole('navigation', { name: 'メインメニュー' }).isVisible()), '練習中はタブバーを隠す')
const pairBtn = page.locator('.grid.grid-cols-2 > button').first()
const pairWord = (await pairBtn.locator('.en').textContent()).trim()
check((await pairBtn.textContent()).length > pairWord.length, '聞き分けの選択肢に意味を表示')
await pairBtn.click()
check(await page.getByText('聞き比べる（同じ声）').isVisible(), '聞き分けの回答と聞き比べ')
check(await page.locator('mark.hl', { hasText: new RegExp(`^${pairWord}$`, 'i') }).first().isVisible(), '聞き分けの語の例文を表示')
await page.screenshot({ path: `${OUT}/4-sounds.png` })
await page.getByRole('button', { name: 'やめる' }).click()
await page.getByRole('tab', { name: '同じ？ちがう？' }).click()
await page.getByRole('button', { name: /F と H/ }).click()
await page.getByRole('button', { name: 'ちがう' }).click()
check(await page.getByText('聞き比べる（同じ声）').isVisible(), '聞き分け（同じ？ちがう？）の回答')
await page.getByRole('button', { name: 'やめる' }).click()
await page.getByRole('tab', { name: '単語' }).click()

// リスニング：共通の練習画面（× でやめる・進み具合・回答後の「次へ」）
await page.goto(BASE + '/practice/listening')
await page.getByRole('button', { name: 'はじめる', exact: true }).click()
await page.locator('button[data-choice]').first().click()
check(await page.getByRole('button', { name: '次へ' }).isVisible(), 'リスニングの回答と次へ')
check(await page.getByText('1 / 10').isVisible(), 'リスニングの進み具合')

// 使い分け（日本語では同じになる英語の組）
await page.goto(BASE + '/practice/usage')
await page.getByRole('button', { name: 'はじめる', exact: true }).click()
check(await page.getByText('和訳に合うように、空所に入る語を選ぼう').isVisible(), '使い分けの問題（空所と和訳）')
await page.locator('button[data-choice]').first().click()
check(await page.getByRole('button', { name: '次へ' }).isVisible(), '使い分けの回答と違いの解説')

// 定着チェック（まだ定着した単語がないときは案内を出す）
await page.goto(BASE + '/study?mode=check')
await page.getByText(/まだ確かめられる単語がない/).waitFor({ timeout: 5000 }).catch(() => {})
check(await page.getByText(/まだ確かめられる単語がない/).isVisible(), '定着チェック（対象がないときの案内）')

// 瞬間英作文
await page.goto(BASE + '/practice/compose')
await page.getByRole('button', { name: 'はじめる' }).click()
await page.getByRole('button', { name: '答えを見る' }).click()
check(await page.getByRole('button', { name: '言えた' }).isVisible(), '瞬間英作文の答えと自己評価')
await page.getByRole('button', { name: '言えた' }).click()

// ながら練習：時間と内容を選んで始め、一時停止 → やめると結果
await page.goto(BASE + '/practice/handsfree')
await page.getByRole('button', { name: '5分', exact: true }).click()
await page.getByRole('button', { name: /^会話を聞く/ }).click()
check(await page.getByRole('button', { name: /^会話を聞く/ }).getAttribute('aria-pressed') === 'false', 'ながら練習の内容を選べる')
await page.getByRole('button', { name: '5分はじめる' }).click()
await page.getByRole('button', { name: '一時停止' }).waitFor({ timeout: 8000 })
check(await page.getByText(/^[45]:\d\d$/).isVisible(), 'ながら練習の残り時間')
await page.getByText('単語を思い出す').first().waitFor({ timeout: 8000 })
check(await page.getByText('単語を思い出す').first().isVisible(), 'ながら練習のまとまり（単語）')
await page.getByText('例文', { exact: true }).waitFor({ timeout: 20000 })
await page.getByRole('button', { name: '次へ' }).click()
await page.waitForTimeout(800)
await page.getByRole('button', { name: '一時停止' }).click()
check(await page.getByText('一時停止中').isVisible(), 'ながら練習の一時停止')
await page.getByRole('button', { name: 'やめる' }).click()
await page.getByRole('button', { name: 'あと5分' }).waitFor({ timeout: 5000 })
check(await page.getByText(/ながら練習 ・/).isVisible(), 'ながら練習の結果（あと5分・終える）')
await page.getByRole('button', { name: '終える' }).click()
// 次回のために内容を戻す（設定に保存される）
await page.goto(BASE + '/practice/handsfree')
await page.getByRole('button', { name: /^会話を聞く/ }).click()

// 学習記録
await page.goto(BASE + '/stats')
await page.getByText('12週間の学習').waitFor()
check(await page.getByText('12週間の学習').isVisible(), '学習記録（12週間）')

// 翻訳ページの用語検出（オフラインでも動作）
await page.goto(BASE + '/translate')
await page.getByPlaceholder(/翻訳したい文章/).fill('明日の夜間に下り線で道床つき固めを行い、軌間とカントを測定します。')
await page.getByText('track gauge', { exact: true }).waitFor({ timeout: 5000 })
check(await page.getByText('track gauge', { exact: true }).isVisible(), '翻訳画面で「軌間」を検出')
check(await page.getByText('cant', { exact: true }).isVisible(), '翻訳画面で「カント」を検出')
await page.screenshot({ path: `${OUT}/5-glossary.png`, fullPage: true })

// 翻訳（API はモック）：自動の向き・訳・保存・入れ替え・拡大
await page.route('**/api/health', (r) => r.fulfill({ json: { translator: true, speech: false, tts: false, realtime: false, tokenRequired: false } }))
await page.route('**/api/translate', (r) => {
  const b = JSON.parse(r.request().postData() || '{}')
  r.fulfill({ json: b.to === 'en' ? { text: 'See you tomorrow.' } : { text: 'また明日。' } })
})
await page.goto(BASE + '/translate')
await page.getByPlaceholder(/翻訳したい文章/).fill('また明日。')
await page.getByText('See you tomorrow.', { exact: true }).waitFor({ timeout: 5000 })
check(await page.getByText('See you tomorrow.', { exact: true }).isVisible(), '翻訳：入力しながら訳が出る')
await page.getByRole('button', { name: /^保存$/ }).click()
await page.getByRole('tab', { name: /保存した訳（1）/ }).waitFor({ timeout: 3000 })
check(await page.getByRole('tab', { name: /保存した訳（1）/ }).isVisible(), '翻訳：訳を保存すると「保存した訳」に入る')
await page.getByRole('button', { name: '拡大' }).click()
check(await page.getByRole('dialog', { name: '訳を大きく表示' }).isVisible(), '翻訳：訳を大きく表示')
await page.getByRole('button', { name: '閉じる' }).click()
await page.getByRole('button', { name: '訳す向きを入れ替える' }).click()
check((await page.getByLabel('翻訳する文').inputValue()) === 'See you tomorrow.', '翻訳：入れ替えで訳が入力欄に移る')
await page.unroute('**/api/health')
await page.unroute('**/api/translate')

// AI と会話（API はモック）：場面を選ぶ → 相手が話しかける → 入力して送る → 直しが出る → 振り返り
await page.route('**/api/health', (r) => r.fulfill({ json: { translator: false, speech: false, tts: false, realtime: false, chat: true, tokenRequired: false } }))
let chatN = 0
await page.route('**/api/chat', (r) => {
  chatN++
  r.fulfill({ json: chatN === 1 ? { reply: 'Hi! What can I get for you?', correction: null, hint: 'A latte, please.' } : { reply: 'Sure. What size?', correction: { better: "I'd like a latte, please.", note: '丁寧な言い方' }, hint: 'Medium, please.' } })
})
await page.goto(BASE + '/practice/chat')
await page.getByText('カフェで注文').click()
await page.getByText('Hi! What can I get for you?').waitFor({ timeout: 5000 })
check(await page.getByText('Hi! What can I get for you?').isVisible(), 'AI と会話：相手が話しかける')
await page.getByLabel('英語で返事を入力').fill('I want latte')
await page.getByRole('button', { name: '送る' }).click()
await page.getByText("I'd like a latte, please.").waitFor({ timeout: 5000 })
check(await page.getByText('より自然な言い方').isVisible(), 'AI と会話：より自然な言い方が出る')
await page.getByRole('button', { name: 'やめる' }).click()
check(await page.getByRole('heading', { name: '会話の振り返り' }).isVisible(), 'AI と会話：振り返り')
await page.unroute('**/api/health')
await page.unroute('**/api/chat')

// 翻訳画面のヘルプと同時通訳
await page.goto(BASE + '/translate')
await page.getByRole('button', { name: '翻訳画面の使い方' }).click()
check(await page.getByRole('dialog').getByText('訳す向き').first().isVisible(), '翻訳画面のヘルプ（ツアー）')
await page.getByRole('button', { name: 'スキップ' }).click()
await page.getByRole('link', { name: /同時通訳/ }).click()
await page.getByRole('tab', { name: '会話' }).click()
check(await page.getByRole('button', { name: '日本語で話す' }).isVisible(), '同時通訳の会話モード（日本語／英語のボタン）')
check(await page.getByRole('button', { name: 'Speak English' }).isVisible(), '同時通訳の英語ボタン')
await page.screenshot({ path: `${OUT}/6-interpreter.png` })

// シーンのロールプレイ開始
await page.goto(BASE + '/scenes/r-briefing')
await page.getByRole('tab', { name: 'ロールプレイ' }).click()
await page.getByRole('button', { name: 'ロールプレイをはじめる' }).click()
await page.waitForTimeout(500)
check(await page.locator('text=Supervisor').first().isVisible(), 'ロールプレイ開始')

// モードの切り替え（ホーム）：「すべて」と「組み合わせる」、タップでそのモードだけに。シーンの最初のタブも合わせる
await page.goto(BASE + '/')
const modeGroup = page.getByRole('group', { name: '学ぶモード' })
const studyCats = () => page.evaluate(() => JSON.parse(localStorage.getItem('tetsu-settings')).state.studyCats)
await modeGroup.getByRole('button', { name: 'すべて', exact: true }).click()
let mode = await studyCats()
check(mode.general && mode.business && mode.it && mode.rail, 'モードを「すべて」に切り替え')
check(await modeGroup.getByText('すべてのコースから出題').isVisible(), '「すべて」の状態を文で表示')
check(
  (await modeGroup.getByRole('button', { name: 'すべて', exact: true }).getAttribute('aria-pressed')) === 'true' &&
    (await modeGroup.getByRole('button', { name: 'IT', exact: true }).getAttribute('aria-pressed')) === 'false',
  '「すべて」のときは「すべて」だけが選択中',
)
await modeGroup.getByRole('button', { name: '組み合わせる' }).click()
await modeGroup.getByRole('button', { name: '鉄道', exact: true }).click()
await modeGroup.getByRole('button', { name: 'ビジネス', exact: true }).click()
await modeGroup.getByRole('button', { name: '完了' }).click()
mode = await studyCats()
check(mode.general && mode.it && !mode.business && !mode.rail, '組み合わせでコースを外す')
check(await modeGroup.getByText('一般＋ITから出題').isVisible(), '組み合わせの状態を文で表示')
await modeGroup.getByRole('button', { name: 'IT', exact: true }).click()
mode = await studyCats()
check(mode.it && !mode.general && !mode.rail && !mode.business, 'モードを IT に切り替え')
check(await modeGroup.getByText('ITだけを出題').isVisible(), '1つのモードの状態を文で表示')
await page.goto(BASE + '/scenes')
await page.getByText('朝会で進捗を報告する').waitFor({ timeout: 5000 })
check(await page.getByText('朝会で進捗を報告する').isVisible(), 'シーンが IT モードの場面で開く')

// 起動時のオープニング（自動テストでは ?opening を付けたときだけ）：出て、時間がたつと消える。タップでも飛ばせる
await page.goto(BASE + '/?opening')
await page.getByRole('img', { name: /Eliza Patina/ }).waitFor({ timeout: 5000 })
check(await page.getByRole('img', { name: /Eliza Patina/ }).isVisible(), '起動時のオープニング')
await page.getByRole('img', { name: /Eliza Patina/ }).waitFor({ state: 'detached', timeout: 12000 })
check(await page.getByRole('img', { name: /Eliza Patina/ }).count() === 0, 'オープニングが終わってアプリが使える')
await page.goto(BASE + '/?opening')
await page.getByRole('img', { name: /Eliza Patina/ }).waitFor({ timeout: 5000 })
await page.waitForTimeout(600)
await page.getByRole('img', { name: /Eliza Patina/ }).click()
await page.getByRole('img', { name: /Eliza Patina/ }).waitFor({ state: 'detached', timeout: 3000 })
check(true, 'オープニングはタップで飛ばせる')

// 発音（国・地域）の選択
await page.goto(BASE + '/settings')
await page.getByText('iPhone で高音質の声を入れる方法', { exact: true }).waitFor({ timeout: 5000 })
check(await page.getByText('iPhone で高音質の声を入れる方法', { exact: true }).isVisible(), '設定に高音質の声の入れ方と、いまの声の状態を表示')
await page.getByText('iPhone で高音質の声を入れる方法', { exact: true }).click()
await page.getByText('「リーダーと読み上げ」を開く').waitFor({ timeout: 5000 })
check(await page.getByText('「リーダーと読み上げ」を開く').isVisible(), '高音質の声の手順を開ける')
await page.getByRole('button', { name: /^オーストラリア/ }).first().click()
await page.waitForTimeout(200)
check(await page.evaluate(() => JSON.parse(localStorage.getItem('tetsu-settings')).state.accent === 'en-AU'), '読み上げの発音をオーストラリアに変更')

// ダークモード切替
await page.goto(BASE + '/settings')
await page.getByRole('tab', { name: 'ダーク' }).click()
check(await page.evaluate(() => document.documentElement.classList.contains('dark')), 'ダークモード切替')

if (errors.length) {
  console.log('page errors:', errors)
  process.exitCode = 1
}
await browser.close()
console.log('e2e done')
