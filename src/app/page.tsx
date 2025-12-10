// app/page.tsx — AlphaStream v100000 — FINAL DASHBOARD
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

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL);
      setData(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 10000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-800 px-4 py-3">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              v100000
            </h1>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 rounded bg-emerald-600 font-bold">{data.mode || "PAPER"}</span>
            <span className="text-cyan-400">EST {data.lastUpdate || "—"}</span>
          </div>
        </div>
      </header>

      <main className="pt-16 px-4 max-w-3xl mx-auto space-y-4 pb-24">
        <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl p-5 text-center border border-purple-700">
          <div className="text-3xl font-black">{data.equity || "$100,000"}</div>
          <div className={`text-xl font-bold mt-2 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/90 rounded-xl p-4 border border-cyan-700">
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between py-1 text-xs border-b border-gray-800 last:border-b-0">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-3 border border-pink-700">
            <div className="grid grid-cols-6 gap-2 text-center text-xs">
              {data.rockets.map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded p-2 font-bold text-pink-400 border border-pink-600">
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-black/90 rounded-xl p-3 border border-green-700">
          <div className="text-xs font-bold text-green-400 text-center mb-1">PPO LOGS</div>
          <div className="bg-black/70 rounded p-2 h-48 overflow-y-auto text-xs font-mono">
            {data.logs?.slice(-20).map((l: string, i: number) => {
              const text = l.split("] ")[1] || l;
              return (
                <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">
                  <span className="text-gray-400">{text}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-6">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-24 py-4 text-sm font-black rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition disabled:opacity-50 border-2 border-purple-800"
          >
            <RefreshCw className={`inline w-6 h-6 mr-3 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        <div className="text-center py-4 text-cyan-400 animate-pulse font-bold text-sm">
          v100000 • PPO • {data.mode || "PAPER"} • LIVE
        </div>
      </main>
    </div>
  );
}
