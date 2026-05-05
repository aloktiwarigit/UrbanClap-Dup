'use client';

import { useState } from 'react';
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
}

function formatDate(value: string | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
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
}: ComplianceClientProps) {
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
      setToast({ type: 'success', message: 'Erasure request executed.' });
    } catch {
      setToast({ type: 'error', message: 'Erasure execution failed.' });
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
      setToast({ type: 'success', message: 'Erasure request denied.' });
    } catch {
      setToast({ type: 'error', message: 'Erasure denial failed.' });
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
      setToast({ type: 'success', message: `SSC levy ${result.quarter} transferred.` });
    } catch {
      setToast({ type: 'error', message: 'SSC levy approval failed.' });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-8)]">
      <div>
        <p className="eyebrow m-0 mb-[var(--space-1)]">Compliance operations</p>
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">
          Compliance
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
            Erasure Requests
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Pending DPDP erasure requests awaiting cool-off review or denial.
          </p>
        </div>

        {erasureRequests.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No erasure requests returned.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="pb-2 pr-4 font-medium">Request</th>
                  <th className="pb-2 pr-4 font-medium">User</th>
                  <th className="pb-2 pr-4 font-medium">Schedule</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
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
                          Requested {formatDate(request.requestedAt)}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium m-0">{request.userRole}</p>
                        <p className="font-mono text-xs text-[var(--color-text-muted)] m-0">{request.userId}</p>
                      </td>
                      <td className="py-3 pr-4">{formatDate(request.scheduledDeletionAt)}</td>
                      <td className="py-3 pr-4">{request.status}</td>
                      <td className="py-3 text-right">
                        {isPending ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={pendingKey !== null || executionBlocked}
                              onClick={() => void handleExecute(request)}
                            >
                              Execute
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
                              aria-label={`Deny reason for ${request.id}`}
                            >
                              {DENIAL_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={pendingKey !== null}
                              onClick={() => void handleDeny(request)}
                            >
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Closed {formatDate(request.executedAt ?? request.deniedAt ?? request.failedAt)}
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
            SSC Levy Approval
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Quarterly statutory levy transfers require super-admin approval.
          </p>
        </div>

        {sscLevies.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No SSC levies returned.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="pb-2 pr-4 font-medium">Quarter</th>
                  <th className="pb-2 pr-4 font-medium text-right">GMV</th>
                  <th className="pb-2 pr-4 font-medium text-right">Levy</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Action</th>
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
                      <td className="py-3 pr-4">{levy.status}</td>
                      <td className="py-3 text-right">
                        {canApprove ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={pendingKey !== null}
                            onClick={() => void handleApproveLevy(levy)}
                          >
                            Approve Transfer
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {levy.razorpayTransferId ?? 'No action'}
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
