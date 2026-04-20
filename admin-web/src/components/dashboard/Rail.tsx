'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';

interface NavItem {
  label: string;
  href: Route;
  icon: string; // text icon / emoji shorthand
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Live Ops', href: '/dashboard' as Route, icon: '⬡' },
  { label: 'Orders', href: '/dashboard/orders' as Route, icon: '◈' },
  { label: 'Technicians', href: '/dashboard/technicians' as Route, icon: '◉' },
  { label: 'Customers', href: '/dashboard/customers' as Route, icon: '◎' },
  { label: 'Finance', href: '/dashboard/finance' as Route, icon: '◆' },
  { label: 'Complaints', href: '/dashboard/complaints' as Route, icon: '◇' },
  { label: 'Audit Log', href: '/dashboard/audit' as Route, icon: '⊕' },
  { label: 'Settings', href: '/dashboard/settings' as Route, icon: '⊗' },
];

export function Rail() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Primary navigation"
        style={{
          width: '68px',
          minHeight: '100vh',
          background: 'var(--ink-1)',
          borderRight: '1px solid var(--ink-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '1rem',
          gap: '4px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
        }}
        className="rail-desktop"
      >
        {/* Logo mark */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-0)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1rem',
            marginBottom: '1rem',
          }}
          aria-hidden="true"
        >
          H
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                textDecoration: 'none',
                background: isActive ? 'var(--teal-dim)' : 'transparent',
                color: isActive ? 'var(--teal-soft)' : 'var(--fog-0)',
                transition: 'background 120ms, color 120ms',
                outline: 'none',
              }}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Primary navigation (mobile)"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--ink-1)',
          borderTop: '1px solid var(--ink-4)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
        }}
        className="rail-mobile"
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--teal-soft)' : 'var(--fog-0)',
                fontSize: '1rem',
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
