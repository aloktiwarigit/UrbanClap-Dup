import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RemittanceDrawer } from '../../../src/components/commissions/RemittanceDrawer';
import type { CommissionLedgerDetail, RecordRemittanceResponse } from '../../../src/api/commissions';

// task-8 brief + design doc §5, fix rounds 1-2. This is the one place in the commission console
// that moves real money: the idempotency key must survive retries of the same attempt AND survive
// the drawer being closed and reopened after an ambiguous failure (fix round 1, C1/C2), the drawer
// must not be closeable mid-flight, and the client-computed allocation preview must never be
// presented as truth — the server recomputes it authoritatively and this drawer must say so
// explicitly, persistently, when the two disagree, rather than swapping the numbers in silently.
// Fix round 2 adds: the abandoned key must not become a wedge that blocks every later payment
// (N1), the pending record moved to localStorage so two tabs cannot double-record (N3), a bounded
// watchdog so a hung request cannot strand the drawer closed forever (N2), and the persistent
// disclosures must actually be persistent, not just textually present somewhere on the page (M2).

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'remittance.title': 'Record payment',
      'remittance.fields.amountLabel': 'Amount (₹)',
      'remittance.fields.methodLabel': 'Method',
      'remittance.fields.methodUpi': 'UPI',
      'remittance.fields.methodCash': 'Cash deposit',
      'remittance.fields.refLabel': 'Reference',
      'remittance.fields.noteLabel': 'Note (optional)',
      'remittance.preview.label': 'Preview. The server recalculates when you record this.',
      'remittance.preview.empty': 'No amount entered yet.',
      'remittance.preview.unallocated': '{amount} will not be allocated to any due job — it will become a credit.',
      'remittance.actual.label': 'Recorded allocation',
      'remittance.actual.creditCreated': 'Credit created: {amount}.',
      'remittance.actions.cancel': 'Cancel',
      'remittance.actions.submit': 'Record payment',
      'remittance.actions.discardPending': 'This is a different payment. Discard the pending attempt.',
      'remittance.warnings.discardRisk':
        'If that earlier attempt did land, discarding it and recording this payment will charge the technician twice.',
      'remittance.warnings.pendingAttempt':
        'An earlier attempt for this technician has not been confirmed: {amount} via {method}, reference {ref}.',
      'remittance.warnings.pendingAttemptSafeMove':
        'If this is that same payment, record it again — you will get the original receipt back, not a second charge.',
      'remittance.errors.invalidAmount': 'Enter an amount greater than ₹0, with at most 2 decimal places.',
      'remittance.errors.refRequired': 'A reference is required.',
      'remittance.errors.recordFailed':
        "Could not confirm this payment was recorded. Check the technician's ledger before trying again.",
      'remittance.errors.timeout':
        'This is taking longer than expected. The payment may or may not have gone through — check the technician\'s ledger before trying again.',
      'remittance.errors.idempotencyMismatch':
        'A previous attempt for this technician has not been confirmed: {amount} via {method}, reference {ref}.',
      'remittance.errors.idempotencyMismatchGeneric':
        "A previous attempt for this technician has not been confirmed, but its details aren't available on this device.",
      'remittance.outcomes.success': 'Payment recorded',
      'remittance.outcomes.replayed': 'Already recorded. This is the original receipt, not a second payment.',
      'remittance.outcomes.recomputePending': 'Recorded. The balance will catch up shortly.',
      'remittance.outcomes.allocationMismatch':
        'Allocated differently than previewed. Preview showed {previewAmount} across {previewCount} jobs; recorded {actualAmount} across {actualCount} jobs.',
      'remittance.outcomes.allocationResplit':
        'Allocated differently than previewed. {bookings} received a different share of the same total.',
    };
    const template = dictionary[key] ?? `[${key}]`;
    if (!params) return template;
    return Object.entries(params).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template,
    );
  },
  useLocale: () => 'en',
}));

const { recordRemittance } = vi.hoisted(() => ({
  recordRemittance: vi.fn(),
}));
vi.mock('@/api/commissions', () => ({
  recordRemittance,
}));

function receivable(
  overrides: Partial<CommissionLedgerDetail['receivables'][number]>,
): CommissionLedgerDetail['receivables'][number] {
  return {
    id: overrides.bookingId ?? 'b1',
    bookingId: 'b1',
    technicianId: 't1',
    partitionKey: 't1',
    serviceId: 's1',
    categoryId: 'c1',
    bookingAmount: 67390,
    commissionBps: 2000,
    commissionDue: 15000,
    commissionResolvedFrom: 'SERVICE',
    remittanceStatus: 'DUE',
    remittedAmount: 0,
    createdAt: '2026-05-08T04:57:40.119Z',
    serviceName: 'AC Deep Clean',
    outstandingPaise: 15000,
    ...overrides,
  };
}

