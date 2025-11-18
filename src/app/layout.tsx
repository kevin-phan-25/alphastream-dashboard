'use client';
import axios from "axios";
import { useState, useEffect } from "react";

export default function Positions() {
  const [positions, setPositions] = useState<any[]>([]);

  const fetchPositions = async () => {
    try {
      const res = await axios.get(process.env.NEXT_PUBLIC_BOT_URL || "");
      const pos = res.data.positions || {};
      setPositions(Object.entries(pos).map(([sym, data]: any) => ({
        symbol: sym,
        qty: data.qty,
        entry: data.entry?.toFixed(2),
        risk: data.risk?.toFixed(2)
      })));
    } catch {}
  };

  useEffect(() => {
    fetchPositions();
    const id = setInterval(fetchPositions, 12000);
    return () => clearInterval(id);
  }, []);

  const exit = async (sym: string) => {
    if (!confirm(`Exit ${sym}?`)) return;
    await axios.post(`${process.env.NEXT_PUBLIC_BOT_URL}/exit`, {
      secret: process.env.NEXT_PUBLIC_FORWARD_SECRET,
      symbol: sym
    });
    fetchPositions();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900/20 p-8">
      <h1 className="text-5xl font-black text-white mb-12 tracking-tighter">LIVE POSITIONS</h1>

      {positions.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-3xl text-gray-500">No open positions</p>
          <p className="text-xl text-gray-600 mt-4">AlphaStream is hunting...</p>
        </div>
      ) : (
        <div className="grid gap-6 max-w-4xl">
          {positions.map(p => (
            <div key={p.symbol} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black">{p.symbol}</h2>
                  <div className="mt-4 space-y-2 text-lg">
                    <p>Entry: ${p.entry}</p>
                    <p>Qty: {p.qty} shares</p>
                    <p className="text-gray-400">Risk: ${p.risk}</p>
                  </div>
                </div>
                <button
                  onClick={() => exit(p.symbol)}
                  className="bg-red-600/80 hover:bg-red-600 px-10 py-5 rounded-xl text-xl font-bold transition-all hover:scale-105"
                >
                  EXIT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
