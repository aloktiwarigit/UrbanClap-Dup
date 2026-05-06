import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Not authorized - HomeHeroo admin',
};

interface NotAuthorizedPageProps {
  searchParams: Promise<{ from?: string; next?: string }>;
}

function safeInternalPath(value: string | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  return value;
}

export default async function NotAuthorizedPage({ searchParams }: NotAuthorizedPageProps) {
  const params = await searchParams;
  const requestedPath = safeInternalPath(params.from);
  const nextPath = safeInternalPath(params.next);

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        minHeight: 'calc(100vh - 72px)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <section
        aria-labelledby="not-authorized-heading"
        style={{
          width: '100%',
          maxWidth: '560px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          padding: 'var(--space-6)',
        }}
      >
        <p className="eyebrow" style={{ margin: 0, marginBottom: 'var(--space-2)' }}>
          Access control
        </p>
        <h1
          id="not-authorized-heading"
          style={{
            margin: 0,
            color: 'var(--color-text)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
          }}
        >
          You do not have access to this admin area.
        </h1>
        <p
          style={{
            margin: 'var(--space-3) 0 0 0',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.6,
          }}
        >
          {requestedPath
            ? `Your role is not allowed to open ${requestedPath}.`
            : 'Your role does not include any dashboard capabilities.'}
        </p>
        {nextPath && nextPath !== '/not-authorized' && (
          <Link
            href={nextPath}
            className="btn btn-primary"
            style={{ display: 'inline-flex', marginTop: 'var(--space-4)' }}
          >
            Go to allowed area
          </Link>
        )}
      </section>
    </div>
  );
}
