'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Sun, Moon } from 'lucide-react';
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
        <title>AlphaStream v28.0</title>
      </head>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/30 dark:to-blue-900/20`}>
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/90 border-b border-white/20 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Zap className="w-9 h-9 text-purple-600 dark:text-purple-400 animate-pulse" />
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AlphaStream v28.0
              </h1>
            </div>
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex gap-8 font-medium">
                <a href="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Scan</a>
                <a href="/positions" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Positions</a>
                <a href="/trades" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Trades</a>
                <a href="/health" className="hover:text-purple-600 dark:hover:text-purple-400 transition">Health</a>
              </nav>
              <button
                onClick={toggle}
                className="relative p-3 rounded-full bg-gray-200/50 dark:bg-gray-800/70 backdrop-blur hover:scale-110 transition-all duration-200 shadow-lg"
              >
                <div className="w-6 h-6">
                  {darkMode ? (
                    <Sun className="w-full h-full text-yellow-400 drop-shadow-glow" />
                  ) : (
                    <Moon className="w-full h-full text-gray-800" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </header>
        <main className="pt-24 px-6 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
