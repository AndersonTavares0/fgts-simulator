import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/fgts-simulator/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['fonts/*.woff2', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        id: '/fgts-simulator/',
        name: 'Simulador FGTS',
        short_name: 'FGTS',
        description: 'Simulações estimativas de FGTS, histórico local e relatórios offline.',
        lang: 'pt-BR',
        start_url: '/fgts-simulator/',
        scope: '/fgts-simulator/',
        display: 'standalone',
        theme_color: '#fafaf9',
        background_color: '#fafaf9',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: 'fgts-simulator',
        globPatterns: ['**/*.{js,css,html,woff2,ttf,png,svg,ico}'],
        navigateFallback: '/fgts-simulator/index.html',
        navigateFallbackAllowlist: [/^\/fgts-simulator\//],
        skipWaiting: false,
        clientsClaim: false,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: { outDir: 'dist', emptyOutDir: true },
});
