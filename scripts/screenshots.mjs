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
  ['word-detail-general', '/words/g-record'],
  ['study', '/study'],
  ['practice', '/practice'],
  ['listening', '/practice/listening'],
  ['sounds', '/practice/sounds'],
  ['chat', '/practice/chat'],
  ['compose', '/practice/compose'],
  ['audio', '/practice/audio'],
  ['speaking', '/practice/speaking?mode=shadow'],
  ['scenes', '/scenes'],
  ['scene-detail', '/scenes/r-recording-review'],
  ['translate', '/translate'],
  ['interpreter', '/translate/live'],
  ['stats', '/stats'],
  ['settings', '/settings'],
  ['research', '/research'],
]

/** オンボーディング済み（4コースすべて・使い方ツアーは見終えた）の設定を書き込む */
async function onboard(page, extra = {}) {
  await page.evaluate((extra) => {
    const raw = localStorage.getItem('tetsu-settings')
    const s = raw ? JSON.parse(raw) : { state: {}, version: 4 }
    s.state = { ...s.state, onboarded: true, tourDone: true, studyCats: { general: true, business: true, it: true, rail: true }, ...extra }
    s.version = 4
    localStorage.setItem('tetsu-settings', JSON.stringify(s))
  }, extra)
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

  // 使い方ツアー（ホーム）の最初と「モード」の説明
  await onboard(page, { tourDone: false })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${scheme}-tour-1.png` })
  await page.getByRole('button', { name: '次へ' }).click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${scheme}-tour-mode.png` })

  await onboard(page)
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    if (name === 'study') {
      const start = page.getByRole('button', { name: 'はじめる', exact: true })
      if (await start.isVisible().catch(() => false)) {
        await page.screenshot({ path: `${OUT}/${scheme}-study-start.png`, fullPage: false })
        await start.click()
        await page.waitForTimeout(600)
      }
    }
    await page.screenshot({ path: `${OUT}/${scheme}-${name}.png`, fullPage: false })
    if (name === 'interpreter') {
      await page.getByRole('tab', { name: '会話' }).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/${scheme}-interpreter-talk.png` })
    }
    if (name === 'scenes') {
      await page.getByRole('tab', { name: 'IT' }).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/${scheme}-scenes-it.png` })
      await page.getByRole('tab', { name: '鉄道' }).click()
      await page.getByRole('tab', { name: /検査・測定/ }).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/${scheme}-scenes-rail.png`, fullPage: true })
    }
    if (name === 'settings') {
      await page.getByText('英語の発音（国・地域）').scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/${scheme}-settings-voice.png` })
    }
  }
  // 練習の画面（共通の部品：× でやめる・進み具合・回答後のバー）
  await page.goto(BASE + '/practice/sounds', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /L と R/ }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${scheme}-sounds-question.png` })
  await page.locator('.grid.grid-cols-2 > button').first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${scheme}-sounds-answer.png` })
  await page.screenshot({ path: `${OUT}/${scheme}-sounds-answer-full.png`, fullPage: true })
  await page.goto(BASE + '/practice/listening', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'はじめる', exact: true }).click()
  await page.waitForTimeout(600)
  await page.locator('button[data-choice]').first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${scheme}-listening-answer.png` })

  // ホームの下の方も撮る
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/${scheme}-home-full.png`, fullPage: true })
  if (errors.length) console.log(scheme, 'errors:', errors)
  await ctx.close()
}
await browser.close()
console.log('done')
