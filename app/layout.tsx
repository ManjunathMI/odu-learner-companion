import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './globals.css';
import '../styles/light-theme.css';
import '../styles/dark-theme.css';
import '../styles/neon-theme.css';
import '../styles/system-theme.css';

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'ODU Learner Companion — Learn anything. Together.',
    template: '%s | ODU Learner Companion',
  },
  description:
    'A collaborative learning companion for students, working professionals, and lifelong learners. Discover structured Learning Paths, track personal progress, and learn together.',
  keywords: [
    'ODU Learner Companion',
    'collaborative learning',
    'learning paths',
    'study tracker',
    'students',
    'working professionals',
    'lifelong learning',
  ],
  authors: [{ name: 'ODU Learner Companion' }],
  creator: 'ODU Learner Companion',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'ODU Learner Companion',
    title: 'ODU Learner Companion — Learn anything. Together.',
    description:
      'A collaborative learning companion for students, working professionals, and lifelong learners. Discover structured Learning Paths, track personal progress, and learn together.',
  },
  twitter: {
    card: 'summary',
    title: 'ODU Learner Companion — Learn anything. Together.',
    description:
      'A collaborative learning companion for students, working professionals, and lifelong learners. Discover structured Learning Paths, track personal progress, and learn together.',
  },
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
          <a className="skip-link" href="#main-content">Skip to content</a>
          <main id="main-content" className="main-content">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
