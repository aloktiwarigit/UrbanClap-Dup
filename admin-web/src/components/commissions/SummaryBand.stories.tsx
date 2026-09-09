import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { SummaryBand } from './SummaryBand';
import enMessages from '../../../messages/en.json';

// SummaryBand calls both useTranslations('commissions') and useLocale() (formatINR/formatDate
// need a real locale to format money and dates) — it needs a real NextIntlClientProvider
// ancestor with the actual commissions namespace, not the empty-object stub CounterStrip.stories
// and Drawer.stories use for components that only call useLocale(). Importing the namespace
// straight from the real message file (rather than hand-copying strings here) keeps these
// stories from silently drifting out of sync with the copy the app actually ships.
const messages = { commissions: enMessages.commissions };

const meta: Meta<typeof SummaryBand> = {
  title: 'Commissions/SummaryBand',
  component: SummaryBand,
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <div style={{ padding: 'var(--space-6)', maxWidth: '720px' }}>
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
type Story = StoryObj<typeof SummaryBand>;

// Every technician's balance is current — the roster-wide reconciliation line reads as a quiet
// footnote, not a warning (SummaryBand.tsx binding rule).
export const Reconciled: Story = {
  args: {
    totalOutstanding: 684258,
    technicianCount: 12,
    unreconciledTechnicianCount: 0,
    oldestDueAt: '2026-04-20T00:00:00.000Z',
    asOf: '2026-05-04T09:00:00.000Z',
    isPartial: false,
    canRecompute: true,
    onRecompute: () => {},
  },
};

// Some technicians' cached balances haven't been recomputed recently: the headline label swaps
// to "Cached total" and the reconciliation line becomes a warn-coloured strip rather than a
// quiet footnote (SummaryBand.tsx binding rule — the number stops claiming to be the truth the
// moment it stops being the truth).
export const Unreconciled: Story = {
  args: {
    totalOutstanding: 684258,
    technicianCount: 12,
    unreconciledTechnicianCount: 3,
    oldestDueAt: '2026-04-20T00:00:00.000Z',
    asOf: '2026-05-04T09:00:00.000Z',
    isPartial: false,
    canRecompute: true,
    onRecompute: () => {},
  },
};

// A recompute is in flight — the button is disabled while it runs.
export const Recomputing: Story = {
  args: {
    ...Unreconciled.args,
    recomputing: true,
  },
};

// A viewer without settings.manage (super-admin only) never sees the recompute control at all.
export const WithoutRecomputeCapability: Story = {
  args: {
    ...Reconciled.args,
    canRecompute: false,
  },
};
