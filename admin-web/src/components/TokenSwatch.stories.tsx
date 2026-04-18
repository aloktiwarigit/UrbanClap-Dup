import type { Meta, StoryObj } from '@storybook/react';

const COLOR_TOKENS = [
  '--color-brand',
  '--color-brand-fg',
  '--color-surface',
  '--color-surface-alt',
  '--color-text',
  '--color-text-muted',
  '--color-border',
  '--color-success',
  '--color-warn',
  '--color-danger',
] as const;

function Swatches() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', padding: 'var(--space-4)' }}>
      {COLOR_TOKENS.map((token) => (
        <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: `var(${token})`, border: '1px solid var(--color-border)' }} />
          <code style={{ fontSize: 'var(--text-xs)' }}>{token}</code>
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof Swatches> = {
  title: 'Tokens/Color',
  component: Swatches,
};
export default meta;
type S = StoryObj<typeof Swatches>;

export const Palette: S = {};
