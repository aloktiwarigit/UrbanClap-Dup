import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RemittanceDrawer } from '../../../src/components/commissions/RemittanceDrawer';
import type { CommissionLedgerDetail, RecordRemittanceResponse } from '../../../src/api/commissions';

// task-8 brief + design doc §5. This is the one place in the commission console that moves real
// money: the idempotency key must survive retries of the same attempt but never leak into the
// next distinct payment, and the client-computed allocation preview must never be presented as
// truth — the server recomputes it authoritatively and this drawer must say so explicitly when
// the two disagree, rather than swapping the numbers in silently.

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
      'remittance.actual.label': 'Recorded allocation',
      'remittance.actions.cancel': 'Cancel',
      'remittance.actions.submit': 'Record payment',
      'remittance.errors.invalidAmount': 'Enter an amount greater than ₹0.',
      'remittance.errors.refRequired': 'A reference is required.',
      'remittance.errors.recordFailed': 'Could not record this payment. Try again.',
      'remittance.errors.idempotencyMismatch':
        'That reference was already used for a different amount. Check the amount and reference, then try again.',
      'remittance.outcomes.success': 'Payment recorded',
      'remittance.outcomes.replayed': 'Already recorded. This is the original receipt, not a second payment.',
      'remittance.outcomes.recomputePending': 'Recorded. The balance will catch up shortly.',
      'remittance.outcomes.allocationMismatch':
        'Allocated differently than previewed. Preview showed {previewAmount} across {previewCount} jobs; recorded {actualAmount} across {actualCount} jobs.',
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
});

describe('RemittanceDrawer', () => {
  it('labels the allocation as a preview the server will recalculate', () => {
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    expect(screen.getByTestId('allocation-preview')).toHaveTextContent(/server recalculates/i);
  });

  it('allocates the preview oldest-due first', () => {
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    // ₹200 = 20000 paise: fully covers the older ₹150 job, then ₹50 of the newer ₹100 job.
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
    const preview = screen.getByTestId('allocation-preview');
    expect(preview).toHaveTextContent('Older job');
    expect(preview).toHaveTextContent('₹150.00');
    expect(preview).toHaveTextContent('Newer job');
    expect(preview).toHaveTextContent('₹50.00');
  });

  it('generates one idempotency key per attempt and reuses it across retries of that attempt', async () => {
    // A new key per retry would defeat idempotency and risk double-charging.
    recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
    recordRemittance.mockResolvedValueOnce(okResponse());
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    await fillAndSubmit();
    await fillAndSubmit();
    const [first, second] = twoCalls(recordRemittance.mock.calls as [{ idempotencyKey: string }][]);
    expect(first[0].idempotencyKey).toBe(second[0].idempotencyKey);
  });

  it('starts a fresh idempotency key after a successful record', async () => {
    recordRemittance.mockResolvedValue(okResponse());
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    await fillAndSubmit('200', 'ref-1');
    await fillAndSubmit('50', 'ref-2');
    const [first, second] = twoCalls(recordRemittance.mock.calls as [{ idempotencyKey: string }][]);
    expect(first[0].idempotencyKey).not.toBe(second[0].idempotencyKey);
  });

  it('reports a replayed receipt as the original, not a second payment', async () => {
    recordRemittance.mockResolvedValue(okResponse({ replayed: true }));
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    await fillAndSubmit();
    expect(await screen.findByRole('status')).toHaveTextContent(/original receipt, not a second payment/i);
  });

  it('says the balance will catch up when the hold recompute is pending', async () => {
    recordRemittance.mockResolvedValue(okResponse({ hold: null, holdRecomputePending: true }));
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    await fillAndSubmit();
    expect(await screen.findByRole('status')).toHaveTextContent(/catch up shortly/i);
  });

  it('explains an idempotency mismatch as a reference-reuse problem', async () => {
    recordRemittance.mockRejectedValue(
      Object.assign(new Error(), { status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } }),
    );
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/already used for a different amount/i);
  });

  it('tells the operator when the server allocated differently than previewed', async () => {
    // The preview (₹200 against dueRows) spans 2 jobs; the server recorded against only 1.
    recordRemittance.mockResolvedValue(
      okResponse({ allocations: [{ bookingId: 'b1', paise: 20000 }] }),
    );
    render(
      <RemittanceDrawer
        open
        technicianId="t1"
        receivables={dueRows}
        onClose={noop}
        onRecorded={noop}
      />,
    );
    await fillAndSubmit();
    expect(await screen.findByRole('status')).toHaveTextContent(/Allocated differently than previewed/i);
  });
});
