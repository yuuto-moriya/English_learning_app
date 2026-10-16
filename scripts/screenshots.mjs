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
  ['study', '/study'],
  ['practice', '/practice'],
  ['listening', '/practice/listening'],
  ['speaking', '/practice/speaking?mode=shadow'],
  ['scenes', '/scenes'],
  ['scene-detail', '/scenes/r-recording-review'],
  ['translate', '/translate'],
  ['settings', '/settings'],
  ['research', '/research'],
]

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ ...devices['iPhone 15'], colorScheme: scheme, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`${e.message}`))
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('/api/') && errors.push(m.text()))
  // オンボーディング済みの状態（ホームのヒーローカード）も撮る
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    const raw = localStorage.getItem('tetsu-settings')
    const s = raw ? JSON.parse(raw) : { state: {}, version: 2 }
    s.state = { ...s.state, onboarded: true }
    localStorage.setItem('tetsu-settings', JSON.stringify(s))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${scheme}-home-onboarded.png`, fullPage: false })
  await page.evaluate(() => localStorage.removeItem('tetsu-settings'))
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    if (name === 'study') {
      const start = page.getByRole('button', { name: 'スタート' })
      if (await start.isVisible().catch(() => false)) {
        await start.click()
        await page.waitForTimeout(600)
      }
    }
    await page.screenshot({ path: `${OUT}/${scheme}-${name}.png`, fullPage: false })
  }
  if (errors.length) console.log(scheme, 'errors:', errors)
  await ctx.close()
}
await browser.close()
console.log('done')
