// iPhoneサイズでの画面確認用スクリーンショット（ライト/ダーク）
// 使い方: npm run build && npx vite preview --port 4173 & node scripts/screenshots.mjs <出力dir>
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? 'screenshots'
const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['home', '/'],
  ['words-rail', '/words?cat=rail'],
  ['word-detail', '/words/r-track-gauge'],
  ['word-detail-general', '/words/g-reservation'],
  ['study', '/study'],
  ['practice', '/practice'],
  ['listening', '/practice/listening'],
  ['sounds', '/practice/sounds'],
  ['compose', '/practice/compose'],
  ['audio', '/practice/audio'],
  ['speaking', '/practice/speaking?mode=shadow'],
  ['scenes', '/scenes'],
  ['scene-detail', '/scenes/r-recording-review'],
  ['translate', '/translate'],
  ['stats', '/stats'],
  ['settings', '/settings'],
  ['research', '/research'],
]

/** オンボーディング済み（3コースすべて）の設定を書き込む */
async function onboard(page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem('tetsu-settings')
    const s = raw ? JSON.parse(raw) : { state: {}, version: 3 }
    s.state = { ...s.state, onboarded: true, studyCats: { general: true, business: true, rail: true } }
    s.version = 3
    localStorage.setItem('tetsu-settings', JSON.stringify(s))
  })
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ ...devices['iPhone 15'], colorScheme: scheme, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`${e.message}`))
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('/api/') && !m.text().includes('404') && errors.push(m.text()))

  // はじめての起動（コース → レベル → プラン）
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${scheme}-welcome-course.png` })
  await page.getByRole('button', { name: /ビジネス/ }).first().click()
  await page.getByRole('button', { name: '次へ' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${scheme}-welcome-level.png` })
  await page.getByRole('button', { name: /中級/ }).click()
  await page.getByRole('button', { name: '次へ' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${scheme}-welcome-plan.png` })

  await onboard(page)
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    if (name === 'study') {
      const start = page.getByRole('button', { name: 'スタート' })
      if (await start.isVisible().catch(() => false)) {
        await page.screenshot({ path: `${OUT}/${scheme}-study-start.png`, fullPage: false })
        await start.click()
        await page.waitForTimeout(600)
      }
    }
    await page.screenshot({ path: `${OUT}/${scheme}-${name}.png`, fullPage: false })
  }
  // ホームの下の方も撮る
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/${scheme}-home-full.png`, fullPage: true })
  if (errors.length) console.log(scheme, 'errors:', errors)
  await ctx.close()
}
await browser.close()
console.log('done')
