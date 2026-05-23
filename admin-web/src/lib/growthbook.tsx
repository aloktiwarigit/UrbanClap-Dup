'use client';

/**
 * GrowthBook singleton for the admin-web Next.js 15 app.
 *
 * Initialised once at module load time. When running server-side (SSR / RSC),
 * `window` is undefined so `loadFeatures` is intentionally skipped — the server
 * always evaluates flags as OFF (safe-default). The client picks up features via
 * `autoRefresh: true` once the component tree hydrates.
 *
 * E13-S05 — initial SDK wiring.
 */

import { GrowthBook } from '@growthbook/growthbook-react';

export const gb = new GrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: process.env['NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY'] ?? '',
  enableDevMode: process.env['NODE_ENV'] !== 'production',
});

// Only load features on the client — avoids Next.js Edge / SSR fetch restrictions
// and prevents blocking the server render path.
if (typeof window !== 'undefined') {
  void gb.loadFeatures({ autoRefresh: true }).catch(() => undefined);
}
