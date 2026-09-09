import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HoldChip } from '../../../src/components/commissions/HoldChip';

// Sketched in the task-6 brief (.superpowers/sdd/2026-09-07-e21-s03-commission-console/task-6-brief.md).
// Hold state is an eligibility filter, never a ranking input (design doc §3), and the common CLEAR
// case must render as quiet as possible — no badge, just the em-dash — because a badge on every
// healthy row trains the eye to skip badges (design doc §2).

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'holdChip.warn': 'Warn',
      'holdChip.blocked': 'Blocked',
      'holdChip.override': 'Override · {actor} · {date}',
    };
    const template = dictionary[key] ?? `[${key}]`;
    if (!params) return template;
    return Object.entries(params).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template,
    );
  },
  useLocale: () => 'en',
}));

describe('HoldChip', () => {
  it('renders no badge for a CLEAR hold', () => {
    const { container } = render(<HoldChip state="CLEAR" />);
    expect(container).toHaveTextContent('—');
  });

  it('renders a warn label for a WARN hold', () => {
    render(<HoldChip state="WARN" />);
    expect(screen.getByText('Warn')).toBeInTheDocument();
  });

  it('renders a blocked label for a BLOCKED hold', () => {
    render(<HoldChip state="BLOCKED" />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('names the actor and date on an override', () => {
    render(
      <HoldChip
        state="CLEAR"
        override={{ until: '2026-09-30T00:00:00Z', byAdminId: 'Alok', reason: 'r' }}
      />,
    );
    expect(screen.getByText(/Override/)).toBeInTheDocument();
    expect(screen.getByText(/Alok/)).toBeInTheDocument();
  });

  it('shows the override chip even when the underlying state is BLOCKED', () => {
    // An override always names who acted and when — colour alone can never
    // carry that (design doc §2) — so it must supersede the bare state label.
    render(
      <HoldChip
        state="BLOCKED"
        override={{ until: '2026-09-30T00:00:00Z', byAdminId: 'Alok', reason: 'r' }}
      />,
    );
    expect(screen.getByText(/Override · Alok/)).toBeInTheDocument();
    expect(screen.queryByText('Blocked')).not.toBeInTheDocument();
  });
});
