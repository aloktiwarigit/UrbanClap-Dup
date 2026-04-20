'use client';

import { formatPaise } from '@/api/finance';
import type { PayoutQueueEntry } from '@/api/finance';

interface Props {
  entries: PayoutQueueEntry[];
  totalNetPayable: number;
  onApproveAll: () => void;
}

export function PayoutQueueTable({ entries, totalNetPayable, onApproveAll }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[var(--space-3)]">
        <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]">
          Payout Queue — {formatPaise(totalNetPayable)} total
        </h2>
        <button
          onClick={onApproveAll}
          disabled={entries.length === 0}
          className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-medium disabled:opacity-40"
        >
          Approve All
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No payouts due this week.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="pb-2 pr-4 font-medium">Technician</th>
              <th className="pb-2 pr-4 font-medium text-right">Jobs</th>
              <th className="pb-2 pr-4 font-medium text-right">Gross</th>
              <th className="pb-2 pr-4 font-medium text-right">Commission</th>
              <th className="pb-2 font-medium text-right">Net Payable</th>
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
