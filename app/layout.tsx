// app/layout.tsx   (or layout.js)
import "./globals.css";
import LiveDashboard from "@/components/LiveDashboard";

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
        <LiveDashboard />
        {children}
      </body>
    </html>
  );
}
