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

// Fix round 2 (N2) + fix round 3 (Minor): rural/low-connectivity networks (the Ayodhya/UP pivot)
// can leave this request hanging well past what an operator will wait. Without a bound,
// `submitting` never clears and the drawer — deliberately unclosable mid-flight per C1 — becomes
// unclosable *forever*, with no escape but a page reload. Raised from 20s to 45s this round: every
// premature timeout leaves a wedged key behind (the request may still land after the client gives
// up on it), and 20s was tight enough to fire on exactly the connections this product targets. This
// is a client-side watchdog (`Promise.race`, not `AbortSignal`) deliberately: it re-enables the
// drawer regardless of whether the underlying request ever settles, and it is exercisable with fake
// timers in tests, which a real network abort is not.
const REQUEST_TIMEOUT_MS = 45_000;

interface Watchdog {
  promise: Promise<never>;
  cancel: () => void;
}

// Fix round 3 (Minor): the timer used to always fire, even when the real request won the race —
// harmless (nothing observes the rejection once the race has settled the other way) but wasteful,
// and it left a live timer outliving the component in tests unless carefully awaited out. Returning
// a `cancel()` alongside the promise lets the caller clear it in a `finally` once the race is over.
function createWatchdog(ms: number): Watchdog {
  // `number`, not `ReturnType<typeof window.setTimeout>` — @types/node's ambient `setTimeout`
  // augments the global scope and can make that alias resolve to `NodeJS.Timeout` instead of the
  // DOM lib's actual return type, even though this file always calls the `window.`-qualified form.
  let timeoutId: number | undefined;
  const promise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(Object.assign(new Error('RemittanceDrawer: record request timed out'), { isTimeout: true }));
    }, ms);
  });
  return {
    promise,
    cancel: () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    },
  };
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

// Fix round 3: the fingerprint fields are nullable because the record is now written at *mint*
// time (see the open effect), before the operator has typed an amount/method/ref — a reservation
// with no fingerprint yet. `handleSubmit` fills them in once, the first time this key is actually
// sent. A record with null fingerprint fields is "pending but not yet attempted"; one with all
// three filled is "an unconfirmed attempt" — see `hasFingerprint` below.
interface PendingAttempt {
  key: string;
  amountPaise: number | null;
  method: 'UPI' | 'CASH_DEPOSIT' | null;
  ref: string | null;
}

type PendingAttemptFingerprint = { [K in keyof PendingAttempt]: NonNullable<PendingAttempt[K]> };

function hasFingerprint(attempt: PendingAttempt): attempt is PendingAttemptFingerprint {
  return attempt.amountPaise !== null && attempt.method !== null && attempt.ref !== null;
}

function pendingAttemptStorageName(technicianId: string): string {
  return `commissions.remittance.pendingAttempt.${technicianId}`;
}

function mintKey(): string {
  return crypto.randomUUID();
}

/**
 * Fix round 1 (C1/C2) + fix round 2 (N1/N3) + fix round 3 (the N3 regression). The pending
 * idempotency key is scoped to the *technician*, not to the drawer's open/close lifecycle, and
 * persisted in `localStorage` — not `sessionStorage` (fix round 2, N3): `sessionStorage` is per
 * browsing *context* (per tab), so two tabs open on the same technician would each mint their own
 * key and could both succeed, producing two real remittances. `localStorage` is shared across
 * every tab for this origin, which is the only thing that actually prevents that.
 *
 * Fix round 3: round 2 moved the *write* from mint time (the open effect) to submit time, which
 * reopened the exact two-tab race N3 was written to close — tab A opens (key only in its ref, not
 * yet in storage), tab B opens before A submits, reads nothing, mints its own key. Minting and
 * persisting must be the same atomic step, which is why `savePendingAttempt` is called from the
 * open effect again, immediately after `mintKey()`, with the fingerprint fields left `null` until
 * `handleSubmit` fills them in. This makes the pending record slightly longer-lived than a tab
 * close would have made it, but that wedge is escapable (see `clearPendingAttempt`, called from the
 * operator's explicit "discard" action) — an unresolvable cross-tab double charge is not.
 *
 * The fingerprint (`amountPaise`, `method`, `ref`) is what makes a 409 `IDEMPOTENCY_MISMATCH`
 * (fix round 2, N1) able to say something true — the actual unconfirmed attempt that key was
 * minted for — rather than the old copy's false claim about whatever the operator had just typed.
 * It is filled in exactly once per key, the first time that key is actually sent (write-if-*absent*
 * — round 2's version compared *keys*, which meant a same-key retry with different inputs silently
 * overwrote the original fingerprint; this round's `hasFingerprint` check compares *fingerprint
 * presence*, which is what "absent" actually means here).
 */
