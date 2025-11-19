// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Zap } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaStream v29 ELITE',
  description: 'Fully Autonomous Trading System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950 text-white`}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-purple-400 animate-pulse" />
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                AlphaStream v29
              </h1>
            </div>
            <div className="text-2xl font-bold text-cyan-400">v29.0</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-32">
          {children}
        </main>
      </body>
    </html>
  );
}
