import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionReceivableRepo } from '../../../cosmos/commission-receivable-repository.js';
import {
  getTechniciansByIds,
  listTechniciansWithHold,
  listAllTechniciansWithHold,
  readCommissionHold,
} from '../../../cosmos/technician-repository.js';
import { systemDocsRepo } from '../../../cosmos/system-docs-repository.js';
import { auditLog } from '../../../services/auditLog.service.js';
import { outstandingOf } from '../../../schemas/commission-receivable.js';

/**
 * Hold-based admin dashboard (E21-S02 Task 10, replaces the E21-S01 DUE-count dashboard). One
 * page of technicians currently carrying a commissionHold, filtered to those actually worth an
 * admin's attention (non-zero outstanding or a non-CLEAR state). `unreconciledTechnicianCount` is
 * computed across the FULL technician roster (not just this page) so an admin paging through
 * never sees a count that silently depends on which page they're looking at.
 */
export const adminCommissionReceivablesDashboardHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const continuationToken = req.query.get('continuationToken') ?? undefined;

  try {
    const [page, allWithHold, dueGroups] = await Promise.all([
      listTechniciansWithHold(continuationToken),
      listAllTechniciansWithHold(),
      commissionReceivableRepo.sumDueGroupedByTechnician(),
    ]);

    const holdById = new Map(allWithHold.map((t) => [t.id, t.commissionHold]));
    const unreconciledTechnicianCount = dueGroups.filter((g) => {
      const h = holdById.get(g.technicianId);
      return !h || h.outstandingPaise !== g.outstandingPaise;
    }).length;

    const relevant = page.items.filter(
      (t) => t.commissionHold.outstandingPaise > 0 || t.commissionHold.state !== 'CLEAR',
    );

    const techProfiles = relevant.length > 0 ? await getTechniciansByIds(relevant.map((t) => t.id)) : [];
    const nameById = new Map(
      techProfiles.map((t) => [t.technicianId || t.id, t.displayName || t.name]),
    );

    const technicians = relevant.map((t) => ({
      technicianId: t.id,
      technicianName: nameById.get(t.id) ?? t.name ?? t.id,
      outstandingPaise: t.commissionHold.outstandingPaise,
      dueCount: t.commissionHold.dueCount,
      ...(t.commissionHold.oldestDueAt !== undefined ? { oldestDueAt: t.commissionHold.oldestDueAt } : {}),
      state: t.commissionHold.state,
      evaluatedAt: t.commissionHold.evaluatedAt,
      ...(t.commissionHold.override !== undefined ? { override: t.commissionHold.override } : {}),
    }));
    const totalOutstanding = technicians.reduce((acc, t) => acc + t.outstandingPaise, 0);

    return {
      status: 200,
      jsonBody: {
        technicians,
        totalOutstanding,
        unreconciledTechnicianCount,
        ...(page.continuationToken !== undefined ? { continuationToken: page.continuationToken } : {}),
      },
    };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

/**
 * Full ledger detail for one technician (E21-S02 Task 10). `cashCollectedPaise` and
 * `creditAppliedPaise` are reported separately and are NEVER summed — cash is money that changed
 * hands at the door; credit is commission offset via an incentive, a wholly different flow.
 */
export const adminCommissionReceivablesPerTechHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const technicianId = (req as unknown as { params: { technicianId: string } }).params.technicianId;
  if (!technicianId) return { status: 400, jsonBody: { code: 'MISSING_TECHNICIAN_ID' } };

  try {
    const [{ receivables, remittances, credits }, { hold }] = await Promise.all([
      commissionReceivableRepo.listLedger(technicianId),
      readCommissionHold(technicianId),
    ]);

    const receivablesOut = receivables
      .map((r) => ({ ...r, outstandingPaise: outstandingOf(r) }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    const remittancesOut = [...remittances].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );

    const cashCollectedPaise = remittances.reduce((sum, r) => sum + r.amountPaise, 0);
    const creditAppliedPaise = receivables.reduce(
      (sum, r) =>
        sum + (r.allocations ?? []).filter((a) => a.source === 'INCENTIVE').reduce((s, a) => s + a.paise, 0),
      0,
    );

    return {
      status: 200,
      jsonBody: {
        technicianId,
        hold,
        receivables: receivablesOut,
        remittances: remittancesOut,
        credits,
        cashCollectedPaise,
        creditAppliedPaise,
      },
    };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

/** Enqueues a full hold-repair sweep across every technician (E21-S02 Task 10, super-admin only). */
export const adminCommissionReceivablesRecomputeHandler: AdminHttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  try {
    await systemDocsRepo.enqueueHoldRepair('ALL');
    await auditLog(admin, 'COMMISSION_HOLD_RECOMPUTE_REQUESTED', 'commission_hold', 'ALL', {});
    return { status: 202, jsonBody: { queued: true } };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('adminCommissionReceivablesDashboard', {
  methods: ['GET'],
  route: 'v1/admin/finance/commission-receivables',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance', 'ops-manager'])(adminCommissionReceivablesDashboardHandler),
});

app.http('adminCommissionReceivablesPerTech', {
  methods: ['GET'],
  route: 'v1/admin/finance/commission-receivables/{technicianId}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance', 'ops-manager'])(adminCommissionReceivablesPerTechHandler),
});

app.http('adminCommissionReceivablesRecompute', {
  methods: ['POST'],
  route: 'v1/admin/finance/commission-receivables/recompute',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(adminCommissionReceivablesRecomputeHandler),
});
