import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommissionsClient } from '../../../src/components/commissions/CommissionsClient';
import type { CommissionDashboard } from '../../../src/api/commissions';

// Sketched in the task-6 brief, extended in fix round 1. The binding rules from the design
// direction (docs/design/E21-S03-commission-console.md §1, §3):
//   1. Hold state is an eligibility filter, never a ranking input — the server orders by
//      outstanding amount and the client must render that order as given, never re-sort by state.
//   2. Every figure here is a cache over a ledger, so a stale row must say so explicitly.
//   3. A page-scoped figure must never be presented as if it were roster-wide: technicianCount,
//      oldestDueAt, and asOf on the summary band are all derived from whichever rows are
//      currently loaded, so whenever more pages exist (a continuationToken is present) or an
//      earlier page has already been paged past, those figures must render with an explicit
//      page-scope qualifier rather than silently under-reporting the roster.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      title: 'Commissions',
      subtitle: 'Technicians who owe commission on cash jobs.',
      loading: 'Loading commission dashboard…',
      'errors.loadFailed': 'Could not load the commission dashboard.',
      'errors.recomputeFailed': 'Could not queue the recompute.',
      'messages.recomputeQueued': 'Recompute queued.',
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
      'table.columns.technician': 'Technician',
      'table.columns.outstanding': 'Outstanding',
      'table.columns.jobs': 'Jobs',
      'table.columns.oldestDue': 'Oldest due',
      'table.columns.lastChecked': 'Last checked',
      'table.columns.state': 'State',
      'table.stale': 'stale',
      'emptyState.eyebrow': 'Commissions',
      'emptyState.headline': 'No outstanding commission',
      'emptyState.copy': 'Every technician is reconciled.',
      'pagination.previous': 'Previous',
      'pagination.next': 'Next',
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

const { fetchCommissionDashboard, recomputeAllHolds } = vi.hoisted(() => ({
  fetchCommissionDashboard: vi.fn(),
  recomputeAllHolds: vi.fn(),
}));
vi.mock('@/api/commissions', () => ({ fetchCommissionDashboard, recomputeAllHolds }));

let mockRole: string | null = 'super-admin';
vi.mock('@/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: mockRole ? { role: mockRole } : null }),
}));
vi.mock('@/admin/capabilities', () => ({
  hasCapability: (role: string | null | undefined, capability: string) =>
    role === 'super-admin' || (role === 'finance' && capability === 'finance.settleCommission'),
}));

// Never stale relative to the real clock (test runs in 2026); never re-used as a "now" fixture —
// isStale reads Date.now() internally, not a param, so these only need to bracket the real date.
const NOT_STALE = '2099-01-01T00:00:00.000Z';
const ALWAYS_STALE = '2020-01-01T00:00:00.000Z';
const EVALUATED_AT = '2026-09-07T13:24:00.000Z';

function dashboard(overrides: Partial<CommissionDashboard>): CommissionDashboard {
  return {
    technicians: [],
    totalOutstanding: 0,
    unreconciledTechnicianCount: 0,
    ...overrides,
  };
}

