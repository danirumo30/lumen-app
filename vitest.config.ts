import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './config/vitest.setup.ts',
    include: ['**/*.test.ts'],
  },
});