import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// TEMPORARILY DISABLED: vite-plugin-vue-devtools causing parsing issues
// import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Solo incluir devtools en desarrollo
    // Temporalmente deshabilitado para debug
    // ...(process.env.NODE_ENV !== 'production' ? [vueDevTools()] : []),
    // PWA Configuration
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Nalub Pedidos',
        short_name: 'Nalub',
        description: 'Sistema de pedidos para clientes Nalub',
        theme_color: '#1976D2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.railway\.app\/api\/(productos|ofertas|dashboard)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // Optimizaciones para producción
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log en producción
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-vuetify': ['vuetify'],
          'vendor-axios': ['axios'],
          // Separar vistas por módulos
          'views-auth': ['./src/views/auth/Login.vue', './src/views/auth/Perfil.vue'],
          'views-pedidos': ['./src/views/pedidos/PedidosList.vue', './src/views/pedidos/PedidoDetail.vue'],
          'views-prepedidos': ['./src/views/prepedidos/Prepedidos.vue', './src/views/prepedidos/PrepedidoForm.vue']
        }
      }
    },
    // Aumentar límite de tamaño para chunks grandes
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true
  }
})
