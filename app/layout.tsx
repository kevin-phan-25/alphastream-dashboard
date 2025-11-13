// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AlphaStream',
  description: 'Live trading dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full m-0 p-0 bg-slate-950 dark:bg-slate-950 light:bg-gray-50 text-slate-100 dark:text-slate-100 light:text-gray-900">
        {children}
      </body>
    </html>
  );
}
