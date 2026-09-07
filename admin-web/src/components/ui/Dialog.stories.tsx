import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { Dialog } from './Dialog';

// Dialog itself does not call useLocale()/useTranslations, but every screen
// that will actually use it does, and Storybook's isolated render has no
// ancestor <NextIntlClientProvider> the way the real app layout does. Wrap
// unconditionally so a future story added here (or copy-pasted elsewhere)
// doesn't throw. Same pattern as CounterStrip.stories.tsx.
const messages = {};

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
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
type Story = StoryObj<typeof Dialog>;

function DialogDemo({
  title,
  body,
  withFooter,
}: {
  title: string;
  body: string;
  withFooter: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Reopen dialog
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          withFooter ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                Confirm
              </button>
            </>
          ) : undefined
        }
      >
        <p>{body}</p>
      </Dialog>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <DialogDemo
      title="Record payment"
      body="This records a manual off-platform payment against the technician's commission ledger."
      withFooter
    />
  ),
};

export const NoFooter: Story = {
  render: () => (
    <DialogDemo
      title="Session expired"
      body="Your session has expired. Sign in again to continue."
      withFooter={false}
    />
  ),
};
