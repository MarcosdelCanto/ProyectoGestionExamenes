import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      include: [
        'src/components/**/*.{js,jsx}',
        'src/pages/**/*.{js,jsx}',
        'src/services/**/*.{js,jsx}',
        'src/utils/**/*.{js,jsx}',
        'src/store/**/*.{js,jsx}'
      ],
      exclude: [
        'src/main.jsx',
        'src/test/**',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
