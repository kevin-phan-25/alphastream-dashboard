// app/layout.tsx
import "./globals.css";
import "../components/liveDashboard";
import liveDashboard from "../components/liveDashboard";

export const metadata = {
  title: "AlphaStream v3.1",
  description: "Gap & Go + Full Risk + Backtested",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <liveDashboard />
        {children}
      </body>
    </html>
  );
}
