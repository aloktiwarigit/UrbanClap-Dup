// admin-web/src/components/EmptyState.tsx
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  eyebrow: string;
  headline: string;
  copy?: string;
  action?: ReactNode;
}

export function EmptyState({ eyebrow, headline, copy, action }: EmptyStateProps) {
  return (
    <section
      aria-label={headline}
      className="empty-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-8) var(--space-6)',
        border: '1px dashed var(--color-border)',
        background: 'transparent',
      }}
    >
      <span className="eyebrow" style={{ margin: 0 }}>
        {eyebrow}
      </span>
      <h3
        className="display"
        style={{
          margin: 0,
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text)',
        }}
      >
        {headline}
      </h3>
      {copy !== undefined && (
        <p
          style={{
            margin: 0,
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.55,
            maxWidth: '40ch',
          }}
        >
          {copy}
        </p>
      )}
      {action !== undefined && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </section>
  );
}
