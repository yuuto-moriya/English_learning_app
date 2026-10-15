// 主要フローの動作確認（オンボーディング → 学習セッション → 単語帳 → シーン → 翻訳の用語検出）
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

await page.goto(BASE + '/')
await page.getByRole('button', { name: /中級/ }).click()
check(!(await page.getByText('はじめまして').isVisible()), 'オンボーディングでレベル選択')

await page.getByRole('button', { name: '学習をはじめる' }).click()
await page.getByRole('button', { name: 'スタート' }).click()
check(await page.getByText('NEW').isVisible(), '新出語の提示カード')
await page.screenshot({ path: `${OUT}/1-learn.png` })

// 新出語3語を提示 → 想起テスト
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '覚えた！次へ' }).click()
check(await page.getByText('意味を選ぼう').isVisible(), '提示後に選択式の想起テスト')
const options = page.locator('button.min-h-12')
await options.first().waitFor()
await options.nth(1).click()
await page.waitForTimeout(400)
check(await page.getByRole('button', { name: '次へ' }).isVisible(), '回答後にフィードバックと次へボタン')
await page.screenshot({ path: `${OUT}/2-feedback.png` })
await page.getByRole('button', { name: '次へ' }).click()

// 単語帳でカード作成を確認
await page.goto(BASE + '/words?cat=general')
await page.getByPlaceholder('英語・日本語で検索').fill('maintain')
await page.waitForTimeout(300)
check(await page.getByText('維持する；保守する').first().isVisible(), '単語帳の検索')

// 保線語の詳細（英米表記）
await page.goto(BASE + '/words/r-sleeper')
await page.getByText('tie', { exact: true }).first().waitFor({ timeout: 5000 })
check(await page.getByText('tie', { exact: true }).first().isVisible(), '保線語の米国表記（sleeper/tie）')
await page.screenshot({ path: `${OUT}/3-sleeper.png` })

// 翻訳ページの用語検出（オフラインでも動作）
await page.goto(BASE + '/translate')
await page.getByPlaceholder(/翻訳したい文章/).fill('明日の夜間に下り線で道床つき固めを行い、軌間とカントを測定します。')
await page.getByText('🇬🇧 track gauge').waitFor({ timeout: 5000 })
check(await page.getByText('🇬🇧 track gauge').isVisible(), '翻訳画面で「軌間」を検出')
check(await page.getByText('🇬🇧 cant').isVisible(), '翻訳画面で「カント」を検出')
await page.screenshot({ path: `${OUT}/4-glossary.png`, fullPage: true })

// シーンのロールプレイ開始
await page.goto(BASE + '/scenes/r-briefing')
await page.getByRole('tab', { name: 'ロールプレイ' }).click()
await page.getByRole('button', { name: 'ロールプレイ開始' }).click()
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
