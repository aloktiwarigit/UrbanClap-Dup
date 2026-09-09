'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDate } from '@/lib/format/intl';
import {
  fetchTechnicianLedger,
  fetchCommissionConfig,
  setHoldOverride,
  clearHoldOverride,
  type CommissionLedgerDetail,
  type CommissionConfig,
} from '@/api/commissions';
import { buildBalanceStack, buildBalanceEvents, holdReason } from '@/lib/commissions/derive';
import { hasCapability } from '@/admin/capabilities';
import { useAdminAuth } from '@/lib/auth/context';
import { useToast, ToastRegion } from '@/components/ui/Toast';
import { BalanceStack } from './BalanceStack';
import { BalanceEvents } from './BalanceEvents';
import { HoldOverrideDialog } from './HoldOverrideDialog';
import { HoldChip } from './HoldChip';
import { RemittanceDrawer } from './RemittanceDrawer';

export interface TechnicianLedgerClientProps {
  technicianId: string;
  // Seeds initial state without the mount-time fetch — used by tests, and available for a future
  // SSR handoff. Fetches on mount only when either is omitted; neither is re-read after mount.
  initialDetail?: CommissionLedgerDetail;
  initialConfig?: CommissionConfig;
}

/**
 * The per-technician commission ledger detail screen (design doc §4, task-7 brief) — the page the
 * owner opens at 11pm when a technician phones disputing a balance.
 *
 * Deliberately does not render the technician's phone number: `CommissionLedgerDetail` carries no
 * such field, and E09-S08 owns masked contact with audited reveal — a raw number here would
 * pre-empt that design.
 */
