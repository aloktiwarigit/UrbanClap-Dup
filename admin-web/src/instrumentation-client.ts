/**
 * Next.js client-side instrumentation (E13-S04, ADR-0018).
 *
 * Loaded once in the browser. Wires:
 * - Sentry client SDK
 * - PostHog browser analytics (posthog-js)
 */

import './sentry.client.config';
import { sanitizeProperties } from './lib/posthog-sanitize';

// PostHog browser init — page-view autocapture + identify-on-login.
// Disabled when NEXT_PUBLIC_POSTHOG_KEY is absent (local dev / test environments).
const posthogKey = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
if (posthogKey && typeof window !== 'undefined') {
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      api_host: process.env['NEXT_PUBLIC_POSTHOG_HOST'] ?? 'https://us.i.posthog.com',
      capture_pageview: true,

      // PII masking — strip all text content and element attributes from session
      // recordings; respect the browser Do Not Track signal.
      mask_all_text: true,
      mask_all_element_attributes: true,
      respect_dnt: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '*',
      },

      // Autocapture allowlist — restrict to known-safe routes and interactions.
      // Prevents accidental capture of sensitive admin paths or PII-bearing events.
      autocapture: {
        url_allowlist: [
          /^\/[a-z]{2}\/(dashboard|orders|finance|complaints|technicians|audit-log|admin-users|compliance|customers)\//,
        ],
        element_allowlist: ['button', 'a'],
        dom_event_allowlist: ['click'],
      },

      // Strip PII keys and sanitise URL query params in all captured properties.
      sanitize_properties: (properties, eventName) =>
        sanitizeProperties(properties as Record<string, unknown>, eventName) as typeof properties,

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
