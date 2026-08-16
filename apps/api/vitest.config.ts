import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/scripts/**', 'src/db/migrate.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: '../../coverage/api',
      thresholds: { lines: 50, functions: 30, statements: 47, branches: 18 },
    },
  },
});
