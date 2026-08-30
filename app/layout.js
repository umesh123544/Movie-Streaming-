import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'ReelHouse — Stream',
  description: 'Watch movies online.',
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
      </head>
      <body className="font-body bg-void text-bone min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
