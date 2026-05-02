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

// Coords inside the Ayodhya operational bounding box ([82.10-82.30, 26.70-26.88])
const fixtureLocations: TechLocation[] = [
  { technicianId: 't-1', name: 'Ravi Kumar', serviceType: 'plumbing', lat: 26.79, lng: 82.20, state: 'active', updatedAt: '2026-04-19T10:00:00Z' },
  { technicianId: 't-2', name: 'Suresh Babu', serviceType: 'electrical', lat: 26.78, lng: 82.22, state: 'enroute', updatedAt: '2026-04-19T10:05:00Z' },
  { technicianId: 't-3', name: 'Anand Pillai', serviceType: 'carpentry', lat: 26.81, lng: 82.18, state: 'idle', updatedAt: '2026-04-19T10:08:00Z' },
  { technicianId: 't-4', name: 'Deepak Rao', serviceType: 'painting', lat: 26.76, lng: 82.16, state: 'alert', updatedAt: '2026-04-19T10:10:00Z' },
  { technicianId: 't-5', name: 'Priya Nair', serviceType: 'cleaning', lat: 26.83, lng: 82.24, state: 'active', updatedAt: '2026-04-19T10:12:00Z' },
  { technicianId: 't-6', name: 'Vikram Singh', serviceType: 'plumbing', lat: 26.79, lng: 82.21, state: 'active', updatedAt: '2026-04-19T10:15:00Z' },
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
