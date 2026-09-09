import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { Drawer } from './Drawer';

// Drawer itself does not call useLocale()/useTranslations, but every screen
// that will actually use it does, and Storybook's isolated render has no
// ancestor <NextIntlClientProvider> the way the real app layout does. Wrap
// unconditionally so a future story added here (or copy-pasted elsewhere)
// doesn't throw. Same pattern as CounterStrip.stories.tsx.
const messages = {};

const meta: Meta<typeof Drawer> = {
  title: 'UI/Drawer',
  component: Drawer,
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0E0B08' }],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Drawer>;

function DrawerDemo({ title, withFooter }: { title: string; withFooter: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Reopen drawer
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          withFooter ? (
            <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
              Done
            </button>
          ) : undefined
        }
      >
        <p>Detail content for the record scrolls here.</p>
      </Drawer>
    </div>
  );
}

export const Default: Story = {
  render: () => <DrawerDemo title="Commission adjustment #a1b2c3d4" withFooter />,
};

export const NoFooter: Story = {
  render: () => <DrawerDemo title="Ledger entry detail" withFooter={false} />,
};
