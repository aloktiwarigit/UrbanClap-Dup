'use client';

import { useState, useEffect } from 'react';

const CITY = process.env.NEXT_PUBLIC_CITY ?? 'Bengaluru';

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function Topbar() {
  const [clock, setClock] = useState<string>(() => formatClock(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      style={{
        height: '52px',
        background: 'var(--ink-1)',
        borderBottom: '1px solid var(--ink-4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.9375rem',
            color: 'var(--fog-2)',
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          Operations Observatory
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            color: 'var(--fog-0)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {CITY}
        </span>
      </div>

      {/* Right side — clock + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Live status dot */}
        <div
          aria-live="polite"
          aria-label="System status: live"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--teal)',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              color: 'var(--teal)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            LIVE
          </span>
        </div>

        {/* Clock */}
        <time
          dateTime={new Date().toISOString()}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            color: 'var(--fog-1)',
            letterSpacing: '0.04em',
          }}
        >
          {clock}
        </time>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulse-dot { 0%, 100% { opacity: 1; } }
        }
      `}</style>
    </header>
  );
}
