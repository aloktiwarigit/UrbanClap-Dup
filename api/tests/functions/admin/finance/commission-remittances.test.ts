import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../../src/cosmos/technician-repository.js');
vi.mock('../../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../../src/services/commission-allocator.service.js');
vi.mock('../../../../src/services/commission-hold.service.js');
vi.mock('../../../../src/services/auditLog.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { commissionReceivableRepo } from '../../../../src/cosmos/commission-receivable-repository.js';
import { readCommissionHold } from '../../../../src/cosmos/technician-repository.js';
import { systemDocsRepo } from '../../../../src/cosmos/system-docs-repository.js';
import { applyCredit } from '../../../../src/services/commission-allocator.service.js';
import { recomputeCommissionHold } from '../../../../src/services/commission-hold.service.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import * as Sentry from '@sentry/node';
import { recordCommissionRemittanceHandler } from '../../../../src/functions/admin/finance/commission-remittances.js';

const ctx = { adminId: 'admin-1', role: 'finance' as const, sessionId: 's1' };

const sampleHold = {
  outstandingPaise: 5000,
  dueCount: 1,
  state: 'WARN' as const,
  evaluatedAt: '2026-09-01T00:00:00.000Z',
};

const sampleRemittance = {
  id: 'rem:key-1-abcdef',
  docType: 'REMITTANCE' as const,
  technicianId: 'tech-1',
  partitionKey: 'tech-1',
  amountPaise: 10000,
  method: 'UPI' as const,
  ref: 'upi-ref-1',
  allocations: [{ bookingId: 'booking-1', paise: 10000 }],
  creditCreatedPaise: 0,
  recordedByAdminId: 'admin-1',
  idempotencyKey: 'key-1-abcdef',
  createdAt: '2026-09-01T00:00:00.000Z',
};

function makeReq(body: unknown): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/finance/commission-remittances',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

const validBody = {
  technicianId: 'tech-1',
  amountPaise: 10000,
  method: 'UPI' as const,
  ref: 'upi-ref-1',
  idempotencyKey: 'key-1-abcdef',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auditLog).mockResolvedValue(undefined);
  vi.mocked(systemDocsRepo.enqueueHoldRepair).mockResolvedValue(undefined);
});

