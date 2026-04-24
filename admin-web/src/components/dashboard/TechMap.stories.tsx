import type { Meta, StoryObj } from '@storybook/react';
import { TechMap } from './TechMap';
import type { components } from '@/api/generated/schema';

type TechLocation = components['schemas']['TechLocation'];

const meta: Meta<typeof TechMap> = {
  title: 'Dashboard/TechMap',
  component: TechMap,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#070a0b' }],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TechMap>;

const fixtureLocations: TechLocation[] = [
  { technicianId: 't-1', name: 'Ravi Kumar', serviceType: 'plumbing', lat: 12.93, lng: 77.62, state: 'active', updatedAt: '2026-04-19T10:00:00Z' },
  { technicianId: 't-2', name: 'Suresh Babu', serviceType: 'electrical', lat: 12.91, lng: 77.65, state: 'enroute', updatedAt: '2026-04-19T10:05:00Z' },
  { technicianId: 't-3', name: 'Anand Pillai', serviceType: 'carpentry', lat: 12.95, lng: 77.63, state: 'idle', updatedAt: '2026-04-19T10:08:00Z' },
  { technicianId: 't-4', name: 'Deepak Rao', serviceType: 'painting', lat: 12.90, lng: 77.61, state: 'alert', updatedAt: '2026-04-19T10:10:00Z' },
  { technicianId: 't-5', name: 'Priya Nair', serviceType: 'cleaning', lat: 12.96, lng: 77.67, state: 'active', updatedAt: '2026-04-19T10:12:00Z' },
  { technicianId: 't-6', name: 'Vikram Singh', serviceType: 'plumbing', lat: 12.925, lng: 77.645, state: 'active', updatedAt: '2026-04-19T10:15:00Z' },
];

export const MixedStates: Story = {
  args: { techs: fixtureLocations },
};

export const Empty: Story = {
  args: { techs: [] },
};

export const AllActive: Story = {
  args: {
    techs: fixtureLocations.map((t) => ({ ...t, state: 'active' as const })),
  },
};
