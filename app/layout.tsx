import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';  // Assume you have this

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaStream v24 Dashboard',
  description: 'Bot Status & Trades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
