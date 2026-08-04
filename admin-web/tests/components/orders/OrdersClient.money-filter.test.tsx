import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';

// This test guards a live unit-mismatch bug: the orders Min/Max amount
// filter inputs are operator-facing rupees ("Min ₹" / "Max ₹" per
// messages/en.json), but c.amount in Cosmos — and every amount field the
// API accepts — is integer paise, exactly like every other money value in
// this codebase (see api/src/schemas/order.ts `amount`, contrasted with the
// deliberately-named `amountRupees` exception in
// api/src/schemas/admin-customer.ts RefundCreditBodySchema). Before the
// fix, the raw rupee string typed by the operator was sent straight through
// as `minAmount`/`maxAmount`, so typing "500" filtered for orders
// >= 500 paise (₹5), not >= ₹500 — silently over-inclusive by 100x.
//
// This test asserts the query params `fetchOrders` receives are already
// converted to paise, at the exact FiltersState -> OrdersQueryParams
// boundary (OrdersClient.filtersToQueryParams) where the bug lived.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

let currentSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => '/orders',
}));
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/orders',
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

const fetchOrders = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 });
vi.mock('@/api/orders', () => ({
  fetchOrders: (...args: unknown[]) => fetchOrders(...args),
  fetchOrderById: vi.fn(),
  fetchAllOrdersForExport: vi.fn().mockResolvedValue([]),
  reassignOrder: vi.fn(),
  completeOrder: vi.fn(),
  refundOrder: vi.fn(),
  waiveFeeOrder: vi.fn(),
  escalateOrder: vi.fn(),
  addOrderNote: vi.fn(),
  fetchTechnicianCandidatesForOrder: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: { role: 'super-admin' } }),
}));
vi.mock('@/admin/capabilities', () => ({
  hasCapability: () => true,
}));

import { OrdersClient } from '../../../src/components/orders/OrdersClient';

describe('OrdersClient money filter — rupee-to-paise conversion', () => {
  beforeEach(() => {
    fetchOrders.mockClear();
  });

  it('converts a Min ₹ "500" URL filter to minAmount=50000 paise, not 500', async () => {
    currentSearchParams = new URLSearchParams({ minAmount: '500' });
    render(React.createElement(OrdersClient));

    await waitFor(() => expect(fetchOrders).toHaveBeenCalled());
    const params = fetchOrders.mock.calls[0]![0] as Record<string, unknown>;
    expect(params.minAmount).toBe('50000');
  });

  it('converts a Max ₹ "900" URL filter to maxAmount=90000 paise, not 900', async () => {
    currentSearchParams = new URLSearchParams({ maxAmount: '900' });
    render(React.createElement(OrdersClient));

    await waitFor(() => expect(fetchOrders).toHaveBeenCalled());
    const params = fetchOrders.mock.calls[0]![0] as Record<string, unknown>;
    expect(params.maxAmount).toBe('90000');
  });

  it('the paise value it sends correctly discriminates orders around the boundary (this is the actual bug the fix closes)', async () => {
    // An order priced at exactly ₹500 (50000 paise). An operator filtering
    // Min ₹500 should INCLUDE it (50000 >= 50000); Min ₹600 should EXCLUDE
    // it (50000 < 60000). Under the pre-fix bug, minAmount was sent as raw
    // rupees (500 / 600), and since Cosmos compares against paise, both
    // "500" and "600" would incorrectly evaluate as `50000 >= 500` and
    // `50000 >= 600` — both true — silently including the order in the
    // "600" case as well, which should have excluded it.
    const orderAmountPaise = 50000;

    currentSearchParams = new URLSearchParams({ minAmount: '500' });
    render(React.createElement(OrdersClient));
    await waitFor(() => expect(fetchOrders).toHaveBeenCalled());
    let sentMinAmount = Number(
      (fetchOrders.mock.calls[0]![0] as Record<string, unknown>).minAmount,
    );
    expect(orderAmountPaise >= sentMinAmount).toBe(true); // ₹500 filter includes a ₹500 order

    fetchOrders.mockClear();
    currentSearchParams = new URLSearchParams({ minAmount: '600' });
    render(React.createElement(OrdersClient));
    await waitFor(() => expect(fetchOrders).toHaveBeenCalled());
    sentMinAmount = Number(
      (fetchOrders.mock.calls[0]![0] as Record<string, unknown>).minAmount,
    );
    expect(orderAmountPaise >= sentMinAmount).toBe(false); // ₹600 filter excludes a ₹500 order
  });
});