// Total outstanding across these two rows is ₹250.00 (25000 paise).
const dueRows: CommissionLedgerDetail['receivables'] = [
  receivable({
    id: 'b1',
    bookingId: 'b1',
    createdAt: '2026-05-08T04:57:40.119Z',
    commissionDue: 15000,
    outstandingPaise: 15000,
    serviceName: 'Older job',
  }),
  receivable({
    id: 'b2',
    bookingId: 'b2',
    createdAt: '2026-05-09T03:26:15.061Z',
    commissionDue: 10000,
    outstandingPaise: 10000,
    serviceName: 'Newer job',
  }),
];

function okResponse(overrides: Partial<RecordRemittanceResponse> = {}): RecordRemittanceResponse {
  return {
    remittance: {
      id: 'rem-1',
      docType: 'REMITTANCE',
      technicianId: 't1',
      partitionKey: 't1',
      amountPaise: 20000,
      method: 'UPI',
      ref: 'ref-1',
      allocations: [
        { bookingId: 'b1', paise: 15000 },
        { bookingId: 'b2', paise: 5000 },
      ],
      creditCreatedPaise: 0,
      recordedByAdminId: 'admin-1',
      idempotencyKey: 'k1',
      createdAt: '2026-09-07T10:00:00.000Z',
    },
    allocations: [
      { bookingId: 'b1', paise: 15000 },
      { bookingId: 'b2', paise: 5000 },
    ],
    creditCreatedPaise: 0,
    hold: {
      outstandingPaise: 0,
      dueCount: 0,
      state: 'CLEAR',
      evaluatedAt: '2026-09-07T10:00:00.000Z',
    },
    holdRecomputePending: false,
    replayed: false,
    ...overrides,
  };
}

const noop = () => {};

/**
 * `noUncheckedIndexedAccess` makes `calls[0]`/`calls[1]` possibly-undefined; this asserts exactly
 * two calls were made and narrows the tuple without a non-null assertion.
 */
function twoCalls<T>(calls: T[]): [T, T] {
  const [first, second] = calls;
  if (first === undefined || second === undefined) {
    throw new Error(`expected exactly two recorded calls, got ${calls.length}`);
  }
  return [first, second];
}

function threeCalls<T>(calls: T[]): [T, T, T] {
  const [first, second, third] = calls;
  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`expected exactly three recorded calls, got ${calls.length}`);
  }
  return [first, second, third];
}

function oneCall<T>(calls: T[]): T {
  const [first] = calls;
  if (first === undefined) {
    throw new Error(`expected exactly one recorded call, got ${calls.length}`);
  }
  return first;
}

function readPendingAttempt(technicianId: string): { key: string; amountPaise: number | null; method: string | null; ref: string | null } | null {
  const raw = window.localStorage.getItem(`commissions.remittance.pendingAttempt.${technicianId}`);
  if (raw === null) return null;
  return JSON.parse(raw) as { key: string; amountPaise: number | null; method: string | null; ref: string | null };
}

async function fillAndSubmit(amount = '200', ref = 'ref-1') {
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: ref } });
  fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
  await waitFor(() => expect(recordRemittance).toHaveBeenCalled());
}

beforeEach(() => {
  recordRemittance.mockReset();
  // Fix round 2 (N3): the pending record moved from sessionStorage to localStorage.
  window.localStorage.clear();
});

