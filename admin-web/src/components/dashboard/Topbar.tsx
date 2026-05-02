'use client';

import { useState, useEffect, type ReactNode } from 'react';

const CITY = process.env.NEXT_PUBLIC_CITY ?? 'Bengaluru';

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
  const [clock, setClock] = useState<string>(() => formatClock(new Date()));

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock(new Date())), 1000);
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

        <time className="topbar__clock" dateTime={new Date().toISOString()}>
          {clock}
        </time>

        {rightSlot !== undefined && <div className="topbar__slot">{rightSlot}</div>}
      </div>
    </header>
  );
}
