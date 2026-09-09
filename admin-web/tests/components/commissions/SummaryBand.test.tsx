import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SummaryBand } from '../../../src/components/commissions/SummaryBand';
import { formatDate, formatDateTime } from '../../../src/lib/format/intl';

// The technician-count/oldest/as-of clauses render as sibling text inside one shared <span>
// (design: a compact single meta line), so their combined text is a single DOM text node from
// React Testing Library's point of view — getByText needs a substring (regex) matcher rather
// than an exact-equality string to find one clause within that combined line.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Sketched in the task-6 brief, extended in fix round 1. The binding rule (design doc §3): the
// number stops claiming to be the truth at the moment it stops being the truth —
//   1. when unreconciledTechnicianCount > 0 the headline label switches from "Outstanding
//      commission" to "Cached total" and the reconciliation line becomes a warning strip;
//   2. a page-scoped figure (technicianCount / oldestDueAt / asOf, all derived from whichever
//      rows are currently loaded) must never be presented as if it covered the whole roster —
//      `isPartial` swaps in an explicitly page-scoped label instead.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'summaryBand.outstandingLabel': 'Outstanding commission',
      'summaryBand.cachedTotal': 'Cached total',
      'summaryBand.technicianCount': '{count} technicians',
      'summaryBand.technicianCountPartial': '{count} technicians on this page',
      'summaryBand.oldest': 'oldest {date}',
      'summaryBand.oldestPartial': 'oldest on this page {date}',
      'summaryBand.asOf': 'as of {date}',
      'summaryBand.asOfPartial': 'as of {date} (this page)',
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
        isPartial={false}
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
        isPartial={false}
        onRecompute={noop}
        canRecompute
      />,
    );
    expect(screen.getByText(/Cached total/)).toBeInTheDocument();
    // No role="status" on this strip — the toast that CommissionsClient renders alongside it
    // already owns role="status"/"alert", and a second simultaneous live region would make
    // screen readers announce both at once (fix round 1, minor finding).
    expect(
      screen.getByText(/3 technicians have unreconciled balances/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('hides the Recompute button from a role without settle capability', () => {
    render(
      <SummaryBand
        totalOutstanding={0}
        technicianCount={0}
        unreconciledTechnicianCount={0}
        isPartial={false}
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
        isPartial={false}
        onRecompute={noop}
        canRecompute
      />,
    );
    expect(screen.getByRole('button', { name: 'Recompute' })).toBeInTheDocument();
  });

  const OLDEST_DUE_AT = '2026-05-08T00:00:00Z';
  const AS_OF = '2026-09-07T13:24:00.000Z';
  // Computed with the exact same formatter the component uses, rather than a hardcoded string,
  // so this test doesn't depend on the host machine's timezone (formatDate/formatDateTime don't
  // pin a timeZone, so their output shifts by local offset — asserting a literal string here
  // would make the test pass or fail depending on where it runs).
  const expectedOldestDate = formatDate(OLDEST_DUE_AT, 'en');
  const expectedAsOfDate = formatDateTime(AS_OF, 'en');

  it('renders the technician count, oldest-due date, and as-of time unqualified when the loaded set is the whole roster', () => {
    render(
      <SummaryBand
        totalOutstanding={184258}
        technicianCount={4}
        unreconciledTechnicianCount={0}
        oldestDueAt={OLDEST_DUE_AT}
        asOf={AS_OF}
        isPartial={false}
        onRecompute={noop}
        canRecompute
      />,
    );
    expect(screen.getByText(/^4 technicians/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`oldest ${escapeRegex(expectedOldestDate)}`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`as of ${escapeRegex(expectedAsOfDate)}`))).toBeInTheDocument();
    expect(screen.queryByText(/on this page/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(this page\)/)).not.toBeInTheDocument();
  });

  it('qualifies the technician count, oldest-due date, and as-of time as page-scoped when isPartial is true', () => {
    render(
      <SummaryBand
        totalOutstanding={184258}
        technicianCount={50}
        unreconciledTechnicianCount={0}
        oldestDueAt={OLDEST_DUE_AT}
        asOf={AS_OF}
        isPartial
        onRecompute={noop}
        canRecompute
      />,
    );
    expect(screen.getByText(/50 technicians on this page/)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`oldest on this page ${escapeRegex(expectedOldestDate)}`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`as of ${escapeRegex(expectedAsOfDate)} \\(this page\\)`)),
    ).toBeInTheDocument();
  });
});
