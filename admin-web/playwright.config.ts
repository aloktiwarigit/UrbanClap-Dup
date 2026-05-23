import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'a11y/**/*.spec.ts'],
  // notfound.spec.ts asserts unknown paths return 404 with a themed page.
  // That requires middleware to distinguish "unknown path" (→ 404) from
  // "known path, no capability" (→ /not-authorized). The capability default-
  // deny landed in S0; the path-matrix distinction is part of S4's auth
  // hardening (P1-AUTH-4 + Task 7). Re-enable this spec once S4 merges.
  testIgnore: ['e2e/notfound.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'e2e/**/*.spec.ts',
    },
    {
      name: 'a11y',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'a11y/**/*.spec.ts',
    },
  ],
  webServer: [
    {
      command: 'node tests/e2e/mock-admin-api.mjs',
      url: 'http://localhost:7072/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        MOCK_ADMIN_API_PORT: '7072',
      },
    },
    {
      command: 'pnpm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        API_BASE_URL: 'http://localhost:7072/api',
        // JWT_SECRET must match the secret used in tests/e2e/helpers/make-token.ts
        // so that mock cookies generated in tests pass middleware verification.
        JWT_SECRET: process.env['JWT_SECRET'] ?? 'e2e-test-jwt-secret-placeholder-min32chars!',
      },
    },
  ],
});
