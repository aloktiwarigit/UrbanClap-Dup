'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatINR } from '@/lib/format/intl';
import type { BalanceStack as BalanceStackData } from '@/lib/commissions/derive';

export interface BalanceStackProps {
  stack: BalanceStackData;
  // Money that passed through the technician's hands at the door — evidence for *why* a
  // commission exists, never a balance line. See the module doc below.
  cashCollectedPaise: number;
  // Number of cash jobs the cashCollectedPaise figure was collected across.
  jobCount: number;
}

/**
 * Renders the per-technician balance as an accounting stack (design doc §4): every line carries
 * its own sign, the total is stated, and nothing here can be mis-added because there is nothing
 * left for the reader to add themselves.
 *
 * Binding rule (task-7 brief, design doc §4): `cashCollectedPaise` and `creditAppliedPaise` must
 * never be read as summable, and cash collected is not a balance line at all — it is evidence for
 * why a commission exists. So this component renders two structurally separate regions:
 *
 *   - `data-testid="balance-stack"` — the accounting stack (due, payments, settled, total).
 *   - `data-testid="cash-context"` — a sibling section, never nested inside the stack, stating
 *     the cash collected and explicitly noting it is "not part of the balance".
 *
 * Two derivation facts this component must respect (task-7 brief):
 *   1. `stack.settledPaise` is signed and can be negative on a legacy over-settled row (a row
 *      remitted for more than it owed). It is rendered through `formatSubtractionLine`, which
 *      flips the displayed sign to '+' for a negative value rather than `Math.abs()`-ing it into
 *      looking like a positive deduction.
 *   2. `stack.creditAppliedPaise` is already folded into `stack.repaidPaise` by the server
 *      (`consumePendingCredits` allocates credit consumption with source `'REMITTANCE'`), so it
 *      is rendered only as an annotation on the payments line — never as a fourth subtracted row,
 *      which would double-count it.
 */
export function BalanceStack({ stack, cashCollectedPaise, jobCount }: BalanceStackProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();
  const { commissionDuePaise, repaidPaise, settledPaise, balancePaise, creditAppliedPaise } = stack;

  return (
    <>
      <section aria-labelledby="balance-stack-heading">
        <h2
          id="balance-stack-heading"
          className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)] mb-[var(--space-3)]"
        >
          {t('detail.balance.heading')}
        </h2>
        <dl data-testid="balance-stack" className="space-y-[var(--space-2)]">
          <div className="flex items-baseline justify-between gap-[var(--space-3)]">
            <dt className="text-[var(--color-text)]">{t('detail.balance.due')}</dt>
            <dd className="font-mono tabular-nums text-right text-[var(--color-text)]">
              {formatINR(commissionDuePaise, locale)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-[var(--space-3)]">
            <dt className="text-[var(--color-text)]">
              {t('detail.balance.repaid')}
              <span className="block text-xs text-[var(--color-text-muted)]">
                {t('detail.balance.creditAnnotation', {
                  amount: formatINR(creditAppliedPaise, locale),
                })}
              </span>
            </dt>
            <dd className="font-mono tabular-nums text-right text-[var(--color-text)]">
              {formatSubtractionLine(repaidPaise, locale)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-[var(--space-3)]">
            <dt className="text-[var(--color-text)]">{t('detail.balance.settled')}</dt>
            <dd className="font-mono tabular-nums text-right text-[var(--color-text)]">
              {formatSubtractionLine(settledPaise, locale)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-[var(--space-3)] border-t border-[var(--color-border)] pt-[var(--space-2)] font-semibold">
            <dt className="text-[var(--color-text)]">{t('detail.balance.total')}</dt>
            <dd className="font-mono tabular-nums text-right text-[var(--color-text)]">
              {formatINR(balancePaise, locale)}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="cash-context-heading" data-testid="cash-context">
        <h2
          id="cash-context-heading"
          className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)] mb-[var(--space-3)]"
        >
          {t('detail.cashContext.heading')}
        </h2>
        <p className="flex items-baseline justify-between gap-[var(--space-3)] text-[var(--color-text)]">
          <span>{t('detail.cashContext.line', { count: jobCount })}</span>
          <span className="font-mono tabular-nums text-right">
            {formatINR(cashCollectedPaise, locale)}
          </span>
        </p>
        <p className="mt-[var(--space-1)] text-xs text-[var(--color-text-muted)]">
          {`(${t('detail.cashContext.caveat')})`}
        </p>
      </section>
    </>
  );
}

/**
 * Formats a balance-stack subtraction line. `valuePaise` is the magnitude being subtracted from
 * the running total, not a pre-negated delta — a positive value renders as "− ₹X" (the normal
 * deduction case) and a negative value (a legacy over-settled row, see the module doc) renders as
 * "+ ₹X" rather than being `Math.abs()`-ed into looking like a positive deduction.
 */
function formatSubtractionLine(valuePaise: number, locale: string): string {
  const sign = valuePaise < 0 ? '+' : '−';
  return `${sign} ${formatINR(Math.abs(valuePaise), locale)}`;
}
