import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

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

import { getOverdueComplaints, replaceComplaint } from '../../../../src/cosmos/complaints-repository.js';
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
  beforeEach(() => vi.clearAllMocks());

  it('sets escalated=true on each overdue complaint and calls replaceComplaint', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([{ ...overdueComplaint }]);
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).toHaveBeenCalledOnce();
    const replacedDoc = (replaceComplaint as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(replacedDoc.escalated).toBe(true);
  });

  it('calls appendAuditEntry with SLA_BREACH for each breach', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...overdueComplaint },
      { ...overdueComplaint, id: 'complaint_overdue_2' },
    ]);
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(appendAuditEntry).toHaveBeenCalledTimes(2);
    const auditCalls = (appendAuditEntry as ReturnType<typeof vi.fn>).mock.calls;
    expect(auditCalls[0]![0]!.action).toBe('SLA_BREACH');
    expect(auditCalls[1]![0]!.action).toBe('SLA_BREACH');
  });

  it('does nothing when no overdue complaints', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).not.toHaveBeenCalled();
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });
});
