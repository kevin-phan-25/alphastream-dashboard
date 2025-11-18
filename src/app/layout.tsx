import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sun, Moon } from 'lucide-react';  // Icons for toggle
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaStream v24',
  description: 'Live Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <body className={`${inter.className} min-h-screen`}>
        <nav className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-gray-800 dark:to-gray-900 text-white p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">AlphaStream v24 ELITE</h1>
            <div className="flex items-center space-x-6">
              <nav className="space-x-6">
                <a href="/" className="hover:underline">Scan</a>
                <a href="/positions" className="hover:underline">Positions</a>
                <a href="/trades" className="hover:underline">Trades</a>
                <a href="/health" className="hover:underline">Health</a>
              </nav>
              <button onClick={toggleDarkMode} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
