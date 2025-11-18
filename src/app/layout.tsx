import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaStream v24',
  description: 'Live Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen`}>
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold">AlphaStream v24 ELITE</h1>
            <nav className="space-x-8 text-lg">
              <a href="/" className="hover:text-yellow-300">Scan</a>
              <a href="/positions" className="hover:text-yellow-300">Positions</a>
              <a href="/trades" className="hover:text-yellow-300">Trades</a>
              <a href="/health" className="hover:text-yellow-300">Health</a>
            </nav>
          </div>
        </div>
        <main className="max-w-6xl mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
