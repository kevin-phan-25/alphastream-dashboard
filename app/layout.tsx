// app/layout.tsx
import type { Metadata } from 'next';
import './page.css'; // Optional: if you want to extract styles

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
      <head />
      <body className="h-full m-0 p-0 bg-slate-950">
        <style jsx global>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #__next { height: 100vh !important; margin: 0 !important; padding: 0 !important; }
        `}</style>
        {children}
      </body>
    </html>
  );
}
