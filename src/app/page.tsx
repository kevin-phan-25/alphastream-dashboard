// app/page.tsx — AlphaStream v100000 — FINAL DASHBOARD (Dec 11, 2025)
'use client';
import { RefreshCw, Brain, TrendingUp, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
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
    setTimeout(() => setScanning(false), 2800);
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-4 py-2 z-50">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              AlphaStream v100000
            </h1>
          </div>
          <div className="flex gap-3 text-xs">
            <span className={`px-3 py-1 rounded font-bold ${data.alpacaConnected ? "bg-red-600" : "bg-yellow-600"}`}>
              {data.alpacaConnected ? "LIVE" : "PAPER"}
            </span>
            <span className="text-cyan-400">{data.lastUpdate?.slice(11, 19) || "--:--"}</span>
          </div>
        </div>
      </header>

      <main className="pt-12 px-4 max-w-4xl mx-auto space-y-3 pb-20">
        {/* EQUITY + P&L */}
        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg p-4 text-center border border-purple-700">
          <div className="text-2xl font-black">{data.equity || "$100,000"}</div>
          <div className={`text-lg font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-900/80 rounded p-3 border border-purple-700">
            <TrendingUp className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <div className="font-bold">{data.positions || 0}</div>
            <div className="text-gray-500 text-xs">POS</div>
          </div>
          <div className="bg-gray-900/80 rounded p-3 border border-pink-700">
            <Zap className="w-5 h-5 mx-auto text-pink-400 mb-1" />
            <div className="font-bold">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-xs">GAPS</div>
          </div>
          <div className="bg-gray-900/80 rounded p-3 border border-green-700">
            <div className="font-bold">{data.stats?.winRate || "—"}%</div>
            <div className="text-gray-500 text-xs">WIN</div>
          </div>
          <div className="bg-gray-900/80 rounded p-3 border border-orange-700">
            <div className="font-bold">{data.stats?.totalTrades || 0}</div>
            <div className="text-gray-500 text-xs">TRADES</div>
          </div>
        </div>

        {/* POSITIONS — HOVER = LIVE CHART */}
        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-700">
            <div className="text-cyan-400 font-bold text-center mb-2">POSITIONS ({data.positionsList.length})</div>
            {data.positionsList.map((p: any, i: number) => (
              <div
                key={i}
                className="relative flex justify-between py-2 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-gray-800/50"
                onMouseEnter={() => setHovered(p.symbol)}
                onMouseLeave={() => setHovered(null)}
              >
                <div>
                  <span className="font-bold">{p.symbol} ×{p.qty}</span>
                  <div className="text-xs text-gray-500">{p.entryTime}</div>
                </div>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct}%
                </span>

                {/* HOVER CHART */}
                {hovered === p.symbol && (
                  <div className="absolute left-0 top-full z-50 bg-black/95 border-2 border-purple-700 rounded-lg p-3 shadow-2xl">
                    <img 
                      src={`https://finviz.com/chart.ashx?t=${p.symbol}&ty=c&ta=1&p=d&s=l`} 
                      alt={p.symbol} 
                      className="w-96 h-56 rounded" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ROCKETS */}
        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-lg p-3 border border-pink-700">
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {data.rockets.slice(0, 10).map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded p-2 font-bold text-pink-400 border border-pink-600">
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS */}
        <div className="bg-black/90 rounded-lg p-3 border border-green-700">
          <div className="text-xs font-bold text-green-400 text-center mb-1">NEURO LOGS</div>
          <div className="bg-black/70 rounded p-2 h-44 overflow-y-auto text-xs font-mono">
            {data.logs?.slice(-22).map((l: string, i: number) => {
              const text = l.split("] ")[1] || l;
              return (
                <div key={i} className="py-0.5">
                  {text.includes("BOUGHT") ? <span className="text-cyan-400 font-bold">{text}</span> :
                   text.includes("WIN") ? <span className="text-green-400 font-bold">{text}</span> :
                   text.includes("LOSS") ? <span className="text-red-400 font-bold">{text}</span> :
                   text.includes("FORCED") ? <span className="text-yellow-400">{text}</span> :
                   <span className="text-gray-500">{text}</span>}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE HUNT */}
        <div className="text-center pt-4">
          <button
            onClick={forceHunt}
            disabled={scanning}
            className="px-20 py-3 text-sm font-black rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition disabled:opacity-50 border border-purple-800"
          >
            <RefreshCw className={`inline w-5 h-5 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING" : "FORCE HUNT"}
          </button>
        </div>

        <div className="text-center py-3 text-cyan-400 text-xs animate-pulse font-bold">
          v100000 • REAL ALPACA • LIVE EQUITY • NO OVERNIGHT
        </div>
      </main>
    </div>
  );
}
