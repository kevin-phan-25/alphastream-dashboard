'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, TrendingUp, Terminal, AlertCircle } from 'lucide-react';

interface BotData {
  equity: number;
  unrealized: number;
  positions: number;
  mode: string;
  rockets: string[];
  winRate: number;
  recent: { equity: number }[];
  logs: string[];
}

export default function Home() {
  const [data, setData] = useState<BotData>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "LOADING",
    rockets: ["Connecting to Alpaca..."],
    winRate: 0,
    recent: [],
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [mainRes, perfRes] = await Promise.all([
        axios.get(URL, { timeout: 12000 }),
        axios.get(URL + "/performance", { timeout: 12000 }).catch(() => ({ data: { stats: {}, recent: [] } }))
      ]);

      const main = mainRes.data;
      const perf = perfRes.data;

      // THIS IS THE FIX — EXTRACT REAL VALUES FROM YOUR BACKEND
      const rawEquity = main.equity || main.accountEquity || "100000";
      const equity = Math.round(parseFloat(rawEquity.toString().replace(/[^0-9.-]+/g,"")) || 100000;

      // Unrealized P&L from positions sum
      const unrealized = main.positions?.reduce((sum: number, p: any) => {
        return sum + (parseFloat(p.unrealized_pl || "0"));
      }, 0) || 0;

      const positionsCount = main.positions?.length || 0;

      // Win rate from CSV parsing in /performance
      const winRate = perf.stats?.winRate || perf.winRate || "0.0%";
      const winRateNum = parseFloat(winRate.replace("%","")) || 0;

      setData({
        equity,
        unrealized: Math.round(unrealized),
        positions: positionsCount,
        mode: main.mode || "PAPER",
        rockets: main.rockets && main.rockets.length > 0 && main.rockets[0] !== "Scanning..." 
          ? main.rockets 
          : ["Awaiting signal..."],
        winRate: winRateNum,
        recent: Array.isArray(perf.recent) ? perf.recent.slice(-50) : [],
        logs: Array.isArray(main.logs) ? main.logs.slice(-40) : []
      });
    } catch (err: any) {
      console.error("Failed to fetch:", err.message);
      // Keep last good data, don't reset
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${URL}/scan`);
      setTimeout(fetchData, 3000);
    } catch {}
    setTimeout(() => setScanning(false), 8000);
  };

  // Equity Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.recent.length < 2) return;

    const ctx = canvas.getContext('2d')!;
    const values = data.recent.map(p => p.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#c084fc';
    ctx.beginPath();

    data.recent.forEach((p, i) => {
      const x = (i / (data.recent.length - 1) * canvas.width);
      const y = canvas.height - ((p.equity - min) / range) * (canvas.height - 50) + 25;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data.recent]);

  if (loading && data.equity === 100000) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-20 h-20 text-purple-500 animate-spin mx-auto mb-6" />
          <p className="text-2xl font-bold text-purple-400">Connecting to Alpaca Account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b-4 border-purple-600">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v100 ELITE
          </h1>
          <span className={`px-8 py-3 rounded-full text-xl font-black ${data.mode === "LIVE" ? "bg-red-600" : "bg-gradient-to-r from-emerald-500 to-cyan-600"}`}>
            {data.mode}
          </span>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-5xl mx-auto space-y-10 pb-24">

        <h2 className="text-5xl font-black text-center bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          ELITE SNIPER ACTIVE
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-3xl p-8 border-4 border-purple-500 text-center">
            <p className="text-5xl font-black text-purple-400">${data.equity.toLocaleString()}</p>
            <p className="text-lg text-gray-400 mt-2">Equity</p>
          </div>
          <div className={`bg-white/10 rounded-3xl p-8 border-4 ${data.unrealized >= 0 ? 'border-green-500' : 'border-red-500'} text-center`}>
            <p className={`text-5xl font-black ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.unrealized >= 0 ? '+' : '-'}${Math.abs(data.unrealized).toLocaleString()}
            </p>
            <p className="text-lg text-gray-400 mt-2">Unrealized P&L</p>
          </div>
          <div className="bg-white/10 rounded-3xl p-8 border-4 border-yellow-500 text-center">
            <p className="text-5xl font-black text-yellow-400">{data.winRate.toFixed(1)}%</p>
            <p className="text-lg text-gray-400 mt-2">Win Rate</p>
          </div>
          <div className="bg-white/10 rounded-3xl p-8 border-4 border-orange-500 text-center">
            <p className="text-5xl font-black text-orange-400">{data.positions}</p>
            <p className="text-lg text-gray-400 mt-2">Positions</p>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-black/60 rounded-3xl p-8 border-4 border-cyan-500">
          <h3 className="text-2xl font-black text-cyan-400 text-center mb-6">LIVE EQUITY CURVE</h3>
          <canvas ref={canvasRef} width={1200} height={300} className="w-full rounded-2xl bg-black/60" />
        </div>

        {/* Live Logs */}
        <div className="bg-black/70 rounded-3xl p-8 border-4 border-green-500">
          <div className="flex items-center gap-4 mb-6">
            <Terminal className="w-10 h-10 text-green-400" />
            <h3 className="text-2xl font-black text-green-400">LIVE BOT LOGS</h3>
          </div>
          <div className="bg-black/80 rounded-2xl p-6 h-96 overflow-y-auto font-mono text-sm text-gray-300">
            {data.logs.length > 0 ? data.logs.map((log, i) => (
              <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                {log}
              </div>
            )) : <div className="text-gray-500 italic">Waiting for logs...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Rockets */}
        {data.rockets[0] !== "Awaiting signal..." && (
          <div className="bg-black/60 rounded-3xl p-8 border-4 border-yellow-500">
            <h3 className="text-2xl font-black text-yellow-400 text-center mb-6">ROCKETS FIRED</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {data.rockets.slice(0, 8).map((r, i) => {
                const [sym, gain, ...rest] = r.split(' ');
                const pattern = rest.join(' ').replace(/[[\]]/g, '');
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-2xl p-6 text-center border-4 border-yellow-500">
                    <p className="text-4xl font-black">{sym}</p>
                    <p className="text-3xl text-green-400">{gain}</p>
                    {pattern && <p className="text-lg text-cyan-300 mt-2">{pattern}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Force Scan Button */}
        <div className="text-center pt-10">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-32 py-16 text-5xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-110 transition-all shadow-3xl border-8 border-purple-400 flex items-center gap-10 mx-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-20 h-20 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
