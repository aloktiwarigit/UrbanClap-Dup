import Link from 'next/link';
import { createApiClient } from '@/api';
import { landingCopy } from '@/content/landing';

// Render on every request so /v1/health reflects the live API server.
export const dynamic = 'force-dynamic';

type FooterBuildInfo = { version: string; commit: string; fallback: boolean };

async function fetchBuildInfo(): Promise<FooterBuildInfo> {
  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:7071/api';
  const fallbackVersion = process.env['NEXT_PUBLIC_APP_VERSION'] ?? 'dev';
  const rawSha = process.env['NEXT_PUBLIC_GIT_SHA'];
  const fallbackCommit =
    rawSha && rawSha.length >= 8 ? rawSha.slice(0, 8) : 'dev';

  try {
    const client = createApiClient({ baseUrl });
    const { data, error } = await client.GET('/v1/health');
    if (error || !data) {
      console.warn('landing /v1/health returned error envelope - using fallback', {
        error,
      });
      return { version: fallbackVersion, commit: fallbackCommit, fallback: true };
    }
    return { version: data.version, commit: data.commit.slice(0, 8), fallback: false };
  } catch (err) {
    console.warn('landing /v1/health fetch threw - using fallback', err);
    return { version: fallbackVersion, commit: fallbackCommit, fallback: true };
  }
}

export default async function LandingPage() {
  const build = await fetchBuildInfo();
  const { brand, tagline, ctaLabel, ctaHref, footerNote } = landingCopy;

  return (
    <main className="min-h-[100dvh] flex flex-col bg-[var(--color-surface)] text-[var(--color-text)]">
      <header className="px-[var(--space-6)] py-[var(--space-4)] border-b border-[var(--color-border)]">
        <p className="text-[length:var(--text-sm)] font-semibold text-[var(--color-text)]">
          {brand} admin
        </p>
      </header>

      <section className="flex-1 grid content-center p-[var(--space-6)] gap-[var(--space-8)] max-w-[72rem] mx-auto w-full lg:grid-cols-[1fr_24rem] lg:items-center">
        <div className="flex flex-col gap-[var(--space-4)]">
          <p className="text-[length:var(--text-sm)] font-semibold uppercase text-[var(--color-brand)]">
            Field operations command center
          </p>
          <h1 className="text-[length:var(--text-4xl)] font-bold m-0 max-w-[40rem]">
            {brand}
          </h1>
          <p className="text-[length:var(--text-lg)] text-[var(--color-text-muted)] m-0 max-w-[36rem]">
            {tagline}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex min-h-12 items-center justify-center mt-[var(--space-4)] px-[var(--space-6)] py-[var(--space-3)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-[var(--radius-md)] no-underline text-[length:var(--text-base)] font-semibold self-start shadow-[var(--shadow-md)] transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]"
          >
            {ctaLabel}
          </Link>
        </div>
        <div className="grid gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-[var(--space-6)] shadow-[var(--shadow-sm)]">
          {['Live bookings', 'Technician dispatch', 'Payout control', 'Complaint recovery'].map(
            (item) => (
              <div key={item} className="flex items-center gap-[var(--space-3)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand)]" />
                <span className="text-[length:var(--text-sm)] font-medium">{item}</span>
              </div>
            ),
          )}
        </div>
      </section>

      <footer className="px-[var(--space-6)] py-[var(--space-4)] border-t border-[var(--color-border)] text-[length:var(--text-xs)] text-[var(--color-text-muted)] flex gap-[var(--space-4)]">
        <span>
          v{build.version} - {build.commit}
          {build.fallback ? ' (local)' : ''}
        </span>
        <span>-</span>
        <span>{footerNote}</span>
      </footer>
    </main>
  );
}
