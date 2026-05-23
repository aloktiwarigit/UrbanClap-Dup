'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section
      role="alert"
      style={{
        padding: 'var(--space-12) var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        maxWidth: '48rem',
        margin: '0 auto',
      }}
    >
      <span className="eyebrow" style={{ margin: 0 }}>
        Console
      </span>
      <h2
        className="display"
        style={{ margin: 0, fontSize: 'var(--text-3xl)', color: 'var(--color-text)' }}
      >
        Something stalled.
      </h2>
      <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
        The page hit an unexpected error. The incident has been logged. Try once more, then refresh the
        whole dashboard if it persists.
      </p>
      <div>
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          Try again
        </button>
      </div>
      {error.digest !== undefined && (
        <p
          className="font-mono"
          style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
            letterSpacing: '0.04em',
          }}
        >
          ref · {error.digest}
        </p>
      )}
    </section>
  );
}
