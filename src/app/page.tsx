'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const CORE = process.env.NEXT_PUBLIC_CORE_URL;
const ML = process.env.NEXT_PUBLIC_ML_URL;

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);

  const fetchAll = async () => {
    const c = await axios.get(CORE);
    const m = await axios.get(`${ML}`);
    setCore(c.data);
    setML(m.data);
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 8000);
    return () => clearInterval(t);
  }, []);

  if (!core) return <div className="p-6 text-white">Loading…</div>;

  return (
    <div className="bg-black min-h-screen text-gray-300 p-4 text-sm">
      <h1 className="text-cyan-400 font-bold text-lg">AlphaStream</h1>

      <div className="mt-4">
        <div>Equity: <b>${core.equity}</b></div>
        <div>Positions: {core.positions.length}</div>
      </div>

      <h2 className="mt-4 text-yellow-400 font-bold">Rockets</h2>
      {core.rockets.map((r:any,i:number)=>(
        <div key={i}>{r.symbol} +{r.gap}%</div>
      ))}

      <h2 className="mt-4 text-purple-400 font-bold">ML Memory</h2>
      <div>Tracked Symbols: {ml?.symbolsTracked}</div>

      <h2 className="mt-4 text-green-400 font-bold">Logs</h2>
      <div className="font-mono text-xs max-h-48 overflow-y-auto">
        {core.logs.slice(-15).map((l:string,i:number)=>(
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
