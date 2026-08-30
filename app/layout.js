import './globals.css';
import Providers from '@/components/Providers';
import RegisterSW from '@/components/RegisterSW';

export const metadata = {
  title: 'ReelHouse — Stream',
  description: 'Watch movies online.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ReelHouse',
  },
};

export const viewport = {
  themeColor: '#0B0B0D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-body bg-void text-bone min-h-screen">
        <Providers>
          <RegisterSW />
          {children}
        </Providers>
      </body>
    </html>
  );
}
