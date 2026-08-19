import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './globals.css';
import '../styles/light-theme.css';
import '../styles/dark-theme.css';
import '../styles/neon-theme.css';
import '../styles/system-theme.css';

export const metadata: Metadata = {
  title: 'ODU Learner Companion',
  description: 'A comprehensive learning tracker for ODU students',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="system">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="layout-wrapper">
          <Header />
          <main className="main-content">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
