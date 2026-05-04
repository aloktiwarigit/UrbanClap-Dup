/**
 * E2E: CSRF double-submit cookie protection on /admin-api/*
 *
 * These tests verify that POST (state-changing) requests to the /admin-api proxy
 * are rejected with 403 when the CSRF tokens are absent or mismatched.
 *
 * The tests use Playwright's `request` API (no browser page needed) so they
 * execute quickly without a full browser context.
 *
 * NOTE: These tests require the Next.js dev server to be running (started by
 * the playwright webServer config). They test the actual HTTP layer, not mocks.
 */

import { test, expect } from '@playwright/test';

test.describe('CSRF protection on /admin-api/*', () => {
  test('POST without x-csrf-token header returns 403', async ({ request }) => {
    const response = await request.post('/admin-api/v1/admin/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        // No x-csrf-token header
        // No hs_csrf cookie
      },
      data: { firebaseToken: 'test-token' },
      // Prevent playwright from following redirects
      failOnStatusCode: false,
    });

    // The CSRF guard should fire before reaching the backend
    expect(response.status()).toBe(403);
  });

  test('POST with mismatched CSRF cookie and header returns 403', async ({ request }) => {
    const response = await request.post('/admin-api/v1/admin/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'hs_csrf=token-from-cookie',
        'x-csrf-token': 'completely-different-token',
      },
      data: { firebaseToken: 'test-token' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(403);
  });

  test('GET to /admin-api/* is not blocked by CSRF check', async ({ request }) => {
    // GET is a safe method — CSRF check must be bypassed entirely.
    // The request will likely get a different error (auth/404) but NOT 403 from CSRF.
    const response = await request.get('/admin-api/v1/admin/auth/login', {
      failOnStatusCode: false,
    });

    // 403 from CSRF guard is specifically what we must NOT see for GET.
    // Any other status (401, 404, 405, 200) is acceptable.
    expect(response.status()).not.toBe(403);
  });
});
