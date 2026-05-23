'use client';

import { useTranslations } from 'next-intl';
import { formatPaise } from '@/api/finance';
import type { PayoutQueueEntry } from '@/api/finance';

interface Props {
  entries: PayoutQueueEntry[];
  totalNetPayable: number;
  onApproveAll: () => void;
  canApproveAll?: boolean;
}

export function PayoutQueueTable({
  entries,
  totalNetPayable,
  onApproveAll,
  canApproveAll = true,
}: Props) {
  const t = useTranslations('finance');
  return (
    <div>
      <div className="flex items-center justify-between mb-[var(--space-3)]">
        <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]">
          {t('payoutQueue.title', { total: formatPaise(totalNetPayable) })}
        </h2>
        {canApproveAll ? (
          <button
            onClick={onApproveAll}
            disabled={entries.length === 0}
            className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-medium disabled:opacity-40"
          >
            {t('buttons.approveAll')}
          </button>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">
            {t('permissions.approvalRestricted')}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">{t('emptyStates.noPayouts')}</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="pb-2 pr-4 font-medium">{t('payoutQueue.columns.technician')}</th>
              <th className="pb-2 pr-4 font-medium text-right">{t('payoutQueue.columns.jobs')}</th>
              <th className="pb-2 pr-4 font-medium text-right">{t('payoutQueue.columns.gross')}</th>
              <th className="pb-2 pr-4 font-medium text-right">{t('payoutQueue.columns.commission')}</th>
              <th className="pb-2 font-medium text-right">{t('payoutQueue.columns.netPayable')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.technicianId} className="border-b border-[var(--color-border)]">
                <td className="py-2 pr-4 text-[var(--color-text)]">{e.technicianName}</td>
                <td className="py-2 pr-4 text-right">{e.completedJobsThisWeek}</td>
                <td className="py-2 pr-4 text-right">{formatPaise(e.grossEarnings)}</td>
                <td className="py-2 pr-4 text-right text-[var(--color-warn)]">{formatPaise(e.commissionDeducted)}</td>
                <td className="py-2 text-right font-medium text-[var(--color-success)]">{formatPaise(e.netPayable)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
