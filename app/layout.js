// app/layout.js
export const metadata = {
  title: "AlphaStream Dashboard",
  description: "Live Trading Dashboard by Kevin Phan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0f172a", color: "white" }}>
        {children}
      </body>
    </html>
  );
}
