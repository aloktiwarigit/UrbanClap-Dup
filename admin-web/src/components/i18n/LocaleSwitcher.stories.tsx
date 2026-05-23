import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';

const messages = {
  locale: {
    switcher: {
      label: 'Language',
      en: 'English',
      hi: 'हिन्दी',
    },
  },
};

const hiMessages = {
  locale: {
    switcher: {
      label: 'भाषा',
      en: 'English',
      hi: 'हिन्दी',
    },
  },
};

const meta: Meta<typeof LocaleSwitcher> = {
  title: 'i18n/LocaleSwitcher',
  component: LocaleSwitcher,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0E0B08' },
        { name: 'light', value: '#F4EDDF' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocaleSwitcher>;

export const EnglishActive: Story = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export const HindiActive: Story = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="hi" messages={hiMessages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export const InTopbarContext: Story = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="hi" messages={hiMessages}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 16px',
            height: '48px',
            background: 'var(--ink-1, #14110C)',
            borderBottom: '1px solid var(--ink-4, #2E2719)',
            fontFamily: 'var(--font-geist, system-ui)',
          }}
        >
          {/* LIVE indicator placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#5BA38E', boxShadow: '0 0 6px #5BA38E',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#5BA38E' }}>
              LIVE
            </span>
          </div>
          {/* Clock placeholder */}
          <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: '#6E665B', marginRight: '8px' }}>
            08:32:14
          </span>
          <span style={{ flex: 1 }} />
          <Story />
          {/* ThemeToggle placeholder */}
          <button
            type="button"
            aria-label="Toggle theme"
            style={{
              width: '28px', height: '28px', border: '1px solid #2E2719',
              borderRadius: '6px', background: 'transparent', cursor: 'pointer',
              color: '#6E665B', fontSize: '14px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ☀
          </button>
        </div>
      </NextIntlClientProvider>
    ),
  ],
};
