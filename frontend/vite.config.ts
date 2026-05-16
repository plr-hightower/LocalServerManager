import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: './', // Explicitly set the root to the frontend folder
  plugins: [
    vue(),
    // Keep vueDevTools commented out until the server starts successfully
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@rig/shared': fileURLToPath(new URL('../shared', import.meta.url))
    },
  },
})