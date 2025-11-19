// src/app/layout.tsx — MODERN 2025 HEADER
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Zap } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaStream v30.0 ELITE',
  description: 'Fully Autonomous Trading System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950 text-white`}>
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-purple-400 animate-pulse" />
              <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                AlphaStream v30.0
              </h1>
            </div>
            <div className="text-2xl font-bold text-cyan-400">ELITE AUTONOMOUS</div>
          </div>
        </header>
        <main className="pt-32 pb-16">{children}</main>
      </body>
    </html>
  );
}
