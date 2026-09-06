import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/technician-repository.js');
vi.mock('../../../../src/services/commission-hold.service.js');
vi.mock('../../../../src/services/auditLog.service.js');

import { readCommissionHold, patchCommissionHold } from '../../../../src/cosmos/technician-repository.js';
import { recomputeCommissionHold } from '../../../../src/services/commission-hold.service.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import {
  setCommissionHoldOverrideHandler,
  clearCommissionHoldOverrideHandler,
} from '../../../../src/functions/admin/finance/commission-hold-override.js';

const ctx = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 's1' };

const existingHold = {
  outstandingPaise: 20000,
  dueCount: 3,
  state: 'BLOCKED' as const,
  evaluatedAt: '2026-09-01T00:00:00.000Z',
};

const overriddenHold = {
  ...existingHold,
  state: 'CLEAR' as const,
  override: { until: '2026-09-10T00:00:00.000Z', byAdminId: 'admin-1', reason: 'goodwill' },
};

function makeReq(technicianId: string, method: 'POST' | 'DELETE', body?: unknown): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/admin/finance/commission-hold/${technicianId}/override`,
    method,
    ...(body !== undefined ? { body: { string: JSON.stringify(body) }, headers: { 'content-type': 'application/json' } } : {}),
  });
  Object.assign(req, { params: { technicianId } });
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auditLog).mockResolvedValue(undefined);
});

describe('setCommissionHoldOverrideHandler', () => {
  const validBody = { until: '2026-09-10T00:00:00.000Z', reason: 'goodwill' };

  it('returns 400 VALIDATION_ERROR on invalid body (bad datetime)', async () => {
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: existingHold, exists: true });

    const res = (await setCommissionHoldOverrideHandler(
      makeReq('tech-1', 'POST', { until: 'not-a-date', reason: 'x' }),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
    expect(patchCommissionHold).not.toHaveBeenCalled();
  });

  it('returns 400 VALIDATION_ERROR when reason is empty', async () => {
    const res = (await setCommissionHoldOverrideHandler(
      makeReq('tech-1', 'POST', { until: '2026-09-10T00:00:00.000Z', reason: '' }),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
  });

  it('returns 404 when technician does not exist', async () => {
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: null, exists: false });

    const res = (await setCommissionHoldOverrideHandler(
      makeReq('tech-missing', 'POST', validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('TECHNICIAN_NOT_FOUND');
    expect(patchCommissionHold).not.toHaveBeenCalled();
  });

  it('patches the override field, recomputes, audits, and returns the recomputed hold', async () => {
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: existingHold, exists: true });
    vi.mocked(patchCommissionHold).mockResolvedValue('APPLIED');
    vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: overriddenHold, status: 'APPLIED' });

    const res = (await setCommissionHoldOverrideHandler(
      makeReq('tech-1', 'POST', validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(patchCommissionHold).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({
        ...existingHold,
        override: { until: validBody.until, byAdminId: 'admin-1', reason: validBody.reason },
      }),
      expect.any(String),
    );
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
    expect(auditLog).toHaveBeenCalledWith(
      ctx,
      'COMMISSION_HOLD_OVERRIDDEN',
      'commission_hold',
      'tech-1',
      expect.objectContaining({ until: validBody.until, reason: validBody.reason }),
    );
    expect((res.jsonBody as { hold: unknown }).hold).toEqual(overriddenHold);
  });

  it('seeds a default hold when the technician exists but has never had one computed', async () => {
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: null, exists: true });
    vi.mocked(patchCommissionHold).mockResolvedValue('APPLIED');
    vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: overriddenHold, status: 'APPLIED' });

    const res = (await setCommissionHoldOverrideHandler(
      makeReq('tech-1', 'POST', validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(patchCommissionHold).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({
        outstandingPaise: 0,
        dueCount: 0,
        state: 'CLEAR',
        override: { until: validBody.until, byAdminId: 'admin-1', reason: validBody.reason },
      }),
      expect.any(String),
    );
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(readCommissionHold).mockRejectedValue(new Error('cosmos down'));

    const res = (await setCommissionHoldOverrideHandler(
      makeReq('tech-1', 'POST', validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});

describe('clearCommissionHoldOverrideHandler', () => {
  it('returns 404 when technician does not exist', async () => {
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: null, exists: false });

    const res = (await clearCommissionHoldOverrideHandler(
      makeReq('tech-missing', 'DELETE'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(404);
  });

  it('strips the override field, recomputes, audits, and returns the recomputed hold', async () => {
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: overriddenHold, exists: true });
    vi.mocked(patchCommissionHold).mockResolvedValue('APPLIED');
    vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: existingHold, status: 'APPLIED' });

    const res = (await clearCommissionHoldOverrideHandler(
      makeReq('tech-1', 'DELETE'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const patchedArg = vi.mocked(patchCommissionHold).mock.calls[0]![1] as Record<string, unknown>;
    expect(patchedArg['override']).toBeUndefined();
    expect(patchedArg['outstandingPaise']).toBe(overriddenHold.outstandingPaise);
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
    expect(auditLog).toHaveBeenCalledWith(
      ctx,
      'COMMISSION_HOLD_OVERRIDE_CLEARED',
      'commission_hold',
      'tech-1',
      expect.objectContaining({ clearedOverride: overriddenHold.override }),
    );
    expect((res.jsonBody as { hold: unknown }).hold).toEqual(existingHold);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: overriddenHold, exists: true });
    vi.mocked(patchCommissionHold).mockRejectedValue(new Error('cosmos down'));

    const res = (await clearCommissionHoldOverrideHandler(
      makeReq('tech-1', 'DELETE'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});
