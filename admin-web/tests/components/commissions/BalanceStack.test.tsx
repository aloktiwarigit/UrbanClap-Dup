import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BalanceStack } from '../../../src/components/commissions/BalanceStack';

// task-7 brief + design doc §4. The load-bearing rule of this whole screen: cashCollectedPaise
// and creditAppliedPaise must never be read as summable, and cash is not a balance line at all —
// it is evidence for *why* a commission exists, not a reduction of what is owed. The structural
// separation between the balance region and the cash-job-context region is the requirement, not
// a styling preference (hence the `not.toContainElement` assertion below).
//
// Two derivation facts this component must respect (task-7 brief):
//   1. `settledPaise` is signed and can be negative on a legacy over-settled row — it must never
//      be Math.abs()'d into looking like a positive deduction.
//   2. `creditAppliedPaise` is already inside `repaidPaise` (server-side), so it is rendered only
//      as an annotation on the payments line, never as its own subtracted row.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'detail.balance.heading': 'Balance',
      'detail.balance.due': 'Commission due from cash jobs',
      'detail.balance.repaid': 'Payments and credits applied',
      'detail.balance.creditAnnotation': 'includes {amount} applied from credit',
      'detail.balance.settled': 'Waived or settled',
      'detail.balance.total': 'Balance due',
      'detail.cashContext.heading': 'Cash-job context',
      'detail.cashContext.line': 'Collected at the door, {count} jobs',
      'detail.cashContext.caveat': 'not part of the balance',
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

describe('BalanceStack', () => {
  it('shows the accounting stack with signed lines and a stated balance', () => {
    render(
      <BalanceStack
        stack={{
          commissionDuePaise: 26956,
          repaidPaise: 13478,
          settledPaise: 0,
          balancePaise: 13478,
          creditAppliedPaise: 0,
        }}
        cashCollectedPaise={619300}
        jobCount={11}
      />,
    );
    expect(screen.getByText('₹269.56')).toBeInTheDocument();
    expect(screen.getByText('− ₹134.78')).toBeInTheDocument();
    expect(screen.getByText('₹134.78')).toBeInTheDocument();
  });

  it('states plainly that cash collected is not part of the balance', () => {
    render(
      <BalanceStack
        stack={{
          commissionDuePaise: 26956,
          repaidPaise: 0,
          settledPaise: 0,
          balancePaise: 26956,
          creditAppliedPaise: 0,
        }}
        cashCollectedPaise={619300}
        jobCount={11}
      />,
    );
    const cash = screen.getByTestId('cash-context');
    expect(cash).toHaveTextContent('₹6,193.00');
    expect(cash).toHaveTextContent(/not part of the balance/i);
  });

  it('renders cash context outside the balance region so the two are not one group', () => {
    render(
      <BalanceStack
        stack={{
          commissionDuePaise: 26956,
          repaidPaise: 13478,
          settledPaise: 0,
          balancePaise: 13478,
          creditAppliedPaise: 0,
        }}
        cashCollectedPaise={619300}
        jobCount={11}
      />,
    );
    const balance = screen.getByTestId('balance-stack');
    expect(balance).not.toContainElement(screen.getByTestId('cash-context'));
  });

  it('annotates the payments line with the credit applied, without a separate subtracted row', () => {
    render(
      <BalanceStack
        stack={{
          commissionDuePaise: 26956,
          repaidPaise: 13478,
          settledPaise: 0,
          balancePaise: 13478,
          creditAppliedPaise: 5000,
        }}
        cashCollectedPaise={619300}
        jobCount={11}
      />,
    );
    // The annotation reads as a sub-clause of the payments line, not a fourth line item.
    expect(screen.getByText('includes ₹50.00 applied from credit')).toBeInTheDocument();
    // No dedicated "credit" subtraction row exists — searching for the raw amount formatted as a
    // standalone subtraction would find nothing.
    expect(screen.queryByText('− ₹50.00')).not.toBeInTheDocument();
  });

  it('renders a signed, non-absolute settled line for a legacy over-settled row', () => {
    // settledPaise negative means a legacy row was settled for more than it owed — this must
    // render as an addition back onto the balance, never as a positive-looking deduction.
    render(
      <BalanceStack
        stack={{
          commissionDuePaise: 13478,
          repaidPaise: 15000,
          settledPaise: -1522,
          balancePaise: 0,
          creditAppliedPaise: 0,
        }}
        cashCollectedPaise={0}
        jobCount={1}
      />,
    );
    expect(screen.getByText('+ ₹15.22')).toBeInTheDocument();
    expect(screen.queryByText('− ₹15.22')).not.toBeInTheDocument();
  });

  it('never renders a figure combining cash collected and credit applied', () => {
    const cashCollectedPaise = 619300;
    const creditAppliedPaise = 5000;
    render(
      <BalanceStack
        stack={{
          commissionDuePaise: 26956,
          repaidPaise: 13478,
          settledPaise: 0,
          balancePaise: 13478,
          creditAppliedPaise,
        }}
        cashCollectedPaise={cashCollectedPaise}
        jobCount={11}
      />,
    );
    const combined = cashCollectedPaise + creditAppliedPaise; // ₹6,243.00 — must never appear
    expect(screen.queryByText(/6,243\.00/)).not.toBeInTheDocument();
  });
});