function loadPendingAttempt(technicianId: string): PendingAttempt | null {
  try {
    const raw = window.localStorage.getItem(pendingAttemptStorageName(technicianId));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      isRecord(parsed) &&
      typeof parsed.key === 'string' &&
      (parsed.amountPaise === null || typeof parsed.amountPaise === 'number') &&
      (parsed.method === null || parsed.method === 'UPI' || parsed.method === 'CASH_DEPOSIT') &&
      (parsed.ref === null || typeof parsed.ref === 'string')
    ) {
      return { key: parsed.key, amountPaise: parsed.amountPaise, method: parsed.method, ref: parsed.ref };
    }
    return null;
  } catch {
    // localStorage unavailable (privacy mode, embedded webview), or a malformed/legacy entry —
    // either way, treat it as "no pending attempt" rather than throwing. The ref-held key still
    // protects retries within this page load even when storage cannot be read at all. Fix round 3
    // (Important): this also means a live 409 can occur with nothing readable to explain it —
    // callers must fall back to a generic disclosure rather than rendering nothing. See
    // `handleSubmit`'s catch block.
    return null;
  }
}

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
 * The remittance drawer (design doc §5, task-8 brief, fix rounds 1-3) — the one place in the
 * commission console that moves real money. Invariants this file exists to protect:
 *
 * 1. The idempotency key is keyed to the *technician* (see `loadPendingAttempt` above), not to the
 *    drawer's open/close lifecycle, and shared across tabs via `localStorage` (fix round 2, N3 —
 *    `sessionStorage` is per-tab and cannot stop two tabs from both recording a real payment). It
 *    survives retries of the same attempt, survives the drawer being closed and reopened after an
 *    ambiguous failure, and survives a page reload. It is deleted only after a *successful* record
 *    — a genuinely abandoned attempt keeps its key until that technician's next successful
 *    payment, which is the safe direction: a replay returns the original receipt instead of
 *    charging again. Fix round 3: minting the key and persisting it are the *same atomic step*, in
 *    the open effect — round 2 moved the persist to submit time, which reopened the exact two-tab
 *    race N3 exists to close (tab A opens, tab B opens before A submits, B reads nothing and mints
 *    its own key). The fingerprint fields are filled in later, at first submit, once they exist.
 * 2. That safety has a cost the drawer must not let become a dead end (fix round 2, N1): an
 *    abandoned key otherwise blocks *every* later distinct payment for that technician with an
 *    inscrutable 409, forever. The key is never silently swapped just because the operator's
 *    current input looks different — that would defeat (1). Instead, a 409 `IDEMPOTENCY_MISMATCH`
 *    surfaces the *actual* unconfirmed attempt (amount/method/reference, from the fingerprint
 *    persisted alongside the key — falling back to a generic disclosure, never silence, when that
 *    fingerprint cannot be read) and offers an explicit, risk-labelled "discard the pending
 *    attempt" action that clears it so the next submission can mint a fresh one. Fix round 3: a
 *    stale wedge should not require a failed round trip to discover, so it is also disclosed
 *    proactively at drawer-open. Fix round 4: those are two *different* banners, not one reused
 *    twice — a polite `--color-warn` statement of fact with no discard action (variant A, whose
 *    content mirrors storage and therefore survives an unrelated failed submit) versus the red,
 *    assertive 409 result that carries the discard action (variant B). Discard is scoped to the
 *    409 on purpose: see the render block for why offering it any earlier is the dangerous move.
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
  // Fix round 2 (N1): the fingerprint of the unconfirmed pending attempt named by a *live* 409
  // IDEMPOTENCY_MISMATCH response. This is variant B of the disclosure (see the render block): a
  // failure result, red, assertive, and the only place the discard action is offered.
  const [conflict, setConflict] = useState<PendingAttemptFingerprint | null>(null);
  // Fix round 4: variant A — the *proactive* disclosure of an already-fingerprinted pending attempt
  // for this technician. Round 3 introduced this behaviour but reused the 409 banner wholesale,
  // which made a statement of fact shout like a failure and put the discard action on screen at the
  // one moment it is guaranteed to be the wrong move (see the render block and design §5). Kept as
  // a mirror of *storage*, not as a result of the last submission: it is re-derived from
  // `loadPendingAttempt` on open and after a settled submit, never blanket-cleared at the top of
  // `handleSubmit` the way the 409-derived flags are — a 503 does not change what is wedged. Fix
  // round 5 (I1): the one exception is a failure whose stored fingerprint is exactly what was just
  // submitted, which is the operator's *own* attempt rather than a wedge they walked into; see the
  // catch block for why describing that back to them is both wrong and self-contradictory.
  const [pendingDisclosure, setPendingDisclosure] = useState<PendingAttemptFingerprint | null>(null);
  // Fix round 3 (Important): a 409 occurred but the pending record could not be read (storage
  // unavailable, or — theoretically — present with no fingerprint yet). `conflict` alone cannot
  // distinguish "no conflict" from "a conflict we can't describe", and rendering nothing on a money
  // screen after a click reads as "the button is broken" and invites a real double-submit.
  const [conflictUnreadable, setConflictUnreadable] = useState(false);

  // Never regenerated on retry — only reloaded/minted per technician when the drawer opens (see
  // `loadPendingAttempt`), and cleared only after a successful record or an explicit discard.
  const idempotencyKeyRef = useRef<string | null>(null);

  // Fix round 4: the single place variant A is computed — always straight from storage, never from
  // a remembered submission outcome. Called on open and after every settled submit (success,
  // ambiguous failure, timeout, 409) so the banner tracks what is actually wedged rather than
  // whatever the last request happened to do.
  function refreshPendingDisclosure() {
    const stored = loadPendingAttempt(technicianId);
    setPendingDisclosure(stored !== null && hasFingerprint(stored) ? stored : null);
  }

  useEffect(() => {
    if (!open) return;
    // Fix round 3: mint-and-persist is one atomic step, restored here from `handleSubmit` (see the
    // class doc comment, point 1, and `loadPendingAttempt`'s doc comment for why round 2's
    // submit-time write reopened the two-tab race). An existing pending attempt for this technician
    // is reused verbatim, key and fingerprint alike; only when none exists is a fresh key minted —
    // and persisted immediately, with the fingerprint left `null` until a submission fills it in.
    const existing = loadPendingAttempt(technicianId);
    if (existing !== null) {
      idempotencyKeyRef.current = existing.key;
    } else {
      const minted = mintKey();
      idempotencyKeyRef.current = minted;
      savePendingAttempt(technicianId, { key: minted, amountPaise: null, method: null, ref: null });
    }
    // Fix round 3 (Important), reshaped in round 4: proactive disclosure. If this pending attempt
    // already has a fingerprint (someone — this tab or another — actually submitted it before it
    // went unconfirmed), say so now rather than waiting for a 409 that may never come if the
    // operator simply types a brand-new, non-colliding reference. A record with no fingerprint yet
    // (a bare reservation nobody has attempted) discloses nothing — there is nothing to disclose.
    setPendingDisclosure(existing !== null && hasFingerprint(existing) ? existing : null);
    setConflict(null);
    setConflictUnreadable(false);
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
    // Only the 409-derived flags are cleared here: they describe the *result of the last
    // submission*, so a new submission invalidates them. `pendingDisclosure` deliberately is not —
    // it describes what is in storage, and a failed submit (a 503, a timeout) changes nothing about
    // that. Round 3 cleared both here, so opening onto a wedge and then hitting any error made the
    // disclosure vanish while the wedge itself was untouched. It is re-derived from storage on every
    // settled outcome below instead.
    setConflict(null);
    setConflictUnreadable(false);

    // Fix round 2 (N1): whatever key is currently pending for this technician is what gets sent —
    // never minted or swapped based on what the operator typed. Silently minting a new key here
    // because the inputs look different would restore the exact double-charge risk C2 exists to
    // prevent, if the earlier attempt this key belongs to actually landed. A genuine mismatch is
    // surfaced by the server's 409 below and resolved only by the operator's explicit discard. In
    // the normal flow this key was already minted *and persisted* by the open effect (fix round 3);
    // the `?? mintKey()` fallback only covers a re-submission in the same open session after an
    // earlier success already cleared the ref (see the success branch below).
    const idempotencyKey = idempotencyKeyRef.current ?? mintKey();
    idempotencyKeyRef.current = idempotencyKey;
    const previewAtSubmit = previewAllocations;

    // Fix round 3: write-if-absent now means "this key has no fingerprint yet", not "this key
    // differs from whatever is currently stored". Round 2's version compared keys, so a same-key
    // retry with different inputs (the exact abandoned-key-wedge scenario) silently overwrote the
    // original fingerprint — which then made the *next* mismatch report the operator's own just-
    // typed input as "the previous attempt", the precise false-blame N1 exists to eliminate. A
    // fingerprint, once filled in for a key, is never touched again by this check.
    const existingForThisKey = loadPendingAttempt(technicianId);
    if (
      existingForThisKey === null ||
      existingForThisKey.key !== idempotencyKey ||
      !hasFingerprint(existingForThisKey)
    ) {
      savePendingAttempt(technicianId, { key: idempotencyKey, amountPaise: paise, method, ref: trimmedRef });
    }

    setSubmitting(true);
    let response: RecordRemittanceResponse;
    const watchdog = createWatchdog(REQUEST_TIMEOUT_MS);
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
      response = await Promise.race([attempt, watchdog.promise]);
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
        const pending = loadPendingAttempt(technicianId);
        // Fix round 3 (Important): a 409 with nothing readable to explain it (storage unavailable,
        // or — in principle — a pending record with no fingerprint yet) must still say *something*.
        // Rendering nothing here reads as "the button did nothing" and invites a real double-submit.
        if (pending !== null && hasFingerprint(pending)) {
          setConflict(pending);
        } else {
          setConflictUnreadable(true);
        }
      } else if (isTimeoutError(err)) {
        show(t('remittance.errors.timeout'), 'error');
      } else {
        // Fix round 1 (Minor): an ambiguous failure (timeout, 5xx, dropped connection) does not
        // mean the payment didn't land — only that this client never saw the response. Assert
        // less than "could not record".
        show(t('remittance.errors.recordFailed'), 'error');
      }
      // Fix round 4: re-derive variant A from storage on every failed outcome — a pre-existing
      // wedge is unchanged by this failure and must still be disclosed afterwards.
      //
      // Fix round 5 (I1): but *only* a wedge the operator did not just create. Round 4 refreshed
      // unconditionally, so a clean drawer + a 503 raised variant A describing the operator's own
      // attempt, one second after their own click, with those exact values still in the inputs
      // above it — "an earlier attempt ... ₹200.00 via UPI, reference ref-1" invites the reading
      // that two ₹200/ref-1 attempts are outstanding, which is the wrong belief to induce here. It
      // also contradicted the toast rendered in the same update: `recordFailed`/`timeout` say
      // "check the ledger before trying again", variant A says "record it again". Two live regions,
      // one event, opposed instructions. When the stored fingerprint IS what was just submitted,
      // the refresh is skipped entirely — leaving whatever variant A already showed (nothing, on a
      // clean drawer; the pre-existing wedge, if there was one). Storage is untouched either way,
      // so reopening the drawer later still surfaces it through the open effect.
      const storedAfterFailure = loadPendingAttempt(technicianId);
      const isOwnJustSubmittedAttempt =
        storedAfterFailure !== null &&
        hasFingerprint(storedAfterFailure) &&
        storedAfterFailure.amountPaise === paise &&
        storedAfterFailure.method === method &&
        storedAfterFailure.ref === trimmedRef;
      if (!isOwnJustSubmittedAttempt) refreshPendingDisclosure();
      return;
    } finally {
      // Fix round 3 (Minor): the watchdog timer used to always fire, even when the real request won
      // the race — harmless, but wasteful, and it left a live timer outliving the settled race.
      watchdog.cancel();
    }
    setSubmitting(false);

    // Success. The key is retired now, unconditionally, before anything else runs.
    clearPendingAttempt(technicianId);
    idempotencyKeyRef.current = null;
    // Storage no longer holds a pending attempt, so variant A has nothing left to describe.
    setPendingDisclosure(null);

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
    // Fix round 3 (Minor): this button cannot currently be clicked mid-flight — `submitting` hides
    // the conflict banner's own trigger paths — but that is an emergent consequence of statement
    // ordering elsewhere, not a guarantee this function makes itself. On the most dangerous control
    // on this screen, the guarantee belongs here too.
    if (submitting) return;
    clearPendingAttempt(technicianId);
    idempotencyKeyRef.current = null;
    setConflict(null);
    setConflictUnreadable(false);
    // Storage is now empty for this technician; variant A must not outlive the record it mirrors.
    setPendingDisclosure(null);
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

        {/*
          Variant A — the proactive disclosure (fix round 4, splitting what round 3 had merged into
          the 409 banner below). Three deliberate differences from variant B:

          1. `role="status"` (polite), not `role="alert"`. Opening a drawer is not an event entitled
             to interrupt a screen reader mid-sentence. It also keeps this off the assertive channel
             the validation error owns — the same reasoning as the comment in `SummaryBand.tsx`
             about not stacking simultaneous live regions on one screen.
          2. `--color-warn`, not the danger palette. This is a fact about state, not a failure; the
             operator has done nothing wrong by opening a drawer onto someone else's stale wedge.
          3. **No discard action.** At drawer-open, discard is the only control on this surface that
             can produce a real double charge: if the operator is about to record the same payment
             this key belongs to, submitting under it replays and returns the original receipt (and
             clears the pending record as a side effect); if it is a genuinely different payment,
             they get the 409 and the escape hatch appears *there*, having proven it is needed.
             Offering it before either is established puts the most dangerous control on screen at
             the one moment it is guaranteed to be wrong. Design §5 scopes discard to the 409.

          Suppressed while variant B is showing — a live 409 names the same pending attempt with
          more authority, and two banners about one record is noise — and while a request is in
          flight (fix round 5, M1): `handleSubmit` clears `conflict` at the top, which would
          otherwise unsuppress a variant A left populated by the previous 409 and flip the banner
          red-with-discard → amber-without-discard → red across the in-flight window, the discard
          button visibly vanishing and returning.

          The region itself is mounted unconditionally with empty children, and only its *content*
          appears and disappears (fix round 5, I2) — the same shape as the `allocation-disclosures`
          container below, and for the reason spelled out in its comment: most assistive tech does
          not announce a live region whose region and content are inserted in the same update, so
          round 4's conditionally-mounted `role="status"` would have been silent. `empty:m-0` keeps
          the always-present-but-empty wrapper from claiming a slot in the parent's `space-y`
          rhythm (`:empty` + class out-specifies Tailwind v4's zero-specificity `:where()` space
          selector, so no `!important` is needed).
        */}
        <div role="status" data-testid="pending-attempt-disclosure" className="empty:m-0">
          {pendingDisclosure !== null && conflict === null && !conflictUnreadable && !submitting && (
            <div className="space-y-[var(--space-2)] rounded border border-[var(--color-warn)] bg-[var(--color-surface-raised)] p-[var(--space-3)]">
              <p className="text-xs text-[var(--color-warn)]">
                {t('remittance.warnings.pendingAttempt', {
                  amount: formatINR(pendingDisclosure.amountPaise, locale),
                  method: methodLabel(pendingDisclosure.method, t),
                  ref: pendingDisclosure.ref,
                })}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t('remittance.warnings.pendingAttemptSafeMove')}
              </p>
            </div>
          )}
        </div>

        {/*
          Variant B — the live 409 IDEMPOTENCY_MISMATCH (fix round 2, N1). Red, assertive, and the
          one place the discard action is offered: by this point the server has proven the pending
          attempt is a *different* payment from the one being recorded, so freeing the slot is the
          only way forward. `conflictUnreadable` covers a mismatch that is known to have happened
          but has nothing left to quote (storage unreadable) — never silence.
        */}
        {(conflict !== null || conflictUnreadable) && (
          <div
            role="alert"
            className="space-y-[var(--space-2)] rounded border border-[var(--color-danger)] bg-[var(--color-surface-raised)] p-[var(--space-3)]"
          >
            <p className="text-xs text-[var(--color-danger)]">
              {conflict !== null
                ? t('remittance.errors.idempotencyMismatch', {
                    amount: formatINR(conflict.amountPaise, locale),
                    method: methodLabel(conflict.method, t),
                    ref: conflict.ref,
                  })
                : t('remittance.errors.idempotencyMismatchGeneric')}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t('remittance.warnings.discardRisk')}
            </p>
            <button
              type="button"
              onClick={handleDiscardPending}
              disabled={submitting}
              className="text-xs font-medium text-[var(--color-danger)] underline disabled:opacity-40"
            >
              {t('remittance.actions.discardPending')}
            </button>
          </div>
        )}

        <div
          data-testid={isActual ? undefined : 'allocation-preview'}
          className={
            isActual
              ? 'pl-[var(--space-3)] border-l border-[var(--color-border)] text-[var(--color-text)] transition-[opacity,color,border-color] duration-[220ms] ease-out motion-reduce:transition-none'
              : 'pl-[var(--space-3)] border-l border-dashed border-[var(--color-text-faint)] text-[var(--color-text-faint)] transition-[opacity,color,border-color] duration-[220ms] ease-out motion-reduce:transition-none'
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
