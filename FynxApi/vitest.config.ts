import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['../FynxTests/backend/**/*.test.ts'],
    globalSetup: ['../FynxTests/backend/globalSetup.ts'],
    setupFiles: ['../FynxTests/backend/setup.ts'],
    globals: true,
    fileParallelism: false,
  },
});
