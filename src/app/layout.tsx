'use client';
import axios from "axios";
import { useState, useEffect } from "react";

export default function Positions() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(process.env.NEXT_PUBLIC_BOT_URL);
        setPositions(Object.entries(res.data.positions || {}).map(([sym, p]) => ({ sym, ...p })));
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 10000);
    return () => clearInterval(id);
  }, []);

  const exit = async (sym) => {
    await axios.post(`${process.env.NEXT_PUBLIC_BOT_URL}/exit`, { secret: "your-forward-secret", symbol: sym });
    alert(`${sym} EXITED`);
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-black mb-8">LIVE POSITIONS</h1>
      {positions.length === 0 ? (
        <p className="text-2xl text-gray-400">No open positions — hunting...</p>
      ) : (
        <div className="grid gap-6">
          {positions.map(p => (
            <div key={p.sym} className="bg-black/80 backdrop-blur border border-green-500/50 rounded-2xl p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">{p.sym}</h2>
                  <p>Entry: ${p.entry?.toFixed(2)} × {p.qty} shares</p>
                  <p className="text-green-400">Risk: ${(p.risk * p.qty).toFixed(2)}</p>
                </div>
                <button onClick={() => exit(p.sym)} className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl text-xl font-bold">
                  EXIT NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
