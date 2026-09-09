'use client';

import {
  Activity, ClipboardList, LayoutGrid, IndianRupee,
  MessageCircleWarning, ScrollText, ShieldUser, Scale,
  Wrench, Users2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from '@/lib/i18n/navigation';
import { navItemsForRole } from '@/admin/capabilities';
import { useAdminAuth } from '@/lib/auth/context';

const NAV_ICON_MAP: Record<string, LucideIcon> = {
  'activity':               Activity,
  'clipboard-list':         ClipboardList,
  'layout-grid':            LayoutGrid,
  'indian-rupee':           IndianRupee,
  'message-circle-warning': MessageCircleWarning,
  'scroll-text':            ScrollText,
  'shield-user':            ShieldUser,
  'scale':                  Scale,
  'wrench':                 Wrench,
  'users-2':                Users2,
};

const NAV_I18N_KEY: Record<string, string> = {
  '/dashboard':    'dashboard',
  '/orders':       'orders',
  '/finance':      'finance',
  '/catalogue':    'catalogue',
  '/complaints':   'complaints',
  '/audit-log':    'auditLog',
  '/admin-users':  'adminUsers',
  '/compliance':   'compliance',
  '/technicians':  'technicians',
  '/customers':    'customers',
  // E21-S03 task 11: these two nav items (Commissions, Settings) were added to ADMIN_NAV_ITEMS
  // by task 10 without a matching entry here, so `labelKey` fell through to the hardcoded
  // English `item.label` ("Commissions" / "Settings") and `t(labelKey)` threw MISSING_MESSAGE on
  // every render for every admin who can see either item, in both locales — nothing in
  // Rail.test.tsx caught it because that test mocks `useTranslations` to return the key itself,
  // which never diverges from a hardcoded English label the way a real MISSING_MESSAGE does.
  // Found via tests/a11y/commissions.a11y.spec.ts, which renders through real next-intl.
  '/finance/commissions': 'commissions',
  '/settings/commission': 'settings',
};

// Fix round (P3): a plain "does the pathname start with this href" test matches every ancestor
// prefix of the current route, not just the most specific one — on `/finance/commissions` both
// `/finance` and `/finance/commissions` match, marking two nav items active and emitting two
// `aria-current="page"` elements. Longest-match resolves this the same way a router would: among
// every item whose href is an exact match or a `/`-bounded prefix of the pathname, only the
// longest href is truly "where we are."
function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function activeHrefFor(pathname: string, navItems: readonly { href: string }[]): string | null {
  let best: string | null = null;
  for (const item of navItems) {
    if (!matchesPath(pathname, item.href)) continue;
    if (best === null || item.href.length > best.length) best = item.href;
  }
  return best;
}

export function Rail() {
  const pathname = usePathname();
  const { auth } = useAdminAuth();
  const navItems = navItemsForRole(auth?.role);
  const t = useTranslations('nav');
  const activeHref = activeHrefFor(pathname, navItems);

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Primary navigation"
        className="rail-desktop"
        style={{
          width: '192px',
          minHeight: '100vh',
          background: 'var(--rail-bg)',
          borderRight: '1px solid var(--rail-border)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '1rem',
          paddingLeft: '12px',
          paddingRight: '12px',
          gap: '2px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-0)',
            fontFamily: 'var(--font-body)',
            fontWeight: 800,
            fontSize: '0.9rem',
            marginBottom: '1rem',
          }}
          aria-hidden="true"
        >
          HS
        </div>

        {navItems.map((item) => {
          const isActive = item.href === activeHref;
          const Icon = NAV_ICON_MAP[item.icon] ?? Activity;
          const labelKey = NAV_I18N_KEY[item.href] ?? item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                background: isActive ? 'var(--rail-active-bg)' : 'transparent',
                color: isActive ? 'var(--rail-text-active)' : 'var(--rail-text)',
                borderLeft: isActive ? '2px solid var(--marigold)' : '2px solid transparent',
                transition: 'background 120ms, color 120ms, border-color 120ms',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              <Icon size={18} aria-hidden="true" strokeWidth={1.75} />
              
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Primary navigation (mobile)"
        className="rail-mobile"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          minHeight: '60px',
          background: 'var(--rail-bg)',
          borderTop: '1px solid var(--rail-border)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
        }}
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = item.href === activeHref;
          const Icon = NAV_ICON_MAP[item.icon] ?? Activity;
          const labelKey = NAV_I18N_KEY[item.href] ?? item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '6px 8px',
                textDecoration: 'none',
                color: isActive ? 'var(--rail-text-active)' : 'var(--rail-text)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                fontWeight: 500,
              }}
            >
              <Icon size={18} aria-hidden="true" strokeWidth={1.75} />
              
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