describe('recordCommissionRemittanceHandler', () => {
  it('returns 400 VALIDATION_ERROR when body fails schema', async () => {
    const res = (await recordCommissionRemittanceHandler(
      makeReq({ technicianId: 'tech-1' }),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
    expect(applyCredit).not.toHaveBeenCalled();
  });

  it('returns 400 PARSE_ERROR on invalid JSON body', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/admin/finance/commission-remittances',
      method: 'POST',
      body: { string: 'not-json{' },
      headers: { 'content-type': 'application/json' },
    });

    const res = (await recordCommissionRemittanceHandler(req, {} as never, ctx)) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('PARSE_ERROR');
  });

  it('happy path: builds the deterministic anchor and applies credit, then audits (not replayed)', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance)
      .mockResolvedValueOnce(null) // pre-check: no existing remittance
      .mockResolvedValueOnce(sampleRemittance as never); // post-applyCredit re-read
    vi.mocked(applyCredit).mockResolvedValue({
      replayed: false,
      anchorId: 'rem:key-1-abcdef',
      allocations: [{ bookingId: 'booking-1', paise: 10000 }],
      creditCreatedPaise: 0,
    });
    vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: sampleHold, status: 'APPLIED' });

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(applyCredit).toHaveBeenCalledWith(
      expect.objectContaining({
        technicianId: 'tech-1',
        refId: 'rem:key-1-abcdef',
        source: 'REMITTANCE',
        paise: 10000,
        byId: 'admin-1',
        anchor: expect.objectContaining({ id: 'rem:key-1-abcdef', build: expect.any(Function) }),
      }),
    );

    // Exercise the anchor's build() the way applyCredit would, to verify its shape.
    const call = vi.mocked(applyCredit).mock.calls[0]![0];
    const built = call.anchor.build({ allocations: [{ bookingId: 'booking-1', paise: 10000 }], leftoverPaise: 0 });
    expect(built).toMatchObject({
      id: 'rem:key-1-abcdef',
      docType: 'REMITTANCE',
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      amountPaise: 10000,
      method: 'UPI',
      ref: 'upi-ref-1',
      allocations: [{ bookingId: 'booking-1', paise: 10000 }],
      creditCreatedPaise: 0,
      recordedByAdminId: 'admin-1',
      idempotencyKey: 'key-1-abcdef',
    });

    const body = res.jsonBody as {
      remittance: unknown;
      allocations: unknown;
      creditCreatedPaise: number;
      hold: unknown;
      holdRecomputePending: boolean;
      replayed: boolean;
    };
    expect(body.remittance).toEqual(sampleRemittance);
    expect(body.creditCreatedPaise).toBe(0);
    expect(body.hold).toEqual(sampleHold);
    expect(body.holdRecomputePending).toBe(false);
    expect(body.replayed).toBe(false);

    expect(auditLog).toHaveBeenCalledWith(
      ctx,
      'COMMISSION_REMITTANCE_RECORDED',
      'commission_remittance',
      'rem:key-1-abcdef',
      expect.objectContaining({
        technicianId: 'tech-1',
        amountPaise: 10000,
        method: 'UPI',
        ref: 'upi-ref-1',
        allocations: [{ bookingId: 'booking-1', paise: 10000 }],
        creditCreatedPaise: 0,
      }),
    );
  });

  it('replay (found via top-level getRemittance): returns stored remittance with replayed=true and does not audit or call applyCredit', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance).mockResolvedValue(sampleRemittance as never);
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: sampleHold, exists: true });

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { replayed: boolean; holdRecomputePending: boolean; hold: unknown };
    expect(body.replayed).toBe(true);
    expect(body.holdRecomputePending).toBe(false);
    expect(body.hold).toEqual(sampleHold);
    expect(applyCredit).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });

  it('replay (race detected inside applyCredit): does not audit, reads back the stored remittance', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(sampleRemittance as never);
    vi.mocked(applyCredit).mockResolvedValue({ replayed: true, anchorId: 'rem:key-1-abcdef' });
    vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: sampleHold, status: 'APPLIED' });

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { replayed: boolean; allocations: unknown; creditCreatedPaise: number };
    expect(body.replayed).toBe(true);
    expect(body.allocations).toEqual(sampleRemittance.allocations);
    expect(body.creditCreatedPaise).toBe(sampleRemittance.creditCreatedPaise);
    expect(auditLog).not.toHaveBeenCalled();
  });

  it('maps thrown IDEMPOTENCY_MISMATCH to 409', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance).mockResolvedValue(null);
    vi.mocked(applyCredit).mockRejectedValue(Object.assign(new Error('mismatch'), { code: 'IDEMPOTENCY_MISMATCH' }));

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('IDEMPOTENCY_MISMATCH');
  });

  it('maps thrown PRECONDITION to 409 LEDGER_BUSY', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance).mockResolvedValue(null);
    vi.mocked(applyCredit).mockRejectedValue(Object.assign(new Error('busy'), { code: 'PRECONDITION' }));

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('LEDGER_BUSY');
  });

  it('maps any other thrown error to 502 UPSTREAM_ERROR', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance).mockResolvedValue(null);
    vi.mocked(applyCredit).mockRejectedValue(new Error('cosmos exploded'));

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
    expect((res.jsonBody as { code: string }).code).toBe('UPSTREAM_ERROR');
  });

  it('hold recompute failure: holdRecomputePending=true, hold=null, queues repair, still returns 200 and audits', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(sampleRemittance as never);
    vi.mocked(applyCredit).mockResolvedValue({
      replayed: false,
      anchorId: 'rem:key-1-abcdef',
      allocations: [{ bookingId: 'booking-1', paise: 10000 }],
      creditCreatedPaise: 0,
    });
    vi.mocked(recomputeCommissionHold).mockRejectedValue(new Error('cosmos timeout'));

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { hold: unknown; holdRecomputePending: boolean };
    expect(body.hold).toBeNull();
    expect(body.holdRecomputePending).toBe(true);
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith(['tech-1']);
    // Not replayed, so the audit must still be written even though the hold recompute failed.
    expect(auditLog).toHaveBeenCalledWith(
      ctx,
      'COMMISSION_REMITTANCE_RECORDED',
      'commission_remittance',
      'rem:key-1-abcdef',
      expect.anything(),
    );
  });

  it('returns 502 when the post-applyCredit getRemittance re-read comes back null', async () => {
    vi.mocked(commissionReceivableRepo.getRemittance)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vi.mocked(applyCredit).mockResolvedValue({
      replayed: false,
      anchorId: 'rem:key-1-abcdef',
      allocations: [],
      creditCreatedPaise: 10000,
    });
    vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: sampleHold, status: 'APPLIED' });

    const res = (await recordCommissionRemittanceHandler(
      makeReq(validBody),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
    expect((res.jsonBody as { code: string }).code).toBe('UPSTREAM_ERROR');
    expect(auditLog).not.toHaveBeenCalled();
  });
});
