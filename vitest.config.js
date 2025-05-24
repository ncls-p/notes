import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.js'],
    globals: true,
    exclude: ['e2e'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})