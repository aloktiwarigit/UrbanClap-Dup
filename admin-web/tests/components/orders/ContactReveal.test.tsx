import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `[${ns}.${key}:${JSON.stringify(values)}]` : `[${ns}.${key}]`;
    return t;
  },
}));

// vi.mock factories are hoisted above module-scope declarations, so the
// values they close over must be created inside vi.hoisted() to avoid a
// "Cannot access before initialization" TDZ error.
const { revealOrderContact, RevealContactError } = vi.hoisted(() => {
  const revealOrderContact = vi.fn();
  class RevealContactError extends Error {
    status: number;
    constructor(status: number) { super('x'); this.status = status; }
  }
  return { revealOrderContact, RevealContactError };
});
vi.mock('@/api/orders', () => ({ revealOrderContact, RevealContactError }));

import { ContactReveal } from '../../../src/components/orders/ContactReveal';

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { vi.useRealTimers(); });

const base = {
  orderId: 'ord_1',
  party: 'CUSTOMER' as const,
  maskedPhone: '+91 XXXXX-X9999',
  canReveal: true,
};

describe('ContactReveal', () => {
  it('renders the masked number at rest', () => {
    render(<ContactReveal {...base} />);
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('hides the reveal control when the role lacks the capability', () => {
    render(<ContactReveal {...base} canReveal={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('renders the unavailable copy when there is no masked number', () => {
    render(<ContactReveal {...base} maskedPhone={undefined} />);
    expect(screen.getByText('[orders.pii.unavailable]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the full number and a tel: link after a successful reveal', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', 'tel:+919999999999');
  });

  it('states that the reveal was recorded', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.recorded]')).toBeInTheDocument());
  });

  it('re-masks automatically after 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    await vi.advanceTimersByTimeAsync(60_000);
    await waitFor(() => expect(screen.queryByText('+919999999999')).toBeNull());
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('re-masks immediately when the operator hides it', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('+919999999999')).toBeNull();
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('shows the forbidden message on 403', async () => {
    revealOrderContact.mockRejectedValue(new RevealContactError(403));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.forbidden]')).toBeInTheDocument());
  });

  it('shows the rate-limited message on 429', async () => {
    revealOrderContact.mockRejectedValue(new RevealContactError(429));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.rateLimited]')).toBeInTheDocument());
  });

  it('shows the generic failure message on any other error', async () => {
    revealOrderContact.mockRejectedValue(new Error('network'));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.failed]')).toBeInTheDocument());
  });

  it('requests the party it was given', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'TECHNICIAN', phone: '+919876544321', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} party="TECHNICIAN" maskedPhone="+91 XXXXX-X4321" />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(revealOrderContact).toHaveBeenCalledWith('ord_1', 'TECHNICIAN'));
  });
});
