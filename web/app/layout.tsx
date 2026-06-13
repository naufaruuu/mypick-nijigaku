import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { SITE_URL } from '@/lib/site';

const DESCRIPTION = 'Pick your favorite Nijigasaki songs and share your grid.';

// Self-hosted by next/font (same origin) so modern-screenshot can inline it
// into the exported PNG — a plain Google <link> is cross-origin and won't embed.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'My Pick Nijigasaki',
  description: DESCRIPTION,
  icons: { icon: '/favicon.svg' },
  // og:image / twitter:image are supplied automatically by app/opengraph-image.tsx
  openGraph: {
    type: 'website',
    siteName: 'My Pick Nijigasaki',
    title: 'My Pick Nijigasaki',
    description: DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Pick Nijigasaki',
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <div className="app-shell">
          <SiteHeader />
          <main className="app-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
