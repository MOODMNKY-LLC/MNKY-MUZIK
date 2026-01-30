import { Sidebar } from '@/components/Sidebar';

import './globals.css';

import { Analytics } from '@vercel/analytics/react';

import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { UserProvider } from '@/providers/UserProvider';
import { ModalProvider } from '@/providers/ModalProvider';
import { ToasterProvider } from '@/providers/ToasterProvider';
import { PWAProvider } from '@/providers/PWAProvider';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

import { getSongsByUserId } from '@/actions/getSongsByUserId';
import { Player } from '@/components/Player';
import { getActiveProductsWithPrices } from '@/actions/getActiveProductsWithPrices';

//* Describe the web app
export const metadata = {
  title: 'MNKY MUZIK',
  description: 'Scents the mood.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export const revalidate = 0;

//* Main layout component for the app
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userSongs = await getSongsByUserId();
  const products = await getActiveProductsWithPrices();

  //* Providers & Components
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&display=swap"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className="font-figtree">
        <ToasterProvider />
        <PWAProvider>
          <SupabaseProvider>
            <UserProvider>
              <ModalProvider products={products} />
              <Sidebar songs={userSongs}>{children}</Sidebar>
              <Player />
            </UserProvider>
          </SupabaseProvider>
          <PWAInstallBanner />
        </PWAProvider>
        <Analytics />
      </body>
    </html>
  );
}
