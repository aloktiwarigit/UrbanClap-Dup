// admin-web/tests/dashboard-error.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

import DashboardError from '../app/(dashboard)/error';

describe('(dashboard)/error.tsx', () => {
  it('renders an editorial error block with eyebrow + headline', () => {
    render(<DashboardError error={new Error('boom')} reset={() => {}} />);
    expect(screen.getByRole('heading', { name: /something stalled/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
