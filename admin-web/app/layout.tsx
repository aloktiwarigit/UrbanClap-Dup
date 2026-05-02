import type { Metadata } from 'next';
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'homeservices — admin',
  description: 'Owner console for the homeservices field-operations platform.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await readThemeCookie();
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
