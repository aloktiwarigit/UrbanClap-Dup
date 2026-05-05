import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Fraunces, Geist, JetBrains_Mono, Noto_Sans_Devanagari } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { readThemeCookie } from '@/lib/theme';
import { routing } from '@/i18n/config';
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

export const metadata: Metadata = {
  title: 'HomeHeroo — admin',
  description: 'Owner console for the HomeHeroo field-operations platform.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await readThemeCookie();
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const lang = (routing.locales as readonly string[]).includes(rawLocale ?? '')
    ? rawLocale!
    : routing.defaultLocale;

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
