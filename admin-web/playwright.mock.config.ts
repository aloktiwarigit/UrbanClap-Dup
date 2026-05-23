import { defineConfig, devices } from '@playwright/test';

const jwtSecret = process.env['JWT_SECRET'] ?? 'e2e-test-jwt-secret-placeholder-min32chars!';

export default defineConfig({
  testDir: './tests',
  testMatch: [
    'e2e/admin-completion.spec.ts',
    'e2e/login.spec.ts',
    // notfound.spec.ts excluded: after S4 merges (fail-closed canAccessAdminPath),
    // authenticated users hitting unknown paths get /not-authorized instead of 404.
    // Re-add once S4 updates middleware to fall through unknown paths to Next.js.
    'e2e/rbac-403.spec.ts',
    'e2e/totp-enrollment.spec.ts',
  ],
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node tests/e2e/mock-admin-api.mjs',
      url: 'http://localhost:7072/api/v1/health',
      reuseExistingServer: false,
      timeout: 30_000,
      env: { MOCK_ADMIN_API_PORT: '7072' },
    },
    {
      command: 'pnpm exec next start -p 3010',
      url: 'http://localhost:3010',
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        API_BASE_URL: 'http://localhost:7072/api',
        JWT_SECRET: jwtSecret,
        // Must match the port Next.js is served on — the CSRF guard in
        // app/admin-api/[...path]/route.ts compares request Origin against
        // this value; mismatched origins return 403.
        NEXT_PUBLIC_APP_URL: 'http://localhost:3010',
      },
    },
  ],
});
