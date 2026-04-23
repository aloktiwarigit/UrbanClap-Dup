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

import { queryComplaints } from '../../../../src/cosmos/complaints-repository.js';
import { adminListComplaintsHandler } from '../../../../src/functions/admin/complaints/list.js';

function makeReq(query: Record<string, string> = {}): HttpRequest {
  const params = new URLSearchParams(query);
  return {
    query: { get: (k: string) => params.get(k), has: (k: string) => params.has(k) },
    headers: { get: (_k: string) => null },
  } as unknown as HttpRequest;
}
const mockCtx = {} as InvocationContext;
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

describe('adminListComplaintsHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with complaint list on valid request', async () => {
    (queryComplaints as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], total: 0, page: 1, pageSize: 50, totalPages: 0,
    });
    const res = await adminListComplaintsHandler(makeReq(), mockCtx, mockAdmin);
    expect(res.status).toBe(200);
  });

  it('passes status array to queryComplaints (comma-separated input)', async () => {
    (queryComplaints as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], total: 0, page: 1, pageSize: 50, totalPages: 0,
    });
    await adminListComplaintsHandler(makeReq({ status: 'NEW,INVESTIGATING' }), mockCtx, mockAdmin);
    const calledWith = (queryComplaints as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(calledWith.status).toEqual(['NEW', 'INVESTIGATING']);
  });

  it('passes assigneeAdminId filter', async () => {
    (queryComplaints as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], total: 0, page: 1, pageSize: 50, totalPages: 0,
    });
    await adminListComplaintsHandler(makeReq({ assigneeAdminId: 'admin_42' }), mockCtx, mockAdmin);
    const calledWith = (queryComplaints as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(calledWith.assigneeAdminId).toBe('admin_42');
  });

  it('returns 400 on validation error (non-numeric page)', async () => {
    const res = await adminListComplaintsHandler(makeReq({ page: 'notanumber' }), mockCtx, mockAdmin);
    expect(res.status).toBe(400);
  });
});
