import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'fake-jwt' }) }),
}));

vi.mock('@/lib/serverApi', () => ({
  getServerApiClient: async () => ({}),
}));

const listMock = vi.fn();
vi.mock('@/api/customers', () => ({
  listCustomers: (...args: unknown[]): unknown => listMock(...args),
}));

const clientProps: { current: unknown } = { current: undefined };
vi.mock('../app/[locale]/(dashboard)/customers/CustomerListClient', () => ({
  CustomerListClient: (props: unknown) => {
    clientProps.current = props;
    return null;
  },
}));

import CustomersPage from '../app/[locale]/(dashboard)/customers/page';

interface ListProps {
  initialCustomers: Array<{ id: string }>;
}

describe('CustomersPage', () => {
  beforeEach(() => {
    listMock.mockReset();
    clientProps.current = undefined;
  });

  it('passes customers to client component on success', async () => {
    listMock.mockResolvedValue({
      customers: [
        { id: 'c1', name: 'Riya', phone: '+91 XXXXX-X5678', city: 'Ayodhya',
          bookingCount: 3, accountStatus: 'ACTIVE', openComplaintCount: 0,
          recentBookings: [], recentComplaints: [], notes: [] },
      ],
    });
    render(await CustomersPage({ params: Promise.resolve({ locale: 'hi' }) }));
    const props = clientProps.current as ListProps;
    expect(props.initialCustomers).toHaveLength(1);
    expect(props.initialCustomers[0]).toMatchObject({ id: 'c1' });
  });

  it('passes empty list when API returns no customers', async () => {
    listMock.mockResolvedValue({ customers: [] });
    render(await CustomersPage({ params: Promise.resolve({ locale: 'hi' }) }));
    const props = clientProps.current as ListProps;
    expect(props.initialCustomers).toEqual([]);
  });

  it('passes empty list when API throws', async () => {
    listMock.mockRejectedValue(new TypeError('fetch failed'));
    render(await CustomersPage({ params: Promise.resolve({ locale: 'hi' }) }));
    const props = clientProps.current as ListProps;
    expect(props.initialCustomers).toEqual([]);
  });
});
