// app/page.tsx — Compact Dashboard for v200000
'use client';
import { RefreshCw, Brain } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 8000); return () => clearInterval(i); }, []);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.logs]);

  const forceHunt = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 2500);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Brain className="w-10 h-10 text-purple-500 animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-4 py-2 z-50">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              AlphaStream v200000
            </h1>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-bold ${data.marketStatus === 'TRADING' ? 'bg-green-600' : data.marketStatus === 'CLOSE' ? 'bg-red-600' : 'bg-gray-600'}`}>
            {data.marketStatus || "LOADING"}
          </span>
        </div>
      </header>

      <main className="pt-14 px-4 max-w-4xl mx-auto space-y-4 pb-20">
        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-xl p-5 text-center border border-purple-700">
          <div className="text-3xl font-black">{data.equity || "$100,000"}</div>
          <div className={`text-xl font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-gray-900/80 rounded-lg p-3 border border-purple-600">
            <div className="text-lg font-bold">{data.positions || 0}</div>
            <div className="text-2xs text-gray-500">POS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-600">
            <div className="text-lg font-bold">{data.rockets?.length || 0}</div>
            <div className="text-2xs text-gray-500">GAPS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-green-600">
            <div className="text-lg font-bold">{data.stats?.winRate || "—"}%</div>
            <div className="text-2xs text-gray-500">WIN</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-orange-600">
            <div className="text-lg font-bold">{data.stats?.totalTrades || 0}</div>
            <div className="text-2xs text-gray-500">TRADES</div>
          </div>
        </div>

        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-4 border border-cyan-600">
            <div className="text-cyan-400 font-bold text-center mb-2 text-xs">POSITIONS</div>
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-800 last:border-0 text-xs">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-black/90 rounded-xl p-4 border border-green-700">
          <div className="text-green-400 font-bold text-center mb-2 text-xs">LOGS</div>
          <div className="bg-black/70 rounded p-3 h-64 overflow-y-auto font-mono text-2xs">
            {data.logs?.slice(-28).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              return (
                <div key={i} className="py-0.5">
                  {text.includes("ENTRY") ? <span className="text-cyan-400">{text}</span> :
                   text.includes("WIN") ? <span className="text-green-400">{text}</span> :
                   text.includes("STOP") ? <span className="text-red-400">{text}</span> :
                   text.includes("FORCED") || text.includes("CLOSE") ? <span className="text-orange-400 font-bold">{text}</span> :
                   <span className="text-gray-500">{text}</span>}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-6">
          <button
            onClick={forceHunt}
            disabled={scanning}
            className="px-32 py-4 text-lg font-black rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition disabled:opacity-50 border-2 border-purple-800"
          >
            <RefreshCw className={`inline w-7 h-7 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-4 text-cyan-400 text-xs font-bold">
          v200000 • 4:00 AM – 3:59 PM ET • NO OVERNIGHT • IMMORTAL
        </div>
      </main>
    </div>
  );
}
