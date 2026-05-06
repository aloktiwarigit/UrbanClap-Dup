'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { PnLChart } from '@/components/finance/PnLChart';
import { PayoutQueueTable } from '@/components/finance/PayoutQueueTable';
import { ApproveAllModal } from '@/components/finance/ApproveAllModal';
import {
  fetchFinanceSummary,
  fetchPayoutQueue,
  approveAllPayouts,
  formatPaise,
  type FinanceSummary,
  type PayoutQueue,
} from '@/api/finance';
import { hasCapability } from '@/admin/capabilities';
import { useAdminAuth } from '@/lib/auth/context';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 6);
  return { from: toDateStr(from), to: toDateStr(to) };
}

type Toast = { message: string; type: 'success' | 'error' };

export function FinanceClient() {
  const t = useTranslations('finance');
  const locale = useLocale();
  const { auth } = useAdminAuth();
  const canApprovePayouts = hasCapability(auth?.role, 'finance.approvePayouts');
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [queue, setQueue] = useState<PayoutQueue | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await fetchFinanceSummary(from, to));
    } catch {
      setToast({ message: t('errors.loadSummaryFailed'), type: 'error' });
    } finally {
      setSummaryLoading(false);
    }
  }, [from, to, t]);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      setQueue(await fetchPayoutQueue());
    } catch {
      setToast({ message: t('errors.loadQueueFailed'), type: 'error' });
    } finally {
      setQueueLoading(false);
    }
  }, [t]);

  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { void loadQueue(); }, [loadQueue]);

  async function handleApproveConfirm() {
    setApproving(true);
    try {
      const result = await approveAllPayouts();
      setShowModal(false);
      const msg = t('messages.approveSuccess', {
        approved: result.approved,
        hasFailed: result.failed > 0 ? 'true' : 'other',
        failed: result.failed,
      });
      setToast({ message: msg, type: result.failed > 0 ? 'error' : 'success' });
      void loadQueue();
    } catch {
      setToast({ message: t('errors.approveFailed'), type: 'error' });
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-8)]">
      <div>
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">{t('title')}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-[var(--space-1)]">{t('subtitle')}</p>
      </div>

      {toast && (
        <p
          role="status"
          className={`text-sm rounded p-[var(--space-3)] ${
            toast.type === 'success'
              ? 'bg-green-50 text-[var(--color-success)]'
              : 'bg-red-50 text-[var(--color-danger)]'
          }`}
        >
          {toast.message}
        </p>
      )}

      <section aria-labelledby="pnl-heading">
        <h2 id="pnl-heading" className="sr-only">{t('sections.pnl')}</h2>
        <div className="flex flex-wrap gap-[var(--space-3)] items-end mb-[var(--space-4)]">
          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
            {t('dateRange.from')}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
            {t('dateRange.to')}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)]"
            />
          </label>
        </div>

        {summaryLoading && (
          <p className="text-sm text-[var(--color-text-muted)]">{t('loading.summary')}</p>
        )}

        {!summaryLoading && summary && (
          <>
            <div className="grid grid-cols-3 gap-[var(--space-4)] mb-[var(--space-4)]">
              <div className="rounded p-[var(--space-4)] bg-[var(--color-surface-alt)]">
                <p className="text-xs text-[var(--color-text-muted)]">{t('summary.grossRevenue')}</p>
                <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-text)]">{formatPaise(summary.totalGross)}</p>
              </div>
              <div className="rounded p-[var(--space-4)] bg-[var(--color-surface-alt)]">
                <p className="text-xs text-[var(--color-text-muted)]">{t('summary.commission')}</p>
                <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-warn)]">{formatPaise(summary.totalCommission)}</p>
              </div>
              <div className="rounded p-[var(--space-4)] bg-[var(--color-surface-alt)]">
                <p className="text-xs text-[var(--color-text-muted)]">{t('summary.netToOwner')}</p>
                <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-success)]">{formatPaise(summary.totalNet)}</p>
              </div>
            </div>
            <PnLChart data={summary.dailyPnL} locale={locale} />
          </>
        )}
      </section>

      <section aria-labelledby="payout-heading">
        <h2 id="payout-heading" className="sr-only">Payout Queue</h2>
        {queueLoading && (
          <p className="text-sm text-[var(--color-text-muted)]">{t('loading.queue')}</p>
        )}
        {!queueLoading && queue && (
          <PayoutQueueTable
            entries={queue.entries}
            totalNetPayable={queue.totalNetPayable}
            canApproveAll={canApprovePayouts}
            onApproveAll={() => setShowModal(true)}
          />
        )}
      </section>

      {showModal && queue && (
        <ApproveAllModal
          totalNetPayable={queue.totalNetPayable}
          onConfirm={() => void handleApproveConfirm()}
          onCancel={() => setShowModal(false)}
          loading={approving}
        />
      )}
    </div>
  );
}
