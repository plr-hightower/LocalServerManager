import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    {
      // Vite globs .ts files but the runtime lookup uses .js extension from the
      // template literal , they don't match. Patch game.service.ts before Vite
      // processes the dynamic import so the glob keys match the runtime lookup.
      name: 'patch-game-service-dynamic-import',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('/game.service.ts')) {
          return code.replaceAll('.service.js', '.service.ts')
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})