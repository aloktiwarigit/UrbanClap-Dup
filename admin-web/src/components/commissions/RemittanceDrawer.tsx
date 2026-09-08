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

interface RemittanceOutcome {
  allocations: AllocationEntry[];
  replayed: boolean;
  creditCreatedPaise: number;
  // Pre-formatted, human-facing string — null when the server's allocation matches the preview.
  mismatchMessage: string | null;
}

// Only whole rupees or up to 2 decimal places — rejecting anything finer avoids silently rounding
// an operator typo like "1200.555" up to ₹1,200.56 (fix round 1, Minor).
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

function isWellFormedRupeeAmount(raw: string): boolean {
  return AMOUNT_PATTERN.test(raw.trim());
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
 * Builds the human-facing mismatch disclosure (design §5; fix round 1 review I2). When the
 * preview and the actual allocation carry the same total and the same job count, quoting both
 * figures is self-contradictory ("Preview showed ₹200 across 2 jobs; recorded ₹200 across 2
 * jobs" — nothing looks different). That shape is a pure *re-split*: the same money, spread
 * across the same jobs differently. In that case name the bookings whose amount actually moved
 * instead of repeating identical totals; otherwise use the quantitative before/after phrasing.
 */
function describeAllocationMismatch(
  preview: AllocationEntry[],
  actual: AllocationEntry[],
  receivables: RemittanceReceivable[],
  locale: string,
  t: ReturnType<typeof useTranslations>,
): string {
  const previewTotal = sumPaise(preview);
  const actualTotal = sumPaise(actual);

  if (previewTotal === actualTotal && preview.length === actual.length) {
    const previewByBooking = new Map(preview.map((entry) => [entry.bookingId, entry.paise]));
    const actualBookingIds = new Set(actual.map((entry) => entry.bookingId));
    const movedIds = actual
      .filter((entry) => previewByBooking.get(entry.bookingId) !== entry.paise)
      .map((entry) => entry.bookingId);
    const droppedIds = preview
      .filter((entry) => !actualBookingIds.has(entry.bookingId))
      .map((entry) => entry.bookingId);
    const changedLabels = Array.from(new Set([...movedIds, ...droppedIds])).map((id) =>
      allocationLabel(id, receivables),
    );
    return t('remittance.outcomes.allocationResplit', { bookings: changedLabels.join(', ') });
  }

  return t('remittance.outcomes.allocationMismatch', {
    previewAmount: formatINR(previewTotal, locale),
    previewCount: preview.length,
    actualAmount: formatINR(actualTotal, locale),
    actualCount: actual.length,
  });
}

function pendingKeyStorageName(technicianId: string): string {
  return `commissions.remittance.pendingIdempotencyKey.${technicianId}`;
}

/**
 * Fix round 1 (C1/C2): the pending idempotency key is scoped to the *technician*, not to the
 * drawer's open/close lifecycle, and persisted in `sessionStorage` rather than only a ref — a ref
 * is lost on unmount and can never survive a page reload. On open, an existing pending key for
 * this technician is reused; one is minted (and persisted immediately) only when none exists.
 * This is what makes close-and-reopen after an ambiguous failure safe: the same key survives the
 * round trip, so a retry after "closing to start clean" still dedupes against the first attempt
 * instead of becoming a second real payment.
 */
function loadOrMintPendingKey(technicianId: string): string {
  try {
    const existing = window.sessionStorage.getItem(pendingKeyStorageName(technicianId));
    if (existing !== null) return existing;
  } catch {
    // sessionStorage unavailable (privacy mode, embedded webview) — fall through to an
    // in-memory-only key; the ref still protects retries within this page load.
  }
  const minted = crypto.randomUUID();
  try {
    window.sessionStorage.setItem(pendingKeyStorageName(technicianId), minted);
  } catch {
    // best-effort persistence only
  }
  return minted;
}

function clearPendingKey(technicianId: string): void {
  try {
    window.sessionStorage.removeItem(pendingKeyStorageName(technicianId));
  } catch {
    // best-effort
  }
}

/**
 * The remittance drawer (design doc §5, task-8 brief, fix round 1) — the one place in the
 * commission console that moves real money. Invariants this file exists to protect:
 *
 * 1. The idempotency key is keyed to the *technician* (see `loadOrMintPendingKey` above), not to
 *    the drawer's open/close lifecycle. It survives retries of the same attempt, survives the
 *    drawer being closed and reopened after an ambiguous failure, and survives a page reload. It
 *    is deleted only after a *successful* record — a genuinely abandoned attempt keeps its key
 *    until that technician's next successful payment, which is the safe direction: a replay
 *    returns the original receipt instead of charging again.
 * 2. The drawer cannot be closed (backdrop, ×, Escape, or Cancel) while a request is in flight —
 *    a mid-flight close would let the promise resolve into a state the operator never sees,
 *    inviting a "did it go through? let me try again" double payment.
 * 3. The allocation preview is computed locally, oldest-due-first, for display only. It is
 *    rendered behind a dashed left rule in `--color-text-faint` under a plain label. On success it
 *    is replaced in place by the server's actual `allocations` at full strength; if the two
 *    disagree, or the record was a replay, or an overpayment created a credit, that is disclosed
 *    persistently inline (not a five-second toast) — never a silent swap.
 * 4. Money crosses the rupee/paise boundary exactly once, via `rupeesToPaise` — never hand-parsed,
 *    never a float, and rejected client-side if it carries more than 2 decimal places.
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
  const [outcome, setOutcome] = useState<RemittanceOutcome | null>(null);

  // Never regenerated on retry — only reloaded/minted per technician when the drawer opens (see
  // `loadOrMintPendingKey`), and cleared only after a successful record.
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    idempotencyKeyRef.current = loadOrMintPendingKey(technicianId);
    setAmount('');
    setMethod('UPI');
    setRef('');
    setNote('');
    setValidationError(null);
    setOutcome(null);
    dismiss();
    // `dismiss` is a stable useCallback (see useToast) — this effect intentionally reacts to
    // `open`/`technicianId` only, so it fires once per drawer-open transition, not on every
    // keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, technicianId]);

  const amountPaise = rupeesToPaise(amount);
  const previewAllocations = useMemo(
    () => buildOldestDueFirstPreview(receivables, amountPaise ?? 0),
    [receivables, amountPaise],
  );
  const previewRemainderPaise = useMemo(() => {
    if (amountPaise === undefined) return 0;
    return Math.max(0, amountPaise - sumPaise(previewAllocations));
  }, [amountPaise, previewAllocations]);

  // Fix round 1 (I1): once a payment has been recorded, editing the amount or reference starts a
  // new, distinct payment — the "Recorded allocation" block must not keep showing the previous
  // payment's numbers at full strength while the operator types the next one.
  function handleAmountChange(value: string) {
    setAmount(value);
    if (outcome !== null) setOutcome(null);
  }
  function handleRefChange(value: string) {
    setRef(value);
    if (outcome !== null) setOutcome(null);
  }

  function requestClose() {
    // Fix round 1 (C1): backdrop click, ×, Escape, and Cancel all route through this — none of
    // them may close the drawer while a request is in flight, or the promise resolves into a
    // state the operator never sees and a "did it go through?" retry becomes a real second
    // payment.
    if (submitting) return;
    onClose();
  }

  async function handleSubmit() {
    // Fix round 1: a second dispatch while one is already in flight (a fast double-click, or an
    // Enter-key repeat) must never become a second request — `disabled` on the button is a UI
    // affordance, not the guarantee.
    if (submitting) return;

    const trimmedAmount = amount.trim();
    if (trimmedAmount === '' || !isWellFormedRupeeAmount(trimmedAmount)) {
      dismiss();
      setValidationError(t('remittance.errors.invalidAmount'));
      return;
    }
    const paise = rupeesToPaise(trimmedAmount);
    if (paise === undefined || paise <= 0) {
      dismiss();
      setValidationError(t('remittance.errors.invalidAmount'));
      return;
    }
    const trimmedRef = ref.trim();
    if (trimmedRef === '') {
      dismiss();
      setValidationError(t('remittance.errors.refRequired'));
      return;
    }
    setValidationError(null);

    const idempotencyKey = idempotencyKeyRef.current ?? loadOrMintPendingKey(technicianId);
    idempotencyKeyRef.current = idempotencyKey;
    const previewAtSubmit = previewAllocations;

    setSubmitting(true);
    let response: RecordRemittanceResponse;
    try {
      const params: RecordRemittanceParams = {
        technicianId,
        amountPaise: paise,
        method,
        ref: trimmedRef,
        idempotencyKey,
        ...(note.trim() !== '' ? { note: note.trim() } : {}),
      };
      // Narrowed to just the awaited call (fix round 1, I5): everything below this point is
      // "the payment already happened" territory and must never be reinterpreted as a failure —
      // including by a parent callback that throws.
      response = await recordRemittance(params);
    } catch (err) {
      setSubmitting(false);
      if (isIdempotencyMismatch(err)) {
        show(t('remittance.errors.idempotencyMismatch'), 'error');
      } else {
        // Fix round 1 (Minor): an ambiguous failure (timeout, 5xx, dropped connection) does not
        // mean the payment didn't land — only that this client never saw the response. Assert
        // less than "could not record".
        show(t('remittance.errors.recordFailed'), 'error');
      }
      return;
    }
    setSubmitting(false);

    // Success. The key is retired now, unconditionally, before anything else runs.
    clearPendingKey(technicianId);
    idempotencyKeyRef.current = null;

    const mismatchMessage = allocationsDiffer(previewAtSubmit, response.allocations)
      ? describeAllocationMismatch(previewAtSubmit, response.allocations, receivables, locale, t)
      : null;
    setOutcome({
      allocations: response.allocations,
      replayed: response.replayed,
      creditCreatedPaise: response.creditCreatedPaise,
      mismatchMessage,
    });

    // The toast is the ephemeral "it worked" confirmation. The replayed/mismatch/credit facts
    // are disclosed persistently inline below (fix round 1, I4/I6) — a 5-second toast does not
    // satisfy "say so explicitly rather than swapping the numbers silently".
    if (response.holdRecomputePending) {
      show(t('remittance.outcomes.recomputePending'), 'success');
    } else {
      show(t('remittance.outcomes.success'), 'success');
    }

    setAmount('');
    setRef('');
    setNote('');

    try {
      onRecorded(response);
    } catch (err) {
      // The payment already succeeded and the key is already retired — a parent callback
      // throwing here is a bug in the caller, not a failed payment. Never let it surface as one.
      console.error('RemittanceDrawer: onRecorded threw after a successful record', err);
    }
  }

  const displayedAllocations = outcome?.allocations ?? previewAllocations;
  const isActual = outcome !== null;

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      title={t('remittance.title')}
      footer={
        <>
          <button
            type="button"
            onClick={requestClose}
            disabled={submitting}
            className="px-4 py-2 rounded border border-[var(--color-border)] text-sm text-[var(--color-text)] disabled:opacity-40"
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
            onChange={(e) => handleAmountChange(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
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
            onChange={(e) => handleRefChange(e.target.value)}
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
          {!isActual && previewRemainderPaise > 0 && (
            <p className="mt-[var(--space-1)] text-xs" aria-live="polite">
              {t('remittance.preview.unallocated', { amount: formatINR(previewRemainderPaise, locale) })}
            </p>
          )}
          {isActual && outcome.replayed && (
            <p className="mt-[var(--space-1)] text-xs" aria-live="polite">
              {t('remittance.outcomes.replayed')}
            </p>
          )}
          {isActual && outcome.mismatchMessage !== null && (
            <p className="mt-[var(--space-1)] text-xs" aria-live="polite">
              {outcome.mismatchMessage}
            </p>
          )}
          {isActual && outcome.creditCreatedPaise > 0 && (
            <p className="mt-[var(--space-1)] text-xs" aria-live="polite">
              {t('remittance.actual.creditCreated', {
                amount: formatINR(outcome.creditCreatedPaise, locale),
              })}
            </p>
          )}
        </div>
      </div>
    </Drawer>
  );
}
