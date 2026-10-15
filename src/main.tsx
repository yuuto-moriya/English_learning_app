import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerServiceWorker } from './components/UpdateToast'
import './styles/index.css'
import { applyTheme, useSettings } from './lib/settings'

applyTheme(useSettings.getState().theme)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyTheme(useSettings.getState().theme)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: サービスワーカー登録（オフライン対応）。更新は UpdateToast でユーザーが選んだときに適用する
if (import.meta.env.PROD) registerServiceWorker()

// Safari は操作のない状態が続くとサイトデータ（IndexedDB）を消すことがあるため、永続化を要求しておく（結果は問わない）
try {
  void navigator.storage?.persist?.()?.catch(() => {})
} catch {
  /* noop */
}
