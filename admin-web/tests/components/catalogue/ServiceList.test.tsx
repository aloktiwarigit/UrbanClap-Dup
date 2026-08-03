import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'en',
}));
vi.mock('../../../app/[locale]/(dashboard)/catalogue/actions', () => ({
  toggleServiceAction: vi.fn(),
}));

import { ServiceList } from '../../../app/[locale]/(dashboard)/catalogue/[categoryId]/ServiceList';
import type { components } from '../../../src/api/generated/schema';

type AdminService = components['schemas']['AdminService'];

const service: AdminService = {
  id: 'svc_1',
  name: 'AC Repair',
  basePrice: 59900,
  isActive: true,
} as AdminService;

describe('ServiceList money formatting', () => {
  it('renders the base price via the canonical formatINR currency string, not the old ad-hoc "INR 599" format', () => {
    render(<ServiceList categoryId="ac-repair" services={[service]} />);
    // Canonical formatter: currency-style, ₹ symbol, 2 decimals.
    expect(screen.getByText(/₹599\.00/)).toBeInTheDocument();
    // The old ad-hoc local formatter produced "INR 599" (no decimals, no ₹) — must be gone.
    expect(screen.queryByText(/INR 599/)).not.toBeInTheDocument();
  });
});
