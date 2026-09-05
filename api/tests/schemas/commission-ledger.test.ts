import { describe, it, expect } from 'vitest';
import { CommissionReceivableEntrySchema, outstandingOf } from '../../src/schemas/commission-receivable.js';
import { LedgerDocSchema, RemittanceDocSchema, CreditDocSchema, RecordRemittanceBodySchema } from '../../src/schemas/commission-ledger.js';

const legacy = {
  id: 'bk-1', bookingId: 'bk-1', technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c',
  bookingAmount: 99900, commissionBps: 2200, commissionDue: 21978, commissionResolvedFrom: 'GLOBAL',
  remittanceStatus: 'DUE', createdAt: '2026-09-01T00:00:00.000Z',
};

describe('ledger schemas', () => {
  it('parses an E21-S01-shaped receivable with no docType and treats it as RECEIVABLE', () => {
    const r = LedgerDocSchema.parse(legacy);
    expect(r.docType).toBe('RECEIVABLE');
  });
  it('outstandingOf derives from remittedAmount and never goes negative', () => {
    expect(outstandingOf(CommissionReceivableEntrySchema.parse(legacy))).toBe(21978);
    expect(outstandingOf(CommissionReceivableEntrySchema.parse({ ...legacy, remittedAmount: 30000 }))).toBe(0);
  });
  it('parses remittance and credit docs', () => {
    expect(RemittanceDocSchema.parse({
      id: 'rem:k1', docType: 'REMITTANCE', technicianId: 't1', partitionKey: 't1', amountPaise: 5000,
      method: 'UPI', ref: 'utr-1', allocations: [{ bookingId: 'bk-1', paise: 5000 }], creditCreatedPaise: 0,
      recordedByAdminId: 'a1', idempotencyKey: 'k1', createdAt: '2026-09-05T00:00:00.000Z',
    }).docType).toBe('REMITTANCE');
    expect(CreditDocSchema.parse({
      id: 'cr:rem:k1', docType: 'CREDIT', technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT',
      refId: 'rem:k1', originalPaise: 700, remainingPaise: 700, consumedBy: [], createdAt: '2026-09-05T00:00:00.000Z',
    }).remainingPaise).toBe(700);
  });
  it('rejects a remittance body with a bad idempotency key or ADJUSTMENT method', () => {
    expect(RecordRemittanceBodySchema.safeParse({ technicianId: 't1', amountPaise: 1, method: 'UPI', ref: 'x', idempotencyKey: 'short' }).success).toBe(false);
    expect(RecordRemittanceBodySchema.safeParse({ technicianId: 't1', amountPaise: 1, method: 'ADJUSTMENT', ref: 'x', idempotencyKey: 'abcdefgh-1' }).success).toBe(false);
    expect(RecordRemittanceBodySchema.safeParse({ technicianId: 't1', amountPaise: 1, method: 'CASH_DEPOSIT', ref: 'x', idempotencyKey: 'abcdefgh-1' }).success).toBe(true);
  });
});
