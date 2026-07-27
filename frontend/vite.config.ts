import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
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