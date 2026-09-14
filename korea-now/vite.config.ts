import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 하위 경로(/korea-now/)에 배포되므로 base를 고정한다.
export default defineConfig({
  plugins: [
    react(),
    // PWA: 홈화면 설치 + 오프라인. 앱 껍데기는 미리 저장, 지도 타일은 본 것만 캐시.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Korea Now — Go when it\'s quiet',
        short_name: 'Korea Now',
        description: 'Live crowd levels, admission fees, opening hours and closed days for spots across Korea.',
        theme_color: '#0f766e',
        background_color: '#f6f7f8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/korea-now/',
        scope: '/korea-now/',
        lang: 'en',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/korea-now/index.html',
        runtimeCaching: [
          {
            // 지도 타일: 한 번 본 타일은 30일 보관 (최대 300장)
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 관광지 이미지(TourAPI)
            urlPattern: /^https?:\/\/tong\.visitkorea\.or\.kr\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tour-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 서버 응답: 네트워크 우선, 실패하면 최근 응답 (혼잡도는 5분 이상 묵으면 데모로 대체됨)
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
  base: '/korea-now/',
  build: { outDir: 'dist', sourcemap: false },
})
