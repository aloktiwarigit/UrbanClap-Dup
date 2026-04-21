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

import { getComplaint, replaceComplaint } from '../../../../src/cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { adminPatchComplaintHandler } from '../../../../src/functions/admin/complaints/patch.js';

const existingComplaint = {
  id: 'complaint_1',
  orderId: 'order_1',
  customerId: 'customer_1',
  technicianId: 'tech_1',
  description: 'A valid complaint description here',
  status: 'NEW' as const,
  internalNotes: [],
  slaDeadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  escalated: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeReq(body: unknown = {}, id = 'complaint_1'): HttpRequest {
  return {
    query: { get: (_k: string) => null, has: (_k: string) => false },
    headers: { get: (_k: string) => null },
    json: () => Promise.resolve(body),
    params: { id },
  } as unknown as HttpRequest;
}
const mockCtx = {} as InvocationContext;
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

describe('adminPatchComplaintHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 on valid status transition', async () => {
    (getComplaint as ReturnType<typeof vi.fn>).mockResolvedValue({ doc: existingComplaint, etag: '"etag_1"' });
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await adminPatchComplaintHandler(
      makeReq({ status: 'INVESTIGATING' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as Record<string, unknown>)['status']).toBe('INVESTIGATING');
  });

  it('appends note to internalNotes when note provided', async () => {
    (getComplaint as ReturnType<typeof vi.fn>).mockResolvedValue({ doc: existingComplaint, etag: '"etag_1"' });
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await adminPatchComplaintHandler(
      makeReq({ note: 'Investigating the issue' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    const notes = (res.jsonBody as Record<string, unknown>)['internalNotes'] as Array<Record<string, unknown>>;
    expect(notes).toHaveLength(1);
    expect(notes[0]!['note']).toBe('Investigating the issue');
    expect(notes[0]!['adminId']).toBe('admin_1');
  });

  it('calls appendAuditEntry with COMPLAINT_STATUS_CHANGED on status change', async () => {
    (getComplaint as ReturnType<typeof vi.fn>).mockResolvedValue({ doc: existingComplaint, etag: '"etag_1"' });
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await adminPatchComplaintHandler(
      makeReq({ status: 'RESOLVED', resolutionCategory: 'OTHER' }),
      mockCtx,
      mockAdmin,
    );
    expect(appendAuditEntry).toHaveBeenCalledOnce();
    const auditCall = (appendAuditEntry as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(auditCall.action).toBe('COMPLAINT_STATUS_CHANGED');
    expect(auditCall.payload).toMatchObject({ from: 'NEW', to: 'RESOLVED' });
  });

  it('returns 400 when resolving without a resolutionCategory', async () => {
    (getComplaint as ReturnType<typeof vi.fn>).mockResolvedValue({ doc: existingComplaint, etag: '"etag_1"' });
    const res = await adminPatchComplaintHandler(
      makeReq({ status: 'RESOLVED' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(400);
    expect((res.jsonBody as Record<string, unknown>)['code']).toBe('RESOLUTION_CATEGORY_REQUIRED');
  });

  it('returns 409 when Cosmos ETag conflicts (concurrent update)', async () => {
    (getComplaint as ReturnType<typeof vi.fn>).mockResolvedValue({ doc: existingComplaint, etag: '"etag_1"' });
    const conflictErr = Object.assign(new Error('Precondition Failed'), { code: 412 });
    (replaceComplaint as ReturnType<typeof vi.fn>).mockRejectedValue(conflictErr);
    const res = await adminPatchComplaintHandler(
      makeReq({ status: 'INVESTIGATING' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(409);
    expect((res.jsonBody as Record<string, unknown>)['code']).toBe('CONFLICT');
  });

  it('returns 404 when complaint not found', async () => {
    (getComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await adminPatchComplaintHandler(
      makeReq({ status: 'INVESTIGATING' }, 'nonexistent'),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 on validation error (invalid status value)', async () => {
    const res = await adminPatchComplaintHandler(
      makeReq({ status: 'INVALID_STATUS' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(400);
  });

  it('calls appendAuditEntry with COMPLAINT_ASSIGNED on assigneeAdminId-only patch', async () => {
    (getComplaint as ReturnType<typeof vi.fn>).mockResolvedValue({ doc: existingComplaint, etag: '"etag_1"' });
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await adminPatchComplaintHandler(
      makeReq({ assigneeAdminId: 'admin_2' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect(appendAuditEntry).toHaveBeenCalledOnce();
    const auditCall = (appendAuditEntry as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(auditCall.action).toBe('COMPLAINT_ASSIGNED');
    expect(auditCall.payload).toMatchObject({ from: null, to: 'admin_2' });
  });
});
