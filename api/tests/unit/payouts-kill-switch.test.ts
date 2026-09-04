import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/cosmos/finance-repository.js', () => ({
  getPayoutQueue: vi.fn(),
  getWeekSnapshot: vi.fn(),
  getLedgerTransfer: vi.fn(),
  writeLedgerEntry: vi.fn(),
  getTechnicianLinkedAccount: vi.fn(),
}));
vi.mock('../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn().mockResolvedValue({ sessionId: 's1' }),
}));
vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/services/razorpayRoute.service.js');
vi.mock('../../src/services/fcm.service.js', () => ({
  sendTechEarningsUpdate: vi.fn(),
  sendOwnerRouteAlert: vi.fn(),
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpRequest } from '@azure/functions';
import { arePayoutsEnabled } from '../../src/shared/payouts-enabled.js';
import { processNextDayPayouts } from '../../src/functions/trigger-next-day-payout.js';
import { reconcilePayouts } from '../../src/functions/trigger-reconcile-payouts.js';
import { adminApprovePayoutsHandler } from '../../src/functions/admin/finance/approve-payouts.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import { getWeekSnapshot } from '../../src/cosmos/finance-repository.js';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

const mockCtx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;
const superAdminCtx = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 's1' };
const req = () =>
  new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/payouts/approve-all', method: 'POST' });

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.PAYOUTS_ENABLED;
});

afterEach(() => {
  delete process.env.PAYOUTS_ENABLED;
});

describe('arePayoutsEnabled', () => {
  it('is false when PAYOUTS_ENABLED is unset', () => {
    expect(arePayoutsEnabled()).toBe(false);
  });

  it('is true only for the exact string "true"', () => {
    process.env.PAYOUTS_ENABLED = 'true';
    expect(arePayoutsEnabled()).toBe(true);
  });

  // Fail-closed: anything truthy-looking but not exactly "true" must NOT arm payouts.
  it.each(['false', 'TRUE', 'True', '1', 'yes', '', ' true '])(
    'is false for %o',
    (value) => {
      process.env.PAYOUTS_ENABLED = value;
      expect(arePayoutsEnabled()).toBe(false);
    },
  );
});

describe('payout kill switch — money must not move while disabled', () => {
  it('processNextDayPayouts does not read the ledger or construct Razorpay', async () => {
    await processNextDayPayouts(mockCtx);

    expect(walletLedgerRepo.getNextDayPendingBefore).not.toHaveBeenCalled();
    expect(RazorpayRouteService).not.toHaveBeenCalled();
    expect(walletLedgerRepo.markPaid).not.toHaveBeenCalled();
    expect(walletLedgerRepo.markFailed).not.toHaveBeenCalled();
  });

  it('reconcilePayouts does not read the ledger or construct Razorpay', async () => {
    await reconcilePayouts(mockCtx);

    expect(walletLedgerRepo.getPendingEntriesOlderThan).not.toHaveBeenCalled();
    expect(walletLedgerRepo.getFailedEntries).not.toHaveBeenCalled();
    expect(RazorpayRouteService).not.toHaveBeenCalled();
  });

  it('adminApprovePayoutsHandler returns 503 PAYOUTS_DISABLED without touching finance data', async () => {
    const res = await adminApprovePayoutsHandler(req(), mockCtx, superAdminCtx);

    expect(res.status).toBe(503);
    expect((res.jsonBody as { code: string }).code).toBe('PAYOUTS_DISABLED');
    expect(getWeekSnapshot).not.toHaveBeenCalled();
    expect(RazorpayRouteService).not.toHaveBeenCalled();
  });

  // The switch must not become an authorisation oracle: a non-super-admin
  // gets 403 whether or not payouts are enabled.
  it('still returns 403 for a non-super-admin while disabled', async () => {
    const opsCtx = { adminId: 'admin-2', role: 'ops-manager' as const, sessionId: 's1' };
    const res = await adminApprovePayoutsHandler(req(), mockCtx, opsCtx);

    expect(res.status).toBe(403);
  });
});

// ─── Static coverage layer ───────────────────────────────────────────────────
//
// The behavioural tests above prove money does not move while the switch is off,
// but they mock the repositories — so a future refactor could move a transfer to a
// new helper the mocks no longer observe. This layer asserts the guard is still
// lexically present in each money-moving entry point.
//
// Deliberately a static file scan rather than a Semgrep rule: per the E19-S03 note
// in api/.semgrep.yml, semgrep-action treats ANY finding as blocking regardless of
// severity, which previously blocked every api-ship deploy. Same defence, no CI risk.
describe('payout kill-switch guard presence (static scan)', () => {
  const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

  const GUARDED_ENTRY_POINTS = [
    'src/functions/trigger-next-day-payout.ts',
    'src/functions/trigger-reconcile-payouts.ts',
    'src/functions/admin/finance/approve-payouts.ts',
  ] as const;

  it.each(GUARDED_ENTRY_POINTS)('%s imports and calls arePayoutsEnabled', (relPath) => {
    const src = readFileSync(resolve(API_ROOT, relPath), 'utf8');

    expect(src, `${relPath} must import the kill switch`).toContain('payouts-enabled.js');
    expect(src, `${relPath} must actually call arePayoutsEnabled()`).toContain('arePayoutsEnabled()');
  });

  it('no money-moving file relies on Razorpay credential absence as its only guard', () => {
    for (const relPath of GUARDED_ENTRY_POINTS) {
      const src = readFileSync(resolve(API_ROOT, relPath), 'utf8');
      const guardIndex = src.indexOf('arePayoutsEnabled()');
      const razorpayIndex = src.indexOf('new RazorpayRouteService()');

      if (razorpayIndex === -1) continue;
      expect(
        guardIndex,
        `${relPath}: arePayoutsEnabled() must be checked before RazorpayRouteService is constructed`,
      ).toBeGreaterThan(-1);
      expect(guardIndex).toBeLessThan(razorpayIndex);
    }
  });
});
