import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

// Seed GIT_SHA for the api/ webServer so getVersionInfo() returns a real 8-char
// hex SHA (not the "dev" fallback). CI sets GIT_SHA at job scope; locally we
// derive it from HEAD so `pnpm test:e2e` exercises the real round-trip.
const localGitSha =
  process.env['GIT_SHA'] ?? execSync('git rev-parse HEAD').toString().trim();

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
      command: 'pnpm -C ../api dev',
      url: 'http://localhost:7071/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        GIT_SHA: localGitSha,
      },
    },
    {
      command: 'pnpm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        API_BASE_URL: 'http://localhost:7071/api',
      },
    },
  ],
});
