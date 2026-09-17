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
  applicationName: 'ODU Learner Companion',

  authors: [
    {
      name: 'Manjunath Islampure',
    },
  ],

  creator: 'Manjunath Islampure',

  publisher: 'ODU Learner Companion',

  keywords: [
    'free learning paths',
    'free online courses',
    'free certification preparation',
    'certification study plans',
    'certification roadmap',
    'learning roadmap',
    'technology learning paths',
    'free tutorials',
    'AI learning paths',
    'AI learning roadmap',
    'cloud learning paths',
    'cloud certification preparation',
    'AWS learning',
    'AWS certification preparation',
    'Azure learning',
    'Azure certification preparation',
    'Google Cloud learning',
    'programming learning paths',
    'Java learning path',
    'Python learning path',
    'Kubernetes learning path',
    'DevOps learning path',
    'software development learning',
    'career learning paths',
    'study plans',
    'ODU Learner Companion',
    'Manjunath Islampure',
  ],

  alternates: {
    canonical: baseUrl,
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
  verification: {
    google: "1hqdet7Qsz9wqTF9tqkR7Zo1JxgNXpSAWjoi_ZjQ--U",
  }
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
