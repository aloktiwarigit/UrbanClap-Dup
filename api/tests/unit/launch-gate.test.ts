import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSoftLaunchEnabled, isMarketingPaused, type FeatureFlagClient } from '../../src/services/featureFlags.service.js';

const ENV_KEY = 'GROWTHBOOK_CLIENT_KEY';
const savedKey = process.env[ENV_KEY];

// Build a mock FeatureFlagClient (init + isOn).
// GrowthBook SDK resolves (does not reject) on timeout/network errors:
//   init() → { success: false, source: 'timeout' | 'error' }
// Only truly unexpected errors cause init() to throw.
type FailureMode = 'ok' | 'sdk-timeout' | 'throws';

function makeClient(flags: Record<string, boolean>, failureMode: FailureMode = 'ok'): FeatureFlagClient {
  return {
    init: failureMode === 'throws'
      ? vi.fn().mockRejectedValue(new Error('Unexpected GrowthBook SDK error'))
      : vi.fn().mockResolvedValue({ success: failureMode === 'ok', source: failureMode === 'ok' ? 'network' : 'timeout' }),
    isOn: vi.fn((flag: string) => flags[flag] ?? false),
  };
}

beforeEach(() => {
  process.env[ENV_KEY] = 'test-key';
});

afterEach(() => {
  if (savedKey === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = savedKey;
  }
});

describe('isSoftLaunchEnabled', () => {
  it('returns false when soft_launch_enabled = false → createBooking must return 503 SERVICE_UNAVAILABLE', async () => {
    const client = makeClient({ soft_launch_enabled: false });
    const result = await isSoftLaunchEnabled('user-123', client);
    expect(result).toBe(false);
  });

  it('returns true when soft_launch_enabled = true → booking flow proceeds normally', async () => {
    const client = makeClient({ soft_launch_enabled: true });
    const result = await isSoftLaunchEnabled('user-123', client);
    expect(result).toBe(true);
  });

  it('fails open when GrowthBook init resolves with success=false (real SDK timeout/network error)', async () => {
    // GrowthBook SDK does NOT throw on timeout — it resolves {success:false}.
    // The catch block alone is insufficient; we must check result.success.
    const client = makeClient({}, 'sdk-timeout');
    const result = await isSoftLaunchEnabled('user-123', client);
    expect(result).toBe(true); // fail open — never block bookings due to flags SDK issue
  });

  it('fails open when GrowthBook init throws unexpectedly (defensive catch)', async () => {
    const client = makeClient({}, 'throws');
    const result = await isSoftLaunchEnabled('user-123', client);
    expect(result).toBe(true);
  });

  it('returns true when GROWTHBOOK_CLIENT_KEY is empty → local-dev passthrough (no GrowthBook call)', async () => {
    delete process.env[ENV_KEY];
    const result = await isSoftLaunchEnabled('user-123');
    expect(result).toBe(true);
  });
});

describe('isMarketingPaused', () => {
  it('returns true when marketing_pause_enabled = true → 503 TEMPORARILY_UNAVAILABLE even during soft launch', async () => {
    const client = makeClient({ marketing_pause_enabled: true });
    const result = await isMarketingPaused('user-123', client);
    expect(result).toBe(true);
  });

  it('returns false when marketing_pause_enabled = false → booking not paused', async () => {
    const client = makeClient({ marketing_pause_enabled: false });
    const result = await isMarketingPaused('user-123', client);
    expect(result).toBe(false);
  });

  it('fails open (returns false) when GrowthBook init resolves with success=false (real SDK timeout)', async () => {
    const client = makeClient({}, 'sdk-timeout');
    const result = await isMarketingPaused('user-123', client);
    expect(result).toBe(false); // fail safe — never accidentally pause bookings due to SDK issue
  });

  it('fails open (returns false) when GrowthBook init throws unexpectedly', async () => {
    const client = makeClient({}, 'throws');
    const result = await isMarketingPaused('user-123', client);
    expect(result).toBe(false);
  });

  it('returns false when GROWTHBOOK_CLIENT_KEY is empty → local-dev is never paused', async () => {
    delete process.env[ENV_KEY];
    const result = await isMarketingPaused('user-123');
    expect(result).toBe(false);
  });
});
