import { describe, it, expect } from 'vitest';
import {
  CommissionReceivableEntrySchema,
  MarkCommissionReceivedBodySchema,
  TechnicianOutstandingSummarySchema,
} from '../../src/schemas/commission-receivable.js';

const validEntry = {
  id: 'booking-1',
  bookingId: 'booking-1',
  technicianId: 'tech-1',
  partitionKey: 'tech-1',
  serviceId: 'ac-deep-clean',
  categoryId: 'ac-repair',
  bookingAmount: 59900,
  commissionBps: 2250,
  commissionDue: 13478,
  commissionResolvedFrom: 'SERVICE' as const,
  remittanceStatus: 'DUE' as const,
  createdAt: '2026-05-24T00:00:00.000Z',
};

describe('CommissionReceivableEntrySchema', () => {
  it('parses a valid DUE entry', () => {
    expect(() => CommissionReceivableEntrySchema.parse(validEntry)).not.toThrow();
  });

  it('parses a REMITTED entry with remittance fields', () => {
    expect(() =>
      CommissionReceivableEntrySchema.parse({
        ...validEntry,
        remittanceStatus: 'REMITTED',
        remittedAmount: 13478,
        remittedAt: '2026-05-25T00:00:00.000Z',
        remittanceRef: 'upi-txn-abc',
        remittanceMethod: 'UPI',
        markedByAdminId: 'admin-1',
        updatedAt: '2026-05-25T00:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it('rejects an unknown remittance status', () => {
    expect(() =>
      CommissionReceivableEntrySchema.parse({ ...validEntry, remittanceStatus: 'PAID' }),
    ).toThrow();
  });

  it('rejects commission bps out of range', () => {
    expect(() =>
      CommissionReceivableEntrySchema.parse({ ...validEntry, commissionBps: 100 }),
    ).toThrow();
  });

  it('rejects negative commissionDue', () => {
    expect(() =>
      CommissionReceivableEntrySchema.parse({ ...validEntry, commissionDue: -1 }),
    ).toThrow();
  });
});

describe('MarkCommissionReceivedBodySchema', () => {
  it('accepts a REMIT action', () => {
    expect(() =>
      MarkCommissionReceivedBodySchema.parse({
        action: 'REMIT',
        bookingId: 'booking-1',
        technicianId: 'tech-1',
        remittedAmount: 13478,
        remittanceMethod: 'UPI',
        remittanceRef: 'upi-txn-abc',
      }),
    ).not.toThrow();
  });

  it('accepts a WAIVE action', () => {
    expect(() =>
      MarkCommissionReceivedBodySchema.parse({
        action: 'WAIVE',
        bookingId: 'booking-1',
        technicianId: 'tech-1',
        waivedReason: 'goodwill — first job',
      }),
    ).not.toThrow();
  });

  it('rejects REMIT without a remittance ref', () => {
    expect(() =>
      MarkCommissionReceivedBodySchema.parse({
        action: 'REMIT',
        bookingId: 'booking-1',
        technicianId: 'tech-1',
        remittedAmount: 13478,
        remittanceMethod: 'UPI',
      }),
    ).toThrow();
  });

  it('rejects WAIVE without a reason', () => {
    expect(() =>
      MarkCommissionReceivedBodySchema.parse({
        action: 'WAIVE',
        bookingId: 'booking-1',
        technicianId: 'tech-1',
      }),
    ).toThrow();
  });

  it('rejects an unknown action', () => {
    expect(() =>
      MarkCommissionReceivedBodySchema.parse({ action: 'CANCEL', bookingId: 'b', technicianId: 't' }),
    ).toThrow();
  });
});

describe('TechnicianOutstandingSummarySchema', () => {
  it('parses a summary row', () => {
    expect(() =>
      TechnicianOutstandingSummarySchema.parse({
        technicianId: 'tech-1',
        technicianName: 'Ramesh',
        dueCount: 3,
        totalCommissionDue: 40000,
        oldestDueAt: '2026-05-20T00:00:00.000Z',
      }),
    ).not.toThrow();
  });
});