describe('CommissionsClient', () => {
  it('orders rows by outstanding amount and never by hold state', () => {
    render(
      <CommissionsClient
        initialData={dashboard({
          technicians: [
            {
              technicianId: 'a',
              technicianName: 'Low Blocked',
              outstandingPaise: 100,
              dueCount: 1,
              state: 'BLOCKED',
              evaluatedAt: EVALUATED_AT,
              staleAfter: NOT_STALE,
            },
            {
              technicianId: 'b',
              technicianName: 'High Clear',
              outstandingPaise: 90000,
              dueCount: 2,
              state: 'CLEAR',
              evaluatedAt: EVALUATED_AT,
              staleAfter: NOT_STALE,
            },
          ],
          totalOutstanding: 90100,
          unreconciledTechnicianCount: 0,
        })}
      />,
    );

    const names = screen.getAllByTestId('commission-row-name').map((n) => n.textContent);
    // Array order rendered exactly as given — not re-sorted by state (the low-outstanding BLOCKED
    // row stays first even though it would sort last if the client ranked by hold state).
    expect(names).toEqual(['Low Blocked', 'High Clear']);
    expect(fetchCommissionDashboard).not.toHaveBeenCalled();
  });

  it('marks a row stale once past staleAfter', () => {
    render(
      <CommissionsClient
        initialData={dashboard({
          technicians: [
            {
              technicianId: 'a',
              technicianName: 'Mohan Lal',
              outstandingPaise: 11228,
              dueCount: 1,
              state: 'CLEAR',
              evaluatedAt: EVALUATED_AT,
              staleAfter: ALWAYS_STALE,
            },
            {
              technicianId: 'b',
              technicianName: 'Ramesh Kumar',
              outstandingPaise: 139346,
              dueCount: 7,
              state: 'CLEAR',
              evaluatedAt: EVALUATED_AT,
              staleAfter: NOT_STALE,
            },
          ],
          totalOutstanding: 150574,
          unreconciledTechnicianCount: 0,
        })}
      />,
    );

    const rows = screen.getAllByRole('row').slice(1); // drop the header row
    const staleRow = rows.find((row) => row.textContent?.includes('Mohan Lal'));
    const freshRow = rows.find((row) => row.textContent?.includes('Ramesh Kumar'));
    expect(staleRow).toHaveTextContent('stale');
    expect(freshRow).not.toHaveTextContent('stale');
  });

  it('hides Recompute from a role without settle capability', () => {
    mockRole = 'support-agent';
    render(
      <CommissionsClient
        initialData={dashboard({
          technicians: [
            {
              technicianId: 'a',
              technicianName: 'Ramesh Kumar',
              outstandingPaise: 139346,
              dueCount: 7,
              state: 'CLEAR',
              evaluatedAt: EVALUATED_AT,
              staleAfter: NOT_STALE,
            },
          ],
          totalOutstanding: 139346,
          unreconciledTechnicianCount: 0,
        })}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Recompute' })).not.toBeInTheDocument();
    mockRole = 'super-admin';
  });

  it('qualifies the summary band as page-scoped when a continuation token shows more pages exist', () => {
    render(
      <CommissionsClient
        initialData={dashboard({
          technicians: [
            {
              technicianId: 'a',
              technicianName: 'Ramesh Kumar',
              outstandingPaise: 139346,
              dueCount: 7,
              oldestDueAt: '2026-08-22T00:00:00Z',
              state: 'CLEAR',
              evaluatedAt: EVALUATED_AT,
              staleAfter: NOT_STALE,
            },
          ],
          // Deliberately far larger than this page's one row — proves totalOutstanding (always
          // server-computed roster-wide) is rendered as-is while technicianCount/oldestDueAt/asOf
          // (all page-derived) get the page-scope qualifier instead of quietly under-reporting.
          totalOutstanding: 50000000,
          unreconciledTechnicianCount: 0,
          continuationToken: 'next-page',
        })}
      />,
    );
    expect(screen.getByText(/1 technicians on this page/)).toBeInTheDocument();
    expect(screen.getByText(/oldest on this page/)).toBeInTheDocument();
    expect(screen.getByText(/\(this page\)/)).toBeInTheDocument();
  });

  it('renders the summary band unqualified when the loaded page is the whole roster', () => {
    render(
      <CommissionsClient
        initialData={dashboard({
          technicians: [
            {
              technicianId: 'a',
              technicianName: 'Ramesh Kumar',
              outstandingPaise: 139346,
              dueCount: 7,
              oldestDueAt: '2026-08-22T00:00:00Z',
              state: 'CLEAR',
              evaluatedAt: EVALUATED_AT,
              staleAfter: NOT_STALE,
            },
          ],
          totalOutstanding: 139346,
          unreconciledTechnicianCount: 0,
          // No continuationToken — this is the only page.
        })}
      />,
    );
    expect(screen.getByText(/1 technicians/)).toBeInTheDocument();
    expect(screen.queryByText(/on this page/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(this page\)/)).not.toBeInTheDocument();
  });
});
