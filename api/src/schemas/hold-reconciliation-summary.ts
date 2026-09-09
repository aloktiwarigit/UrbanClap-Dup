/**
 * E21-S04 — `system/hold-reconciliation-summary`, written by the 15-minute reconciler and read
 * by the admin commission dashboard.
 *
 * Exists to close a parked Codex P2 from E21-S02 Task 10: the dashboard drained EVERY technician
 * hold document plus a cross-partition GROUP BY on every single request. Precomputing the same
 * aggregates on a fixed schedule is both cheaper and far more predictable.
 *
 * Not a Zod schema on the read path by design: this document is written by exactly one system
 * writer and the dashboard falls back to a live drain whenever it is missing, stale, or too
 * short — so a shape change degrades to the old behaviour rather than throwing (read-path
 * schemas only widen; see the #320 lesson).
 */
import type { HoldState } from './technician.js';

export const HOLD_RECONCILIATION_SUMMARY_DOC_ID = 'hold-reconciliation-summary';

/** Two dashboard pages at DASHBOARD_PAGE_SIZE = 50. Beyond this the dashboard drains live. */
export const HOLD_SUMMARY_TOP_N = 100;

export interface HoldSummaryRow {
  technicianId: string;
  technicianName?: string;
  outstandingPaise: number;
  dueCount: number;
  oldestDueAt?: string;
  state: HoldState;
  evaluatedAt: string;
  override?: { until: string; byAdminId: string; reason: string };
}

export interface HoldReconciliationSummaryDoc {
  id: typeof HOLD_RECONCILIATION_SUMMARY_DOC_ID;
  /** ISO. The dashboard treats the document as unusable once this is older than 45 minutes. */
  computedAt: string;
  /** Size of the FULL roster carrying a hold, not of `top`. */
  totalTechnicianCount: number;
  /** Dashboard-wide, page-independent total across the FULL roster. */
  totalOutstandingPaise: number;
  unreconciledTechnicianCount: number;
  topN: number;
  /** Sorted outstandingPaise DESC. The ordering IS the payload. */
  top: HoldSummaryRow[];
}
