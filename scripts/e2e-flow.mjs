// 主要フローの動作確認（はじめての設定 → 学習セッション → 単語帳 → 練習 → シーン → 翻訳の用語検出 → 設定）
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
await page.getByRole('button', { name: 'はじめる' }).click()
await page.getByRole('button', { name: /学習をはじめる/ }).waitFor()
check(await page.getByText('帰り道に10分').isVisible(), 'ホームに学習プラン（実行意図）を表示')
const cats = await page.evaluate(() => JSON.parse(localStorage.getItem('tetsu-settings')).state.studyCats)
check(cats.general && cats.rail && !cats.business, '選んだコース（一般会話＋保線）が保存される')

// 学習セッション
await page.getByRole('button', { name: /学習をはじめる/ }).click()
await page.getByRole('button', { name: 'スタート' }).click()
check(await page.getByText('新しい単語').first().isVisible(), '新出語の提示')
await page.screenshot({ path: `${OUT}/1-learn.png` })

// 新出語3語を提示 → 想起テスト
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '覚えた・次へ' }).click()
check(await page.getByText('意味を選ぼう').isVisible(), '提示後に選択式の想起テスト')
const options = page.locator('button[data-choice]')
await options.first().waitFor()
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
await page.goto(BASE + '/words?cat=rail&status=marked')
await page.getByText('sleeper', { exact: true }).waitFor({ timeout: 5000 })
check(await page.getByRole('button', { name: /保存した単語を練習する/ }).isVisible(), '保存した単語の一覧と集中練習')
await page.screenshot({ path: `${OUT}/3-marked.png` })

// 聞き分け（HVPT）
await page.goto(BASE + '/practice/sounds')
await page.getByRole('button', { name: /L と R/ }).click()
await page.getByText('どちらが聞こえた？').waitFor()
await page.locator('.grid.grid-cols-2 > button').first().click()
check(await page.getByText('聞き比べる（同じ声）').isVisible(), '聞き分けの回答と聞き比べ')
await page.screenshot({ path: `${OUT}/4-sounds.png` })

// 瞬間英作文
await page.goto(BASE + '/practice/compose')
await page.getByRole('button', { name: 'はじめる' }).click()
await page.getByRole('button', { name: '答えを見る' }).click()
check(await page.getByRole('button', { name: '言えた' }).isVisible(), '瞬間英作文の答えと自己評価')
await page.getByRole('button', { name: '言えた' }).click()

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

// シーンのロールプレイ開始
await page.goto(BASE + '/scenes/r-briefing')
await page.getByRole('tab', { name: 'ロールプレイ' }).click()
await page.getByRole('button', { name: 'ロールプレイを始める' }).click()
await page.waitForTimeout(500)
check(await page.locator('text=Supervisor').first().isVisible(), 'ロールプレイ開始')

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
