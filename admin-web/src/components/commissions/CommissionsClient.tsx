'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDate, formatDateTime } from '@/lib/format/intl';
import {
  fetchCommissionDashboard,
  recomputeAllHolds,
  type CommissionDashboard,
} from '@/api/commissions';
import { isStale } from '@/lib/commissions/derive';
import { hasCapability } from '@/admin/capabilities';
import { useAdminAuth } from '@/lib/auth/context';
import { useToast, ToastRegion } from '@/components/ui/Toast';
import { SummaryBand } from './SummaryBand';
import { HoldChip } from './HoldChip';
import { EmptyState } from '@/components/EmptyState';

export interface CommissionsClientProps {
  // Seeds initial state without the mount-time fetch — used by tests, and available for a future
  // SSR handoff. Fetches on mount only when this is omitted; it is never re-read after mount, so
  // changing it on a re-render (which does not happen from any current caller) would not refetch.
  initialData?: CommissionDashboard;
}

/**
 * The commission-console roll-up screen (design doc §3, task-6 brief). Owns all state; `page.tsx`
 * is a thin server component that only renders this.
 *
 * Binding rule: hold state is an eligibility filter, never a ranking input. Rows render in exactly
 * the order the server returns (outstanding-desc) — this component must never sort, filter-then-
 * reorder, or otherwise let `state` influence row order.
 */
export function CommissionsClient({ initialData }: CommissionsClientProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();
  const { auth } = useAdminAuth();
  // The recompute endpoint is requireAdmin(['super-admin']) only (E21-S03 plan). Gate on
  // settings.manage — the branch's existing super-admin-only capability, already used for the
  // hold-override controls — not finance.settleCommission, which the finance role also holds and
  // would surface a button the API always refuses for that role.
  const canRecompute = hasCapability(auth?.role, 'settings.manage');

  const [data, setData] = useState<CommissionDashboard | null>(initialData ?? null);
  const [loading, setLoading] = useState(initialData === undefined);
  const [error, setError] = useState<string | null>(null);
  const [continuationStack, setContinuationStack] = useState<string[]>([]);
  const [recomputing, setRecomputing] = useState(false);
  const { toast, show, dismiss } = useToast();

  const fetchPage = useCallback(
    async (continuationToken?: string) => {
      setLoading(true);
      setError(null);
      try {
        setData(await fetchCommissionDashboard(continuationToken));
      } catch {
        setError(t('errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (initialData === undefined) {
      void fetchPage();
    }
    // Mount-only: initialData is a one-time hydration seed, not a value this effect should react
    // to on every change (there is currently no caller that re-passes a different initialData).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNextPage() {
    if (!data?.continuationToken) return;
    const token = data.continuationToken;
    setContinuationStack((prev) => [...prev, token]);
    void fetchPage(token);
  }

  function handlePrevPage() {
    const stack = [...continuationStack];
    stack.pop();
    setContinuationStack(stack);
    void fetchPage(stack[stack.length - 1]);
  }

  async function handleRecompute() {
    setRecomputing(true);
    try {
      await recomputeAllHolds();
      show(t('messages.recomputeQueued'), 'success');
    } catch {
      show(t('errors.recomputeFailed'), 'error');
    } finally {
      setRecomputing(false);
    }
  }

  const rows = data?.technicians ?? [];

  // True whenever the rows currently loaded are not the whole roster: either more pages exist
  // (`data.continuationToken` set) or we've already paged forward past page 1 (`continuationStack`
  // non-empty — the last page of a multi-page roster has no `continuationToken` of its own, but
  // its loaded rows still exclude every earlier page). `totalOutstanding` and
  // `unreconciledTechnicianCount` are always roster-wide (server-computed over the full set before
  // any sort/slice/filter) regardless of this flag — only the page-derived figures below need it.
  const isPartial = data?.continuationToken !== undefined || continuationStack.length > 0;

  // Neither "oldest due" nor "as of" has a top-level field on the dashboard response — both are
  // derived client-side from whichever rows are currently loaded (oldest `oldestDueAt`, earliest
  // `evaluatedAt`, respectively). When `isPartial` is true these are page-scoped, not
  // roster-wide, and `SummaryBand` labels them accordingly rather than presenting a partial figure
  // as if it covered every technician.
  const oldestDueAt = rows.reduce<string | undefined>((oldest, row) => {
    if (row.oldestDueAt === undefined) return oldest;
    if (oldest === undefined) return row.oldestDueAt;
    return new Date(row.oldestDueAt).getTime() < new Date(oldest).getTime() ? row.oldestDueAt : oldest;
  }, undefined);
  const asOf = rows.reduce<string | undefined>((earliest, row) => {
    if (earliest === undefined) return row.evaluatedAt;
    return new Date(row.evaluatedAt).getTime() < new Date(earliest).getTime()
      ? row.evaluatedAt
      : earliest;
  }, undefined);

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-6)]">
      <div>
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">
          {t('title')}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-[var(--space-1)]">
          {t('subtitle')}
        </p>
      </div>

      <ToastRegion toast={toast} onDismiss={dismiss} />

      {data && (
        <SummaryBand
          totalOutstanding={data.totalOutstanding}
          technicianCount={rows.length}
          unreconciledTechnicianCount={data.unreconciledTechnicianCount}
          {...(oldestDueAt !== undefined ? { oldestDueAt } : {})}
          {...(asOf !== undefined ? { asOf } : {})}
          isPartial={isPartial}
          onRecompute={() => void handleRecompute()}
          canRecompute={canRecompute}
          recomputing={recomputing}
        />
      )}

      {loading && <p className="text-sm text-[var(--color-text-muted)]">{t('loading')}</p>}
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {!loading && data && rows.length === 0 && (
        <EmptyState
          eyebrow={t('emptyState.eyebrow')}
          headline={t('emptyState.headline')}
          copy={t('emptyState.copy')}
        />
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-[var(--color-border)]">
          <table className="w-full text-sm text-left text-[var(--color-text)]">
            <thead className="bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('table.columns.technician')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium text-right">
                  {t('table.columns.outstanding')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium text-right">
                  {t('table.columns.jobs')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('table.columns.oldestDue')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('table.columns.lastChecked')}
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {t('table.columns.state')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.map((row) => {
                const stale = isStale(row, new Date());
                return (
                  <tr key={row.technicianId} className="hover:bg-[var(--color-surface-alt)]">
                    <td className="px-3 py-2">
                      <Link
                        href={`/finance/commissions/${row.technicianId}`}
                        className="text-[var(--color-text)] hover:underline"
                        data-testid="commission-row-name"
                      >
                        {row.technicianName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {formatINR(row.outstandingPaise, locale)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{row.dueCount}</td>
                    <td className="px-3 py-2">
                      {row.oldestDueAt !== undefined ? formatDate(row.oldestDueAt, locale) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {formatDateTime(row.evaluatedAt, locale)}
                      {stale && (
                        <span className="ml-1 font-medium text-[var(--color-warn)]">
                          · {t('table.stale')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <HoldChip
                        state={row.state}
                        {...(row.override !== undefined ? { override: row.override } : {})}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-[var(--space-3)]">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={continuationStack.length === 0}
          className="px-3 py-1 text-sm rounded border border-[var(--color-border)] disabled:opacity-40"
        >
          {t('pagination.previous')}
        </button>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={!data?.continuationToken}
          className="px-3 py-1 text-sm rounded border border-[var(--color-border)] disabled:opacity-40"
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
}
