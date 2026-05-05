/**
 * Next.js client-side instrumentation (E13-S04, ADR-0018).
 *
 * Loaded once in the browser. Wires:
 * - Sentry client SDK
 * - PostHog browser analytics (posthog-js)
 */

import './sentry.client.config';

// PostHog browser init — page-view autocapture + identify-on-login.
// Disabled when NEXT_PUBLIC_POSTHOG_KEY is absent (local dev / test environments).
const posthogKey = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
if (posthogKey && typeof window !== 'undefined') {
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      api_host: process.env['NEXT_PUBLIC_POSTHOG_HOST'] ?? 'https://us.i.posthog.com',
      // Capture page views automatically on route changes.
      capture_pageview: true,
      // Avoid double-counting with server-side captures: use a separate
      // namespace prefix for client events ($pageview, $autocapture) vs
      // server domain events (booking-created, booking-paid).
      loaded(ph) {
        if (process.env['NODE_ENV'] === 'development') {
          ph.debug();
        }
      },
    });
  }).catch(() => {
    // PostHog load failure must never break the admin UI.
  });
}