describe('RemittanceDrawer', () => {
  it('labels the allocation as a preview the server will recalculate', () => {
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    expect(screen.getByTestId('allocation-preview')).toHaveTextContent(/server recalculates/i);
  });

  it('allocates the preview oldest-due first', () => {
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    // ₹200 = 20000 paise: fully covers the older ₹150 job, then ₹50 of the newer ₹100 job.
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    const preview = screen.getByTestId('allocation-preview');
    expect(preview).toHaveTextContent('Older job');
    expect(preview).toHaveTextContent('₹150.00');
    expect(preview).toHaveTextContent('Newer job');
    expect(preview).toHaveTextContent('₹50.00');
  });

  it('flags the unallocated remainder in the preview when the amount exceeds total dues', () => {
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    // Total outstanding is ₹250; ₹300 leaves ₹50 unallocated (would become a credit).
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '300' } });
    expect(screen.getByTestId('allocation-preview')).toHaveTextContent(/₹50\.00 will not be allocated/i);
  });

  it('generates one idempotency key per attempt and reuses it across retries of that attempt', async () => {
    // A new key per retry would defeat idempotency and risk double-charging.
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    recordRemittance.mockResolvedValueOnce(okResponse());
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    await fillAndSubmit();
    const [first, second] = twoCalls(recordRemittance.mock.calls as [{ idempotencyKey: string }][]);
    expect(first[0].idempotencyKey).toBe(second[0].idempotencyKey);
  });

  it('starts a fresh idempotency key after a successful record', async () => {
    recordRemittance.mockResolvedValue(okResponse());
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    await fillAndSubmit('50', 'ref-2');
    const [first, second] = twoCalls(recordRemittance.mock.calls as [{ idempotencyKey: string }][]);
    expect(first[0].idempotencyKey).not.toBe(second[0].idempotencyKey);
  });

  // Fix round 1, C2: the brief tied the key's lifetime to the drawer opening, which meant closing
  // after an ambiguous failure and reopening minted a fresh key — a real double charge. The key
  // is scoped to the technician (localStorage, fix round 2 N3) and is deleted only on success.
  it('reuses the same idempotency key after closing and reopening following a failed attempt', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    recordRemittance.mockResolvedValueOnce(okResponse());
    const { rerender } = render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();

    rerender(
      <RemittanceDrawer open={false} technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    rerender(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();

    const [first, second] = twoCalls(recordRemittance.mock.calls as [{ idempotencyKey: string }][]);
    expect(first[0].idempotencyKey).toBe(second[0].idempotencyKey);
  });

  // Fix round 1, C1: a mid-flight close (backdrop/×/Escape/Cancel) must never be possible — the
  // promise would resolve into a state the operator never sees, inviting a real double payment.
  it('does not allow closing the drawer while a request is in flight', async () => {
    let resolveRequest: (value: RecordRemittanceResponse) => void = () => {};
    recordRemittance.mockImplementation(
      () =>
        new Promise<RecordRemittanceResponse>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const onClose = vi.fn();
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={onClose} onRecorded={noop} />,
    );
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: 'ref-1' } });
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
    await waitFor(() => expect(recordRemittance).toHaveBeenCalled());

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
    fireEvent.click(cancelButton);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    resolveRequest(okResponse());
    await screen.findByText('Payment recorded');
  });

  // Fix round 1: "highest value in the file" per the review — a fast double-click on Record must
  // never dispatch two requests against the technician's balance.
  it('dispatches exactly one request when Record is clicked twice rapidly', async () => {
    recordRemittance.mockResolvedValue(okResponse());
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: 'ref-1' } });
    const button = screen.getByRole('button', { name: /record payment/i });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(recordRemittance).toHaveBeenCalled());
    expect(recordRemittance).toHaveBeenCalledTimes(1);
  });

  it.each(['', 'abc', '-50', '0'])(
    'does not call recordRemittance for an invalid amount (%s)',
    (badAmount) => {
      render(
        <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
      );
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: badAmount } });
      fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: 'ref-1' } });
      fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
      expect(recordRemittance).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    },
  );

  it('does not call recordRemittance for an amount with more than 2 decimal places', () => {
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '1200.555' } });
    fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: 'ref-1' } });
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
    expect(recordRemittance).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not call recordRemittance when the reference is blank', () => {
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
    expect(recordRemittance).not.toHaveBeenCalled();
  });

  // Fix round 2, M2: scoped to the persistent `allocation-disclosures` container, not just
  // `findByText` anywhere on the page — a regression back to rendering this via the auto-dismissing
  // toast would still pass a bare `findByText` assertion (the toast renders the same string), but
  // this container only exists in the non-toast, persistent implementation.
  it('reports a replayed receipt as the original, not a second payment', async () => {
    recordRemittance.mockResolvedValue(okResponse({ replayed: true }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    const disclosures = await screen.findByTestId('allocation-disclosures');
    expect(within(disclosures).getByText(/original receipt, not a second payment/i)).toBeInTheDocument();
  });

  it('says the balance will catch up when the hold recompute is pending', async () => {
    recordRemittance.mockResolvedValue(okResponse({ hold: null, holdRecomputePending: true }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    // The proactive-disclosure region is always mounted (fix round 5, I2), so `role="status"` is
    // no longer unique on this screen — scope this to the toast by its text.
    const statuses = await screen.findAllByRole('status');
    expect(statuses.some((el) => /catch up shortly/i.test(el.textContent ?? ''))).toBe(true);
  });

  // Fix round 2, N1: the abandoned-key wedge. A first attempt fails ambiguously (response lost),
  // leaving its key AND fingerprint (₹200 via UPI, ref-1) durably pending. A second, genuinely
  // different attempt (₹50, ref-2) reuses that same key (per C2 — it is never swapped just because
  // the inputs changed) and the server correctly 409s it as a fingerprint mismatch. The drawer must
  // report the FIRST attempt's fingerprint — not blame ref-2, which was never used for anything —
  // and must offer a way out: discarding frees the slot so the next submission mints a fresh key.
  it('on an idempotency mismatch, reports the pending attempt that actually owns the key and lets the operator discard it', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    recordRemittance.mockRejectedValueOnce(
      Object.assign(new Error(), { status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } }),
    );
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    await fillAndSubmit('50', 'ref-2');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('₹200.00');
    expect(alert).toHaveTextContent('ref-1');
    expect(alert).not.toHaveTextContent('ref-2');
    // Fix round 4: variant B is unchanged — still assertive, still red, and still the one and only
    // place the discard action lives, because the server has now proven this is a different
    // payment. The proactive variant is suppressed while it shows: one record, one banner.
    expect(
      within(alert).getByRole('button', { name: /discard the pending attempt/i }),
    ).toBeInTheDocument();
    expect(within(alert).getByText(/will charge the technician twice/i)).toBeInTheDocument();
    expect(screen.getByTestId('pending-attempt-disclosure')).toBeEmptyDOMElement();

    recordRemittance.mockResolvedValueOnce(okResponse());
    fireEvent.click(screen.getByRole('button', { name: /discard the pending attempt/i }));
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));

    await waitFor(() => expect(recordRemittance).toHaveBeenCalledTimes(3));
    const [firstCall, secondCall, thirdCall] = threeCalls(
      recordRemittance.mock.calls as [{ idempotencyKey: string }][],
    );
    // The mismatched retry (call 2) reused call 1's key exactly, per C2.
    expect(secondCall[0].idempotencyKey).toBe(firstCall[0].idempotencyKey);
    // Discarding is the only thing that mints a new one.
    expect(thirdCall[0].idempotencyKey).not.toBe(firstCall[0].idempotencyKey);
  });

  // Fix round 3, the N3 regression: round 2 moved the pending-key write from mint time (the open
  // effect) to submit time, which reopened the exact two-tab race the move to localStorage was
  // meant to close — tab A opens (key only in its ref), tab B opens before A ever submits, reads
  // nothing, and mints its own key. Two independent component instances for the same technicianId
  // simulate two tabs sharing one `localStorage`; the fix is that opening alone — no submission
  // required — is what persists the key.
  it('two drawer instances opened for the same technician (simulating two tabs) share one pending key, persisted atomically on open', async () => {
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    // Tab A has only opened — never submitted — yet the key must already be durable.
    const afterFirstOpen = readPendingAttempt('t1');
    expect(afterFirstOpen).not.toBeNull();
    const mintedByFirstTab = (afterFirstOpen as { key: string }).key;

    recordRemittance.mockResolvedValueOnce(okResponse());
    // A second, wholly independent render — a second component instance, standing in for a second
    // browser tab open on the same technician's ledger.
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    const dialogs = screen.getAllByRole('dialog');
    const secondTab = dialogs[dialogs.length - 1];
    if (secondTab === undefined) throw new Error('expected a second dialog to be rendered');
    const secondInstance = within(secondTab);
    fireEvent.change(secondInstance.getByLabelText(/amount/i), { target: { value: '200' } });
    fireEvent.change(secondInstance.getByLabelText(/reference/i), { target: { value: 'ref-1' } });
    fireEvent.click(secondInstance.getByRole('button', { name: /record payment/i }));

    await waitFor(() => expect(recordRemittance).toHaveBeenCalledTimes(1));
    const call = oneCall(recordRemittance.mock.calls as [{ idempotencyKey: string }][]);
    // The second "tab" read and reused the first tab's key — it never minted its own.
    expect(call[0].idempotencyKey).toBe(mintedByFirstTab);
  });

  // Fix round 6 (P1): the mirror image of the test above, and the one the old
  // `idempotencyKeyRef.current ?? mintKey()` fallback could not pass. Sequence: tab A records a
  // payment successfully — this clears both A's ref *and* the stored reservation, and the drawer
  // deliberately stays open (class doc comment, point 3). Tab B then opens the same technician and
  // reserves a key purely by mounting (the test above). Tab A's operator, still looking at the same
  // open drawer, records a second, genuinely new payment. With the old fallback, A's now-null ref
  // minted a fresh key instead of reading B's reservation, and the write-if-absent block a few
  // lines below (`existingForThisKey.key !== idempotencyKey`) then overwrote B's reservation with
  // that fresh key — leaving A and B holding two different keys for the same technician and
  // defeating the exact per-technician duplicate-payment protection this file exists to guarantee.
  // The fix re-reads storage before minting, so A's second submission reuses B's reserved key
  // instead of clobbering it. To show the protection actually holds end to end, tab B then submits
  // too: because both tabs now share one key, both real network calls carry the identical
  // `idempotencyKey`, which is what lets the server's write-if-absent / 409 machinery — not a race
  // between two independently-minted keys — be the thing deciding whether a second charge happens.
  it('reuses another tab\'s reserved key instead of minting a fresh one after this tab\'s own success cleared its ref', async () => {
    recordRemittance.mockResolvedValueOnce(okResponse());
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    // Tab A's first payment succeeds — this clears A's ref and the stored reservation, per the
    // "Success. The key is retired now" branch — but the drawer stays open (invariant 3).
    await fillAndSubmit('200', 'ref-1');
    await waitFor(() => expect(readPendingAttempt('t1')).toBeNull());

    // Tab B opens on the same technician only after A's ref/storage were cleared, and reserves a
    // key purely by mounting — no submission required (see the test above).
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    const reservedByTabB = readPendingAttempt('t1');
    expect(reservedByTabB).not.toBeNull();
    const keyReservedByTabB = (reservedByTabB as { key: string }).key;

    // Tab A's operator records a second, genuinely new payment. The bug: A's null ref would mint
    // its own key here and overwrite tab B's reservation in storage.
    recordRemittance.mockResolvedValueOnce(okResponse());
    const dialogsAfterBOpened = screen.getAllByRole('dialog');
    const tabADialog = dialogsAfterBOpened[0];
    if (tabADialog === undefined) throw new Error("expected tab A's dialog to still be present");
    const tabA = within(tabADialog);
    fireEvent.change(tabA.getByLabelText(/amount/i), { target: { value: '50' } });
    fireEvent.change(tabA.getByLabelText(/reference/i), { target: { value: 'ref-2' } });
    fireEvent.click(tabA.getByRole('button', { name: /record payment/i }));
    await waitFor(() => expect(recordRemittance).toHaveBeenCalledTimes(2));

    // Tab B, unaware anything happened, submits its own (different) payment using the key it
    // reserved at mount — its ref was never invalidated by A's activity.
    recordRemittance.mockResolvedValueOnce(okResponse());
    const dialogsAfterASubmitted = screen.getAllByRole('dialog');
    const tabBDialog = dialogsAfterASubmitted[dialogsAfterASubmitted.length - 1];
    if (tabBDialog === undefined) throw new Error("expected tab B's dialog to still be present");
    const tabB = within(tabBDialog);
    fireEvent.change(tabB.getByLabelText(/amount/i), { target: { value: '75' } });
    fireEvent.change(tabB.getByLabelText(/reference/i), { target: { value: 'ref-3' } });
    fireEvent.click(tabB.getByRole('button', { name: /record payment/i }));
    await waitFor(() => expect(recordRemittance).toHaveBeenCalledTimes(3));

    const [, tabASecondCall, tabBCall] = threeCalls(
      recordRemittance.mock.calls as [{ idempotencyKey: string }][],
    );
    // The core assertion: tab A's second submission reused tab B's reservation rather than
    // minting its own — against the old fallback this fails, because A would have minted a fresh
    // key and clobbered B's reservation before B ever got to read it.
    expect(tabASecondCall[0].idempotencyKey).toBe(keyReservedByTabB);
    // And because both tabs now hold the very same key, both real submissions carry it — the
    // duplicate-payment protection this file exists to guarantee is intact across the two tabs.
    expect(tabBCall[0].idempotencyKey).toBe(keyReservedByTabB);
  });

  // Fix round 3: write-if-absent must mean "this key has no fingerprint yet", not "this key
  // differs from what's stored" (round 2's bug) — a same-key retry with different inputs must never
  // overwrite the original attempt's fingerprint in storage.
  it('does not overwrite a pending attempt\'s stored fingerprint on a same-key retry with different inputs', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    const afterFirst = readPendingAttempt('t1');
    expect(afterFirst?.amountPaise).toBe(20000);
    expect(afterFirst?.ref).toBe('ref-1');

    await fillAndSubmit('50', 'ref-2');
    const afterSecond = readPendingAttempt('t1');
    // Still the FIRST attempt's fingerprint, byte for byte — the second, different submission under
    // the same still-pending key must never have touched it.
    expect(afterSecond?.key).toBe(afterFirst?.key);
    expect(afterSecond?.amountPaise).toBe(20000);
    expect(afterSecond?.ref).toBe('ref-1');
  });

  // Fix round 3 (Important): a 409 can occur with nothing readable to explain it — deterministically
  // whenever localStorage is unavailable (privacy window, embedded webview), not just as a race.
  // Rendering nothing here reads as "the button is broken" on the one screen that moves real money.
  it('shows a generic message on an idempotency mismatch when the pending record cannot be read', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    try {
      recordRemittance.mockRejectedValue(
        Object.assign(new Error(), { status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } }),
      );
      render(
        <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
      );
      await fillAndSubmit();
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/previous attempt for this technician has not been confirmed/i);
      expect(alert).toHaveTextContent(/details aren't available/i);
      // The discard action is still offered — clearing whatever key is held in memory even though
      // nothing could be read back to confirm it.
      expect(screen.getByRole('button', { name: /discard the pending attempt/i })).toBeInTheDocument();
    } finally {
      getItemSpy.mockRestore();
    }
  });

  // Fix round 3 (Important): a stale wedge should not require a failed round trip to discover.
  // Opening the drawer onto an already-fingerprinted pending attempt (left behind by an earlier
  // ambiguous failure, possibly from a different admin on a shared machine, since localStorage
  // entries carry no TTL) must disclose it immediately — not wait for a 409 that may never come if
  // the operator simply types a non-colliding amount/reference this time.
  //
  // Fix round 4: that disclosure is its OWN variant, not the 409 banner reused. It is polite
  // (`role="status"` — opening a drawer must not interrupt a screen reader), it is a statement of
  // fact rather than a failure, it tells the operator the safe move, and — the load-bearing part —
  // it carries NO discard action. At open, discard is the only control here that can produce a real
  // double charge: recording the same payment again replays safely, and a genuinely different one
  // earns a 409, which is where the escape hatch belongs (design §5).
  it('proactively discloses a stale pending attempt as a polite status, with no discard action', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    const { rerender } = render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    // Leaves ₹200/UPI/ref-1 pending with a filled-in fingerprint, then closes without resolving it.
    await fillAndSubmit('200', 'ref-1');
    rerender(
      <RemittanceDrawer open={false} technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );

    // Reopening — no submission yet this time — must show the disclosure immediately.
    rerender(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    const status = screen.getByTestId('pending-attempt-disclosure');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveTextContent('₹200.00');
    expect(status).toHaveTextContent('ref-1');
    // It names the safe move, not just the fact.
    expect(status).toHaveTextContent(/record it again — you will get the original receipt back/i);
    // Not the assertive channel, and not the danger palette.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // The one thing that must not be reachable here.
    expect(
      screen.queryByRole('button', { name: /discard the pending attempt/i }),
    ).not.toBeInTheDocument();
  });

  // Fix round 5 (I1): variant A means "a wedge you did not just create". Round 4 refreshed it from
  // storage on every failed outcome, which meant a clean drawer + an ambiguous 503 described the
  // operator's OWN attempt back to them a second after their click, with those exact values still
  // in the inputs above it — inviting the belief that two ₹200/ref-1 attempts are outstanding. It
  // also contradicted the toast rendered in the same update: `recordFailed` says "check the ledger
  // before trying again", variant A says "record it again". One event, two live regions, opposed
  // instructions. The pending record still exists in storage — reopening the drawer is where it
  // legitimately surfaces (the test above) — but it is not disclosed as a pre-existing wedge here.
  it('does not describe the operator\'s own just-failed attempt back to them as a pending wedge', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    // The toast is the whole disclosure for this event, and it is the assertive one.
    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent(/could not confirm this payment was recorded/i);
    expect(screen.getByTestId('pending-attempt-disclosure')).toBeEmptyDOMElement();
    // Storage does hold the attempt — this is a display decision, not a lifecycle change.
    expect(readPendingAttempt('t1')?.ref).toBe('ref-1');
    expect(readPendingAttempt('t1')?.amountPaise).toBe(20000);
  });

  it('does not describe the operator\'s own just-timed-out attempt back to them either', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      recordRemittance.mockReturnValueOnce(new Promise(() => {}));
      render(
        <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
      );
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
      fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: 'ref-1' } });
      fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(45_000);
      });
      // Same collision as the 503 branch: the timeout copy also says "check the ledger before
      // trying again", which variant A would contradict.
      expect(await screen.findByRole('alert')).toHaveTextContent(/taking longer than expected/i);
      expect(screen.getByTestId('pending-attempt-disclosure')).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });

  // Fix round 5 (I2): round 4 mounted the `role="status"` region together with its content, which
  // this file's own round-2 note (on `allocation-disclosures`) says most assistive tech will not
  // announce — so the disclosure was probably inaudible to exactly the users the polite role was
  // chosen for. The region must exist from first render and only ever have its children change.
  it('mounts the proactive disclosure region from the first render and only changes its contents', async () => {
    recordRemittance.mockRejectedValue(Object.assign(new Error('net'), { status: 503 }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    const regionAtMount = screen.getByTestId('pending-attempt-disclosure');
    expect(regionAtMount).toHaveAttribute('role', 'status');
    expect(regionAtMount).toBeEmptyDOMElement();

    // First attempt fails ambiguously — its own fingerprint is not disclosed back to it (I1), so
    // the region is still mounted and still empty.
    await fillAndSubmit('200', 'ref-1');
    await screen.findByText(/could not confirm this payment was recorded/i);
    expect(screen.getByTestId('pending-attempt-disclosure')).toBeEmptyDOMElement();

    // A second, genuinely different attempt fails too. Now the ref-1 record IS a wedge relative to
    // what was just submitted, and variant A appears — inside the region that was already there.
    await fillAndSubmit('50', 'ref-2');
    await waitFor(() =>
      expect(screen.getByTestId('pending-attempt-disclosure')).toHaveTextContent('ref-1'),
    );
    const regionWithContent = screen.getByTestId('pending-attempt-disclosure');
    // The same DOM node, now populated — a mutation inside a live region, not an insertion of one,
    // which is what makes it announceable at all.
    expect(regionWithContent).toBe(regionAtMount);
  });

  // Fix round 5 (M1): `refreshPendingDisclosure()` also runs on the 409 branch, so
  // `pendingDisclosure` is populated but suppressed by variant B. The next submit clears `conflict`
  // at the top of `handleSubmit`, which without the `!submitting` guard unsuppresses variant A for
  // the whole in-flight window — the banner flipping red-with-discard → amber-without-discard →
  // red, the discard button visibly vanishing and coming back.
  it('does not flash the proactive variant while a submit is in flight after a 409', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    recordRemittance.mockRejectedValueOnce(
      Object.assign(new Error(), { status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } }),
    );
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    await fillAndSubmit('50', 'ref-2');
    // Variant B is showing, and variant A is populated-but-suppressed behind it.
    expect(await screen.findByRole('alert')).toHaveTextContent('ref-1');
    expect(screen.getByTestId('pending-attempt-disclosure')).toBeEmptyDOMElement();

    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      recordRemittance.mockReturnValueOnce(new Promise(() => {}));
      fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
      await waitFor(() => expect(recordRemittance).toHaveBeenCalledTimes(3));
      // Mid-flight: variant B has been cleared for the new attempt, and variant A must not take
      // its place — no amber banner, no discard button appearing and vanishing.
      expect(screen.getByTestId('pending-attempt-disclosure')).toBeEmptyDOMElement();
      expect(
        screen.queryByRole('button', { name: /discard the pending attempt/i }),
      ).not.toBeInTheDocument();
      // Let the watchdog settle the race rather than leaving a live timer behind.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(45_000);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  // Fix round 4: variant A mirrors *storage*, variant B is a *result of the last submission*.
  // Round 3 cleared both at the top of `handleSubmit`, so opening onto a wedge and then hitting an
  // unrelated 503 made the disclosure vanish while the wedge it described was completely untouched.
  it('keeps the proactive disclosure after a non-409 failed submit, which leaves the pending record untouched', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    const { rerender } = render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    rerender(
      <RemittanceDrawer open={false} technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    rerender(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    expect(screen.getByTestId('pending-attempt-disclosure')).toHaveTextContent('ref-1');

    // A second, different payment attempt that fails ambiguously — a 503, not a 409, so nothing
    // about the pending record changed.
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    await fillAndSubmit('50', 'ref-2');
    await waitFor(() => expect(recordRemittance).toHaveBeenCalledTimes(2));
    // The failure toast proves the catch path ran to completion, so this is not just a stale render.
    await screen.findByText(/could not confirm this payment was recorded/i);

    const disclosure = screen.getByTestId('pending-attempt-disclosure');
    expect(disclosure).toHaveTextContent('ref-1');
    // Still the original wedge's fingerprint, not the just-typed inputs.
    expect(disclosure).toHaveTextContent('₹200.00');
    // Storage agrees: the wedge is exactly as it was.
    expect(readPendingAttempt('t1')?.ref).toBe('ref-1');
  });

  // Fix round 4: `SummaryBand.tsx` carries an explicit precedent against two simultaneous live
  // regions on this screen (screen readers announce both at once). With variant A downgraded to
  // `role="status"`, the validation error is the only assertive region — which is the whole point
  // of the split, since a wedge plus a first-interaction typo is an ordinary session, not an edge.
  it('does not stack two assertive live regions when a validation error fires under the proactive disclosure', async () => {
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    const { rerender } = render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    rerender(
      <RemittanceDrawer open={false} technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    rerender(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    expect(screen.getByTestId('pending-attempt-disclosure')).toHaveTextContent('ref-1');

    // Submit with a blank amount — the drawer resets its fields on open, so this is the very first
    // interaction of a normal session on a wedged technician.
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));

    expect(recordRemittance).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(/enter an amount greater than ₹0/i);
    // And the disclosure is still there — a typo does not resolve a wedge.
    expect(screen.getByTestId('pending-attempt-disclosure')).toHaveTextContent('ref-1');
  });

  it('tells the operator when the server allocated differently than previewed', async () => {
    // The preview (₹200 against dueRows) spans 2 jobs; the server recorded against only 1.
    recordRemittance.mockResolvedValue(okResponse({ allocations: [{ bookingId: 'b1', paise: 20000 }] }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    const disclosures = await screen.findByTestId('allocation-disclosures');
    expect(within(disclosures).getByText(/Allocated differently than previewed/i)).toBeInTheDocument();
  });

  // Fix round 1, I2: a re-split with the same total and job count must not quote two identical
  // figures as if something differed — it should name the bookings whose amount actually moved.
  it('names the bookings that moved on a same-total, same-count re-split', async () => {
    recordRemittance.mockResolvedValue(
      okResponse({
        allocations: [
          { bookingId: 'b1', paise: 5000 },
          { bookingId: 'b2', paise: 15000 },
        ],
      }),
    );
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    const disclosures = await screen.findByTestId('allocation-disclosures');
    const note = within(disclosures).getByText(/Allocated differently than previewed/i);
    expect(note).toHaveTextContent('Older job');
    expect(note).toHaveTextContent('Newer job');
    expect(note).not.toHaveTextContent(/across 2 jobs; recorded/i);
  });

  // Fix round 1, I4: replayed and allocation-mismatch are orthogonal facts and must both surface.
  it('shows both the replayed and allocation-mismatch disclosures when they co-occur', async () => {
    recordRemittance.mockResolvedValue(
      okResponse({ replayed: true, allocations: [{ bookingId: 'b1', paise: 20000 }] }),
    );
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    const disclosures = await screen.findByTestId('allocation-disclosures');
    expect(within(disclosures).getByText(/original receipt, not a second payment/i)).toBeInTheDocument();
    expect(within(disclosures).getByText(/Allocated differently than previewed/i)).toBeInTheDocument();
  });

  // Fix round 1, I3: an overpayment silently becoming a credit is a money bug in the UI layer.
  it('surfaces an overpayment as a credit-created note', async () => {
    recordRemittance.mockResolvedValue(okResponse({ creditCreatedPaise: 500000 }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    const disclosures = await screen.findByTestId('allocation-disclosures');
    expect(within(disclosures).getByText(/Credit created/i)).toHaveTextContent('₹5,000.00');
  });

  // Fix round 1, I1: a second, distinct payment must not keep showing the first payment's
  // "recorded" numbers at full strength while the operator types the new amount.
  it('returns the allocation block to preview mode when the operator starts a second payment', async () => {
    recordRemittance.mockResolvedValue(okResponse());
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit('200', 'ref-1');
    expect(await screen.findByText('Recorded allocation')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '50' } });
    expect(screen.getByText('Preview. The server recalculates when you record this.')).toBeInTheDocument();
    expect(screen.queryByText('Recorded allocation')).not.toBeInTheDocument();
  });

  // Fix round 2, N2: a request that never settles must not strand the operator with a
  // permanently-unclosable drawer (Cancel disabled, backdrop/×/Escape all no-ops per C1, inside a
  // focus lock). The bounded client-side watchdog must release `submitting` on its own.
  it('re-enables the drawer after a bounded wait when the request never settles', async () => {
    vi.useFakeTimers();
    try {
      recordRemittance.mockImplementation(() => new Promise<never>(() => {}));
      const onClose = vi.fn();
      render(
        <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={onClose} onRecorded={noop} />,
      );
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
      fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: 'ref-1' } });
      fireEvent.click(screen.getByRole('button', { name: /record payment/i }));

      // Let the submit handler run up to its awaited call before the request is (deliberately)
      // left hanging.
      await Promise.resolve();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

      // Fix round 3: REQUEST_TIMEOUT_MS raised from 20s to 45s (rural connectivity headroom).
      await act(async () => {
        await vi.advanceTimersByTimeAsync(45_000);
      });

      expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
