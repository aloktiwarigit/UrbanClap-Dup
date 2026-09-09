'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDate } from '@/lib/format/intl';
import type { BalanceEvent } from '@/lib/commissions/derive';

export interface BalanceEventsProps {
  events: BalanceEvent[];
}

// How long the "Copied" confirmation stays on a reference's copy button before reverting to its
// resting label.
const COPIED_LABEL_MS = 2000;

/**
 * The chronological "balance events" table (design doc §4, "the dispute view"): one ledger with a
 * running balance so the owner can walk a technician's phone call through it line by line.
 *
 * Every row carries the booking id, the reference, and who recorded it, because at 11pm the owner
 * is reading a reference aloud down a phone line — so references are click-to-copy.
 */
export function BalanceEvents({ events }: BalanceEventsProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(ref: string, id: string) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ref);
      } else if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
        const textarea = document.createElement('textarea');
        textarea.value = ref;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } else {
        return;
      }
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, COPIED_LABEL_MS);
    } catch {
      // Clipboard write failed (denied permission, insecure context, no clipboard API at all).
      // The reference is still printed in the table for the owner to read aloud manually, so a
      // failed copy is a degraded convenience, not an error worth surfacing.
    }
  }

  if (events.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">{t('detail.events.empty')}</p>;
  }

  return (
    <section aria-labelledby="balance-events-heading">
      <h2
        id="balance-events-heading"
        className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)] mb-[var(--space-3)]"
      >
        {t('detail.events.heading')}
      </h2>
      <div className="overflow-x-auto rounded border border-[var(--color-border)]">
        <table className="w-full text-sm text-left text-[var(--color-text)]">
          <thead className="bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                {t('detail.events.columns.date')}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t('detail.events.columns.event')}
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-right">
                {t('detail.events.columns.change')}
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-right">
                {t('detail.events.columns.balance')}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t('detail.events.columns.recordedBy')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {events.map((event) => {
              // Bound to a local so the click closure below captures a plain `string` — narrowed
              // once here rather than cast (`as string`) at the closure's call site.
              const ref = event.ref;
              return (
                <tr key={event.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(event.at, locale)}</td>
                  <td className="px-3 py-2">
                    <span>{t(event.labelKey, event.labelParams)}</span>
                    {event.bookingId !== undefined && (
                      <span className="block font-mono text-xs text-[var(--color-text-muted)]">
                        {event.bookingId}
                      </span>
                    )}
                    {ref !== undefined && (
                      <span className="mt-[var(--space-1)] flex items-center gap-[var(--space-2)]">
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">
                          {ref}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(ref, event.id)}
                          className="text-xs text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]"
                        >
                          {copiedId === event.id
                            ? t('detail.events.copied')
                            : t('detail.events.copyReference')}
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {formatDelta(event.changePaise, locale)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {formatINR(event.balancePaise, locale)}
                  </td>
                  <td className="px-3 py-2">{event.actorId ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Formats a balance event's `changePaise` — already a signed delta against the running balance
 * (positive for a DUE event, negative for a REMITTANCE/CREDIT/WAIVER event) — as "+ ₹X" or
 * "− ₹X". Unlike `BalanceStack`'s subtraction-line formatter, the sign here is the delta itself,
 * not a magnitude being subtracted, so the polarity check is the mirror image of that helper's.
 */
function formatDelta(paise: number, locale: string): string {
  const sign = paise < 0 ? '−' : '+';
  return `${sign} ${formatINR(Math.abs(paise), locale)}`;
}
