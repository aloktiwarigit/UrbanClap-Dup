'use client';

import { useState, useEffect, type ReactNode } from 'react';

const CITY = process.env.NEXT_PUBLIC_CITY ?? 'Ayodhya';

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

interface TopbarProps {
  /** Right-side slot — used for the theme toggle in (dashboard)/layout.tsx */
  rightSlot?: ReactNode;
}

export function Topbar({ rightSlot }: TopbarProps) {
  // Clock must be empty during SSR — server time and client time differ, which
  // triggers React #418 hydration mismatch. The mismatch bailout discards the
  // entire dashboard subtree and re-renders it client-side, collapsing the
  // Rail's inline width and breaking the flex layout (manifested as the page
  // rendering in only half the viewport on /hi/dashboard).
  const [clock, setClock] = useState<string>('');
  const [isoTimestamp, setIsoTimestamp] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(formatClock(now));
      setIsoTimestamp(now.toISOString());
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="topbar__brand">
        <span className="topbar__title">Operations Observatory</span>
        <span className="topbar__city">{CITY}</span>
      </div>

      {/* Right side — clock + status + slot */}
      <div className="topbar__right">
        <div className="topbar__live" aria-live="polite" aria-label="System status: live">
          <span className="topbar__live-dot" />
          <span className="topbar__live-label">LIVE</span>
        </div>

        <time
          className="topbar__clock"
          dateTime={isoTimestamp || undefined}
          suppressHydrationWarning
        >
          {clock}
        </time>

        {rightSlot !== undefined && <div className="topbar__slot">{rightSlot}</div>}
      </div>
    </header>
  );
}
