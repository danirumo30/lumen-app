import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './config/vitest.setup.ts',
    include: [
      'tests/unit/**/*.test.ts',
    ],
    exclude: [
      'tests/e2e/**/*',
      'tests/integration/**/*',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
