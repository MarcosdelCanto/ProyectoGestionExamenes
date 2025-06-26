import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    setupFiles: ['./test/setup.js'],
    coverage: {
      include: [
        'controllers/**/*.js',
        'routes/**/*.js',
        'middlewares/**/*.js',
        'utils/**/*.js',
      ],
      exclude: ['index.js', 'db.js'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
    globals: true,
    testTimeout: 10000,
  },
});
