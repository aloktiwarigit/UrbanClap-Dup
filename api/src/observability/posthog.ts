/**
 * PostHog server-side analytics client — api/ (E13-S04, ADR-0018).
 *
 * Self-initialises on import.  Disabled when POSTHOG_API_KEY is absent so
 * local-dev and test environments are silent.
 *
 * Usage:
 *   import { posthog } from './observability/posthog.js';
 *   posthog.capture({ distinctId: userId, event: 'booking-created', properties: { bookingId } });
 */

import { PostHog } from 'posthog-node';

const apiKey = process.env['POSTHOG_API_KEY'];

// PostHog SDK throws synchronously when an empty string is passed as the API
// key, even when `disabled: true` is set. Guard construction behind the key
// presence check and expose a no-op stub when the key is absent.
class NoOpPostHog {
  capture(_event: unknown): void { /* no-op */ }
  identify(_props: unknown): void { /* no-op */ }
  async shutdown(): Promise<void> { /* no-op */ }
}

export const posthog: Pick<PostHog, 'capture' | 'identify' | 'shutdown'> = apiKey
  ? new PostHog(apiKey, {
      host: 'https://us.i.posthog.com',
      flushAt: 20,
      flushInterval: 10_000,
    })
  : new NoOpPostHog();
