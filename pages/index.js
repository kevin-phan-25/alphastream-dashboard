'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data.json?t=' + Date.now());
        const json = await res.json();
        setData(json);
      } catch {}
    };
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>AlphaStream v20.9.6</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
