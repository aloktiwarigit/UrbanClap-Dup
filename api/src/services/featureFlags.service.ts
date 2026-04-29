import { GrowthBook } from '@growthbook/growthbook';

export type FeatureFlagClient = Pick<GrowthBook, 'loadFeatures' | 'isOn'>;

// Module-level singleton — shared across invocations within the same Function App instance.
// Created lazily on first call so the missing-key guard runs at call time, not module load time.
let _singleton: FeatureFlagClient | null = null;

function getSingleton(): FeatureFlagClient {
  if (!_singleton) {
    _singleton = new GrowthBook({
      apiHost: process.env['GROWTHBOOK_API_HOST'] ?? 'https://cdn.growthbook.io',
      clientKey: process.env['GROWTHBOOK_CLIENT_KEY'] ?? '',
    });
  }
  return _singleton;
}

/**
 * Returns true when bookings should be accepted.
 * Fail-open contract: SDK timeout or error → return true (allow booking).
 * Local-dev contract: empty GROWTHBOOK_CLIENT_KEY → return true (skip flag entirely).
 *
 * @param client - injectable for testing; defaults to module singleton
 */
export async function isSoftLaunchEnabled(client?: FeatureFlagClient): Promise<boolean> {
  if (!process.env['GROWTHBOOK_CLIENT_KEY']) return true; // local dev — fail open
  const gb = client ?? getSingleton();
  try {
    await gb.loadFeatures({ timeout: 1000 });
    return gb.isOn('soft_launch_enabled');
  } catch {
    return true; // SDK failure must never block bookings
  }
}

/**
 * Returns true when the owner has manually paused new bookings (e.g. surge / incident).
 * Fail-open contract: SDK timeout or error → return false (do not accidentally pause).
 * Local-dev contract: empty GROWTHBOOK_CLIENT_KEY → return false (never paused locally).
 *
 * @param client - injectable for testing; defaults to module singleton
 */
export async function isMarketingPaused(client?: FeatureFlagClient): Promise<boolean> {
  if (!process.env['GROWTHBOOK_CLIENT_KEY']) return false; // local dev — never paused
  const gb = client ?? getSingleton();
  try {
    await gb.loadFeatures({ timeout: 1000 });
    return gb.isOn('marketing_pause_enabled');
  } catch {
    return false; // SDK failure must never accidentally pause bookings
  }
}
