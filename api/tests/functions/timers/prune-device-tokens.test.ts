import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../../src/cosmos/device-token-repository.js', () => ({
  deviceTokenRepo: { pruneStaleTokens: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ addBreadcrumb: vi.fn(), captureException: vi.fn() }));

import { pruneStaleDeviceTokens } from '../../../src/functions/timers/prune-device-tokens.js';
import { deviceTokenRepo } from '../../../src/cosmos/device-token-repository.js';

const mockCtx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

beforeEach(() => vi.clearAllMocks());

describe('pruneStaleDeviceTokens', () => {
  it('calls pruneStaleTokens with 60 days', async () => {
    vi.mocked(deviceTokenRepo.pruneStaleTokens).mockResolvedValue(5);
    await pruneStaleDeviceTokens(mockCtx);
    expect(deviceTokenRepo.pruneStaleTokens).toHaveBeenCalledWith(60);
  });

  it('logs pruned count', async () => {
    vi.mocked(deviceTokenRepo.pruneStaleTokens).mockResolvedValue(3);
    await pruneStaleDeviceTokens(mockCtx);
    expect(mockCtx.log).toHaveBeenCalledWith(expect.stringContaining('3'));
  });

  it('handles zero tokens gracefully', async () => {
    vi.mocked(deviceTokenRepo.pruneStaleTokens).mockResolvedValue(0);
    await expect(pruneStaleDeviceTokens(mockCtx)).resolves.toBeUndefined();
  });
});
