import type { Meta, StoryObj } from '@storybook/react';
import { CounterStrip } from './CounterStrip';
import type { components } from '@/api/generated/schema';

type DashboardSummary = components['schemas']['DashboardSummary'];

const meta: Meta<typeof CounterStrip> = {
  title: 'Dashboard/CounterStrip',
  component: CounterStrip,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#070a0b' }],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CounterStrip>;

const busySummary: DashboardSummary = {
  bookingsToday: 127,
  gmvToday: 485000, // ₹4,850
  commissionToday: 58200, // ₹582
  payoutsPending: 312000, // ₹3,120
  complaintsOpen: 8,
  techsOnDuty: 34,
};

const quietSummary: DashboardSummary = {
  bookingsToday: 3,
  gmvToday: 12000, // ₹120
  commissionToday: 1440,
  payoutsPending: 0,
  complaintsOpen: 0,
  techsOnDuty: 2,
};

export const Busy: Story = {
  args: { summary: busySummary },
};

export const Quiet: Story = {
  args: { summary: quietSummary },
};

export const ZeroState: Story = {
  args: {
    summary: {
      bookingsToday: 0,
      gmvToday: 0,
      commissionToday: 0,
      payoutsPending: 0,
      complaintsOpen: 0,
      techsOnDuty: 0,
    },
  },
};
