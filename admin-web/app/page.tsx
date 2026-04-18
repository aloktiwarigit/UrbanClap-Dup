import Link from 'next/link';
import { createApiClient } from '@/api';
import { landingCopy } from '@/content/landing';

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
      return { version: fallbackVersion, commit: fallbackCommit, fallback: true };
    }
    return { version: data.version, commit: data.commit.slice(0, 8), fallback: false };
  } catch {
    return { version: fallbackVersion, commit: fallbackCommit, fallback: true };
  }
}

export default async function LandingPage() {
  const build = await fetchBuildInfo();
  const { brand, tagline, ctaLabel, ctaHref, footerNote } = landingCopy;

  return (
    <main className="min-h-[100dvh] flex flex-col bg-[var(--color-surface)] text-[var(--color-text)]">
      <header className="p-[var(--space-6)]">
        <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
          {brand} · admin
        </p>
      </header>

      <section
        className="flex-1 flex flex-col justify-center p-[var(--space-6)] gap-[var(--space-4)] max-w-[40rem] mx-auto w-full"
      >
        <h1 className="text-[length:var(--text-4xl)] font-bold m-0">{brand}</h1>
        <p className="text-[length:var(--text-lg)] text-[var(--color-text-muted)] m-0">
          {tagline}
        </p>
        <Link
          href={ctaHref}
          className="inline-block mt-[var(--space-4)] px-[var(--space-6)] py-[var(--space-3)] bg-[var(--color-brand)] text-[var(--color-brand-fg)] rounded-[var(--radius-md)] no-underline text-[length:var(--text-base)] font-semibold self-start transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]"
        >
          {ctaLabel}
        </Link>
      </section>

      <footer className="px-[var(--space-6)] py-[var(--space-4)] border-t border-[var(--color-border)] text-[length:var(--text-xs)] text-[var(--color-text-muted)] flex gap-[var(--space-4)]">
        <span>
          v{build.version} · {build.commit}
          {build.fallback ? ' (local)' : ''}
        </span>
        <span>·</span>
        <span>{footerNote}</span>
      </footer>
    </main>
  );
}
