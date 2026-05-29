import { defineConfig } from 'vitest/config'

// Test config kept separate from vite.config.ts to avoid Vite/Vitest plugin
// type clashes. The core logic under src/core is framework-free, so no React
// plugin is needed here.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      reporter: ['text', 'html'],
    },
  },
})
