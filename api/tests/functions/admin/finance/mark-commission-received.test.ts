import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../../src/cosmos/audit-log-repository.js');
vi.mock('../../../../src/services/commission-hold.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { commissionReceivableRepo } from '../../../../src/cosmos/commission-receivable-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { recomputeCommissionHold } from '../../../../src/services/commission-hold.service.js';
import * as Sentry from '@sentry/node';
import { markCommissionReceivedHandler } from '../../../../src/functions/admin/finance/mark-commission-received.js';

const ctx = { adminId: 'admin-1', role: 'finance' as const, sessionId: 's1' };

const baseEntry = {
  id: 'booking-abc', bookingId: 'booking-abc', technicianId: 'tech-1', partitionKey: 'tech-1',
  serviceId: 'svc-1', categoryId: 'cat-1', bookingAmount: 50000, commissionBps: 2200,
  commissionDue: 11000, commissionResolvedFrom: 'GLOBAL' as const,
  createdAt: new Date().toISOString(),
};
const waivedEntry = { ...baseEntry, remittanceStatus: 'WAIVED' as const, waivedReason: 'customer dispute' };

const waivedResult = { entry: waivedEntry, wasApplied: true };

function makePostReq(body: unknown): HttpRequest {
  const req = new HttpRequest({
    url: 'http://localhost/api/v1/admin/finance/commission-receivables/settle',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(appendAuditEntry).mockResolvedValue(undefined);
  vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: null, status: 'MISSING' });
});

describe('markCommissionReceivedHandler', () => {
  describe('REMIT action', () => {
    it('returns 410 USE_COMMISSION_REMITTANCES and never touches the repository', async () => {
      const res = (await markCommissionReceivedHandler(
        makePostReq({
          action: 'REMIT',
          bookingId: 'booking-abc',
          technicianId: 'tech-1',
          remittedAmount: 11000,
          remittanceMethod: 'UPI',
          remittanceRef: 'upi-ref-1',
        }),
        {} as never,
        ctx,
      )) as HttpResponseInit;

      expect(res.status).toBe(410);
      expect((res.jsonBody as { code: string }).code).toBe('USE_COMMISSION_REMITTANCES');
      expect(commissionReceivableRepo.markWaived).not.toHaveBeenCalled();
      expect(appendAuditEntry).not.toHaveBeenCalled();
    });
  });

  describe('WAIVE action', () => {
    it('returns 200 and marks receivable as waived via markWaived', async () => {
      vi.mocked(commissionReceivableRepo.markWaived).mockResolvedValue(waivedResult);

      const res = (await markCommissionReceivedHandler(
        makePostReq({
          action: 'WAIVE',
          bookingId: 'booking-abc',
          technicianId: 'tech-1',
          waivedReason: 'customer dispute',
        }),
        {} as never,
        ctx,
      )) as HttpResponseInit;

      expect(res.status).toBe(200);
      expect(commissionReceivableRepo.markWaived).toHaveBeenCalledWith(
        'booking-abc',
        'tech-1',
        expect.objectContaining({ waivedReason: 'customer dispute', markedByAdminId: 'admin-1' }),
      );
    });

    it('audits COMMISSION_WAIVED and recomputes the hold when wasApplied=true', async () => {
      vi.mocked(commissionReceivableRepo.markWaived).mockResolvedValue(waivedResult);

      await markCommissionReceivedHandler(
        makePostReq({
          action: 'WAIVE', bookingId: 'booking-abc', technicianId: 'tech-1',
          waivedReason: 'dispute',
        }),
        {} as never,
        ctx,
      );

      expect(appendAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMMISSION_WAIVED' }),
      );
      expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
    });

    it('does not audit or recompute when wasApplied=false (already settled)', async () => {
      vi.mocked(commissionReceivableRepo.markWaived).mockResolvedValue({ entry: waivedEntry, wasApplied: false });

      await markCommissionReceivedHandler(
        makePostReq({
          action: 'WAIVE', bookingId: 'booking-abc', technicianId: 'tech-1',
          waivedReason: 'dispute',
        }),
        {} as never,
        ctx,
      );

      expect(appendAuditEntry).not.toHaveBeenCalled();
      expect(recomputeCommissionHold).not.toHaveBeenCalled();
    });

    it('a hold recompute failure after waive is Sentry-captured and does not fail the request', async () => {
      vi.mocked(commissionReceivableRepo.markWaived).mockResolvedValue(waivedResult);
      vi.mocked(recomputeCommissionHold).mockRejectedValue(new Error('cosmos timeout'));

      const res = (await markCommissionReceivedHandler(
        makePostReq({ action: 'WAIVE', bookingId: 'booking-abc', technicianId: 'tech-1', waivedReason: 'dispute' }),
        {} as never,
        ctx,
      )) as HttpResponseInit;

      expect(res.status).toBe(200);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('returns 404 when receivable not found', async () => {
      vi.mocked(commissionReceivableRepo.markWaived).mockResolvedValue(null);

      const res = (await markCommissionReceivedHandler(
        makePostReq({ action: 'WAIVE', bookingId: 'booking-abc', technicianId: 'tech-1', waivedReason: 'dispute' }),
        {} as never,
        ctx,
      )) as HttpResponseInit;

      expect(res.status).toBe(404);
      expect((res.jsonBody as { code: string }).code).toBe('RECEIVABLE_NOT_FOUND');
    });

    it('maps a thrown CONFLICT/PRECONDITION from markWaived to 409 LEDGER_BUSY', async () => {
      vi.mocked(commissionReceivableRepo.markWaived).mockRejectedValue(
        Object.assign(new Error('PRECONDITION'), { code: 'PRECONDITION' }),
      );

      const res = (await markCommissionReceivedHandler(
        makePostReq({ action: 'WAIVE', bookingId: 'booking-abc', technicianId: 'tech-1', waivedReason: 'dispute' }),
        {} as never,
        ctx,
      )) as HttpResponseInit;

      expect(res.status).toBe(409);
      expect((res.jsonBody as { code: string }).code).toBe('LEDGER_BUSY');
    });
  });

  it('returns 400 on validation error (missing required field)', async () => {
    const res = (await markCommissionReceivedHandler(
      makePostReq({ action: 'REMIT', bookingId: 'booking-abc' }), // missing technicianId etc.
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionReceivableRepo.markWaived).mockRejectedValue(new Error('cosmos exploded'));

    const res = (await markCommissionReceivedHandler(
      makePostReq({ action: 'WAIVE', bookingId: 'booking-abc', technicianId: 'tech-1', waivedReason: 'dispute' }),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
    expect((res.jsonBody as { code: string }).code).toBe('UPSTREAM_ERROR');
  });
});
