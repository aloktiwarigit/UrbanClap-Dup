import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock next-intl to return sentinel values proving t() is called
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'hi',
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/hi/orders',
}));
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/hi/orders',
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

// Mock API calls
vi.mock('@/api/orders', () => ({
  fetchOrders: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }),
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

// Mock auth
vi.mock('@/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: { role: 'super-admin' } }),
}));
vi.mock('@/admin/capabilities', () => ({
  hasCapability: () => true,
}));

import { OrdersClient } from '../../src/components/orders/OrdersClient';

describe('Orders i18n extraction', () => {
  it('renders no hardcoded English "Orders" title string', () => {
    render(React.createElement(OrdersClient));
    // The literal text "Orders" must not appear anywhere — only the sentinel should
    expect(screen.queryByText('Orders')).toBeNull();
  });

  it('renders i18n sentinel for title', () => {
    render(React.createElement(OrdersClient));
    // After extraction, the sentinel proves t('list.title') is called
    expect(screen.getByText('[orders.list.title]')).toBeTruthy();
  });

  it('renders i18n sentinel for export button', () => {
    render(React.createElement(OrdersClient));
    expect(screen.getByText('[orders.list.exportButton.label]')).toBeTruthy();
  });
});
