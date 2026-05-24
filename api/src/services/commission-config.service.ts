import * as Sentry from '@sentry/node';
import { commissionConfigRepo } from '../cosmos/commission-config-repository.js';
import {
  MIN_COMMISSION_BPS,
  MAX_COMMISSION_BPS,
  type CommissionResolvedFrom,
} from '../schemas/commission-config.js';

/** Platform default when no commission-config doc exists in Cosmos. */
export const DEFAULT_COMMISSION_BPS = 2200;

/** Cache TTL: 5 minutes. */
const CACHE_TTL_MS = 5 * 60 * 1000;

let _cachedBps: number | null = null;
let _cacheExpiresAt = 0;

/** Reset in-process cache — used by tests only. */
export function _resetCommissionConfigCacheForTest(): void {
  _cachedBps = null;
  _cacheExpiresAt = 0;
}

function isValidBps(x: number | undefined): x is number {
  return x !== undefined && Number.isInteger(x) && x >= MIN_COMMISSION_BPS && x <= MAX_COMMISSION_BPS;
}

/**
 * Pure resolver — applies the service > category > global precedence cascade.
 * "valid" = Number.isInteger(x) && 1500 <= x <= 3500.
 * Throws if globalBps is not valid (config is broken at the root).
 */
export function resolveCommissionBps(input: {
  serviceBps?: number;
  categoryBps?: number;
  globalBps: number;
}): { bps: number; from: CommissionResolvedFrom } {
  if (isValidBps(input.serviceBps)) {
    return { bps: input.serviceBps, from: 'SERVICE' };
  }
  if (isValidBps(input.categoryBps)) {
    return { bps: input.categoryBps, from: 'CATEGORY' };
  }
  if (!isValidBps(input.globalBps)) {
    throw new Error('commission config invalid: globalBps out of range');
  }
  return { bps: input.globalBps, from: 'GLOBAL' };
}

/**
 * Returns the platform-wide default commission rate in basis points.
 * Cached in-process with a 5-minute TTL to avoid hammering Cosmos on hot paths.
 * Falls back to DEFAULT_COMMISSION_BPS (2200) and emits a Sentry warning when
 * no commission-config doc has been written yet.
 */
export async function getGlobalCommissionBps(): Promise<number> {
  const now = Date.now();
  if (_cachedBps !== null && now < _cacheExpiresAt) {
    return _cachedBps;
  }

  const doc = await commissionConfigRepo.getCommissionConfig();
  const resolved = doc?.defaultCommissionBps ?? (() => {
    Sentry.captureMessage(
      'commission-config doc missing in Cosmos; falling back to DEFAULT_COMMISSION_BPS',
      'warning',
    );
    return DEFAULT_COMMISSION_BPS;
  })();

  _cachedBps = resolved;
  _cacheExpiresAt = now + CACHE_TTL_MS;

  return resolved;
}
