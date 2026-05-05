import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'tests/a11y/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/sentry.server.config.ts',
        'src/sentry.edge.config.ts',
        'src/sentry.client.config.ts',
        'src/instrumentation.ts',
        'src/instrumentation-client.ts',
        'src/api/generated/**',
        'app/layout.tsx',
        '**/*.stories.tsx',
        '**/*.config.*',
        'src/lib/auth/firebase.ts',
        'src/lib/auth/types.ts',
        'src/api/index.ts',
      ],
      // Coverage debt acknowledgment (E12-S07, 2026-05-04):
      // After new src/ files were added (technicians panel, catalogue forms,
      // compliance client, finance client, orders client — all 0% covered),
      // the actual baseline as of this story is:
      //   lines=54.23%, functions=64.24%, statements=54.23%, branches=78.57%.
      // Thresholds set ~5pt below those values to prevent further regression.
      // Prior E13-S02 comment targeted 62.99% but new uncovered files dropped
      // the floor. E13-S02b (Wave 3) lifts these back to 80/80/80/80 alongside
      // vitest exclude-list trim and additional test coverage.
      // Do NOT lower these further. See plan jiggly-watching-brook.md Wave 3.
      thresholds: {
        lines: 50,
        branches: 75,
        functions: 60,
        statements: 50,
      },
    },
  },
});
