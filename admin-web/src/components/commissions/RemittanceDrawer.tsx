'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Drawer } from '@/components/ui/Drawer';
import { useToast, ToastRegion } from '@/components/ui/Toast';
import { formatINR, rupeesToPaise } from '@/lib/format/intl';
import {
  recordRemittance,
  type RecordRemittanceParams,
  type RecordRemittanceResponse,
  type CommissionLedgerDetail,
} from '@/api/commissions';

export type RemittanceReceivable = CommissionLedgerDetail['receivables'][number];

export interface RemittanceDrawerProps {
  open: boolean;
  technicianId: string;
  receivables: RemittanceReceivable[];
  onClose: () => void;
  onRecorded: (response: RecordRemittanceResponse) => void;
}

interface AllocationEntry {
  bookingId: string;
  paise: number;
}

/**
 * The client-side allocation preview (design doc §5): purely for display, computed
 * oldest-due-first over the DUE receivables handed to this drawer. Never sent to the server and
 * never treated as truth — see the module doc comment on `recordRemittance` in `@/api/commissions`
 * for why the server recomputes this authoritatively.
 */
function buildOldestDueFirstPreview(
  receivables: RemittanceReceivable[],
  amountPaise: number,
): AllocationEntry[] {
  const due = receivables
    .filter((r) => r.remittanceStatus === 'DUE' && r.outstandingPaise > 0)
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let remaining = amountPaise;
  const allocations: AllocationEntry[] = [];
  for (const r of due) {
    if (remaining <= 0) break;
    const alloc = Math.min(remaining, r.outstandingPaise);
    if (alloc > 0) {
      allocations.push({ bookingId: r.bookingId, paise: alloc });
      remaining -= alloc;
    }
  }
  return allocations;
}

/**
 * Whether the server's actual allocation disagrees with the local preview — by set of bookings
 * allocated to, or by the amount allocated to any one of them. A concurrent settlement or a
 * config edit between preview and record can make these disagree; when they do, design doc §5
 * requires saying so explicitly rather than swapping the numbers in silently.
 */
function allocationsDiffer(preview: AllocationEntry[], actual: AllocationEntry[]): boolean {
  if (preview.length !== actual.length) return true;
  const previewByBooking = new Map(preview.map((entry) => [entry.bookingId, entry.paise]));
  return actual.some((entry) => previewByBooking.get(entry.bookingId) !== entry.paise);
}

