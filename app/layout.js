export const metadata = {
  title: 'AlphaStream v4.0 — @Kevin_Phan25',
  description: 'Live Trading Scanner | Real-time Signals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#050505', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
