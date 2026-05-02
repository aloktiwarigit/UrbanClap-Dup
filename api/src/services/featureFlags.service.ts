import { GrowthBook } from '@growthbook/growthbook';

// Use Pick<> over 'init' (not the deprecated loadFeatures) so:
//   1. init() returns InitResponse with a success field we can inspect
//   2. On timeout, SDK resolves {success:false} instead of rejecting — catch alone is insufficient
export type FeatureFlagClient = Pick<GrowthBook, 'init' | 'isOn'>;

function createRequestClient(userId?: string): FeatureFlagClient {
  return new GrowthBook({
    apiHost: process.env['GROWTHBOOK_API_HOST'] ?? 'https://cdn.growthbook.io',
    clientKey: process.env['GROWTHBOOK_CLIENT_KEY'] ?? '',
    // Pass userId so per-user F&F targeting rules in GrowthBook evaluate correctly.
    // GrowthBook's module-level feature cache is shared across instances — network round-trips
    // are deduplicated; creating per-request instances is safe and avoids singleton mutation.
    ...(userId ? { attributes: { id: userId } } : {}),
  });
}

/**
 * Returns true when bookings should be accepted.
 *
 * Fail-open contracts:
 *   - init() resolves with success=false (real timeout/network error) → return true
 *   - init() throws (unexpected SDK error) → return true
 *   - Empty GROWTHBOOK_CLIENT_KEY (local dev) → return true, skip GrowthBook entirely
 *
 * @param userId  - Firebase UID of the requesting customer; used for GrowthBook
 *                  per-user targeting (F&F allowlist). Optional — global eval if omitted.
 * @param client  - Injectable for testing; defaults to a fresh per-request instance.
 */
export async function isSoftLaunchEnabled(userId?: string, client?: FeatureFlagClient): Promise<boolean> {
  if (!process.env['GROWTHBOOK_CLIENT_KEY']) return true; // local dev — fail open
  const gb = client ?? createRequestClient(userId);
  try {
    const result = await gb.init({ timeout: 1000 });
    if (!result.success) return true; // timeout or network error → fail open
    return gb.isOn('soft_launch_enabled');
  } catch {
    return true; // unexpected SDK throw → fail open
  }
}

/**
 * Returns true when the owner has manually paused new bookings (e.g. surge / incident).
 *
 * Fail-open contracts:
 *   - init() resolves with success=false → return false (do not accidentally pause)
 *   - init() throws → return false
 *   - Empty GROWTHBOOK_CLIENT_KEY (local dev) → return false, never paused locally
 *
 * @param userId  - Firebase UID; used for completeness / future per-user overrides.
 * @param client  - Injectable for testing.
 */
export async function isMarketingPaused(userId?: string, client?: FeatureFlagClient): Promise<boolean> {
  if (!process.env['GROWTHBOOK_CLIENT_KEY']) return false; // local dev — never paused
  const gb = client ?? createRequestClient(userId);
  try {
    const result = await gb.init({ timeout: 1000 });
    if (!result.success) return false; // timeout or network error → do not accidentally pause
    return gb.isOn('marketing_pause_enabled');
  } catch {
    return false; // unexpected SDK throw → do not accidentally pause
  }
}
