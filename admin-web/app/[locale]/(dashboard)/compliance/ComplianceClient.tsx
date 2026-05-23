'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  approveSscLevy,
  denyErasureRequest,
  executeErasureRequest,
} from '@/api/compliance';
import type {
  ErasureDenialReason,
  ErasureRequest,
  SscLevy,
} from '@/types/compliance';

const DENIAL_REASONS: ErasureDenialReason[] = [
  'legal-hold',
  'regulatory-retention-conflict',
  'fraud-investigation',
];
const DEFAULT_DENIAL_REASON: ErasureDenialReason = 'legal-hold';

interface ComplianceClientProps {
  initialErasureRequests: ErasureRequest[];
  initialSscLevies: SscLevy[];
  /** Server-side fetch error for the erasure-requests endpoint, surfaced inline so one bad endpoint does not crash the page. */
  erasureError?: string | null;
  /** Server-side fetch error for the ssc-levy endpoint, surfaced inline. */
  sscError?: string | null;
}

function formatPaise(paise: number): string {
  return `INR ${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ComplianceClient({
  initialErasureRequests,
  initialSscLevies,
  erasureError = null,
  sscError = null,
}: ComplianceClientProps) {
  const t = useTranslations('compliance');
  const locale = useLocale();

  function formatDate(value: string | undefined): string {
    if (!value) return '-';
    const dateLocale = locale === 'hi' ? 'hi-IN' : 'en-IN';
    return new Date(value).toLocaleString(dateLocale, {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  const [erasureRequests, setErasureRequests] = useState(initialErasureRequests);
  const [sscLevies, setSscLevies] = useState(initialSscLevies);
  const [denialReasons, setDenialReasons] = useState<Record<string, ErasureDenialReason>>(() =>
    Object.fromEntries(initialErasureRequests.map((item) => [item.id, DEFAULT_DENIAL_REASON])),
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleExecute(request: ErasureRequest) {
    setPendingKey(`execute:${request.id}`);
    setToast(null);
    try {
      const result = await executeErasureRequest(request.id);
      setErasureRequests((current) =>
        current.map((item) => {
          if (item.id !== request.id) return item;
          const patch: Partial<ErasureRequest> = { status: result.status };
          if (result.executedAt !== undefined) patch.executedAt = result.executedAt;
          if (result.deletedCounts !== undefined) patch.deletedCounts = result.deletedCounts;
          return { ...item, ...patch };
        }),
      );
      setToast({ type: 'success', message: t('erasure.toastExecuteSuccess') });
    } catch {
      setToast({ type: 'error', message: t('erasure.toastExecuteFailed') });
    } finally {
      setPendingKey(null);
    }
  }

  async function handleDeny(request: ErasureRequest) {
    setPendingKey(`deny:${request.id}`);
    setToast(null);
    try {
      const reason = denialReasons[request.id] ?? DEFAULT_DENIAL_REASON;
      const result = await denyErasureRequest(request.id, reason);
      setErasureRequests((current) =>
        current.map((item) => {
          if (item.id !== request.id) return item;
          const patch: Partial<ErasureRequest> = { status: result.status };
          if (result.denialReason !== undefined) patch.denialReason = result.denialReason;
          if (result.deniedAt !== undefined) patch.deniedAt = result.deniedAt;
          return { ...item, ...patch };
        }),
      );
      setToast({ type: 'success', message: t('erasure.toastDenySuccess') });
    } catch {
      setToast({ type: 'error', message: t('erasure.toastDenyFailed') });
    } finally {
      setPendingKey(null);
    }
  }

  async function handleApproveLevy(levy: SscLevy) {
    setPendingKey(`ssc:${levy.id}`);
    setToast(null);
    try {
      const result = await approveSscLevy(levy.id);
      setSscLevies((current) =>
        current.map((item) =>
          item.id === levy.id
            ? {
                ...item,
                status: result.status,
                razorpayTransferId: result.transferId,
                transferredAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setToast({ type: 'success', message: t('sscLevy.toastSuccess', { quarter: result.quarter }) });
    } catch {
      setToast({ type: 'error', message: t('sscLevy.toastError') });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-8)]">
      <div>
        <p className="eyebrow m-0 mb-[var(--space-1)]">{t('eyebrow')}</p>
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">
          {t('title')}
        </h1>
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

      <section aria-labelledby="erasure-heading" className="space-y-[var(--space-3)]">
        <div>
          <h2 id="erasure-heading" className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]">
            {t('erasure.heading')}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('erasure.description')}
          </p>
        </div>

        {erasureError && (
          <p role="alert" className="alert alert-danger">
            {erasureError}
          </p>
        )}

        {erasureError ? null : erasureRequests.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('erasure.emptyState')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="pb-2 pr-4 font-medium">{t('erasure.columns.request')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('erasure.columns.user')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('erasure.columns.schedule')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('erasure.columns.status')}</th>
                  <th className="pb-2 font-medium text-right">{t('erasure.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {erasureRequests.map((request) => {
                  const isPending = request.status === 'PENDING';
                  const executionBlocked = Date.parse(request.scheduledDeletionAt) > Date.now();
                  return (
                    <tr key={request.id} className="border-b border-[var(--color-border)] align-top">
                      <td className="py-3 pr-4">
                        <p className="font-mono text-xs m-0">{request.id}</p>
                        <p className="text-xs text-[var(--color-text-muted)] m-0">
                          {t('erasure.requestedLabel', { date: formatDate(request.requestedAt) })}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium m-0">{request.userRole}</p>
                        <p className="font-mono text-xs text-[var(--color-text-muted)] m-0">{request.userId}</p>
                      </td>
                      <td className="py-3 pr-4">{formatDate(request.scheduledDeletionAt)}</td>
                      <td className="py-3 pr-4">{t(`erasure.statuses.${request.status}`)}</td>
                      <td className="py-3 text-right">
                        {isPending ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={pendingKey !== null || executionBlocked}
                              onClick={() => void handleExecute(request)}
                            >
                              {t('erasure.executeButton')}
                            </button>
                            <select
                              className="input"
                              value={denialReasons[request.id] ?? DEFAULT_DENIAL_REASON}
                              onChange={(event) =>
                                setDenialReasons((current) => ({
                                  ...current,
                                  [request.id]: event.target.value as ErasureDenialReason,
                                }))
                              }
                              aria-label={t('erasure.denyReasonAriaLabel', { requestId: request.id })}
                            >
                              {DENIAL_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {t(`erasure.denialReasons.${reason}`)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={pendingKey !== null}
                              onClick={() => void handleDeny(request)}
                            >
                              {t('erasure.denyButton')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {t('erasure.closedLabel', { date: formatDate(request.executedAt ?? request.deniedAt ?? request.failedAt) })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="ssc-heading" className="space-y-[var(--space-3)]">
        <div>
          <h2 id="ssc-heading" className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]">
            {t('sscLevy.heading')}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('sscLevy.description')}
          </p>
        </div>

        {sscError && (
          <p role="alert" className="alert alert-danger">
            {sscError}
          </p>
        )}

        {sscError ? null : sscLevies.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('sscLevy.emptyState')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="pb-2 pr-4 font-medium">{t('sscLevy.columns.quarter')}</th>
                  <th className="pb-2 pr-4 font-medium text-right">{t('sscLevy.columns.gmv')}</th>
                  <th className="pb-2 pr-4 font-medium text-right">{t('sscLevy.columns.levy')}</th>
                  <th className="pb-2 pr-4 font-medium">{t('sscLevy.columns.status')}</th>
                  <th className="pb-2 font-medium text-right">{t('sscLevy.columns.action')}</th>
                </tr>
              </thead>
              <tbody>
                {sscLevies.map((levy) => {
                  const canApprove = ['PENDING_APPROVAL', 'FAILED', 'APPROVED'].includes(levy.status);
                  return (
                    <tr key={levy.id} className="border-b border-[var(--color-border)]">
                      <td className="py-3 pr-4">
                        <p className="font-medium m-0">{levy.quarter}</p>
                        <p className="font-mono text-xs text-[var(--color-text-muted)] m-0">{levy.id}</p>
                      </td>
                      <td className="py-3 pr-4 text-right">{formatPaise(levy.gmv)}</td>
                      <td className="py-3 pr-4 text-right">{formatPaise(levy.levyAmount)}</td>
                      <td className="py-3 pr-4">{t(`sscLevy.statuses.${levy.status}`)}</td>
                      <td className="py-3 text-right">
                        {canApprove ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={pendingKey !== null}
                            onClick={() => void handleApproveLevy(levy)}
                          >
                            {t('sscLevy.approveButton')}
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {levy.razorpayTransferId ?? t('sscLevy.noAction')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
