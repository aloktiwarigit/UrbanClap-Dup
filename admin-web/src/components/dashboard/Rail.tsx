'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Live Ops', href: '/dashboard', icon: 'LO' },
  { label: 'Orders', href: '/orders', icon: 'OR' },
  { label: 'Catalogue', href: '/catalogue', icon: 'CA' },
  { label: 'Finance', href: '/finance', icon: 'FI' },
  { label: 'Complaints', href: '/complaints', icon: 'CO' },
  { label: 'Audit Log', href: '/audit-log', icon: 'AU' },
];

export function Rail() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="rail-desktop"
        style={{
          width: '76px',
          minHeight: '100vh',
          background: 'var(--ink-1)',
          borderRight: '1px solid var(--ink-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '1rem',
          gap: '6px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
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
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              style={{
                width: '48px',
                height: '44px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                background: isActive ? 'var(--teal-dim)' : 'transparent',
                color: isActive ? 'var(--teal-soft)' : 'var(--fog-0)',
                transition: 'background 120ms, color 120ms',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>

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
          background: 'var(--ink-1)',
          borderTop: '1px solid var(--ink-4)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
        }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--teal-soft)' : 'var(--fog-0)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
