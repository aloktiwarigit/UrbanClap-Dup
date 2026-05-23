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
          background: '#0E0B08',
          color: '#F1E9D8',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: '40rem',
            background: '#14110C',
            border: '1px solid #2A251E',
            padding: '2rem',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#9A9082',
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
              color: '#9A9082',
              fontSize: '0.875rem',
            }}
          >
            An unexpected error occurred. Please reload.
            {error.digest && (
              <span
                style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#6E665B',
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
              background: '#E2A04A',
              color: '#14110C',
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
