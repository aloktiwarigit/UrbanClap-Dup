import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

// Seed GIT_SHA for the api/ webServer so getVersionInfo() returns a real 8-char
// hex SHA (not the "dev" fallback). CI sets GIT_SHA at job scope; locally we
// derive it from HEAD so `pnpm test:e2e` exercises the real round-trip.
// Tarball installs / docker contexts without .git fall back to "dev".
function resolveGitSha(): string {
  const fromEnv = process.env['GIT_SHA'];
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}
const localGitSha = resolveGitSha();

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'a11y/**/*.spec.ts'],
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
      // `start` = `func start` (no rebuild). CI pre-builds api/ in the e2e job
      // before playwright runs; locally, developers must run `pnpm -C api build`
      // before `pnpm test:e2e` (documented in admin-web/README.md).
      command: 'pnpm -C ../api start',
      url: 'http://localhost:7071/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        GIT_SHA: localGitSha,
        // api/local.settings.json is .gitignored, so in CI `func start` prompts
        // interactively for a worker runtime and then hangs. Pass the runtime
        // explicitly here so the host launches non-interactively.
        FUNCTIONS_WORKER_RUNTIME: 'node',
        AzureWebJobsStorage: 'UseDevelopmentStorage=true',
      },
    },
    {
      command: 'pnpm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        API_BASE_URL: 'http://localhost:7071/api',
        // JWT_SECRET must match the secret used in tests/e2e/helpers/make-token.ts
        // so that mock cookies generated in tests pass middleware verification.
        JWT_SECRET: process.env['JWT_SECRET'] ?? 'e2e-test-jwt-secret-placeholder-min32chars!',
      },
    },
  ],
});
