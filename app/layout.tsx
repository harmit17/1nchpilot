import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '1nchPilot - Autonomous DeFi Portfolio Co-Pilot',
  description: 'Build, manage, and automate your DeFi portfolio. Gasless & MEV-Protected. Powered by 1inch.',
  keywords: ['DeFi', 'Portfolio', 'Rebalancing', '1inch', 'Ethereum', 'Crypto'],
  authors: [{ name: '1nchPilot Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: '1nchPilot - Autonomous DeFi Portfolio Co-Pilot',
    description: 'Build, manage, and automate your DeFi portfolio. Gasless & MEV-Protected. Powered by 1inch.',
    type: 'website',
    url: 'https://1nchpilot.vercel.app',
    siteName: '1nchPilot',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '1nchPilot - Autonomous DeFi Portfolio Co-Pilot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '1nchPilot - Autonomous DeFi Portfolio Co-Pilot',
    description: 'Build, manage, and automate your DeFi portfolio. Gasless & MEV-Protected. Powered by 1inch.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
} 