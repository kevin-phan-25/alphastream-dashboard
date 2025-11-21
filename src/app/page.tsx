'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Skull, TrendingUp, Package } from 'lucide-react';

export default function Home() {
  const [bot, setBot] = useState<any>({});
  const [perf, setPerf] = useState<any>({ trades: [], stats: {}, equityCurve: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchAll = async () => {
    try {
      const [botRes, perfRes] = await Promise.all([
        axios.get(BOT_URL),
        axios.get(`${BOT_URL}/performance`)
      ]);

      const equityRaw = (botRes.data.equity || "$100000").toString().replace(/[$,]/g, '');
      const unrealRaw = (botRes.data.unrealized || "0").toString().replace(/[$,+]/g, '');

      setBot({
        ...botRes.data,
        equity: `$${parseFloat(equityRaw).toLocaleString()}`,
        unrealized: parseFloat(unrealRaw) >= 0 
          ? `+$${Math.abs(parseFloat(unrealRaw)).toLocaleString()}` 
          : `–$${Math.abs(parseFloat(unrealRaw)).toLocaleString()}`
      });
      setPerf(perfRes.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 10000);
    return () => clearInterval(i);
  }, []);

  // Draw equity curve on canvas
  useEffect(() => {
    if (!canvasRef.current || perf.equityCurve.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const points = perf.equityCurve;

    const minEquity = Math.min(...points.map((p: any) => p.equity));
    const maxEquity = Math.max(...points.map((p: any) => p.equity));
    const range = maxEquity - minEquity || 1;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.beginPath();

    points.forEach((point: any, i: number) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((point.equity - minEquity) / range) * height * 0.9 + height * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [perf.equityCurve]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-32 h-32 text-purple-500 animate-spin" />
      </div>
    );
  }

  const { stats = {}, equityCurve = [], trades = [] } = perf;
  const positionsCount = bot.positions || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white pb-20">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b-2 border-purple-600">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v98
            </h1>
            <p className="text-xl text-orange-400 font-bold">WARRIOR PATTERN SNIPER</p>
          </div>
          <span className="px-10 py-4 rounded-full text-3xl font-black bg-gradient-to-r from-emerald-500 to-green-600">
            {bot.mode || "LIVE"} MODE
          </span>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-7xl mx-auto space-y-12">
        <h2 className="text-8xl font-black text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
          LOW-FLOAT SNIPER
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-purple-500">
            <p className="text-5xl font-black text-purple-300">{bot.equity}</p>
            <p className="text-xl text-gray-300">Equity</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-green-500">
            <TrendingUp className="w-16 h-16 mx-auto text-green-400 mb-2" />
            <p className={`text-5xl font-black ${bot.unrealized?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
              {bot.unrealized}
            </p>
            <p className="text-xl text-gray-300">Unrealized</p>
          </div>
          <div onClick={() => setShowTrades(true)} className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-yellow-500 hover:scale-110 cursor-pointer transition">
            <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-3" />
            <p className="text-6xl font-black text-yellow-400">{stats.winRate || "0.0"}%</p>
            <p className="text-xl text-gray-300">Win Rate</p>
          </div>
          <div onClick={() => setShowPositions(true)} className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-orange-500 hover:scale-110 cursor-pointer transition">
            <Package className="w-20 h-20 mx-auto text-orange-400 mb-3" />
            <p className="text-6xl font-black text-orange-300">{positionsCount}</p>
            <p className="text-xl text-gray-300">Positions</p>
          </div>
        </div>

        {/* EQUITY CURVE — NO DEPENDENCIES */}
        <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-cyan-500">
          <h3 className="text-5xl font-black text-center text-cyan-400 mb-8">
            LIVE EQUITY CURVE
          </h3>
          <div className="h-96 bg-black/40 rounded-2xl overflow-hidden">
            {equityCurve.length > 1 ? (
              <canvas ref={canvasRef} width={1200} height={400} className="w-full h-full" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-3xl">
                Equity curve starts after first trade...
              </div>
            )}
          </div>
        </div>

        {/* Rockets + Force Scan + Modals same as before */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-yellow-500">
            <h3 className="text-5xl font-black text-center text-yellow-400 mb-8">ROCKET HITS</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split('+')[0].trim();
                const pct = r.split('+')[1]?.split(' ')[0];
                const pattern = r.match(/\[(.*?)\]/)?.[1]?.toUpperCase() || "MOMO";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-2xl p-6 text-center hover:scale-110 transition">
                    <p className="text-4xl font-black">{symbol}</p>
                    <p className="text-3xl text-green-400">+{pct}</p>
                    <p className="text-sm font-bold text-cyan-300">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center pt-10">
          <button
            onClick={async () => {
              setScanning(true);
              await axios.post(`${BOT_URL}/scan`).catch(() => {});
              setScanning(false);
              fetchAll();
            }}
            className="px-40 py-16 text-6xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all shadow-2xl border-8 border-purple-400 flex items-center justify-center gap-12 mx-auto"
          >
            <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>

      {/* Trade & Position Modals — same as before */}
      {/* (I'll skip pasting them to save space — you already have them from last version) */}
    </div>
  );
}
