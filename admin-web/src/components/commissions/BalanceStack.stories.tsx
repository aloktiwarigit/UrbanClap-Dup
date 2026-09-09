import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { BalanceStack } from './BalanceStack';
import enMessages from '../../../messages/en.json';

// Same reasoning as SummaryBand.stories.tsx: BalanceStack calls useTranslations('commissions')
// and useLocale() for money formatting, so it needs a real provider with the real namespace.
const messages = { commissions: enMessages.commissions };

const meta: Meta<typeof BalanceStack> = {
  title: 'Commissions/BalanceStack',
  component: BalanceStack,
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <div style={{ padding: 'var(--space-6)', maxWidth: '480px' }}>
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#070a0b' }],
    },
  },
};
export default meta;
type Story = StoryObj<typeof BalanceStack>;

// A straightforward balance: commission due, one partial payment, nothing waived, no credit
// involved. `detail.balance.creditAnnotation` renders "includes ₹0.00 applied from credit" —
// this is deliberately not hidden at zero (BalanceStack.tsx never treats the credit annotation
// as conditional on being non-zero), it just always shows.
export const WithoutCredits: Story = {
  args: {
    stack: {
      commissionDuePaise: 13478,
      repaidPaise: 10000,
      settledPaise: 0,
      balancePaise: 3478,
      creditAppliedPaise: 0,
    },
    cashCollectedPaise: 59900,
    jobCount: 1,
  },
};

// An overpayment on an earlier receivable created a credit, and that credit was consumed against
// this payment — `creditAppliedPaise` is already folded into `repaidPaise` by the server
// (BalanceStack.tsx module doc, point 2), so it renders only as an annotation on the payments
// line, never as a fourth subtracted row that would double-count it.
export const WithCredits: Story = {
  args: {
    stack: {
      commissionDuePaise: 40000,
      repaidPaise: 40000,
      settledPaise: 0,
      balancePaise: 0,
      creditAppliedPaise: 5000,
    },
    cashCollectedPaise: 180000,
    jobCount: 3,
  },
};

// A legacy over-settled row: `settledPaise` is negative, which BalanceStack.tsx renders with a
// flipped '+' sign via `formatSubtractionLine` rather than `Math.abs()`-ing it into looking like
// a positive deduction.
export const LegacyOverSettled: Story = {
  args: {
    stack: {
      commissionDuePaise: 20000,
      repaidPaise: 15000,
      settledPaise: -500,
      balancePaise: 5500,
      creditAppliedPaise: 0,
    },
    cashCollectedPaise: 90000,
    jobCount: 2,
  },
};