export function TechnicianLedgerClient({
  technicianId,
  initialDetail,
  initialConfig,
}: TechnicianLedgerClientProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();
  const { auth } = useAdminAuth();
  const canManageHold = hasCapability(auth?.role, 'settings.manage');
  // Integration gap fix round 2: this is the only capability check gating the one control in the
  // console that moves real money — the roll-up's recompute button is gated the same way
  // (CommissionsClient.tsx), so this mirrors an existing pattern rather than inventing one.
  const canRecordRemittance = hasCapability(auth?.role, 'finance.settleCommission');
  const { toast, show, dismiss } = useToast();

  const [detail, setDetail] = useState<CommissionLedgerDetail | null>(initialDetail ?? null);
  const [config, setConfig] = useState<CommissionConfig | null>(initialConfig ?? null);
  const [loading, setLoading] = useState(initialDetail === undefined);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [remittanceDrawerOpen, setRemittanceDrawerOpen] = useState(false);

  // Fetched independently of `loadConfig` below (fix round 1): this is the page the owner opens
  // at 11pm with a technician on the phone, and only the one "why is this technician on hold"
  // sentence needs `config` at all. A `Promise.all` that fails the whole page on either call
  // failing would blank the entire ledger — balance, events, receivables, remittances, credits —
  // over a rarely-changing config lookup hiccup that has nothing to do with the ledger itself.
  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchTechnicianLedger(technicianId);
      setDetail(d);
    } catch {
      setError(t('errors.detailLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [technicianId, t]);

  // Config degrades, it does not block: a failure here never blanks the ledger, and is
  // deliberately not surfaced as a page-level error — only as a scoped note where the
  // money-terms hold-reason sentence would have gone (see the hold-status section below).
  const loadConfig = useCallback(async () => {
    setConfigError(null);
    try {
      const c = await fetchCommissionConfig();
      setConfig(c);
    } catch {
      setConfigError(t('errors.configLoadFailed'));
    }
  }, [t]);

  useEffect(() => {
    if (initialDetail === undefined) {
      void loadDetail();
    }
    if (initialConfig === undefined) {
      void loadConfig();
    }
    // Mount-only: initialDetail/initialConfig are one-time hydration seeds, not values this
    // effect should react to on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshDetail() {
    const refreshed = await fetchTechnicianLedger(technicianId);
    setDetail(refreshed);
  }

  async function handleSaveOverride(params: { until: string; reason: string }) {
    setOverrideSubmitting(true);
    try {
      await setHoldOverride(technicianId, params);
      await refreshDetail();
      setOverrideDialogOpen(false);
      show(t('messages.overrideSaved'), 'success');
    } catch {
      show(t('errors.overrideFailed'), 'error');
    } finally {
      setOverrideSubmitting(false);
    }
  }

  async function handleClearOverride() {
    try {
      await clearHoldOverride(technicianId);
      await refreshDetail();
      show(t('messages.overrideCleared'), 'success');
    } catch {
      show(t('errors.clearOverrideFailed'), 'error');
    }
  }

  // Integration gap fix round 2: RemittanceDrawer never closes itself on success (by design — see
  // its own doc comment) so the operator can read the recorded/mismatch/credit outcome before
  // dismissing it themselves. This only refreshes the ledger underneath so the balance, receivable
  // statuses, and remittance history are current the moment they do.
  function handleRemittanceRecorded() {
    void refreshDetail().catch(() => {
      show(t('errors.detailLoadFailed'), 'error');
    });
  }

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-6)]">
      <div>
        <Link
          href="/finance/commissions"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline"
        >
          {t('detail.backLink')}
        </Link>
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)] mt-[var(--space-1)]">
          {t('detail.heading', { technicianId })}
        </h1>
      </div>

      <ToastRegion toast={toast} onDismiss={dismiss} />

      {loading && <p className="text-sm text-[var(--color-text-muted)]">{t('detail.loading')}</p>}
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {!loading && detail && (
        <>
          <section aria-labelledby="hold-status-heading" className="space-y-[var(--space-2)]">
            <div className="flex items-center justify-between gap-[var(--space-3)]">
              <h2
                id="hold-status-heading"
                className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]"
              >
                {t('detail.hold.heading')}
              </h2>
              {canManageHold && (
                <>
                  {detail.hold?.override !== undefined ? (
                    <button
                      type="button"
                      onClick={() => void handleClearOverride()}
                      className="px-3 py-1 text-sm rounded border border-[var(--color-border)] text-[var(--color-text)]"
                    >
                      {t('detail.hold.clearOverride')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOverrideDialogOpen(true)}
                      className="px-3 py-1 text-sm rounded border border-[var(--color-border)] text-[var(--color-text)]"
                    >
                      {t('detail.hold.setOverride')}
                    </button>
                  )}
                </>
              )}
            </div>
            {detail.hold !== null && (
              <div className="flex items-center gap-[var(--space-2)]">
                <HoldChip
                  state={detail.hold.state}
                  {...(detail.hold.override !== undefined ? { override: detail.hold.override } : {})}
                />
                {config !== null
                  ? (() => {
                      const reason = holdReason(
                        detail.hold,
                        { warnPaise: config.warnThresholdPaise, blockPaise: config.blockThresholdPaise },
                        locale,
                      );
                      return (
                        reason !== null && (
                          <p className="text-sm text-[var(--color-text)]">{t(reason.key, reason.params)}</p>
                        )
                      );
                    })()
                  : (
                      configError !== null && (
                        <p className="text-xs text-[var(--color-text-muted)]">{configError}</p>
                      )
                    )}
              </div>
            )}
          </section>

          <BalanceStack
            stack={buildBalanceStack(detail)}
            cashCollectedPaise={detail.cashCollectedPaise}
            jobCount={detail.receivables.length}
          />

          <BalanceEvents events={buildBalanceEvents(detail)} />

          <section aria-labelledby="receivables-heading">
            <div className="flex items-center justify-between gap-[var(--space-3)] mb-[var(--space-3)]">
              <h2
                id="receivables-heading"
                className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]"
              >
                {t('detail.receivables.heading')}
              </h2>
              {canRecordRemittance && (
                <button
                  type="button"
                  onClick={() => setRemittanceDrawerOpen(true)}
                  className="px-3 py-1 text-sm rounded border border-[var(--color-border)] text-[var(--color-text)]"
                >
                  {t('detail.receivables.recordPayment')}
                </button>
              )}
            </div>
            {detail.receivables.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t('detail.receivables.empty')}</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--color-border)]">
                <table className="w-full text-sm text-left text-[var(--color-text)]">
                  <thead className="bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.receivables.columns.service')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.receivables.columns.date')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium text-right">
                        {t('detail.receivables.columns.amount')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.receivables.columns.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {detail.receivables.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2">{r.serviceName ?? '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDate(r.slotDate ?? r.createdAt, locale)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {formatINR(r.commissionDue, locale)}
                        </td>
                        <td className="px-3 py-2">
                          {receivableStatusLabel(r.remittanceStatus, t)}
                          {r.collectionMethod === 'UPI_QR' && (
                            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                              {t('detail.receivables.technicianDeclared')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="remittance-history-heading">
            <h2
              id="remittance-history-heading"
              className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)] mb-[var(--space-3)]"
            >
              {t('detail.remittanceHistory.heading')}
            </h2>
            {detail.remittances.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('detail.remittanceHistory.empty')}
              </p>
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--color-border)]">
                <table className="w-full text-sm text-left text-[var(--color-text)]">
                  <thead className="bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.remittanceHistory.columns.date')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium text-right">
                        {t('detail.remittanceHistory.columns.amount')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.remittanceHistory.columns.method')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.remittanceHistory.columns.ref')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.remittanceHistory.columns.recordedBy')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {detail.remittances.map((rem) => (
                      <tr key={rem.id}>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(rem.createdAt, locale)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {formatINR(rem.amountPaise, locale)}
                        </td>
                        <td className="px-3 py-2">{rem.method}</td>
                        <td className="px-3 py-2 font-mono text-xs">{rem.ref}</td>
                        <td className="px-3 py-2">{rem.recordedByAdminId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="credits-heading">
            <h2
              id="credits-heading"
              className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)] mb-[var(--space-3)]"
            >
              {t('detail.credits.heading')}
            </h2>
            {detail.credits.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t('detail.credits.empty')}</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--color-border)]">
                <table className="w-full text-sm text-left text-[var(--color-text)]">
                  <thead className="bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">
                        {t('detail.credits.columns.source')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium text-right">
                        {t('detail.credits.columns.original')}
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium text-right">
                        {t('detail.credits.columns.remaining')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {detail.credits.map((credit) => (
                      <tr key={credit.id}>
                        <td className="px-3 py-2">{credit.source}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {formatINR(credit.originalPaise, locale)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {formatINR(credit.remainingPaise, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <HoldOverrideDialog
        open={overrideDialogOpen}
        onClose={() => setOverrideDialogOpen(false)}
        onSubmit={(params) => void handleSaveOverride(params)}
        submitting={overrideSubmitting}
      />

      <RemittanceDrawer
        open={remittanceDrawerOpen}
        technicianId={technicianId}
        receivables={detail?.receivables ?? []}
        onClose={() => setRemittanceDrawerOpen(false)}
        onRecorded={handleRemittanceRecorded}
      />
    </div>
  );
}

function receivableStatusLabel(
  status: CommissionLedgerDetail['receivables'][number]['remittanceStatus'],
  t: ReturnType<typeof useTranslations>,
): string {
  switch (status) {
    case 'DUE':
      return t('detail.receivables.statusDue');
    case 'REMITTED':
      return t('detail.receivables.statusRemitted');
    case 'WAIVED':
      return t('detail.receivables.statusWaived');
    default:
      return status;
  }
}
