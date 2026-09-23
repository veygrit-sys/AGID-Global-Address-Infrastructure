import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function manualVendorChunk(id: string) {
  const normalizedId = id.replace(/\\/g, '/');

  if (!normalizedId.includes('/node_modules/')) return undefined;

  if (
    normalizedId.includes('/react/') ||
    normalizedId.includes('/react-dom/') ||
    normalizedId.includes('/scheduler/')
  ) {
    return 'vendor-react';
  }

  if (normalizedId.includes('/maplibre-gl/')) return 'vendor-maplibre';
  if (normalizedId.includes('/pmtiles/')) return 'vendor-pmtiles';
  if (normalizedId.includes('/ol/')) return 'vendor-openlayers';

  if (normalizedId.includes('/html5-qrcode/')) {
    return 'vendor-qr-scanner';
  }

  if (normalizedId.includes('/qrcode.react/')) {
    return 'vendor-qr-display';
  }

  if (normalizedId.includes('/@turf/')) return 'vendor-geo-turf';
  if (normalizedId.includes('/open-location-code/')) return 'vendor-geo-code';
  if (
    normalizedId.includes('/geokdbush/') ||
    normalizedId.includes('/kdbush/') ||
    normalizedId.includes('/ngraph.') ||
    normalizedId.includes('/minisearch/')
  ) {
    return 'vendor-search';
  }

  if (normalizedId.includes('/dexie/')) {
    return 'vendor-storage';
  }

  if (normalizedId.includes('/opencc-js/')) return 'vendor-language-opencc';
  if (normalizedId.includes('/pinyin-pro/')) return 'vendor-language-pinyin';
  if (normalizedId.includes('/franc-min/')) return 'vendor-language-detect';
  if (normalizedId.includes('/cldr-core/') || normalizedId.includes('/cldr-localenames-modern/')) return 'vendor-language-cldr';
  if (normalizedId.includes('/yaml/')) return 'vendor-yaml';
  if (normalizedId.includes('/lucide-react/')) return 'vendor-icons';
  if (normalizedId.includes('/file-saver/')) return 'vendor-export';
  if (normalizedId.includes('/viem/') || normalizedId.includes('/wagmi/') || normalizedId.includes('/@tanstack/')) return 'vendor-web3';
  if (normalizedId.includes('/snarkjs/')) return 'vendor-zk';
  if (normalizedId.includes('/@google/genai/')) return 'vendor-ai';

  return 'vendor-misc';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: ['agid-logo.png', 'agid-logo.jpg', 'pwa-icon.svg'],
        manifest: {
          id: '/',
          name: 'AGID - Absolute Grid Identity',
          short_name: 'AGID',
          description:
            'A deterministic global grid ID system for address, maritime, and location intelligence.',
          lang: 'en',
          dir: 'ltr',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'browser'],
          orientation: 'any',
          scope: '/',
          start_url: '/',
          categories: ['maps', 'navigation', 'utilities', 'productivity'],
          icons: [
            {
              src: '/agid-logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/agid-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          shortcuts: [
            {
              name: 'POS',
              short_name: 'POS',
              description: 'Open the AGID POS handoff surface.',
              url: '/pos',
              icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
            },
            {
              name: 'Field Handoff',
              short_name: 'Field',
              description: 'Open the offline-capable field handoff surface.',
              url: '/field',
              icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
            },
            {
              name: 'Address Portal',
              short_name: 'Portal',
              description: 'Open the address portal.',
              url: '/portal',
              icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
          globIgnores: ['assets/[A-Z][A-Z]*-*.js'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/embed(?:\/|$)/],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'font',
              handler: 'CacheFirst',
              options: {
                cacheName: 'agid-fonts-v1',
                expiration: {
                  maxEntries: 16,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ request, url }) => (
                request.destination === 'image'
                && (
                  url.origin === self.location.origin
                  || /(?:openfreemap|openmaptiles|tile|tiles)\./i.test(url.hostname)
                )
              ),
              handler: 'CacheFirst',
              options: {
                cacheName: 'agid-map-and-app-images-v1',
                expiration: {
                  maxEntries: 800,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
              options: {
                cacheName: 'agid-api-network-only-v1',
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Keep Vite's generic warning aligned with scripts/verify-build-chunk-budget.ts.
      // The dedicated budget script still fails unknown oversized chunks.
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          embed: path.resolve(__dirname, 'embed.html'),
        },
        output: {
          manualChunks: manualVendorChunk,
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
