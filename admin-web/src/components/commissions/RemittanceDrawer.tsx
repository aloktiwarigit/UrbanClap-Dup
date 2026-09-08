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

// Fix round 2 (N2): rural/low-connectivity networks (the Ayodhya/UP pivot) can leave this request
// hanging well past what an operator will wait. Without a bound, `submitting` never clears and the
// drawer — deliberately unclosable mid-flight per C1 — becomes unclosable *forever*, with no
// escape but a page reload. 20s is generous but bounded. This is a client-side watchdog
// (`Promise.race`, not `AbortSignal`) deliberately: it re-enables the drawer regardless of whether
// the underlying request ever settles, and it is exercisable with fake timers in tests, which a
// real network abort is not.
const REQUEST_TIMEOUT_MS = 20_000;

function timeoutAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(Object.assign(new Error('RemittanceDrawer: record request timed out'), { isTimeout: true }));
    }, ms);
  });
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

function isTimeoutError(err: unknown): boolean {
  return isRecord(err) && err.isTimeout === true;
}

function methodLabel(method: 'UPI' | 'CASH_DEPOSIT', t: ReturnType<typeof useTranslations>): string {
  return method === 'UPI' ? t('remittance.fields.methodUpi') : t('remittance.fields.methodCash');
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

interface PendingAttempt {
  key: string;
  amountPaise: number;
  method: 'UPI' | 'CASH_DEPOSIT';
  ref: string;
}

function pendingAttemptStorageName(technicianId: string): string {
  return `commissions.remittance.pendingAttempt.${technicianId}`;
}

function mintKey(): string {
  return crypto.randomUUID();
}

/**
 * Fix round 1 (C1/C2) + fix round 2 (N1/N3). The pending idempotency key is scoped to the
 * *technician*, not to the drawer's open/close lifecycle, and persisted in `localStorage` — not
 * `sessionStorage` (fix round 2, N3): `sessionStorage` is per browsing *context* (per tab), so two
 * tabs open on the same technician would each mint their own key and could both succeed, producing
 * two real remittances. `localStorage` is shared across every tab for this origin, which is the
 * only thing that actually prevents that. This makes the pending record slightly longer-lived than
 * a tab close would have made it, but that wedge is now escapable (see `clearPendingAttempt`,
 * called from the operator's explicit "discard" action) — an unresolvable cross-tab double charge
 * is not.
 *
 * `PendingAttempt` carries the fingerprint the key was minted for (`amountPaise`, `method`, `ref`),
 * not just the key itself (fix round 2, N1). Without it, a 409 `IDEMPOTENCY_MISMATCH` had nothing
 * true to say — the old copy blamed whatever reference the operator had *just* typed, which had
 * never been used for anything. The fingerprint lets the drawer instead describe the *actual*
 * unconfirmed attempt (amount/method/reference) that key was minted for.
 */
function loadPendingAttempt(technicianId: string): PendingAttempt | null {
  try {
    const raw = window.localStorage.getItem(pendingAttemptStorageName(technicianId));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      isRecord(parsed) &&
      typeof parsed.key === 'string' &&
      typeof parsed.amountPaise === 'number' &&
      (parsed.method === 'UPI' || parsed.method === 'CASH_DEPOSIT') &&
      typeof parsed.ref === 'string'
    ) {
      return { key: parsed.key, amountPaise: parsed.amountPaise, method: parsed.method, ref: parsed.ref };
    }
    return null;
  } catch {
    // localStorage unavailable (privacy mode, embedded webview), or a malformed/legacy entry —
    // either way, treat it as "no pending attempt" rather than throwing. The ref-held key still
    // protects retries within this page load even when storage cannot be read at all.
    return null;
  }
}

/**
 * Only called once per key — the first time it is actually sent to the server (see the
 * write-if-absent check at the call site in `handleSubmit`). A key already pending keeps its
 * *original* fingerprint even if the operator changes the amount/ref before retrying with the same
 * key; overwriting it would erase the one thing a later mismatch message needs to say.
 */
function savePendingAttempt(technicianId: string, attempt: PendingAttempt): void {
  try {
    window.localStorage.setItem(pendingAttemptStorageName(technicianId), JSON.stringify(attempt));
  } catch {
    // best-effort persistence only
  }
}

