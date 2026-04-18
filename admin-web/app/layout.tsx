import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'homeservices — admin',
  description: 'Owner console for the homeservices platform.',
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* nosemgrep: no-dangerous-html — pre-hydration theme script must run before React; minimised IIFE; no user input. See ADR/E01-S02 brainstorm §5. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
