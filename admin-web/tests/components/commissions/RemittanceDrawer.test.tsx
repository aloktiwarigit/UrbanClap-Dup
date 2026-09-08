import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RemittanceDrawer } from '../../../src/components/commissions/RemittanceDrawer';
import type { CommissionLedgerDetail, RecordRemittanceResponse } from '../../../src/api/commissions';

// task-8 brief + design doc §5, fix round 1. This is the one place in the commission console that
// moves real money: the idempotency key must survive retries of the same attempt AND survive the
// drawer being closed and reopened after an ambiguous failure (fix round 1, C1/C2), the drawer
// must not be closeable mid-flight, and the client-computed allocation preview must never be
// presented as truth — the server recomputes it authoritatively and this drawer must say so
// explicitly, persistently, when the two disagree, rather than swapping the numbers in silently.

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
      'remittance.errors.invalidAmount': 'Enter an amount greater than ₹0, with at most 2 decimal places.',
      'remittance.errors.refRequired': 'A reference is required.',
      'remittance.errors.recordFailed':
        "Could not confirm this payment was recorded. Check the technician's ledger before trying again.",
      'remittance.errors.idempotencyMismatch':
        'That reference was already used for a different amount. Check the amount and reference, then try again.',
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

async function fillAndSubmit(amount = '200', ref = 'ref-1') {
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText(/reference/i), { target: { value: ref } });
  fireEvent.click(screen.getByRole('button', { name: /record payment/i }));
  await waitFor(() => expect(recordRemittance).toHaveBeenCalled());
}

beforeEach(() => {
  recordRemittance.mockReset();
  window.sessionStorage.clear();
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
  // is now scoped to the technician (sessionStorage) and is deleted only on success.
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

  it('reports a replayed receipt as the original, not a second payment', async () => {
    recordRemittance.mockResolvedValue(okResponse({ replayed: true }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    expect(await screen.findByText(/original receipt, not a second payment/i)).toBeInTheDocument();
  });

  it('says the balance will catch up when the hold recompute is pending', async () => {
    recordRemittance.mockResolvedValue(okResponse({ hold: null, holdRecomputePending: true }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    expect(await screen.findByRole('status')).toHaveTextContent(/catch up shortly/i);
  });

  it('explains an idempotency mismatch as a reference-reuse problem', async () => {
    recordRemittance.mockRejectedValue(
      Object.assign(new Error(), { status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } }),
    );
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/already used for a different amount/i);
  });

  it('tells the operator when the server allocated differently than previewed', async () => {
    // The preview (₹200 against dueRows) spans 2 jobs; the server recorded against only 1.
    recordRemittance.mockResolvedValue(okResponse({ allocations: [{ bookingId: 'b1', paise: 20000 }] }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    expect(await screen.findByText(/Allocated differently than previewed/i)).toBeInTheDocument();
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
    const note = await screen.findByText(/Allocated differently than previewed/i);
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
    expect(await screen.findByText(/original receipt, not a second payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Allocated differently than previewed/i)).toBeInTheDocument();
  });

  // Fix round 1, I3: an overpayment silently becoming a credit is a money bug in the UI layer.
  it('surfaces an overpayment as a credit-created note', async () => {
    recordRemittance.mockResolvedValue(okResponse({ creditCreatedPaise: 500000 }));
    render(
      <RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />,
    );
    await fillAndSubmit();
    expect(await screen.findByText(/Credit created/i)).toHaveTextContent('₹5,000.00');
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
});
