import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/erasure-request-repository.js', () => ({
  listOverduePendingErasureRequests: vi.fn(),
  getErasureRequestById: vi.fn(),
  replaceErasureRequest: vi.fn(),
}));

vi.mock('../../src/services/erasureCascade.service.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/erasureCascade.service.js')>(
    '../../src/services/erasureCascade.service.js',
  );
  return {
    ...actual,
    executeErasureCascade: vi.fn(),
  };
});

vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/fcm.service.js', () => ({
  sendErasureFinalNotice: vi.fn().mockResolvedValue(undefined),
  sendErasureDenied: vi.fn().mockResolvedValue(undefined),
  sendOwnerComplaintFiled: vi.fn().mockResolvedValue(undefined),
  sendTechEarningsUpdate: vi.fn().mockResolvedValue(undefined),
}));

type MockFn = ReturnType<typeof vi.fn>;

function pending(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    partitionKey: id,
    userId: `user-${id}`,
    userRole: 'CUSTOMER' as const,
    status: 'PENDING' as const,
    requestedAt: '2026-04-15T00:00:00.000Z',
    scheduledDeletionAt: '2026-04-22T00:00:00.000Z',
    anonymizationSalt: `salt-${id}-1234567890abcd`,
    ...overrides,
  };
}

const allZeroCounts = {
  bookings: 0,
  ratings: 0,
  complaints: 0,
  walletLedgerAnonymized: 0,
  bookingEventsAnonymized: 0,
  dispatchAttemptsAnonymized: 0,
  auditLogAnonymized: 0,
  technicianHardDeleted: false,
  kycHardDeleted: false,
  fcmTokensCleared: true,
};

describe('trigger-erasure-deadline (Azure timer trigger)', () => {
  let processOverdueErasures: typeof import('../../src/functions/trigger-erasure-deadline.js').processOverdueErasures;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/trigger-erasure-deadline.js');
    processOverdueErasures = mod.processOverdueErasures;
  });

  it('finds zero overdue → no-op', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const cascade = await import('../../src/services/erasureCascade.service.js');
    (repo.listOverduePendingErasureRequests as MockFn).mockResolvedValue([]);

    const result = await processOverdueErasures(new InvocationContext());

    expect(result.processed).toBe(0);
    expect(result.executed).toBe(0);
    expect(result.failed).toBe(0);
    expect(cascade.executeErasureCascade).not.toHaveBeenCalled();
  });

  it('processes overdue PENDING requests, runs cascade, marks EXECUTED', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const cascade = await import('../../src/services/erasureCascade.service.js');
    const fcm = await import('../../src/services/fcm.service.js');
    const auditService = await import('../../src/services/auditLog.service.js');

    (repo.listOverduePendingErasureRequests as MockFn).mockResolvedValue([
      pending('er-1'),
      pending('er-2'),
    ]);
    (repo.getErasureRequestById as MockFn).mockImplementation((id: string) =>
      Promise.resolve({ doc: pending(id), etag: 'e' }),
    );
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);
    (cascade.executeErasureCascade as MockFn).mockResolvedValue(allZeroCounts);

    const result = await processOverdueErasures(new InvocationContext());

    expect(result.processed).toBe(2);
    expect(result.executed).toBe(2);
    expect(result.failed).toBe(0);
    expect(cascade.executeErasureCascade).toHaveBeenCalledTimes(2);

    // Each request transitions to EXECUTED
    const replaceCalls = (repo.replaceErasureRequest as MockFn).mock.calls;
    const executedCalls = replaceCalls.filter(
      (call: unknown[]) => (call[0] as Record<string, unknown>)['status'] === 'EXECUTED',
    );
    expect(executedCalls.length).toBe(2);

    // FCM final notice sent for each
    expect(fcm.sendErasureFinalNotice).toHaveBeenCalledTimes(2);

    // Audit log written for each
    const erasureExecutedCalls = (auditService.auditLog as MockFn).mock.calls.filter(
      (c: unknown[]) => c[1] === 'ERASURE_EXECUTED',
    );
    expect(erasureExecutedCalls.length).toBe(2);
  });

  it('isolates per-request failures: one cascade error does not abort the batch', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const cascade = await import('../../src/services/erasureCascade.service.js');

    (repo.listOverduePendingErasureRequests as MockFn).mockResolvedValue([
      pending('er-1'),
      pending('er-2'),
      pending('er-3'),
    ]);
    (repo.getErasureRequestById as MockFn).mockImplementation((id: string) =>
      Promise.resolve({ doc: pending(id), etag: 'e' }),
    );
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);
    (cascade.executeErasureCascade as MockFn)
      .mockResolvedValueOnce(allZeroCounts)
      .mockRejectedValueOnce(new Error('cosmos timeout'))
      .mockResolvedValueOnce(allZeroCounts);

    const result = await processOverdueErasures(new InvocationContext());

    expect(result.processed).toBe(3);
    expect(result.executed).toBe(2);
    expect(result.failed).toBe(1);

    const replaceCalls = (repo.replaceErasureRequest as MockFn).mock.calls;
    const failedCalls = replaceCalls.filter(
      (call: unknown[]) => (call[0] as Record<string, unknown>)['status'] === 'FAILED',
    );
    expect(failedCalls.length).toBe(1);
    expect(
      (failedCalls[0]![0] as Record<string, unknown>)['failureReason'],
    ).toContain('cosmos timeout');
  });

  it('skips entries that no longer exist or have changed status (race-free)', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const cascade = await import('../../src/services/erasureCascade.service.js');

    (repo.listOverduePendingErasureRequests as MockFn).mockResolvedValue([pending('er-1')]);
    // The second read returns REVOKED (user revoked between list and process)
    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pending('er-1', { status: 'REVOKED' }),
      etag: 'e',
    });

    const result = await processOverdueErasures(new InvocationContext());

    expect(result.executed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.processed).toBe(1);
    expect(cascade.executeErasureCascade).not.toHaveBeenCalled();
  });
});
