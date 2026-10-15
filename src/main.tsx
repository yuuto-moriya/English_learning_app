import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
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

// PWA: サービスワーカー登録（オフライン対応・自動更新）
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}
