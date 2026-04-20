import type { Meta, StoryObj } from '@storybook/react';
import { OrderFeed } from './OrderFeed';

const meta: Meta<typeof OrderFeed> = {
  title: 'Dashboard/OrderFeed',
  component: OrderFeed,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#070a0b' }],
    },
    // Mock the fetch — in a full Storybook MSW setup this would use an http handler.
    // Static fixture data via msw addon would replace the polling endpoint.
    msw: {
      handlers: [],
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrderFeed>;

// Default story renders with live polling (requires running API or MSW addon configured).
// In CI / static Storybook builds the fetch will fail gracefully and show an empty feed.
export const Default: Story = {};
