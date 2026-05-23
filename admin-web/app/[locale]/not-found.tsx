import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <main className="min-h-[100dvh] grid place-items-center bg-[var(--color-surface)] px-[var(--space-5)] py-[var(--space-8)] text-[var(--color-text)]">
      <section className="w-full max-w-[40rem] bg-[var(--ink-1)] border border-[var(--color-border)] p-[var(--space-8)] shadow-[var(--shadow-lg)]">
        <p className="eyebrow m-0">{t('eyebrow')}</p>
        <h1
          className="display m-0 mt-[var(--space-4)] text-[clamp(4rem,10vw,7.5rem)] tabular-nums"
          aria-label={t('description')}
        >
          {t('title')}
        </h1>
        <p className="m-0 mt-[var(--space-4)] text-[var(--color-text-muted)]">
          {t('description')}
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="btn btn-primary mt-[var(--space-8)] inline-block"
        >
          {t('backHome')}
        </Link>
      </section>
    </main>
  );
}
