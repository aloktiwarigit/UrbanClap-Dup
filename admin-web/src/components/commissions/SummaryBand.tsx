'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDate } from '@/lib/format/intl';

export interface SummaryBandProps {
  totalOutstanding: number;
  technicianCount: number;
  unreconciledTechnicianCount: number;
  oldestDueAt?: string;
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
 */
export function SummaryBand({
  totalOutstanding,
  technicianCount,
  unreconciledTechnicianCount,
  oldestDueAt,
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
          {t('summaryBand.technicianCount', { count: technicianCount })}
          {oldestDueAt !== undefined && (
            <> · {t('summaryBand.oldest', { date: formatDate(oldestDueAt, locale) })}</>
          )}
        </span>
      </div>

      <div
        role="presentation"
        className="my-[var(--space-3)] border-b border-[var(--color-border)]"
      />

      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <p
          role="status"
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
