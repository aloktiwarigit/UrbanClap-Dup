'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { routing, type Locale } from '@/i18n/config';

export function LocaleSwitcher() {
  const t = useTranslations('locale.switcher');
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState('');
  const groupRef = useRef<HTMLDivElement>(null);

  function handleChange(newLocale: Locale) {
    if (newLocale === currentLocale) return;
    router.replace(pathname, { locale: newLocale });
    setAnnouncement(
      newLocale === 'hi' ? 'भाषा बदली — हिन्दी' : 'Language changed to English',
    );
  }

  function handleKeyDown(e: React.KeyboardEvent, locale: Locale) {
    const locales = routing.locales as readonly Locale[];
    const idx = locales.indexOf(locale);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = locales[(idx + 1) % locales.length];
      handleChange(next!);
      focusPill(next!);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = locales[(idx - 1 + locales.length) % locales.length];
      handleChange(prev!);
      focusPill(prev!);
    }
  }

  function focusPill(locale: Locale) {
    const btn = groupRef.current?.querySelector<HTMLButtonElement>(
      `[data-locale="${locale}"]`,
    );
    btn?.focus();
  }

  // Clear announcement after screen reader picks it up
  useEffect(() => {
    if (!announcement) return;
    const timer = setTimeout(() => setAnnouncement(''), 2000);
    return () => clearTimeout(timer);
  }, [announcement]);

  const LABELS: Record<Locale, string> = { en: 'EN', hi: 'हिन्दी' };

  return (
    <>
      {/* ARIA live region — screen reader locale-change announcement */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </span>

      {/* Segmented toggle track */}
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={t('label')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: '28px',
          borderRadius: '6px',
          padding: '2px',
          background: 'var(--ink-3)',
          border: '1px solid var(--ink-4)',
          gap: '1px',
        }}
      >
        {(routing.locales as readonly Locale[]).map((locale) => {
          const isActive = locale === currentLocale;
          return (
            <button
              key={locale}
              type="button"
              role="radio"
              aria-checked={isActive}
              data-locale={locale}
              lang={locale}
              onClick={() => handleChange(locale)}
              onKeyDown={(e) => handleKeyDown(e, locale)}
              tabIndex={isActive ? 0 : -1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '22px',
                padding: '0 8px',
                borderRadius: '4px',
                border: isActive ? '1px solid color-mix(in srgb, var(--marigold) 30%, transparent)' : '1px solid transparent',
                background: isActive ? 'var(--ink-1)' : 'transparent',
                color: isActive ? 'var(--fog-3)' : 'var(--fog-0)',
                fontFamily: locale === 'hi' ? 'var(--font-devanagari), sans-serif' : 'var(--font-geist), sans-serif',
                fontSize: '12px',
                fontWeight: locale === 'hi' ? '500' : '500',
                letterSpacing: locale === 'en' ? '0.06em' : '0',
                lineHeight: 1,
                cursor: isActive ? 'default' : 'pointer',
                transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                outline: 'none',
                boxShadow: isActive
                  ? 'inset 0 1px 0 color-mix(in srgb, white 8%, transparent)'
                  : 'none',
              }}
              onFocus={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--fog-2)';
                }
              }}
              onBlur={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--fog-0)';
                }
              }}
            >
              {LABELS[locale]}
            </button>
          );
        })}
      </div>
    </>
  );
}
