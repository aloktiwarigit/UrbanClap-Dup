import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TechnicianLedgerClient } from '../../../src/components/commissions/TechnicianLedgerClient';
import type { CommissionLedgerDetail, CommissionConfig } from '../../../src/api/commissions';

// task-7 brief + design doc §4. This is the page the owner opens at 11pm when a technician
// phones disputing a balance — it must state the hold reason in money terms, mark
// technician-declared (UPI_QR) collections, and gate the hold-override control on
// settings.manage. The technician's phone number is deliberately absent (E09-S08 owns masked
// contact + audited reveal) — there is no such field on CommissionLedgerDetail to accidentally
// render, so that invariant is structural rather than tested here.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'detail.backLink': 'Back to commissions',
      'detail.heading': 'Technician {technicianId}',
      'detail.loading': 'Loading technician ledger…',
      'errors.detailLoadFailed': "Could not load this technician's ledger.",
      'errors.configLoadFailed': 'Commission thresholds unavailable — showing hold status without the reason.',
      'errors.overrideFailed': 'Could not save the hold override.',
      'errors.clearOverrideFailed': 'Could not clear the hold override.',
      'messages.overrideSaved': 'Hold override saved.',
      'messages.overrideCleared': 'Hold override cleared.',
      'holdChip.warn': 'Warn',
      'holdChip.blocked': 'Blocked',
      'holdChip.override': 'Override · {actor} · {date}',
      'detail.hold.heading': 'Hold status',
      'detail.hold.setOverride': 'Set hold override',
      'detail.hold.clearOverride': 'Clear override',
      'detail.balance.heading': 'Balance',
      'detail.balance.due': 'Commission due from cash jobs',
      'detail.balance.repaid': 'Payments and credits applied',
      'detail.balance.creditAnnotation': 'includes {amount} applied from credit',
      'detail.balance.settled': 'Waived or settled',
      'detail.balance.total': 'Balance due',
      'detail.cashContext.heading': 'Cash-job context',
      'detail.cashContext.line': 'Collected at the door, {count} jobs',
      'detail.cashContext.caveat': 'not part of the balance',
      'detail.events.heading': 'Balance events',
      'detail.events.columns.date': 'Date',
      'detail.events.columns.event': 'Event',
      'detail.events.columns.change': 'Change',
      'detail.events.columns.balance': 'Balance',
      'detail.events.columns.recordedBy': 'Recorded by',
      'detail.events.copyReference': 'Copy reference',
      'detail.events.copied': 'Copied',
      'detail.events.empty': 'No balance events yet.',
      'detail.receivables.heading': 'Receivables',
      'detail.receivables.columns.service': 'Service',
      'detail.receivables.columns.date': 'Date',
      'detail.receivables.columns.amount': 'Commission due',
      'detail.receivables.columns.status': 'Status',
      'detail.receivables.technicianDeclared': 'Technician-declared',
      'detail.receivables.statusDue': 'Due',
      'detail.receivables.statusRemitted': 'Remitted',
      'detail.receivables.statusWaived': 'Waived',
      'detail.receivables.empty': 'No receivables yet.',
      'detail.remittanceHistory.heading': 'Remittance history',
      'detail.remittanceHistory.columns.date': 'Date',
      'detail.remittanceHistory.columns.amount': 'Amount',
      'detail.remittanceHistory.columns.method': 'Method',
      'detail.remittanceHistory.columns.ref': 'Reference',
      'detail.remittanceHistory.columns.recordedBy': 'Recorded by',
      'detail.remittanceHistory.empty': 'No remittances recorded yet.',
      'detail.credits.heading': 'Credits',
      'detail.credits.columns.source': 'Source',
      'detail.credits.columns.original': 'Original',
      'detail.credits.columns.remaining': 'Remaining',
      'detail.credits.empty': 'No credits on this account.',
      'detail.override.dialogTitle': 'Set hold override',
      'detail.override.untilLabel': 'Override until',
      'detail.override.reasonLabel': 'Reason',
      'detail.override.reasonRequired': 'A reason is required.',
      'detail.override.save': 'Save override',
      'detail.override.cancel': 'Cancel',
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

const {
  fetchTechnicianLedger,
  fetchCommissionConfig,
  setHoldOverride,
  clearHoldOverride,
} = vi.hoisted(() => ({
  fetchTechnicianLedger: vi.fn(),
  fetchCommissionConfig: vi.fn(),
  setHoldOverride: vi.fn(),
  clearHoldOverride: vi.fn(),
}));
vi.mock('@/api/commissions', () => ({
  fetchTechnicianLedger,
  fetchCommissionConfig,
  setHoldOverride,
  clearHoldOverride,
}));

let mockRole: string | null = 'super-admin';
vi.mock('@/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: mockRole ? { role: mockRole } : null }),
}));
vi.mock('@/admin/capabilities', () => ({
  hasCapability: (role: string | null | undefined, capability: string) => {
    if (role === 'super-admin') return true;
    if (role === 'finance') return capability === 'finance.read' || capability === 'finance.settleCommission';
    return false;
  },
}));

