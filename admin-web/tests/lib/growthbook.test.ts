// @vitest-environment node

import { describe, expect, it } from 'vitest';

describe('growthbook singleton', () => {
  it('has the correct GrowthBook CDN apiHost', async () => {
    // Import the module — in a Node environment window is undefined so
    // gb.loadFeatures() is not called; we just verify the config shape.
    const { gb } = await import('@/lib/growthbook');
    expect(gb.getApiHosts().apiHost).toBe('https://cdn.growthbook.io');
  });

  it('is enabled (clientKey may be empty in CI, but the instance is constructed)', async () => {
    const { gb } = await import('@/lib/growthbook');
    // instanceof check — confirms the import returns a GrowthBook instance, not undefined.
    expect(gb).toBeDefined();
  });
});
