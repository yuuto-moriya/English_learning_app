// GitHub App のインストールトークン（約1時間有効）を発行し、gh 用の GH_TOKEN として
// セッションに渡す。秘密鍵などは環境の Secrets（GH_APP_ID / GH_APP_PRIVATE_KEY）から読む。
// 未設定・失敗時は何もせず終了する（セッションの起動は止めない）。
import { createSign } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import https from 'node:https'

const REPO = 'yuuto-moriya/English_learning_app'
const appId = process.env.GH_APP_ID
const key = (process.env.GH_APP_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
const envFile = process.env.CLAUDE_ENV_FILE

if (!appId || !key || !envFile) {
  console.error('gh-app-token: GH_APP_ID / GH_APP_PRIVATE_KEY / CLAUDE_ENV_FILE not set; skipped')
  process.exit(0)
}

const b64 = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iat: now - 60, exp: now + 540, iss: appId })}`
const jwt = `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(key).toString('base64url')}`

const call = (method, path) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: 'api.github.com',
        path,
        method,
        headers: { Authorization: `Bearer ${jwt}`, 'User-Agent': 'claude-session-start', Accept: 'application/vnd.github+json' },
      },
      (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => (res.statusCode < 300 ? resolve(JSON.parse(body)) : reject(new Error(`${res.statusCode} ${body}`))))
      },
    )
    req.on('error', reject)
    req.end()
  })

try {
  const inst = await call('GET', `/repos/${REPO}/installation`)
  const { token, expires_at } = await call('POST', `/app/installations/${inst.id}/access_tokens`)
  // gh は GH_TOKEN を GITHUB_TOKEN より優先する。GITHUB_TOKEN（git 認証用）には触れない。
  appendFileSync(envFile, `export GH_TOKEN='${token}'\n`)
  console.error(`gh-app-token: GH_TOKEN set (expires ${expires_at})`)
} catch (e) {
  console.error(`gh-app-token: failed: ${e.message}`)
}
