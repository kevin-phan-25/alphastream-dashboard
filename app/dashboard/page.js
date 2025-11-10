// app/dashboard/page.js
import LiveDashboard from '@/components/LiveDashboard';

export default function Dashboard() {
  return <LiveDashboard />;
}

// Force dynamic rendering so data updates live
export const dynamic = 'force-dynamic';
