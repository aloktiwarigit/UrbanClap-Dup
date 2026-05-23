import type { NextConfig } from 'next';
import { createRequire } from 'node:module';
import createNextIntlPlugin from 'next-intl/plugin';

const require = createRequire(import.meta.url);
const pkg = require('./package.json') as { version: string };

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // typedRoutes: disabled during E12-S03a — all dashboard routes now under [locale]/
  // but existing catalogue navigation still uses bare paths (/catalogue/...).
  // Re-enable in E12-S03b when all navigation calls are updated to locale-aware paths.
  // typedRoutes: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_SHA: process.env.NEXT_PUBLIC_GIT_SHA ?? '',
  },
  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://*.posthog.com https://*.sentry.io https://*.firebaseapp.com https://apis.google.com",
      "connect-src 'self' https://*.googleapis.com https://*.posthog.com https://*.sentry.io https://*.applicationinsights.azure.com https://*.azurewebsites.net https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), xr-spatial-tracking=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Report-Only — violations log but don't block. Promote to enforcing after
          // the observation window (Sprint 2). 'unsafe-inline'/'unsafe-eval' on
          // script-src are temporary; a nonce strategy is tracked in Sprint 2 backlog.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
