import type { Meta, StoryObj } from '@storybook/react';

const SIZES = [
  '--text-xs', '--text-sm', '--text-base', '--text-lg',
  '--text-xl', '--text-2xl', '--text-3xl', '--text-4xl',
] as const;

function Specimens() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
      {SIZES.map((token) => (
        <div key={token} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'baseline' }}>
          <code style={{ width: 120, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{token}</code>
          <span style={{ fontSize: `var(${token})` }}>The quick brown fox jumps over the lazy dog</span>
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof Specimens> = {
  title: 'Tokens/Typography',
  component: Specimens,
};
export default meta;
type S = StoryObj<typeof Specimens>;

export const Scale: S = {};
