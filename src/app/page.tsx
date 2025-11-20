'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Rocket, RefreshCw, X, TrendingUp, AlertTriangle, Zap, Flame, DollarSign, Target, BarChart3 } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  
  const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL?.trim();

  const fetchData = async () => {
    if (!BOT_URL) { setLoading(false); return; }
    try {
      const res = await axios.get(BOT_URL, { timeout: 15000 });
      setData(res.data || {});
    } catch (err) {
      console.error("Bot unreachable:", err);
      setData({ status: "OFFLINE" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [BOT_URL]);

  const triggerScan = async () => {
    if (!BOT_URL || scanning) return;
    setScanning(true);
    setLastScan(new Date().toLocaleTimeString());
    try {
      await axios.post(`${BOT_URL}/scan`);  // ← FIXED ENDPOINT
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
      setTimeout(fetchData, 2000);
    }
  };

  const version = data.version || "v64.0";
  const equity = data.equity || "$100,000.00";
  const dailyPnL = data.dailyPnL || "+$0.00";
  const positionsCount = data.positions_count ?? data.positions?.length ?? 0;
  const winRate = data.backtest?.winRate || "0.0%";
  const isLive = data.mode === "LIVE" || !data.dry_mode;

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center"><Flame className="w-16 h-16 text-orange-500 animate-pulse" /></div>;
  if (data.status === "OFFLINE" || !BOT_URL) return <div className="min-h-screen bg-red-900 flex items-center justify-center text-white text-4xl">BOT OFFLINE — Check BOT_URL</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AlphaStream {version}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-5 py-2 rounded-full font-bold ${isLive ? 'bg-green-600 animate-pulse' : 'bg-yellow-600'}`}>
              {isLive ? "LIVE" : "PAPER"}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 pb-32 text-center">
        <h2 className="text-6xl font-black bg-gradient-to-r from-cyan-300 to-pink-400 bg-clip-text text-transparent">
          FMP MOMENTUM ENGINE
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-12 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6"><DollarSign className="w-10 h-10 mx-auto text-cyan-400" /><p className="text-3xl font-black mt-2">{equity}</p><p className="text-sm text-gray-400">Equity</p></div>
          <div classNameOnClick className="bg-white/10 backdrop-blur-xl rounded-2xl p-6"><Target className="w-10 h-10 mx-auto text-green-400" /><p className={`text-3xl font-black mt-2 ${dailyPnL.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>{dailyPnL}</p><p className="text-sm text-gray-400">Daily P&L</p></div>
          <div onClick={() => setShowPositions(true)} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 cursor-pointer hover:scale-110 transition"><BarChart3 className="w-10 h-10 mx-auto text-purple-400" /><p className="text-5xl font-black mt-2">{positionsCount}/5</p><p className="text-sm text-gray-400">Positions</p></div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6"><Zap className="w-10 h-10 mx-auto text-yellow-400" /><p className="text-5xl font-black mt-2">{winRate}</p><p className="text-sm text-gray-400">Win Rate</p></div>
        </div>

        <button
          onClick={triggerScan}
          disabled={scanning}
          className="relative px-24 py-10 text-5xl font-black rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition shadow-2xl disabled:opacity-60"
        >
          {scanning ? "SCANNING..." : "FORCE SCAN"} <Rocket className="inline ml-4" />
        </button>
      </main>

      {showPositions && data.positions && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" onClick={() => setShowPositions(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-4xl font-black mb-6">POSITIONS</h3>
            {data.positions.map((p: any) => (
              <div key={p.symbol} className="bg-white/10 rounded-xl p-6 mb-4 text-left">
                <span className="text-3xl font-black">{p.symbol}</span> — {p.qty} shares @ ${p.entry?.toFixed(2)} → ${p.current?.toFixed(2)} 
                <span className={p.unrealized_pl >= 0 ? "text-green-400" : "text-red-400"}> (${p.unrealized_pl?.toFixed(2)})</span>
              </div>
            ))}
            <button onClick={() => setShowPositions(false)} className="mt-8 px-8 py-4 bg-red-600 rounded-full">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
