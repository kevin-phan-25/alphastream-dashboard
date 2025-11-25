'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, TrendingUp, Zap } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "PAPER",
    rockets: ["Scanning..."],
    perf: { winRate: 0, recent: [] }
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [mainRes, perfRes] = await Promise.all([
        axios.get(URL).catch(() => ({ data: {} })),
        axios.get(URL + "/performance").catch(() => ({ data: {} }))
      ]);

      setData({
        ...mainRes.data,
        perf: perfRes.data
      });
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    await fetchData();
    setScanning(false);
  };

  // Draw Equity Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.perf?.recent?.length) return;

    const ctx = canvas.getContext('2d')!;
    const points = data.perf.recent;
    const values = points.map((p: any) => p.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Glow effect
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    points.forEach((point: any, i: number) => {
      const x = (i / (points.length - 1)) * canvas.width;
      const y = canvas.height - ((point.equity - min) / range) * (canvas.height - 80) + 40;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Add sparkles on peaks
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    const peak = Math.max(...values);
    const peakIndex = values.indexOf(peak);
    if (peakIndex > 0) {
      const x = (peakIndex / (points.length - 1)) * canvas.width;
      ctx.fillText("⋆", x - 10, 50);
    }
  }, [data.perf?.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-32 h-32 text-purple-500 animate-spin mx-auto mb-8" />
          <p className="text-4xl font-black text-purple-400">ALPHASTREAM BOOTING...</p>
        </div>
      </div>
    );
  }

  const equity = Number(data.equity || 100000);
  const unreal = Number(data.unrealized || 0);
  const winRate = Number(data.perf?.winRate || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-b-4 border-purple-600">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-500 bg-clip-text text-transparent animate-pulse">
            AlphaStream v100 ELITE
          </h1>
          <div className="flex items-center gap-6">
            <span className="px-10 py-4 rounded-full text-3xl font-black bg-gradient-to-r from-emerald-500 to-cyan-600 shadow-2xl">
              {data.mode || "PAPER"} MODE
            </span>
            <Zap className="w-16 h-16 text-yellow-400 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-6xl mx-auto space-y-12 pb-20">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-7xl font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-600 bg-clip-text text-transparent animate-pulse">
            ELITE MOMENTUM SNIPER 2025
          </h2>
          <p className="text-2xl text-purple-300 mt-4 font-light">Real 1-Min Bars • 7 Elite Patterns • Live Alpaca</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-4 border-purple-600 shadow-2xl transform hover:scale-105 transition">
            <p className="text-5xl font-black text-purple-400">
              ${equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-gray-400 text-xl mt-2">Account Equity</p>
          </div>

          <div className={`bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-4 ${unreal >= 0 ? 'border-green-500' : 'border-red-500'} shadow-2xl transform hover:scale-105 transition`}>
            <TrendingUp className="w-16 h-16 mx-auto mb-3 text-green-400" />
            <p className={`text-5xl font-black ${unreal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {unreal >= 0 ? '+' : '-'}${Math.abs(unreal).toLocaleString()}
            </p>
            <p className="text-gray-400 text-xl mt-2">Unrealized P&L</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-4 border-yellow-500 shadow-2xl transform hover:scale-105 transition">
            <p className="text-6xl font-black text-yellow-400">{winRate}%</p>
            <p className="text-gray-400 text-xl mt-2">Win Rate</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border-4 border-orange-500 shadow-2xl transform hover:scale-105 transition">
            <p className="text-6xl font-black text-orange-400">{data.positions || 0}</p>
            <p className="text-gray-400 text-xl mt-2">Open Rockets</p>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-cyan-500 shadow-2xl">
          <h3 className="text-5xl font-black text-center text-cyan-400 mb-8 tracking-wider">
            LIVE EQUITY CURVE
          </h3>
          <div className="bg-black/40 rounded-2xl p-4">
            <canvas
              ref={canvasRef}
              width={1100}
              height={360}
              className="w-full rounded-xl"
            />
          </div>
        </div>

        {/* Rockets */}
        {data.rockets && data.rockets[0] !== "Scanning..." && data.rockets.length > 0 && (
          <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-yellow-500 shadow-2xl animate-pulse">
            <h3 className="text-5xl font-black text-center text-yellow-400 mb-10">
              ELITE ROCKETS JUST FIRED
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {data.rockets.map((rocket: string, i: number) => {
                const [symbol, gain, pattern = ""] = rocket.split(' ');
                const cleanPattern = pattern?.replace(/[[\]]/g, '') || "";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 via-pink-800 to-red-800 rounded-2xl p-6 text-center shadow-2xl border-4 border-yellow-500 transform hover:scale-110 transition">
                    <p className="text-4xl font-black text-white">{symbol}</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">{gain}</p>
                    {cleanPattern && <p className="text-sm text-cyan-300 mt-1 font-mono">{cleanPattern}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Force Scan Button */}
        <div className="text-center pt-12">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="group relative px-40 py-20 text-6xl font-black rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:scale-110 transition-all shadow-3xl border-8 border-purple-400 disabled:opacity-60"
          >
            <div className="absolute inset-0 rounded-3xl bg-white opacity-20 group-hover:opacity-40 transition"></div>
            <div className="relative flex items-center justify-center gap-12">
              <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : 'group-hover:animate-spin'}`} />
              <span>{scanning ? "SNIPING LIVE..." : "FORCE SCAN NOW"}</span>
            </div>
          </button>
        </div>

      </main>
    </div>
  );
}