// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Zap } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaStream v29.0 — LIVE',
  description: 'Fully Autonomous Trading System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>ChartRising</text></svg>" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Zap className="w-14 h-14 text-purple-400 animate-pulse" />
              <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AlphaStream v29.0
              </h1>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-8 py-4 rounded-full border border-purple-500/50">
              <span className="text-2xl font-bold text-purple-300">ELITE AUTONOMOUS</span>
            </div>
          </div>
        </header>
        <main className="pt-32">{children}</main>
      </body>
    </html>
  );
}
