// admin-web/tests/technicians.page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'fake-jwt' }) }),
}));

vi.mock('@/lib/serverApi', () => ({
  getServerApiClient: async () => ({}),
}));

const listMock = vi.fn();
vi.mock('@/api/technicians', () => ({
  listTechnicians: (...args: unknown[]): unknown => listMock(...args),
}));

const clientProps: { current: unknown } = { current: undefined };
vi.mock('../app/[locale]/(dashboard)/technicians/TechnicianRosterClient', () => ({
  TechnicianRosterClient: (props: unknown) => {
    clientProps.current = props;
    return null;
  },
}));

import TechniciansPage from '../app/[locale]/(dashboard)/technicians/page';

interface RosterProps {
  initialTechnicians: Array<{ id: string }>;
}

describe('TechniciansPage', () => {
  beforeEach(() => {
    listMock.mockReset();
    clientProps.current = undefined;
  });

  it('passes technicians to client component on success', async () => {
    listMock.mockResolvedValue({
      technicians: [
        { id: 't1', name: 'Suresh', phone: '+91 XXXXX-X1234', status: 'ON_DUTY',
          kycStatus: 'VERIFIED', serviceCategories: ['AC'], commissionPct: 20, activeBookingCount: 2 },
      ],
    });
    render(await TechniciansPage({ params: Promise.resolve({ locale: 'hi' }) }));
    const props = clientProps.current as RosterProps;
    expect(props.initialTechnicians).toHaveLength(1);
    expect(props.initialTechnicians[0]).toMatchObject({ id: 't1' });
  });

  it('passes empty list when API returns no technicians', async () => {
    listMock.mockResolvedValue({ technicians: [] });
    render(await TechniciansPage({ params: Promise.resolve({ locale: 'hi' }) }));
    const props = clientProps.current as RosterProps;
    expect(props.initialTechnicians).toEqual([]);
  });

  it('passes empty list when API throws', async () => {
    listMock.mockRejectedValue(new TypeError('fetch failed'));
    render(await TechniciansPage({ params: Promise.resolve({ locale: 'hi' }) }));
    const props = clientProps.current as RosterProps;
    expect(props.initialTechnicians).toEqual([]);
  });
});
