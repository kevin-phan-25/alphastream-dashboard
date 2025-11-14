import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState({ trades: [], logs: [] });

  const fetchData = async () => {
    const [t, l] = await Promise.all([
      axios.get('/api/trades'),
      axios.get('/api/logs')
    ]);
    setData({ trades: t.data, logs: l.data });
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>AlphaStream v20.9.6</h1>
      <button onClick={() => axios.post('/api/scan')}>Scan Now</button>
      <button onClick={() => axios.post('/api/close')}>Close All</button>
      <h2>Trades</h2>
      <pre>{JSON.stringify(data.trades, null, 2)}</pre>
      <h2>Logs</h2>
      <pre>{data.logs.slice(0, 10).map(l => `[${l.created_at}] ${l.event} ${l.symbol} ${l.note}`).join('\n')}</pre>
    </div>
  );
}

export default App;
