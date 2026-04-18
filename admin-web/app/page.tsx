import Link from 'next/link';
import { getBuildInfo } from '@/lib/build-info';
import { landingCopy } from '@/content/landing';

export default function LandingPage() {
  const { version, sha } = getBuildInfo();
  const { brand, tagline, ctaLabel, ctaHref, footerNote } = landingCopy;

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
      }}
    >
      <header style={{ padding: 'var(--space-6)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {brand} · admin
        </p>
      </header>

      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          gap: 'var(--space-4)',
          maxWidth: '40rem',
          margin: '0 auto',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, margin: 0 }}>{brand}</h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', margin: 0 }}>
          {tagline}
        </p>
        <Link
          href={ctaHref}
          style={{
            display: 'inline-block',
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--color-brand)',
            color: 'var(--color-brand-fg)',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            alignSelf: 'flex-start',
            transition: 'opacity var(--duration-base) var(--ease-out)',
          }}
        >
          {ctaLabel}
        </Link>
      </section>

      <footer
        style={{
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '1px solid var(--color-border)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          gap: 'var(--space-4)',
        }}
      >
        <span>v{version}</span>
        <span>·</span>
        <span>{sha}</span>
        <span>·</span>
        <span>{footerNote}</span>
      </footer>
    </main>
  );
}
