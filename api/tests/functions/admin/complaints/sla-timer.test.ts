import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
  queryComplaints: vi.fn(),
  createComplaint: vi.fn(),
  getComplaint: vi.fn(),
  replaceComplaint: vi.fn(),
  getOverdueComplaints: vi.fn(),
  getRepeatOffenders: vi.fn(),
  getUnacknowledgedPastDueComplaints: vi.fn(),
}));

vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn(),
  queryAuditLog: vi.fn(),
}));

import { getOverdueComplaints, replaceComplaint, getUnacknowledgedPastDueComplaints } from '../../../../src/cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { slaBreachTimerHandler } from '../../../../src/functions/admin/complaints/sla-timer.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

const overdueComplaint = {
  id: 'complaint_overdue_1',
  orderId: 'order_1',
  customerId: 'customer_1',
  technicianId: 'tech_1',
  description: 'A valid complaint description here',
  status: 'NEW' as const,
  internalNotes: [],
  slaDeadlineAt: new Date(Date.now() - 1000).toISOString(), // 1 second past
  escalated: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('slaBreachTimerHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no unacknowledged-past-due complaints unless overridden per test
    (getUnacknowledgedPastDueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('sets escalated=true on each overdue complaint and calls replaceComplaint with etag', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { doc: overdueComplaint, etag: '"etag_1"' },
    ]);
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).toHaveBeenCalledOnce();
    const [replacedDoc, passedEtag] = (replaceComplaint as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(replacedDoc.escalated).toBe(true);
    expect(passedEtag).toBe('"etag_1"');
  });

  it('calls appendAuditEntry with SLA_BREACH for each breach', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { doc: overdueComplaint, etag: '"etag_1"' },
      { doc: { ...overdueComplaint, id: 'complaint_overdue_2' }, etag: '"etag_2"' },
    ]);
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(appendAuditEntry).toHaveBeenCalledTimes(2);
    const auditCalls = (appendAuditEntry as ReturnType<typeof vi.fn>).mock.calls;
    expect(auditCalls[0]![0]!.action).toBe('SLA_BREACH');
    expect(auditCalls[1]![0]!.action).toBe('SLA_BREACH');
  });

  it('skips a conflicting complaint and continues the sweep', async () => {
    const conflictErr = Object.assign(new Error('Precondition Failed'), { code: 412 });
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { doc: overdueComplaint, etag: '"etag_1"' },
      { doc: { ...overdueComplaint, id: 'complaint_overdue_2' }, etag: '"etag_2"' },
    ]);
    (replaceComplaint as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(conflictErr)
      .mockResolvedValueOnce(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).toHaveBeenCalledTimes(2);
    // First complaint conflicted — no audit entry for it; second succeeded — one entry
    expect(appendAuditEntry).toHaveBeenCalledOnce();
  });

  it('does nothing when no overdue complaints', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).not.toHaveBeenCalled();
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('escalates acknowledge-past-due complaint and logs SLA_BREACH_ACK audit action', async () => {
    const ackOverdueComplaint = {
      ...overdueComplaint,
      id: 'c-ack-1',
      slaDeadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      acknowledgeDeadlineAt: new Date(Date.now() - 1000).toISOString(),
      filedBy: 'CUSTOMER' as const,
    };
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getUnacknowledgedPastDueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { doc: ackOverdueComplaint, etag: '"ack-etag-1"' },
    ]);
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).toHaveBeenCalledOnce();
    const [replacedDoc, passedEtag] = (replaceComplaint as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(replacedDoc.escalated).toBe(true);
    expect(passedEtag).toBe('"ack-etag-1"');
    expect(appendAuditEntry).toHaveBeenCalledOnce();
    const auditCall = (appendAuditEntry as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(auditCall.action).toBe('SLA_BREACH_ACK');
  });

  it('runs both resolve-breach and ack-breach sweeps in parallel', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { doc: overdueComplaint, etag: '"etag-resolve"' },
    ]);
    (getUnacknowledgedPastDueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { doc: { ...overdueComplaint, id: 'c-ack-2', acknowledgeDeadlineAt: new Date(Date.now() - 500).toISOString() }, etag: '"etag-ack"' },
    ]);
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).toHaveBeenCalledTimes(2);
    const auditActions = (appendAuditEntry as ReturnType<typeof vi.fn>).mock.calls.map(
      (call) => (call[0] as { action: string }).action,
    );
    expect(auditActions).toContain('SLA_BREACH');
    expect(auditActions).toContain('SLA_BREACH_ACK');
  });
});
