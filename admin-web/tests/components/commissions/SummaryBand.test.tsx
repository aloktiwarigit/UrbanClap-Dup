import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SummaryBand } from '../../../src/components/commissions/SummaryBand';

// Sketched in the task-6 brief. The binding rule (design doc §3): the number stops claiming to be
// the truth at the moment it stops being the truth — when unreconciledTechnicianCount > 0 the
// headline label switches from "Outstanding commission" to "Cached total" and the reconciliation
// line becomes a warning strip, not a footnote.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'summaryBand.outstandingLabel': 'Outstanding commission',
      'summaryBand.cachedTotal': 'Cached total',
      'summaryBand.technicianCount': '{count} technicians',
      'summaryBand.oldest': 'oldest {date}',
      'summaryBand.reconciled': 'All balances reconciled',
      'summaryBand.unreconciled':
        '{count} technicians have unreconciled balances — figures below may be out of date.',
      'summaryBand.recompute': 'Recompute',
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

const noop = () => {};

describe('SummaryBand', () => {
  it('labels the total "Outstanding commission" when everything is reconciled', () => {
    render(
      <SummaryBand
        totalOutstanding={184258}
        technicianCount={4}
        unreconciledTechnicianCount={0}
        oldestDueAt="2026-05-08T00:00:00Z"
        onRecompute={noop}
        canRecompute
      />,
    );
    expect(screen.getByText(/Outstanding commission/)).toBeInTheDocument();
    expect(screen.getByText('₹1,842.58')).toBeInTheDocument();
    expect(screen.getByText(/All balances reconciled/)).toBeInTheDocument();
  });

  it('relabels the total "Cached total" and warns when balances are unreconciled', () => {
    render(
      <SummaryBand
        totalOutstanding={184258}
        technicianCount={4}
        unreconciledTechnicianCount={3}
        onRecompute={noop}
        canRecompute
      />,
    );
    expect(screen.getByText(/Cached total/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      /3 technicians have unreconciled balances/,
    );
  });

  it('hides the Recompute button from a role without settle capability', () => {
    render(
      <SummaryBand
        totalOutstanding={0}
        technicianCount={0}
        unreconciledTechnicianCount={0}
        onRecompute={noop}
        canRecompute={false}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Recompute' })).not.toBeInTheDocument();
  });

  it('shows the Recompute button when the role has settle capability', () => {
    render(
      <SummaryBand
        totalOutstanding={0}
        technicianCount={0}
        unreconciledTechnicianCount={0}
        onRecompute={noop}
        canRecompute
      />,
    );
    expect(screen.getByRole('button', { name: 'Recompute' })).toBeInTheDocument();
  });
});
