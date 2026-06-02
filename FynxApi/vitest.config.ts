import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['../FynxTests/backend/**/*.test.ts'],
    setupFiles: ['../FynxTests/backend/setup.ts'],
    globals: true,
  },
});
