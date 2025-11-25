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
      setData({ ...mainRes.data, perf: perfRes.data });
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
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    points.forEach((point: any, i: number) => {
      const x = (i / (points.length - 1)) * canvas.width;
      const y = canvas.height - ((point.equity - min) / range) * (canvas.height - 60) + 30;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data.perf?.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-20 h-20 text-purple-500 animate-spin mx-auto mb-6" />
          <p className="text-2xl font-black text-purple-400">BOOTING...</p>
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
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-500 bg-clip-text text-transparent">
            AlphaStream v100 ELITE
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-5 py-2 rounded-full text-lg md:text-2xl font-black bg-gradient-to-r from-emerald-500 to-cyan-600">
              {data.mode || "PAPER"}
            </span>
            <Zap className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-6xl mx-auto space-y-8 pb-20">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-red-500 to-pink-600 bg-clip-text text-transparent">
            ELITE SNIPER 2025
          </h2>
          <p className="text-sm md:text-lg text-purple-300 mt-2">Real 1-Min • 7 Elite Patterns</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 md:p-7 border-2 border-purple-600">
            <p className="text-2xl md:text-4xl font-black text-purple-400">
              ${equity.toLocaleString()}
            </p>
            <p className="text-xs md:text-lg text-gray-400 mt-1">Equity</p>
          </div>

          <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-5 md:p-7 border-2 ${unreal >= 0 ? 'border-green-500' : 'border-red-500'}`}>
            <TrendingUp className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 text-green-400" />
            <p className={`text-2xl md:text-4xl font-black ${unreal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {unreal >= 0 ? '+' : '-'}${Math.abs(unreal).toLocaleString()}
            </p>
            <p className="text-xs md:text-lg text-gray-400 mt-1">Unrealized</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 md:p-7 border-2 border-yellow-500">
            <p className="text-3xl md:text-5xl font-black text-yellow-400">{winRate}%</p>
            <p className="text-xs md:text-lg text-gray-400 mt-1">Win Rate</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 md:p-7 border-2 border-orange-500">
            <p className="text-3xl md:text-5xl font-black text-orange-400">{data.positions || 0}</p>
            <p className="text-xs md:text-lg text-gray-400 mt-1">Positions</p>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-black/60 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border-2 border-cyan-500">
          <h3 className="text-2xl md:text-4xl font-black text-center text-cyan-400 mb-4">
            LIVE EQUITY CURVE
          </h3>
          <div className="bg-black/40 rounded-xl p-2">
            <canvas
              ref={canvasRef}
              width={900}
              height={240}
              className="w-full rounded-lg"
            />
          </div>
        </div>

        {/* Rockets */}
        {data.rockets && data.rockets[0] !== "Scanning..." && data.rockets.length > 0 && (
          <div className="bg-black/60 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border-2 border-yellow-500">
            <h3 className="text-2xl md:text-4xl font-black text-center text-yellow-400 mb-6">
              ROCKETS FIRED
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.rockets.map((rocket: string, i: number) => {
                const [symbol, gain, pattern = ""] = rocket.split(' ');
                const cleanPattern = pattern?.replace(/[[\]]/g, '') || "";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-xl p-4 text-center border border-yellow-500">
                    <p className="text-xl md:text-3xl font-black">{symbol}</p>
                    <p className="text-lg md:text-2xl text-green-400">{gain}</p>
                    {cleanPattern && <p className="text-xs text-cyan-300 mt-1">{cleanPattern}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Force Scan Button */}
        <div className="text-center pt-8">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-20 py-10 md:px-32 md:py-14 text-3xl md:text-5xl font-black rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all shadow-2xl border-4 md:border-8 border-purple-400 flex items-center gap-6 md:gap-10 mx-auto disabled:opacity-60"
          >
            <RefreshCw className={`w-12 h-12 md:w-20 md:h-20 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? "SNIPING..." : "FORCE SCAN"}</span>
          </button>
        </div>

      </main>
    </div>
  );
}