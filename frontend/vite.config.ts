import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Bumped by scripts/release.sh, which also cuts the matching vX.Y.Z tag.
const { version } = createRequire(import.meta.url)('./package.json')

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@hightower/shared': fileURLToPath(new URL('../shared', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4532',
      '/dozzle': {
        target: 'http://localhost:8080',
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['x-frame-options']
            delete proxyRes.headers['content-security-policy']
          })
          proxy.on('error', (err) => {
            console.error('dozzle proxy error:', err.message)
          })
        },
      },
    },
  },
})