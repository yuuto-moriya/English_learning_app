import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 学習中に勝手にリロードされないよう、更新はユーザーの操作で適用する（UpdateToast）
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'guide/*.webp', 'favicon.png'],
      manifest: {
        name: 'Michi — 英語学習と翻訳',
        short_name: 'Michi',
        description: '一般・ビジネス・IT・鉄道の英単語、リスニング、スピーキング、シーン別会話、翻訳と同時通訳をひとつに。',
        lang: 'ja',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f5f1',
        theme_color: '#f6f5f1',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,json,woff2}'],
        // 同時通訳用の Speech SDK は通信が必要な機能でしか使わないので、オフライン用の事前保存から外す（初回の通信量を抑える）
        globIgnores: ['**/microsoft.cognitiveservices.speech.sdk-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/assets/microsoft.cognitiveservices.speech.sdk-'),
            handler: 'CacheFirst',
            options: { cacheName: 'speech-sdk', expiration: { maxEntries: 2 } },
          },
        ],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
})
