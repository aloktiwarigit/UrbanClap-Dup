import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSoftLaunchEnabled, isMarketingPaused, type FeatureFlagClient } from '../../src/services/featureFlags.service.js';

const ENV_KEY = 'GROWTHBOOK_CLIENT_KEY';
const savedKey = process.env[ENV_KEY];

function makeClient(flags: Record<string, boolean>, throws = false): FeatureFlagClient {
  return {
    loadFeatures: throws
      ? vi.fn().mockRejectedValue(new Error('GrowthBook SDK timeout'))
      : vi.fn().mockResolvedValue(undefined),
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
    const result = await isSoftLaunchEnabled(client);
    expect(result).toBe(false);
  });

  it('returns true when soft_launch_enabled = true → booking flow proceeds normally', async () => {
    const client = makeClient({ soft_launch_enabled: true });
    const result = await isSoftLaunchEnabled(client);
    expect(result).toBe(true);
  });

  it('fails open when GrowthBook SDK throws → booking proceeds (SDK failure must not block users)', async () => {
    const client = makeClient({}, true /* throws */);
    const result = await isSoftLaunchEnabled(client);
    expect(result).toBe(true); // fail open
  });

  it('returns true when GROWTHBOOK_CLIENT_KEY is empty → local-dev passthrough (no GrowthBook call)', async () => {
    delete process.env[ENV_KEY];
    // No client passed — uses module singleton path, which bails early when key is missing
    const result = await isSoftLaunchEnabled();
    expect(result).toBe(true);
  });
});

describe('isMarketingPaused', () => {
  it('returns true when marketing_pause_enabled = true → 503 TEMPORARILY_UNAVAILABLE even during soft launch', async () => {
    const client = makeClient({ marketing_pause_enabled: true });
    const result = await isMarketingPaused(client);
    expect(result).toBe(true);
  });

  it('returns false when marketing_pause_enabled = false → booking not paused', async () => {
    const client = makeClient({ marketing_pause_enabled: false });
    const result = await isMarketingPaused(client);
    expect(result).toBe(false);
  });

  it('fails open (returns false) when GrowthBook SDK throws → do not accidentally pause all bookings', async () => {
    const client = makeClient({}, true /* throws */);
    const result = await isMarketingPaused(client);
    expect(result).toBe(false); // fail safe — never pause due to SDK error
  });

  it('returns false when GROWTHBOOK_CLIENT_KEY is empty → local-dev is never paused', async () => {
    delete process.env[ENV_KEY];
    const result = await isMarketingPaused();
    expect(result).toBe(false);
  });
});