function detail(overrides: Partial<CommissionLedgerDetail>): CommissionLedgerDetail {
  return {
    technicianId: 't1',
    hold: null,
    receivables: [
      {
        id: 'b1',
        bookingId: 'b1',
        technicianId: 't1',
        partitionKey: 't1',
        serviceId: 's1',
        categoryId: 'c1',
        bookingAmount: 67390,
        commissionBps: 2000,
        commissionDue: 13478,
        commissionResolvedFrom: 'SERVICE',
        remittanceStatus: 'DUE',
        remittedAmount: 0,
        createdAt: '2026-05-08T04:57:40.119Z',
        serviceName: 'AC Deep Clean',
        collectionMethod: 'UPI_QR',
        outstandingPaise: 13478,
      },
      {
        id: 'b2',
        bookingId: 'b2',
        technicianId: 't1',
        partitionKey: 't1',
        serviceId: 's1',
        categoryId: 'c1',
        bookingAmount: 67390,
        commissionBps: 2000,
        commissionDue: 13478,
        commissionResolvedFrom: 'SERVICE',
        remittanceStatus: 'REMITTED',
        remittedAmount: 13478,
        createdAt: '2026-05-09T03:26:15.061Z',
        serviceName: 'AC Deep Clean',
        collectionMethod: 'CASH',
        outstandingPaise: 0,
      },
    ],
    remittances: [
      {
        id: 'rem:k1',
        docType: 'REMITTANCE',
        technicianId: 't1',
        partitionKey: 't1',
        amountPaise: 13478,
        method: 'UPI',
        ref: 'upi-1',
        allocations: [{ bookingId: 'b2', paise: 13478 }],
        creditCreatedPaise: 0,
        recordedByAdminId: 'admin-1',
        idempotencyKey: 'k1',
        createdAt: '2026-09-02T10:00:00.000Z',
      },
    ],
    credits: [],
    cashCollectedPaise: 619300,
    creditAppliedPaise: 0,
    ...overrides,
  };
}

function config(overrides: Partial<CommissionConfig>): CommissionConfig {
  return {
    defaultCommissionBps: 2000,
    warnThresholdPaise: 5000,
    blockThresholdPaise: 10000,
    holdEnforcementEnabled: true,
    enforceKycInDispatch: true,
    updatedBy: 'admin-1',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  mockRole = 'super-admin';
  fetchTechnicianLedger.mockReset();
  fetchCommissionConfig.mockReset();
  setHoldOverride.mockReset();
  clearHoldOverride.mockReset();
});

