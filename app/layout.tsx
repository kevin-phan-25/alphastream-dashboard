// app/layout.tsx
import type { Metadata } from 'next';

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
    <html lang="en">
      <head />
      <body>
        {/* GLOBAL CSS RESET – NO STYLED-JSX */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body, #__next { height: 100vh; width: 100vw; overflow: hidden; }
              body { background: #020617; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; }
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
