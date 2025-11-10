// app/dashboard/page.js
import LiveDashboard from "@/components/LiveDashboard";

export default function Dashboard() {
  return <LiveDashboard />;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
