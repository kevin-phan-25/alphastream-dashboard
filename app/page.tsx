'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const evtSource = new EventSource('/api/sse'); // You'll need an SSE endpoint later
    // For now just poll or use Realtime DB
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>AlphaStream v16.2 Live</h1>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}