function clearPendingAttempt(technicianId: string): void {
  try {
    window.localStorage.removeItem(pendingAttemptStorageName(technicianId));
  } catch {
    // best-effort
  }
}

/**
 * The remittance drawer (design doc §5, task-8 brief, fix rounds 1-2) — the one place in the
 * commission console that moves real money. Invariants this file exists to protect:
 *
 * 1. The idempotency key is keyed to the *technician* (see `loadPendingAttempt` above), not to the
 *    drawer's open/close lifecycle, and shared across tabs via `localStorage` (fix round 2, N3 —
 *    `sessionStorage` is per-tab and cannot stop two tabs from both recording a real payment). It
 *    survives retries of the same attempt, survives the drawer being closed and reopened after an
 *    ambiguous failure, and survives a page reload. It is deleted only after a *successful* record
 *    — a genuinely abandoned attempt keeps its key until that technician's next successful
 *    payment, which is the safe direction: a replay returns the original receipt instead of
 *    charging again.
 * 2. That safety has a cost the drawer must not let become a dead end (fix round 2, N1): an
 *    abandoned key otherwise blocks *every* later distinct payment for that technician with an
 *    inscrutable 409, forever. The key is never silently swapped just because the operator's
 *    current input looks different — that would defeat (1). Instead, a 409 `IDEMPOTENCY_MISMATCH`
 *    surfaces the *actual* unconfirmed attempt (amount/method/reference, from the fingerprint
 *    persisted alongside the key) and offers an explicit, risk-labelled "discard the pending
 *    attempt" action that clears it so the next submission can mint a fresh one.
 * 3. The drawer cannot be closed (backdrop, ×, Escape, or Cancel) while a request is in flight —
 *    a mid-flight close would let the promise resolve into a state the operator never sees,
 *    inviting a "did it go through? let me try again" double payment. Symmetrically (fix round 2,
 *    N2), the request itself cannot hang forever and hold the drawer hostage: a bounded
 *    client-side watchdog (`REQUEST_TIMEOUT_MS`) always releases `submitting` back to the
 *    operator, without touching the pending key.
 * 4. The allocation preview is computed locally, oldest-due-first, for display only. It is
 *    rendered behind a dashed left rule in `--color-text-faint` under a plain label. On success it
 *    is replaced in place by the server's actual `allocations` at full strength; if the two
 *    disagree, or the record was a replay, or an overpayment created a credit, that is disclosed
 *    persistently inline (not a five-second toast, and — fix round 2, M1 — inside a single
 *    always-mounted `aria-live` container so assistive tech actually announces it) — never a
 *    silent swap.
 * 5. Money crosses the rupee/paise boundary exactly once, via `rupeesToPaise` — never hand-parsed,
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
  // Fix round 2 (N1): populated only from a live 409 IDEMPOTENCY_MISMATCH response — the fingerprint
  // of the *actual* unconfirmed attempt that owns the currently-pending key, so the drawer can say
  // what is true instead of blaming whatever the operator just typed.
  const [conflict, setConflict] = useState<PendingAttempt | null>(null);

  // Never regenerated on retry — only reloaded/minted per technician when the drawer opens (see
  // `loadPendingAttempt`), and cleared only after a successful record or an explicit discard.
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Fix round 2 (N1): reuse an existing pending key verbatim when one exists; mint fresh only
    // when none does. Never minted based on any comparison with the current inputs — see the
    // class doc comment, point 2.
    idempotencyKeyRef.current = loadPendingAttempt(technicianId)?.key ?? mintKey();
    setAmount('');
    setMethod('UPI');
    setRef('');
    setNote('');
    setValidationError(null);
    setOutcome(null);
    setConflict(null);
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
    setConflict(null);

    // Fix round 2 (N1): whatever key is currently pending for this technician is what gets sent —
    // never minted or swapped based on what the operator typed. Silently minting a new key here
    // because the inputs look different would restore the exact double-charge risk C2 exists to
    // prevent, if the earlier attempt this key belongs to actually landed. A genuine mismatch is
    // surfaced by the server's 409 below and resolved only by the operator's explicit discard.
    const idempotencyKey = idempotencyKeyRef.current ?? mintKey();
    idempotencyKeyRef.current = idempotencyKey;
    const previewAtSubmit = previewAllocations;

    // Persisted only the first time this key is actually sent (write-if-absent): if this key is
    // already the pending one, its original fingerprint is left untouched even though the operator
    // may have changed the amount/ref since — overwriting it would erase the one thing a later
    // mismatch message needs to report accurately.
    if (loadPendingAttempt(technicianId)?.key !== idempotencyKey) {
      savePendingAttempt(technicianId, { key: idempotencyKey, amountPaise: paise, method, ref: trimmedRef });
    }

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
      //
      // Raced against a bounded watchdog (fix round 2, N2) rather than left to hang indefinitely —
      // see `REQUEST_TIMEOUT_MS`. The underlying call is given its own no-op `.catch` so that, if
      // it loses the race and later rejects on its own, that rejection does not surface as an
      // unhandled promise rejection.
      const attempt = recordRemittance(params);
      attempt.catch(() => {});
      response = await Promise.race([attempt, timeoutAfter(REQUEST_TIMEOUT_MS)]);
    } catch (err) {
      setSubmitting(false);
      if (isIdempotencyMismatch(err)) {
        // Fix round 2 (N1): say what is actually true — the fingerprint of the unconfirmed attempt
        // that owns this key — rather than the old copy's false claim about the reference just
        // typed. Rendered persistently below with an explicit, risk-labelled discard action; never
        // a toast (it auto-dismisses, and this needs to stay actionable). Any toast left over from
        // an earlier attempt on this same key (e.g. the ambiguous failure that left it pending) is
        // dismissed so it does not sit stale next to this new, more specific disclosure.
        dismiss();
        setConflict(loadPendingAttempt(technicianId));
      } else if (isTimeoutError(err)) {
        show(t('remittance.errors.timeout'), 'error');
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
    clearPendingAttempt(technicianId);
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

  // Fix round 2 (N1): the operator's explicit escape hatch from the abandoned-key wedge. Discarding
  // does not resubmit anything — it only frees the technician's pending slot so the *next*
  // "Record payment" click mints a fresh key and treats the current inputs as a genuinely new
  // payment. The risk (double-charging if the discarded attempt did land) is named in the copy
  // shown alongside this action, not hidden behind a neutral label.
  function handleDiscardPending() {
    clearPendingAttempt(technicianId);
    idempotencyKeyRef.current = null;
    setConflict(null);
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

        {conflict !== null && (
          <div
            role="alert"
            className="space-y-[var(--space-2)] rounded border border-[var(--color-danger)] bg-[var(--color-surface-raised)] p-[var(--space-3)]"
          >
            <p className="text-xs text-[var(--color-danger)]">
              {t('remittance.errors.idempotencyMismatch', {
                amount: formatINR(conflict.amountPaise, locale),
                method: methodLabel(conflict.method, t),
                ref: conflict.ref,
              })}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('remittance.warnings.discardRisk')}
            </p>
            <button
              type="button"
              onClick={handleDiscardPending}
              className="text-xs font-medium text-[var(--color-danger)] underline"
            >
              {t('remittance.actions.discardPending')}
            </button>
          </div>
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
          {/*
            Fix round 2 (M1): a single container, always mounted alongside this block (not one
            `aria-live` region per disclosure, mounted only when its content appears) — most
            assistive tech does not announce a live region's initial content when the region and
            its content are inserted in the same update. Keeping the container present from the
            first render and only ever changing its children is what makes the mutation
            announceable.
          */}
          <div data-testid="allocation-disclosures" aria-live="polite" className="mt-[var(--space-1)] space-y-[var(--space-1)]">
            {!isActual && previewRemainderPaise > 0 && (
              <p className="text-xs">
                {t('remittance.preview.unallocated', { amount: formatINR(previewRemainderPaise, locale) })}
              </p>
            )}
            {isActual && outcome.replayed && <p className="text-xs">{t('remittance.outcomes.replayed')}</p>}
            {isActual && outcome.mismatchMessage !== null && (
              <p className="text-xs">{outcome.mismatchMessage}</p>
            )}
            {isActual && outcome.creditCreatedPaise > 0 && (
              <p className="text-xs">
                {t('remittance.actual.creditCreated', {
                  amount: formatINR(outcome.creditCreatedPaise, locale),
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
