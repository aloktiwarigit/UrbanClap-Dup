import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
  queryComplaints: vi.fn(),
  createComplaint: vi.fn(),
  getComplaint: vi.fn(),
  replaceComplaint: vi.fn(),
  getOverdueComplaints: vi.fn(),
  getRepeatOffenders: vi.fn(),
}));

vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn(),
  queryAuditLog: vi.fn(),
}));

import { createComplaint } from '../../../../src/cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { adminCreateComplaintHandler } from '../../../../src/functions/admin/complaints/create.js';

function makeReq(body: unknown = {}): HttpRequest {
  return {
    query: { get: (_k: string) => null, has: (_k: string) => false },
    headers: { get: (_k: string) => null },
    json: () => Promise.resolve(body),
  } as unknown as HttpRequest;
}
const mockCtx = {} as InvocationContext;
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

const validBody = {
  orderId: 'order_1',
  customerId: 'customer_1',
  technicianId: 'tech_1',
  description: 'This is a valid description with enough chars',
};

describe('adminCreateComplaintHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with created complaint', async () => {
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await adminCreateComplaintHandler(makeReq(validBody), mockCtx, mockAdmin);
    expect(res.status).toBe(201);
    expect(res.jsonBody).toMatchObject({
      orderId: 'order_1',
      customerId: 'customer_1',
      technicianId: 'tech_1',
    });
  });

  it('sets status=NEW, escalated=false, internalNotes=[] and slaDeadlineAt 48h from createdAt', async () => {
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const before = Date.now();
    const res = await adminCreateComplaintHandler(makeReq(validBody), mockCtx, mockAdmin);
    const after = Date.now();
    const doc = res.jsonBody as Record<string, unknown>;
    expect(doc['status']).toBe('NEW');
    expect(doc['escalated']).toBe(false);
    expect(doc['internalNotes']).toEqual([]);
    const createdAt = new Date(doc['createdAt'] as string).getTime();
    const slaDeadlineAt = new Date(doc['slaDeadlineAt'] as string).getTime();
    expect(createdAt).toBeGreaterThanOrEqual(before);
    expect(createdAt).toBeLessThanOrEqual(after);
    // slaDeadlineAt should be ~48h after createdAt (within a second of tolerance)
    expect(slaDeadlineAt - createdAt).toBeCloseTo(48 * 60 * 60 * 1000, -3);
  });

  it('returns 400 on validation error (description too short)', async () => {
    const res = await adminCreateComplaintHandler(
      makeReq({ ...validBody, description: 'short' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(400);
  });
});
