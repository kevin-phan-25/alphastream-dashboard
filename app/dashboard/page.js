// app/dashboard/page.js
import LiveDashboard from '@/components/liveDashboard';  // ← lowercase

export default function Dashboard() {
  return <LiveDashboard />;
}

export const dynamic = 'force-dynamic';
