import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AlphaStream v4.0 — @Kevin_Phan25',
  description: 'Live Trading Scanner | FLAG • FLAT_TOP • ABC_PULL | Real-time',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, background: '#050505' }}>
        {children}
      </body>
    </html>
  );
}
