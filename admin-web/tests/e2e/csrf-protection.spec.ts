/**
 * E2E: CSRF Origin-allowlist protection on /admin-api/*
 *
 * These tests verify that POST (state-changing) requests to the /admin-api proxy
 * are rejected with 403 when the Origin header indicates a cross-origin request.
 * Same-origin requests (matching NEXT_PUBLIC_APP_URL or no Origin header) must pass
 * the CSRF guard.
 *
 * The tests use Playwright's `request` API (no browser page needed) so they
 * execute quickly without a full browser context.
 *
 * NOTE: These tests require the Next.js dev server to be running (started by
 * the playwright webServer config). They test the actual HTTP layer, not mocks.
 */

import { test, expect } from '@playwright/test';

test.describe('CSRF protection on /admin-api/*', () => {
  test('POST from a cross-origin Origin returns 403', async ({ request }) => {
    const response = await request.post('/admin-api/v1/admin/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil.example.com',
      },
      data: { firebaseToken: 'test-token' },
      // Prevent playwright from following redirects
      failOnStatusCode: false,
    });

    // The Origin allowlist CSRF guard should fire before reaching the backend
    expect(response.status()).toBe(403);
  });

  test('POST without an Origin header is not blocked (SSR fetch / curl path)', async ({ request }) => {
    // Same-origin requests that omit Origin (e.g. SSR fetch, curl) must pass the
    // CSRF guard. They will likely fail with a different error (auth 401/404) but
    // NOT 403 from the CSRF guard.
    const response = await request.post('/admin-api/v1/admin/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        // No Origin header — simulates SSR server-side fetch or curl
      },
      data: { firebaseToken: 'test-token' },
      failOnStatusCode: false,
    });

    // CSRF guard must NOT fire — any other status (401, 404, 200, 502) is acceptable.
    expect(response.status()).not.toBe(403);
  });

  test('GET to /admin-api/* is not blocked by CSRF check', async ({ request }) => {
    // GET is a safe method — CSRF check must be bypassed entirely regardless of Origin.
    // The request will likely get a different error (auth/404) but NOT 403 from CSRF.
    const response = await request.get('/admin-api/v1/admin/auth/login', {
      headers: {
        'Origin': 'https://evil.example.com',
      },
      failOnStatusCode: false,
    });

    // 403 from CSRF guard is specifically what we must NOT see for GET.
    // Any other status (401, 404, 405, 200) is acceptable.
    expect(response.status()).not.toBe(403);
  });
});
