'use client';

import { formatPaise } from '@/api/finance';

interface Props {
  totalNetPayable: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function ApproveAllModal({ totalNetPayable, onConfirm, onCancel, loading }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-sm rounded-lg bg-[var(--color-surface)] p-[var(--space-6)] shadow-xl">
        <h2
          id="approve-modal-title"
          className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)] mb-[var(--space-3)]"
        >
          Confirm Payouts
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-[var(--space-6)]">
          This will transfer {formatPaise(totalNetPayable)} to all technicians in this week&apos;s
          payout queue via Razorpay Route. This action cannot be undone.
        </p>
        <div className="flex gap-[var(--space-3)] justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-[var(--color-border)] text-[var(--color-text)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-medium disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
