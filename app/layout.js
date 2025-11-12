// app/layout.js
import './globals.css';  // ← Now points to app/globals.css

export const metadata = {
  title: 'AlphaStream v18.0 — 75%+ Win Rate Trading Dashboard',
  description: 'Long-Only Momentum Bot | @Kevin_Phan25 | Live P&L, Signals, Risk',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
