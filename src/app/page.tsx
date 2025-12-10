'use client';
import { RefreshCw, Brain } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app"; // Update if needed

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 12000 });
      setData(res.data);
    } catch (err) {
      console.log("Bot unreachable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceHunt = async () => {
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/scan`);
    } catch {}
    setTimeout(() => setScanning(false), 3000);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Brain className="w-16 h-16 text-purple-600 animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-800 px-4 py-3">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <h1 className="text-base font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v100000
            </h1>
          </div>
          <div className="flex gap-4">
            <span className={`px-4 py-1 rounded-full font-bold text-sm ${data.alpacaConnected ? "bg-red-600" : "bg-yellow-600"}`}>
              {data.alpacaConnected ? "LIVE ALPACA" : "DISCONNECTED"}
            </span>
            <span className="text-cyan-400 font-mono">{data.lastUpdate}</span>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-5 pb-32">
        <div className="bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/30 rounded-3xl p-8 text-center border-2 border-purple-700">
          <div className="text-5xl font-black mb-2">{data.equity || "$0"}</div>
          <div className={`text-2xl font-bold ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        {data.positionsList?.length > 0 && (
          <div className="bg-gray-900/90 rounded-2xl p-5 border-2 border-cyan-600">
            <h2 className="text-cyan-400 font-bold text-center mb-4">ACTIVE POSITIONS ({data.positionsList.length})</h2>
            {data.positionsList.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <span className="font-bold text-lg">{p.symbol} ×{p.qty}</span>
                <span className={`text-xl font-black ${p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {data.rockets?.length > 0 && (
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-2xl p-5 border-2 border-pink-700">
            <h2 className="text-pink-400 font-bold text-center mb-4">LIVE GAPPERS</h2>
            <div className="grid grid-cols-4 gap-3">
              {data.rockets.map((r: string, i: number) => (
                <div key={i} className="bg-black/70 rounded-xl p-3 text-center border-2 border-pink-600">
                  <div className="text-lg font-black text-pink-400">{r}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-black/90 rounded-2xl p-5 border-2 border-green-700">
          <h2 className="text-green-400 font-bold text-center mb-4">NEURO LOGS</h2>
          <div className="bg-black/80 rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs leading-tight">
            {data.logs?.map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              return (
                <div key={i} className="py-1 border-b border-gray-800 last:border-0">
                  {text.includes("BOUGHT") ? <span className="text-cyan-400 font-bold">{text}</span>
                  : text.includes("WIN") ? <span className="text-green-400 font-bold">{text}</span>
                  : text.includes("LOSS") ? <span className="text-red-400 font-bold">{text}</span>
                  : text.includes("FORCED") || text.includes("SELL") ? <span className="text-yellow-400">{text}</span>
                  : <span className="text-gray-500">{text}</span>}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-10">
          <button
            onClick={forceHunt}
            disabled={scanning}
            className="px-40 py-6 text-2xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:scale-110 transition-all disabled:opacity-50 border-4 border-purple-900 shadow-2xl"
          >
            <RefreshCw className={`inline w-10 h-10 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>

        <div className="text-center py-12">
          <p className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            v100000 • REAL ALPACA • LIVE EQUITY • NO FAKES
          </p>
        </div>
      </main>
    </div>
  );
}