import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * CSP por meta tag: o GitHub Pages não permite cabeçalhos HTTP. O bootstrap de tema é
 * inline, então o hash SHA-256 é calculado do próprio HTML; dev ignora a regra (HMR inline).
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
        (match) =>
          `'sha256-${createHash('sha256')
            .update(match[1] ?? '')
            .digest('base64')}'`,
      );
      const policy = [
        "default-src 'self'",
        `script-src 'self' ${hashes.join(' ')}`.trim(),
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "base-uri 'none'",
      ].join('; ');
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
    },
  };
}

export default defineConfig({
  base: '/fgts-simulator/',
  plugins: [
    react(),
    tailwindcss(),
    contentSecurityPolicy(),
    VitePWA({
      registerType: 'prompt',
      includeManifestIcons: false,
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
        // shortcut: html2canvas/purify/core-js só servem ao html() do jsPDF, que este app nunca chama; remova o ignore se algum dia usar doc.html().
        globIgnores: ['**/html2canvas-*.js', '**/purify.es-*.js', '**/index.es-*.js'],
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
