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
      // Coverage debt acknowledgment (E13-S02 iteration 4, 2026-05-04):
      // admin-web actual coverage when this gate was first enforced was
      // lines=62.99%, functions=67.07%, statements=62.99%, branches=78.57%.
      // Thresholds set ~5pt below those values to prevent regression while
      // acknowledging the gap. E13-S02b (Wave 3) lifts these back to 80/80/80/80
      // alongside the vitest exclude-list trim and additional test coverage.
      // Do NOT lower these further. See plan jiggly-watching-brook.md Wave 3.
      thresholds: {
        lines: 60,
        branches: 75,
        functions: 65,
        statements: 60,
      },
    },
  },
});
