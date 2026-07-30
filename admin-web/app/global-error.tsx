'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="hi">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-body, Arial, sans-serif)',
          padding: '2rem',
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: '40rem',
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            padding: '2rem',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            HomeHeroo admin
          </p>
          <h1
            style={{
              margin: '1rem 0 0',
              fontSize: 'clamp(1.5rem,4vw,2.5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Something went wrong&nbsp;•&nbsp;कुछ रुका
          </h1>
          <p
            style={{
              margin: '1rem 0 0',
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
            }}
          >
            An unexpected error occurred. Please reload.
            {error.digest && (
              <span
                style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Incident: {error.digest}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--marigold)',
              color: 'var(--ink-0)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Reload
          </button>
        </section>
      </body>
    </html>
  );
}
