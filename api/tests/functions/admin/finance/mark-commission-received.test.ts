import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../../src/cosmos/audit-log-repository.js');

import { commissionReceivableRepo } from '../../../../src/cosmos/commission-receivable-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { markCommissionReceivedHandler } from '../../../../src/functions/admin/finance/mark-commission-received.js';

const ctx = { adminId: 'admin-1', role: 'finance' as const, sessionId: 's1' };

const baseEntry = {
  id: 'booking-abc', bookingId: 'booking-abc', technicianId: 'tech-1', partitionKey: 'tech-1',
  serviceId: 'svc-1', categoryId: 'cat-1', bookingAmount: 50000, commissionBps: 2200,
  commissionDue: 11000, commissionResolvedFrom: 'GLOBAL' as const,
  createdAt: new Date().toISOString(),
};
const remittedEntry = {
  ...baseEntry, remittanceStatus: 'REMITTED' as const,
  remittedAmount: 11000, remittedAt: new Date().toISOString(), remittanceMethod: 'UPI' as const,
  remittanceRef: 'upi-ref-1', markedByAdminId: 'admin-1',
};
const waivedEntry = { ...baseEntry, remittanceStatus: 'WAIVED' as const, waivedReason: 'customer dispute' };

const remittedResult = { entry: remittedEntry, wasApplied: true };
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
});

describe('markCommissionReceivedHandler', () => {
  describe('REMIT action', () => {
    // E21-S02 Task 10 rewrites this handler
    it.todo('returns 200 and marks receivable as remitted');

    // E21-S02 Task 10 rewrites this handler
    it.todo('audits COMMISSION_REMITTED when wasApplied=true');

    // E21-S02 Task 10 rewrites this handler
    it.todo('does not audit when wasApplied=false (already settled)');

    // E21-S02 Task 10 rewrites this handler
    it.todo('returns 422 when remittedAmount is below commissionDue');

    // E21-S02 Task 10 rewrites this handler
    it.todo('returns 404 when receivable not found');
  });

  describe('WAIVE action', () => {
    it('returns 200 and marks receivable as waived', async () => {
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

    it('audits COMMISSION_WAIVED when wasApplied=true', async () => {
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
    });

    it('does not audit when wasApplied=false (already settled)', async () => {
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

  // E21-S02 Task 10 rewrites this handler
  it.todo('returns 502 on upstream error');
});
