import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TechnicianRosterClient } from '../../../app/[locale]/(dashboard)/technicians/TechnicianRosterClient';
import type { AdminTechnician } from '../../../src/types/technician-admin';

// Task 10 (E21-S03): commissionPct is dead config — per-service/per-category commissionBps
// (spec §10) supersedes it — so the roster must no longer offer it as an editable field.
// The stored field stays on the API/type (PatchTechnicianBody still accepts it); only the
// editor affordance is removed here.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dictionary: Record<string, string> = {
      title: 'Technician Roster',
      searchPlaceholder: 'Search by name or phone',
      filterAll: 'All Statuses',
      'columns.name': 'Name',
      'columns.phone': 'Phone',
      'columns.categories': 'Categories',
      'columns.status': 'Status',
      'columns.kyc': 'KYC',
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
    };
    return dictionary[key] ?? key;
  },
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
});
