'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDate, formatDateTime } from '@/lib/format/intl';

export interface SummaryBandProps {
  totalOutstanding: number;
  technicianCount: number;
  unreconciledTechnicianCount: number;
  oldestDueAt?: string;
  asOf?: string;
  // Whether `technicianCount`/`oldestDueAt`/`asOf` were computed over only the rows currently
  // loaded (a page) rather than the whole roster — true whenever more pages exist or a later page
  // is already loaded. `totalOutstanding` and `unreconciledTechnicianCount` are always
  // roster-wide (the server computes them over the full set before any sort/slice/filter), so
  // this flag deliberately does not affect their labels — only the per-page-derived figures need
  // a scope qualifier. Required (no default) so every call site has to make this call
  // deliberately, since silently defaulting it is exactly the class of bug this fixes.
  isPartial: boolean;
  onRecompute: () => void;
  canRecompute: boolean;
  recomputing?: boolean;
}

/**
 * The roll-up's summary band (design doc §3). Deliberately a band, not a card — a single hairline
 * rule beneath the headline row, no border box, no nesting (DESIGN.md forbids nested cards).
 *
 * Binding rule: every figure on this surface is a cache over the ledger, so the number stops
 * claiming to be the truth at the moment it stops being the truth. When
 * `unreconciledTechnicianCount > 0` the headline label switches from "Outstanding commission" to
 * "Cached total", and the reconciliation line becomes a `--color-warn` strip instead of a quiet
 * footnote.
 *
 * Second application of the same rule: `technicianCount`, `oldestDueAt`, and `asOf` are all
 * derived from whichever rows the caller currently has loaded, which is only the whole roster
 * when `isPartial` is false. Presenting a page-scoped count next to a roster-wide money figure
 * (`totalOutstanding`) without saying so would be exactly the "page-scoped figure presented as
 * roster-wide" defect this screen exists to prevent — so `isPartial` swaps each affected label for
 * an explicitly page-scoped one ("N technicians on this page" / "oldest on this page …") rather
 * than silently under-reporting.
 */
export function SummaryBand({
  totalOutstanding,
  technicianCount,
  unreconciledTechnicianCount,
  oldestDueAt,
  asOf,
  isPartial,
  onRecompute,
  canRecompute,
  recomputing = false,
}: SummaryBandProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();
  const isUnreconciled = unreconciledTechnicianCount > 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-[var(--space-3)] gap-y-[var(--space-1)]">
        <span className="text-sm text-[var(--color-text-muted)]">
          {isUnreconciled ? t('summaryBand.cachedTotal') : t('summaryBand.outstandingLabel')}
        </span>
        <span className="font-mono text-[length:var(--text-xl)] font-semibold tabular-nums text-[var(--color-text)]">
          {formatINR(totalOutstanding, locale)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {t(
            isPartial ? 'summaryBand.technicianCountPartial' : 'summaryBand.technicianCount',
            { count: technicianCount },
          )}
          {oldestDueAt !== undefined && (
            <>
              {' · '}
              {t(isPartial ? 'summaryBand.oldestPartial' : 'summaryBand.oldest', {
                date: formatDate(oldestDueAt, locale),
              })}
            </>
          )}
          {asOf !== undefined && (
            <>
              {' · '}
              {t(isPartial ? 'summaryBand.asOfPartial' : 'summaryBand.asOf', {
                date: formatDateTime(asOf, locale),
              })}
            </>
          )}
        </span>
      </div>

      <div
        role="presentation"
        className="my-[var(--space-3)] border-b border-[var(--color-border)]"
      />

      <div className="flex items-center justify-between gap-[var(--space-3)]">
        {/*
         * No `role="status"` here: the toast rendered by CommissionsClient already owns
         * `role="status"`/`role="alert"` for this screen, and a second simultaneous live region
         * makes screen readers announce both at once. This strip is static at mount (it doesn't
         * need an aria-live announcement of its own) — the warning colour alone carries the
         * urgency when unreconciled.
         */}
        <p
          className={
            isUnreconciled
              ? 'text-sm font-medium text-[var(--color-warn)]'
              : 'text-sm text-[var(--color-text-muted)]'
          }
        >
          {isUnreconciled
            ? t('summaryBand.unreconciled', { count: unreconciledTechnicianCount })
            : t('summaryBand.reconciled')}
        </p>
        {canRecompute && (
          <button
            type="button"
            onClick={onRecompute}
            disabled={recomputing}
            className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-medium disabled:opacity-40 shrink-0"
          >
            {t('summaryBand.recompute')}
          </button>
        )}
      </div>
    </div>
  );
}
