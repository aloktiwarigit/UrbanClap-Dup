export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Fraunces, Geist, JetBrains_Mono, Noto_Sans_Devanagari } from 'next/font/google';
import { getLocale, getTranslations } from 'next-intl/server';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { readThemeCookie } from '@/lib/theme';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return {
    title: t('title'),
    description: 'Owner console for the HomeHeroo field-operations platform.',
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await readThemeCookie();
  const lang = await getLocale();

  return (
    <html
      lang={lang}
      data-theme={theme}
      className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable} ${notoSansDevanagari.variable}`}
    >
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
