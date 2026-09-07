import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BalanceEvents } from '../../../src/components/commissions/BalanceEvents';

// task-7 brief + design doc §4 "Balance events — the dispute view". One chronological ledger
// with a running balance so the owner can walk a phone call through it line by line. References
// are click-to-copy — at 11pm the owner is reading one aloud down a phone line.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'detail.events.heading': 'Balance events',
      'detail.events.columns.date': 'Date',
      'detail.events.columns.event': 'Event',
      'detail.events.columns.change': 'Change',
      'detail.events.columns.balance': 'Balance',
      'detail.events.columns.recordedBy': 'Recorded by',
      'detail.events.copyReference': 'Copy reference',
      'detail.events.copied': 'Copied',
      'detail.events.empty': 'No balance events yet.',
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

describe('BalanceEvents', () => {
  it('shows a running balance with copyable references', async () => {
    const user = userEvent.setup();
    render(
      <BalanceEvents
        events={[
          {
            id: 'e1',
            at: '2026-09-02T10:00:00Z',
            kind: 'REMITTANCE',
            label: 'Payment',
            ref: 'upi-1',
            actorId: 'Alok',
            changePaise: -13478,
            balancePaise: 13478,
          },
        ]}
      />,
    );
    expect(screen.getByText('upi-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /copy reference/i }));
    expect(await navigator.clipboard.readText()).toBe('upi-1');
  });

  it('carries the booking id, reference, and actor on every row that has one', () => {
    render(
      <BalanceEvents
        events={[
          {
            id: 'due:b1',
            at: '2026-05-08T04:57:40.119Z',
            kind: 'DUE',
            label: 'Commission due — AC Deep Clean',
            bookingId: '304bad00',
            changePaise: 13478,
            balancePaise: 13478,
          },
          {
            id: 'remittance:rem1',
            at: '2026-09-02T10:00:00Z',
            kind: 'REMITTANCE',
            label: 'Remittance recorded — UPI',
            ref: 'upi-abc123',
            actorId: 'Alok',
            changePaise: -13478,
            balancePaise: 0,
          },
        ]}
      />,
    );
    expect(screen.getByText('304bad00')).toBeInTheDocument();
    expect(screen.getByText('upi-abc123')).toBeInTheDocument();
    expect(screen.getByText('Alok')).toBeInTheDocument();
  });

  it('signs the change column truthfully — increases show +, decreases show −', () => {
    render(
      <BalanceEvents
        events={[
          {
            id: 'due:b1',
            at: '2026-05-08T00:00:00Z',
            kind: 'DUE',
            label: 'Commission due',
            changePaise: 13478,
            balancePaise: 13478,
          },
          {
            id: 'remittance:rem1',
            at: '2026-09-02T00:00:00Z',
            kind: 'REMITTANCE',
            label: 'Remittance recorded',
            changePaise: -13478,
            balancePaise: 0,
          },
        ]}
      />,
    );
    expect(screen.getByText('+ ₹134.78')).toBeInTheDocument();
    expect(screen.getByText('− ₹134.78')).toBeInTheDocument();
  });

  it('renders the running balance for every row', () => {
    render(
      <BalanceEvents
        events={[
          {
            id: 'due:b1',
            at: '2026-05-08T00:00:00Z',
            kind: 'DUE',
            label: 'Commission due',
            changePaise: 13478,
            balancePaise: 13478,
          },
          {
            id: 'due:b2',
            at: '2026-05-09T00:00:00Z',
            kind: 'DUE',
            label: 'Commission due',
            changePaise: 13478,
            balancePaise: 26956,
          },
        ]}
      />,
    );
    expect(screen.getByText('₹134.78')).toBeInTheDocument();
    expect(screen.getByText('₹269.56')).toBeInTheDocument();
  });

  it('shows an empty state when there are no events yet', () => {
    render(<BalanceEvents events={[]} />);
    expect(screen.getByText('No balance events yet.')).toBeInTheDocument();
  });
});
