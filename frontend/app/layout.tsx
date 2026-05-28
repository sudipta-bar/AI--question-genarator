import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'VedaAI',
  description: 'AI-powered assessment creator for teachers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeScript = `
    try {
      var stored = localStorage.getItem('theme');
      var legacy = localStorage.getItem('darkMode');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var dark = stored ? stored === 'dark' : legacy ? legacy === 'true' : prefersDark;
      document.documentElement.classList.toggle('dark', dark);
    } catch (_) {}
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