describe('TechnicianLedgerClient', () => {
  it('marks a technician-declared (UPI_QR) receivable row', () => {
    render(
      <TechnicianLedgerClient
        technicianId="t1"
        initialDetail={detail({})}
        initialConfig={config({})}
      />,
    );
    const rows = screen.getAllByRole('row');
    const declaredRow = rows.find((row) => row.textContent?.includes('Technician-declared'));
    expect(declaredRow).toBeDefined();
    // The CASH-collected row (b2) must not carry the marker.
    const cashRow = rows.find((row) => row.textContent?.includes('₹134.78') && !row.textContent?.includes('Technician-declared'));
    expect(cashRow).toBeDefined();
  });

  it('explains why a technician is blocked in money terms', () => {
    render(
      <TechnicianLedgerClient
        technicianId="t1"
        initialDetail={detail({
          hold: {
            outstandingPaise: 13478,
            dueCount: 3,
            state: 'BLOCKED',
            evaluatedAt: '2026-09-07T13:24:00.000Z',
          },
        })}
        initialConfig={config({ warnThresholdPaise: 5000, blockThresholdPaise: 10000 })}
      />,
    );
    expect(
      screen.getByText(/Blocked: outstanding commission of ₹134\.78 exceeds the ₹100\.00 block threshold/),
    ).toBeInTheDocument();
  });

  it('hides the hold-override control from a role without settings.manage', () => {
    mockRole = 'finance';
    render(
      <TechnicianLedgerClient
        technicianId="t1"
        initialDetail={detail({
          hold: { outstandingPaise: 13478, dueCount: 3, state: 'WARN', evaluatedAt: '2026-09-07T13:24:00.000Z' },
        })}
        initialConfig={config({})}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Set hold override' })).not.toBeInTheDocument();
  });

  it('shows the hold-override control for a role with settings.manage', () => {
    render(
      <TechnicianLedgerClient
        technicianId="t1"
        initialDetail={detail({
          hold: { outstandingPaise: 13478, dueCount: 3, state: 'WARN', evaluatedAt: '2026-09-07T13:24:00.000Z' },
        })}
        initialConfig={config({})}
      />,
    );
    expect(screen.getByRole('button', { name: 'Set hold override' })).toBeInTheDocument();
  });

  it('records a hold override and confirms it', async () => {
    const user = userEvent.setup();
    setHoldOverride.mockResolvedValue(undefined);
    fetchTechnicianLedger.mockResolvedValue(
      detail({
        hold: {
          outstandingPaise: 13478,
          dueCount: 3,
          state: 'WARN',
          evaluatedAt: '2026-09-07T13:24:00.000Z',
          override: { until: '2026-09-30T00:00:00.000Z', byAdminId: 'alok', reason: 'phone call' },
        },
      }),
    );
    render(
      <TechnicianLedgerClient
        technicianId="t1"
        initialDetail={detail({
          hold: { outstandingPaise: 13478, dueCount: 3, state: 'WARN', evaluatedAt: '2026-09-07T13:24:00.000Z' },
        })}
        initialConfig={config({})}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Set hold override' }));
    await user.type(screen.getByLabelText('Override until'), '2026-09-30');
    await user.type(screen.getByLabelText('Reason'), 'phone call');
    await user.click(screen.getByRole('button', { name: 'Save override' }));

    await waitFor(() => {
      expect(setHoldOverride).toHaveBeenCalledWith('t1', { until: '2026-09-30', reason: 'phone call' });
    });
    expect(await screen.findByText('Hold override saved.')).toBeInTheDocument();
  });

  it('will not submit a hold override without a reason', async () => {
    const user = userEvent.setup();
    render(
      <TechnicianLedgerClient
        technicianId="t1"
        initialDetail={detail({
          hold: { outstandingPaise: 13478, dueCount: 3, state: 'WARN', evaluatedAt: '2026-09-07T13:24:00.000Z' },
        })}
        initialConfig={config({})}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Set hold override' }));
    await user.type(screen.getByLabelText('Override until'), '2026-09-30');
    await user.click(screen.getByRole('button', { name: 'Save override' }));
    expect(setHoldOverride).not.toHaveBeenCalled();
    expect(screen.getByText('A reason is required.')).toBeInTheDocument();
  });

  it('clears an existing hold override', async () => {
    const user = userEvent.setup();
    clearHoldOverride.mockResolvedValue(undefined);
    fetchTechnicianLedger.mockResolvedValue(
      detail({ hold: { outstandingPaise: 13478, dueCount: 3, state: 'WARN', evaluatedAt: '2026-09-07T13:24:00.000Z' } }),
    );
    render(
      <TechnicianLedgerClient
        technicianId="t1"
        initialDetail={detail({
          hold: {
            outstandingPaise: 13478,
            dueCount: 3,
            state: 'WARN',
            evaluatedAt: '2026-09-07T13:24:00.000Z',
            override: { until: '2026-09-30T00:00:00.000Z', byAdminId: 'alok', reason: 'phone call' },
          },
        })}
        initialConfig={config({})}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear override' }));
    await waitFor(() => {
      expect(clearHoldOverride).toHaveBeenCalledWith('t1');
    });
    expect(await screen.findByText('Hold override cleared.')).toBeInTheDocument();
  });

  it('shows an error when the ledger fails to load', async () => {
    fetchTechnicianLedger.mockRejectedValue(new Error('network'));
    fetchCommissionConfig.mockResolvedValue(config({}));
    render(<TechnicianLedgerClient technicianId="t1" />);
    expect(await screen.findByText("Could not load this technician's ledger.")).toBeInTheDocument();
  });

  // Fix round 1: Promise.all previously failed the whole page when either fetch failed, blanking
  // the ledger over a config hiccup that only the hold-reason sentence actually needs. Config
  // degrades, it does not block — this is the page the owner opens at 11pm with a technician on
  // the phone, and it must not go blank because a rarely-changing config lookup failed.
  it('renders the ledger even when the commission config fails to load', async () => {
    fetchTechnicianLedger.mockResolvedValue(
      detail({
        hold: { outstandingPaise: 13478, dueCount: 3, state: 'WARN', evaluatedAt: '2026-09-07T13:24:00.000Z' },
      }),
    );
    fetchCommissionConfig.mockRejectedValue(new Error('config unavailable'));

    render(<TechnicianLedgerClient technicianId="t1" />);

    // The ledger renders in full: balance stack, events, and the receivables table. "Balance due"
    // (not the bare "Balance" heading) is used here because "Balance" also appears as the events
    // table's column header, which would make the query ambiguous.
    expect(await screen.findByText('Balance due')).toBeInTheDocument();
    expect(screen.getByText('Balance events')).toBeInTheDocument();
    expect(screen.getByText('Receivables')).toBeInTheDocument();
    // The bare hold state still renders...
    expect(screen.getByText('Warn')).toBeInTheDocument();
    // ...but the money-terms hold-reason sentence, which needs config, does not — replaced by a
    // note scoped to that spot, not a page-level error.
    expect(screen.queryByText(/exceeds the/)).not.toBeInTheDocument();
    expect(screen.getByText(/Commission thresholds unavailable/)).toBeInTheDocument();
    // No page-level error for a config-only failure.
    expect(screen.queryByText("Could not load this technician's ledger.")).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
