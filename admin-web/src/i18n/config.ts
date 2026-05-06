import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi'] as const,
  defaultLocale: 'hi',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
