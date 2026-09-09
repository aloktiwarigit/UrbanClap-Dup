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
import { buildHoldRoster } from '../../../services/commission-dashboard.service.js';
import { HOLD_SUMMARY_TOP_N, type HoldSummaryRow } from '../../../schemas/hold-reconciliation-summary.js';

/** Dashboard page size (in-memory pagination over the full drained roster — see below). */
const DASHBOARD_PAGE_SIZE = 50;

/** Full-sweep cadence: the E21-S04 reconciler re-evaluates every hold every 6th 15-minute run,
 *  i.e. every 90 minutes (trigger-reconcile-commission-holds.ts). A row's cached commissionHold
 *  should be treated as possibly-stale once this much time has elapsed since `evaluatedAt`. */
const HOLD_STALE_AFTER_MS = 90 * 60 * 1000;

/** The precomputed summary is unusable once it is older than 3 reconciler cycles. */
const SUMMARY_MAX_AGE_MS = 45 * 60 * 1000;

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
 * Hold-based admin dashboard (E21-S02 Task 10, replaces the E21-S01 DUE-count dashboard;
 * E21-S04 Task 10 adds the summary-first read path below). Pages in memory over the full roster,
 * sorted by `outstandingPaise` desc, so ordering is stable and consistent across pages — a
 * Cosmos-paged query only sorts within its own page. `unreconciledTechnicianCount` is computed
 * across the FULL technician roster (not just this page) so an admin paging through never sees a
 * count that silently depends on which page they're looking at, and is a two-direction union: a
 * DUE group whose hold doesn't match, AND a cached hold with no matching DUE group at all (e.g. a
 * hold left over after every DUE row was waived/remitted elsewhere).
 *
 * E21-S04: the roster is read from the precomputed `system/hold-reconciliation-summary` document
 * (written every 15 minutes by the reconciler) whenever it is usable, and only falls back to the
 * live drain (`listAllTechniciansWithHold` + `sumDueGroupedByTechnician`, reduced through the
 * shared `buildHoldRoster`) when the summary is:
 *   1. missing (`null`/`undefined`, or reading it threw),
 *   2. stale — older than `SUMMARY_MAX_AGE_MS` (45 min, 3 reconciler cycles), or
 *   3. too short for the requested page — the page's end offset exceeds the summary's `topN`.
 * Both paths route through `buildHoldRoster` so they can never disagree on the money shown, and
 * the response JSON shape is byte-for-byte identical regardless of which path served it.
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
    // E21-S04: prefer the precomputed summary the reconciler writes every 15 minutes. The
    // fallback below is the original E21-S02 behaviour and still runs whenever the summary is
    // missing, stale, or too short for the requested page — so this is a pure cost optimisation
    // with no change to the response shape. Truthiness (not `!== null`) gates every branch below
    // so an absent, `null`, or `undefined` summary all take the same explicit fallback path
    // rather than depending on a property access throwing into the catch.
    let rows: HoldSummaryRow[] | null = null;
    let totalOutstanding = 0;
    let unreconciledTechnicianCount = 0;

    try {
      const summary = await systemDocsRepo.getHoldReconciliationSummary();
      const fresh =
        !!summary && Date.now() - new Date(summary.computedAt).getTime() <= SUMMARY_MAX_AGE_MS;
      const coversPage =
        !!summary && offset + DASHBOARD_PAGE_SIZE <= (summary.topN ?? HOLD_SUMMARY_TOP_N);
      if (summary && fresh && coversPage) {
        rows = summary.top;
        totalOutstanding = summary.totalOutstandingPaise;
        unreconciledTechnicianCount = summary.unreconciledTechnicianCount;
      }
    } catch {
      // Fall through to the live drain.
    }

    if (rows === null) {
      const [allWithHold, dueGroups] = await Promise.all([
        listAllTechniciansWithHold(),
        commissionReceivableRepo.sumDueGroupedByTechnician(),
      ]);
      const roster = buildHoldRoster(allWithHold, dueGroups);
      rows = roster.rows;
      totalOutstanding = roster.totalOutstandingPaise;
      unreconciledTechnicianCount = roster.unreconciledTechnicianCount;
    }

    const pageItems = rows.slice(offset, offset + DASHBOARD_PAGE_SIZE);
    const nextOffset = offset + DASHBOARD_PAGE_SIZE;
    const hasMore = nextOffset < rows.length;

    const relevant = pageItems.filter((r) => r.outstandingPaise > 0 || r.state !== 'CLEAR');

    const missingName = relevant.filter((r) => r.technicianName === undefined).map((r) => r.technicianId);
    const techProfiles = missingName.length > 0 ? await getTechniciansByIds(missingName) : [];
    const nameById = new Map(
      techProfiles.map((t) => [t.technicianId || t.id, t.displayName || t.name]),
    );

    const technicians = relevant.map((r) => ({
      technicianId: r.technicianId,
      technicianName: r.technicianName ?? nameById.get(r.technicianId) ?? r.technicianId,
      outstandingPaise: r.outstandingPaise,
      dueCount: r.dueCount,
      ...(r.oldestDueAt !== undefined ? { oldestDueAt: r.oldestDueAt } : {}),
      state: r.state,
      evaluatedAt: r.evaluatedAt,
      staleAfter: new Date(new Date(r.evaluatedAt).getTime() + HOLD_STALE_AFTER_MS).toISOString(),
      ...(r.override !== undefined ? { override: r.override } : {}),
    }));

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
 *
 * `cashCollectedPaise` is derived from the technician's `receivables` — mirroring the
 * technician-facing sibling (`commission-view.service.ts`'s `cashCollectedPaise`) — NOT from
 * `remittances`. A remittance is money the technician pays back to the platform after the fact;
 * summing remittances here would report near-₹0 "collected at the door" for every technician
 * until they remit (remittances are commonly empty), and double-counts money once they do,
 * since the same cash then also reads out as a "payment applied" via `receivablesOut`.
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

    // Only a DUE row carries real outstanding balance — same guard as the technician-facing
    // view (commission-view.service.ts): WAIVED allocations are deliberately excluded from
    // remittedAmount, so a WAIVED row's outstandingOf() reads its full commissionDue as still
    // owed unless gated here; a REMITTED row is settled and must also read 0.
    const receivablesOut = receivables
      .map((r) => ({ ...r, outstandingPaise: r.remittanceStatus === 'DUE' ? outstandingOf(r) : 0 }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    const remittancesOut = [...remittances].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );

    const cashCollectedPaise = receivables.reduce(
      (sum, r) => sum + (r.cashCollectedAmount ?? r.bookingAmount),
      0,
    );
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
