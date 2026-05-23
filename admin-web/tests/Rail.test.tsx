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

// Rail now uses usePathname from next-intl navigation (locale-stripped)
vi.mock('@/lib/i18n/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    ({ type: 'a', props: { href, ...props, children } }),
}));

const NAV_LABELS: Record<string, string> = {
  dashboard: 'Live Ops', orders: 'Orders', finance: 'Finance',
  catalogue: 'Catalogue', complaints: 'Complaints', auditLog: 'Audit Log',
  adminUsers: 'Admin Users', compliance: 'Compliance',
  technicians: 'Technicians', customers: 'Customers',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => NAV_LABELS[key] ?? key,
  useLocale: () => 'en',
}));

function renderRail(role: AdminRole) {
  return render(
    <AdminAuthProvider initialAuth={{ adminId: 'admin-1', email: 'a@example.com', role }}>
      <Rail />
    </AdminAuthProvider>,
  );
}

describe('Rail capability filtering', () => {
  it('hides Audit Log from primary nav for super-admin (route still reachable directly)', () => {
    pathname = '/dashboard';
    renderRail('super-admin');
    // Audit Log no longer appears in the rail — operators reach it via deep link or
    // the capability-gated entry point we keep around for future surfacing.
    expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
    // Other super-admin nav items still present
    expect(screen.getAllByText('Admin Users').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Compliance').length).toBeGreaterThan(0);
  });

  it('still grants super-admin the audit.read capability for /audit-log route', async () => {
    const { canAccessAdminPath } = await import('../src/admin/capabilities');
    expect(canAccessAdminPath('super-admin', '/audit-log')).toBe(true);
  });

  it('hides super-admin-only nav from ops-manager', () => {
    pathname = '/orders';
    renderRail('ops-manager');
    // Active link for /orders should have aria-current="page"
    const ordersLinks = screen.getAllByText('Orders');
    expect(ordersLinks.some((el) => el.closest('[aria-current="page"]') !== null)).toBe(true);
    expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Compliance')).not.toBeInTheDocument();
  });

  it('limits finance to the finance section', () => {
    pathname = '/finance';
    renderRail('finance');
    expect(screen.getAllByText('Finance').length).toBeGreaterThan(0);
    expect(screen.queryByText('Live Ops')).not.toBeInTheDocument();
    expect(screen.queryByText('Orders')).not.toBeInTheDocument();
    expect(screen.queryByText('Catalogue')).not.toBeInTheDocument();
  });
});