function sumPaise(allocations: AllocationEntry[]): number {
  return allocations.reduce((sum, entry) => sum + entry.paise, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Duck-types the 409 IDEMPOTENCY_MISMATCH shape rather than checking `instanceof ApiError` —
 * `recordRemittance` throws a real `ApiError` in production, but this also has to recognise the
 * plain `Object.assign(new Error(), { status, body })` shape test doubles use to stand in for it.
 */
function isIdempotencyMismatch(err: unknown): boolean {
  if (!isRecord(err) || err.status !== 409) return false;
  const body = err.body;
  return isRecord(body) && body.code === 'IDEMPOTENCY_MISMATCH';
}

function allocationLabel(bookingId: string, receivables: RemittanceReceivable[]): string {
  return receivables.find((r) => r.bookingId === bookingId)?.serviceName ?? bookingId;
}

/**
 * The remittance drawer (design doc §5, task-8 brief) — the one place in the commission console
 * that moves real money. Three invariants this file exists to protect:
 *
 * 1. The idempotency key is minted once per payment *attempt* (`crypto.randomUUID()`, held in a
 *    ref) when the drawer opens, and reused across every retry of that same attempt. It is reset
 *    to a fresh value only after a *successful* record. Regenerating it on retry would turn one
 *    payment into two real payments against the technician's balance — `recordRemittance` itself
 *    deliberately does not mint this key, precisely so a retry that reuses the same call site
 *    reuses the same key.
 * 2. The allocation preview is computed locally, oldest-due-first, for display only. It is
 *    rendered behind a dashed left rule in `--color-text-faint` under a plain label. On success it
 *    is replaced in place by the server's actual `allocations` at full strength; if the two
 *    disagree, that is surfaced explicitly (never a silent swap) via `outcomes.allocationMismatch`.
 * 3. Money crosses the rupee/paise boundary exactly once, via `rupeesToPaise` — never hand-parsed,
 *    never a float.
 */
export function RemittanceDrawer({
  open,
  technicianId,
  receivables,
  onClose,
  onRecorded,
}: RemittanceDrawerProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();
  const { toast, show, dismiss } = useToast();

  const amountId = useId();
  const methodId = useId();
  const refId = useId();
  const noteId = useId();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'UPI' | 'CASH_DEPOSIT'>('UPI');
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actualAllocations, setActualAllocations] = useState<AllocationEntry[] | null>(null);

  // Minted once per payment attempt (see class doc comment above). Never regenerated on retry —
  // only when the drawer opens for a new attempt, or after a successful record.
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    idempotencyKeyRef.current = crypto.randomUUID();
    setAmount('');
    setMethod('UPI');
    setRef('');
    setNote('');
    setValidationError(null);
    setActualAllocations(null);
    dismiss();
    // `dismiss` is a stable useCallback (see useToast) — this effect intentionally reacts to
    // `open` only, so it fires exactly once per drawer-open transition, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amountPaise = rupeesToPaise(amount);
  const previewAllocations = useMemo(
    () => buildOldestDueFirstPreview(receivables, amountPaise ?? 0),
    [receivables, amountPaise],
  );

  async function handleSubmit() {
    const paise = rupeesToPaise(amount);
    if (paise === undefined || paise <= 0) {
      dismiss();
      setValidationError(t('remittance.errors.invalidAmount'));
      return;
    }
    if (ref.trim() === '') {
      dismiss();
      setValidationError(t('remittance.errors.refRequired'));
      return;
    }
    setValidationError(null);

    if (idempotencyKeyRef.current === null) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    const idempotencyKey = idempotencyKeyRef.current;
    const previewAtSubmit = previewAllocations;

    setSubmitting(true);
    try {
      const params: RecordRemittanceParams = {
        technicianId,
        amountPaise: paise,
        method,
        ref: ref.trim(),
        idempotencyKey,
        ...(note.trim() !== '' ? { note: note.trim() } : {}),
      };
      const response = await recordRemittance(params);
      setActualAllocations(response.allocations);

      if (response.replayed) {
        show(t('remittance.outcomes.replayed'), 'success');
      } else if (allocationsDiffer(previewAtSubmit, response.allocations)) {
        show(
          t('remittance.outcomes.allocationMismatch', {
            previewAmount: formatINR(sumPaise(previewAtSubmit), locale),
            previewCount: previewAtSubmit.length,
            actualAmount: formatINR(sumPaise(response.allocations), locale),
            actualCount: response.allocations.length,
          }),
          'success',
        );
      } else if (response.holdRecomputePending) {
        show(t('remittance.outcomes.recomputePending'), 'success');
      } else {
        show(t('remittance.outcomes.success'), 'success');
      }

      // Ready the next distinct payment: fresh key, cleared amount/reference/note. `method` is
      // left as-is — repeat payments from the same technician commonly share a collection method.
      idempotencyKeyRef.current = crypto.randomUUID();
      setAmount('');
      setRef('');
      setNote('');
      onRecorded(response);
    } catch (err) {
      if (isIdempotencyMismatch(err)) {
        show(t('remittance.errors.idempotencyMismatch'), 'error');
      } else {
        show(t('remittance.errors.recordFailed'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const displayedAllocations = actualAllocations ?? previewAllocations;
  const isActual = actualAllocations !== null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('remittance.title')}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-[var(--color-border)] text-sm text-[var(--color-text)]"
          >
            {t('remittance.actions.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-sm font-medium disabled:opacity-40"
          >
            {t('remittance.actions.submit')}
          </button>
        </>
      }
    >
      <div className="space-y-[var(--space-4)]">
        <ToastRegion toast={toast} onDismiss={dismiss} />

        <label htmlFor={amountId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {t('remittance.fields.amountLabel')}
          <input
            id={amountId}
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] text-right font-mono"
          />
        </label>

        <label htmlFor={methodId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {t('remittance.fields.methodLabel')}
          <select
            id={methodId}
            value={method}
            onChange={(e) => setMethod(e.target.value as 'UPI' | 'CASH_DEPOSIT')}
            className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)]"
          >
            <option value="UPI">{t('remittance.fields.methodUpi')}</option>
            <option value="CASH_DEPOSIT">{t('remittance.fields.methodCash')}</option>
          </select>
        </label>

        <label htmlFor={refId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {t('remittance.fields.refLabel')}
          <input
            id={refId}
            type="text"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] font-mono"
          />
        </label>

        <label htmlFor={noteId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {t('remittance.fields.noteLabel')}
          <textarea
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] resize-none"
          />
        </label>

        {validationError !== null && (
          <p role="alert" className="text-xs text-[var(--color-danger)]">
            {validationError}
          </p>
        )}

        <div
          data-testid={isActual ? undefined : 'allocation-preview'}
          className={
            isActual
              ? 'pl-[var(--space-3)] border-l border-[var(--color-border)] text-[var(--color-text)] transition-[opacity] duration-[220ms] ease-out motion-reduce:transition-none'
              : 'pl-[var(--space-3)] border-l border-dashed border-[var(--color-text-faint)] text-[var(--color-text-faint)] transition-[opacity] duration-[220ms] ease-out motion-reduce:transition-none'
          }
        >
          <p className="text-xs">
            {isActual ? t('remittance.actual.label') : t('remittance.preview.label')}
          </p>
          {displayedAllocations.length === 0 ? (
            <p className="text-xs">{t('remittance.preview.empty')}</p>
          ) : (
            <ul className="mt-[var(--space-1)] space-y-[var(--space-1)]">
              {displayedAllocations.map((a) => (
                <li key={a.bookingId} className="flex justify-between gap-[var(--space-2)] text-xs">
                  <span className="truncate">{allocationLabel(a.bookingId, receivables)}</span>
                  <span className="font-mono tabular-nums shrink-0">{formatINR(a.paise, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}
