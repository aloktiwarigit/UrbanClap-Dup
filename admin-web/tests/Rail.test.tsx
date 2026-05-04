import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Rail } from '../src/components/dashboard/Rail';
import { AdminAuthProvider } from '../src/lib/auth/context';
import type { AdminRole } from '../src/lib/auth/types';

let pathname = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn() }),
}));

function renderRail(role: AdminRole) {
  return render(
    <AdminAuthProvider initialAuth={{ adminId: 'admin-1', email: 'a@example.com', role }}>
      <Rail />
    </AdminAuthProvider>,
  );
}

describe('Rail capability filtering', () => {
  it('shows super-admin enterprise nav items', () => {
    pathname = '/dashboard';
    renderRail('super-admin');
    expect(screen.getByLabelText('Audit Log')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Users')).toBeInTheDocument();
    expect(screen.getByLabelText('Compliance')).toBeInTheDocument();
  });

  it('hides super-admin-only nav from ops-manager', () => {
    pathname = '/orders';
    renderRail('ops-manager');
    expect(screen.getAllByLabelText('Orders')[0]).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByLabelText('Audit Log')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Admin Users')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Compliance')).not.toBeInTheDocument();
  });

  it('limits finance to the finance section', () => {
    pathname = '/finance';
    renderRail('finance');
    expect(screen.getAllByLabelText('Finance')[0]).toBeInTheDocument();
    expect(screen.queryByLabelText('Live Ops')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Orders')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Catalogue')).not.toBeInTheDocument();
  });
});
