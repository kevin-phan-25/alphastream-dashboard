'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Sun, Moon, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <head>
        <title>AlphaStream v29.0 ELITE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/30 dark:to-blue-900/20`}>
        
        {/* HEADER */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/70 dark:bg-black/80 border-b border-white/20 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-pulse drop-shadow-lg" />
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent tracking-tighter">
                AlphaStream v29.0
              </h1>
            </div>
            {/* Nav + Theme Toggle */}
            <div className="flex items-center gap-12">
              <nav className="hidden lg:flex gap-12 font-bold text-xl">
                <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">Scan</a>
                <a href="/positions" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">Positions</a>
                <a href="/trades" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">Trades</a>
                <a href="/health" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">Health</a>
              </nav>
              <button
                onClick={toggle}
                className="p-4 rounded-full bg-gradient-to-br from-gray-200/80 to-gray-300/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-2xl hover:scale-110 transition-all duration-300"
              >
                {darkMode ? <Sun className="w-8 h-8 text-yellow-400" /> : <Moon className="w-8 h-8 text-indigo-900" />}
              </button>
            </div>
          </div>
        </header>

        <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
          {children}
        </main>

        {/* Mobile Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-t border-white/20 dark:border-white/10">
          <div className="flex justify-around py-5 text-lg font-bold">
            <a href="/" className="text-purple-600 dark:text-purple-400">Scan</a>
            <a href="/positions" className="text-gray-600 dark:text-gray-400">Positions</a>
            <a href="/trades" className="text-gray-600 dark:text-gray-400">Trades</a>
            <a href="/health" className="text-gray-600 dark:text-gray-400">Health</a>
          </div>
        </nav>
      </body>
    </html>
  );
}
