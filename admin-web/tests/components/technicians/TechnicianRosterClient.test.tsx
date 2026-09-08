import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TechnicianRosterClient } from '../../../app/[locale]/(dashboard)/technicians/TechnicianRosterClient';
import type { AdminTechnician } from '../../../src/types/technician-admin';

// Task 10 (E21-S03): commissionPct is dead config — per-service/per-category commissionBps
// (spec §10) supersedes it — so the roster must no longer offer it as an editable field.
// The stored field stays on the API/type (PatchTechnicianBody still accepts it); only the
// editor affordance is removed here.
//
// This roster also now renders each technician's HoldChip (imported from
// @/components/commissions/HoldChip, which reads its own `commissions` namespace), so the
// next-intl mock below is namespace-aware rather than a single flat dictionary.

const DICTIONARIES: Record<string, Record<string, string>> = {
  technicians: {
    title: 'Technician Roster',
    searchPlaceholder: 'Search by name or phone',
    filterAll: 'All Statuses',
    'columns.name': 'Name',
    'columns.phone': 'Phone',
    'columns.categories': 'Categories',
    'columns.status': 'Status',
    'columns.kyc': 'KYC',
    'columns.hold': 'Hold',
    'columns.balance': 'Balance',
    'columns.activeJobs': 'Active Jobs',
    'columns.actions': 'Actions',
    'status.ON_DUTY': 'On Duty',
    'status.OFF_DUTY': 'Off Duty',
    'status.SUSPENDED': 'Suspended',
    'kyc.VERIFIED': 'Verified',
    'kyc.PENDING': 'Pending',
    'kyc.REJECTED': 'Rejected',
    'actions.goOnDuty': 'Go On Duty',
    'actions.goOffDuty': 'Go Off Duty',
    'actions.suspend': 'Suspend',
    'actions.reactivate': 'Reactivate',
    'actions.viewKyc': 'View KYC',
  },
  commissions: {
    'holdChip.warn': 'Warn',
    'holdChip.blocked': 'Blocked',
    'holdChip.override': 'Override · {actor} · {date}',
  },
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, params?: Record<string, unknown>) => {
    const template = DICTIONARIES[ns]?.[key] ?? key;
    if (!params) return template;
    return Object.entries(params).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template,
    );
  },
  useLocale: () => 'en',
}));

const patchTechnicianMock = vi.fn();
vi.mock('../../../src/api/technicians', () => ({
  patchTechnician: (...args: unknown[]): unknown => patchTechnicianMock(...args),
}));

let mockRole: string | null = 'super-admin';
vi.mock('../../../src/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: mockRole ? { role: mockRole } : null }),
}));

function technician(overrides: Partial<AdminTechnician> = {}): AdminTechnician {
  return {
    id: 't1',
    name: 'Suresh Kumar',
    phone: '9876543210',
    status: 'ON_DUTY',
    kycStatus: 'VERIFIED',
    serviceCategories: ['AC Repair'],
    commissionPct: 20,
    activeBookingCount: 3,
    ...overrides,
  };
}

describe('TechnicianRosterClient', () => {
  beforeEach(() => {
    patchTechnicianMock.mockReset();
    mockRole = 'super-admin';
  });

  it('no longer offers an editable commission percentage on the roster', () => {
    render(<TechnicianRosterClient initialTechnicians={[technician()]} />);
    expect(screen.queryByLabelText(/commission %/i)).toBeNull();
    expect(screen.queryByText(/commission %/i)).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.queryByText('20%')).toBeNull();
  });

  it('never calls patchTechnician with commissionPct', () => {
    render(<TechnicianRosterClient initialTechnicians={[technician()]} />);
    // The commission editor and its save handler are gone entirely — there is no
    // remaining UI path that can write commissionPct.
    expect(patchTechnicianMock).not.toHaveBeenCalled();
  });

  it('still renders the roster for non-super-admin roles without the commission column', () => {
    mockRole = 'ops-manager';
    render(<TechnicianRosterClient initialTechnicians={[technician()]} />);
    expect(screen.getByText('Suresh Kumar')).toBeDefined();
    expect(screen.queryByText(/commission %/i)).toBeNull();
  });

  it("shows a roster technician's hold state and outstanding balance", () => {
    render(
      <TechnicianRosterClient
        initialTechnicians={[
          technician({
            commissionHold: {
              outstandingPaise: 134780,
              dueCount: 2,
              state: 'BLOCKED',
              evaluatedAt: '2026-09-01T00:00:00.000Z',
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText('Blocked')).toBeDefined();
    expect(screen.getByText(/1,347\.80/)).toBeDefined();
  });

  it('renders an override chip in place of the bare hold state when one exists', () => {
    render(
      <TechnicianRosterClient
        initialTechnicians={[
          technician({
            commissionHold: {
              outstandingPaise: 50000,
              dueCount: 1,
              state: 'WARN',
              evaluatedAt: '2026-09-01T00:00:00.000Z',
              override: { until: '2026-09-15T00:00:00.000Z', byAdminId: 'admin-1', reason: 'goodwill' },
            },
          }),
        ]}
      />,
    );
    expect(screen.queryByText('Warn')).toBeNull();
    expect(screen.getByText(/Override · admin-1/)).toBeDefined();
  });

  it('shows an em-dash, not a fabricated CLEAR state, for a technician with no hold ever computed', () => {
    render(<TechnicianRosterClient initialTechnicians={[technician()]} />);
    // technician() has no commissionHold at all — absence must render as "no data", never as CLEAR.
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2); // one for hold, one for balance
  });
});
