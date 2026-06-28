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
    },
  },
})