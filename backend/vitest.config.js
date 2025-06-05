import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      include: [
        'controllers/**/*.js',
        'routes/**/*.js',
        'middlewares/**/*.js',
        'utils/**/*.js',
      ],
      exclude: ['index.js', 'db.js'],
    },
  },
});
