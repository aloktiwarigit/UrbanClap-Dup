import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionReceivableRepo } from '../../../cosmos/commission-receivable-repository.js';
import {
  getTechniciansByIds,
  listAllTechniciansWithHold,
  readCommissionHold,
} from '../../../cosmos/technician-repository.js';
import { systemDocsRepo } from '../../../cosmos/system-docs-repository.js';
import { auditLog } from '../../../services/auditLog.service.js';
import { outstandingOf } from '../../../schemas/commission-receivable.js';

/** Dashboard page size (in-memory pagination over the full drained roster — see below). */
const DASHBOARD_PAGE_SIZE = 50;

/** Full-sweep cadence: the async hold-repair sweep re-evaluates every hold roughly every 6h, so a
 *  row's cached commissionHold should be treated as possibly-stale once this much time has
 *  elapsed since `evaluatedAt`. */
const HOLD_STALE_AFTER_MS = 6 * 60 * 60 * 1000;

/**
 * Decodes the dashboard's opaque `continuationToken` (base64 of a decimal offset) back into an
 * in-memory array offset. `undefined` (no token — first page) decodes to offset 0. Returns `null`
 * for anything that isn't a clean non-negative integer once decoded, so the handler can reject it
 * with 400 rather than silently clamping to some page.
 */
function decodeContinuationToken(token: string | undefined): number | null {
  if (token === undefined) return 0;
  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64').toString('utf8');
  } catch {
    return null;
  }
  if (!/^\d+$/.test(decoded)) return null;
  const offset = Number(decoded);
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : null;
}

/**
 * Hold-based admin dashboard (E21-S02 Task 10, replaces the E21-S01 DUE-count dashboard). Pages
 * in memory over the full drained roster (`listAllTechniciansWithHold`), sorted by
 * `outstandingPaise` desc, so ordering is stable and consistent across pages — a Cosmos-paged
 * query only sorts within its own page. `unreconciledTechnicianCount` is computed across the FULL
 * technician roster (not just this page) so an admin paging through never sees a count that
 * silently depends on which page they're looking at, and is a two-direction union: a DUE group
 * whose hold doesn't match, AND a cached hold with no matching DUE group at all (e.g. a hold
 * left over after every DUE row was waived/remitted elsewhere).
 */
export const adminCommissionReceivablesDashboardHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const continuationToken = req.query.get('continuationToken') ?? undefined;
  const offset = decodeContinuationToken(continuationToken);
  if (offset === null) {
    return { status: 400, jsonBody: { code: 'INVALID_CONTINUATION_TOKEN' } };
  }

  try {
    const [allWithHold, dueGroups] = await Promise.all([
      listAllTechniciansWithHold(),
      commissionReceivableRepo.sumDueGroupedByTechnician(),
    ]);

    const dueById = new Map(dueGroups.map((g) => [g.technicianId, g.outstandingPaise]));
    const holdById = new Map(allWithHold.map((t) => [t.id, t.commissionHold]));
    const unreconciled = new Set<string>();
    for (const g of dueGroups) {
      const h = holdById.get(g.technicianId);
      if (!h || h.outstandingPaise !== g.outstandingPaise) unreconciled.add(g.technicianId);
    }
    for (const t of allWithHold) {
      if (!dueById.has(t.id) && t.commissionHold.outstandingPaise !== 0) unreconciled.add(t.id);
    }
    const unreconciledTechnicianCount = unreconciled.size;

    const sorted = [...allWithHold].sort(
      (a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise,
    );
    const pageItems = sorted.slice(offset, offset + DASHBOARD_PAGE_SIZE);
    const nextOffset = offset + DASHBOARD_PAGE_SIZE;
    const hasMore = nextOffset < sorted.length;

    const relevant = pageItems.filter(
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
      staleAfter: new Date(new Date(t.commissionHold.evaluatedAt).getTime() + HOLD_STALE_AFTER_MS).toISOString(),
      ...(t.commissionHold.override !== undefined ? { override: t.commissionHold.override } : {}),
    }));
    const totalOutstanding = technicians.reduce((acc, t) => acc + t.outstandingPaise, 0);

    return {
      status: 200,
      jsonBody: {
        technicians,
        totalOutstanding,
        unreconciledTechnicianCount,
        ...(hasMore ? { continuationToken: Buffer.from(String(nextOffset)).toString('base64') } : {}),
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
