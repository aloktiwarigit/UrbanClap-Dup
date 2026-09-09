import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Rail } from '../src/components/dashboard/Rail';
import { AdminAuthProvider } from '../src/lib/auth/context';
import type { AdminRole } from '../src/lib/auth/types';
import en from '../messages/en.json';

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

// Sourced from the REAL message file, not a hand-maintained duplicate list — this is exactly the
// gap that let the nav i18n defect (Rail.tsx's NAV_I18N_KEY missing 'commissions'/'settings')
// ship undetected: a hardcoded local dictionary with an `?? key` fallback never diverges from a
// hardcoded English label the way a real MISSING_MESSAGE does. Any current or future nav item
// whose labelKey has no matching entry in messages/en.json's `nav` namespace now throws here,
// exactly as next-intl's real `useTranslations` would in production.
const NAV_LABELS: Record<string, string> = en.nav;

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    if (!Object.prototype.hasOwnProperty.call(NAV_LABELS, key)) {
      throw new Error(`MISSING_MESSAGE: Could not resolve \`nav.${key}\` in messages for locale \`en\`.`);
    }
    return NAV_LABELS[key];
  },
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
  it('shows Audit Log in primary nav for super-admin again (E21-S03 un-hides it)', () => {
    pathname = '/dashboard';
    renderRail('super-admin');
    // PRIMARY_NAV_HIDDEN was emptied in E21-S03 — Audit Log is back in the rail.
    expect(screen.getAllByText('Audit Log').length).toBeGreaterThan(0);
    // Other super-admin nav items still present
    expect(screen.getAllByText('Admin Users').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Compliance').length).toBeGreaterThan(0);
  });

  it('renders Commissions and Settings for super-admin without a MISSING_MESSAGE — regression guard for the nav i18n gap (NAV_I18N_KEY missing an entry for a nav item)', () => {
    pathname = '/dashboard';
    // Rendering must not throw: if NAV_I18N_KEY ever again lacks an entry for a nav item (or a
    // key is added there with no matching messages/en.json `nav.*` entry), the mock above throws
    // exactly as real next-intl would, and this render call fails loudly instead of silently
    // showing raw English text in every locale.
    renderRail('super-admin');
    expect(screen.getAllByText(en.nav.commissions).length).toBeGreaterThan(0);
    expect(screen.getAllByText(en.nav.settings).length).toBeGreaterThan(0);
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

  // Fix round (P3): `/finance/commissions` starts with `/finance`, so the naive
  // `pathname.startsWith(item.href)` test matched BOTH the Finance (`/finance`) and Commissions
  // (`/finance/commissions`) nav items, marking two links active and emitting two
  // `aria-current="page"` elements at once. Longest-match must pick only the more specific one.
  it('marks only the most specific nav item active on /finance/commissions, not Finance as well', () => {
    pathname = '/finance/commissions';
    renderRail('finance');
    const current = document.querySelectorAll('[aria-current="page"]');
    // One per nav surface (desktop rail + mobile bar), both for the same (Commissions) item.
    expect(current.length).toBeGreaterThan(0);
    for (const el of Array.from(current)) {
      expect(el).toHaveAttribute('href', '/finance/commissions');
    }
    const financeLinks = screen.getAllByText('Finance').map((el) => el.closest('a'));
    for (const link of financeLinks) {
      expect(link).not.toHaveAttribute('aria-current', 'page');
    }
  });

  // Mirror case: on the exact `/finance` route, Finance alone is active — Commissions must not
  // light up just because it shares the `/finance` prefix.
  it('marks Finance alone as active on /finance itself', () => {
    pathname = '/finance';
    renderRail('finance');
    const current = document.querySelectorAll('[aria-current="page"]');
    expect(current.length).toBeGreaterThan(0);
    for (const el of Array.from(current)) {
      expect(el).toHaveAttribute('href', '/finance');
    }
  });
});
