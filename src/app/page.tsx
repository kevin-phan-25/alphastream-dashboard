'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, TrendingUp, Terminal } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({
    equity: 100000,
    unrealized: 0,
    positions: 0,
    mode: "PAPER",
    rockets: ["Scanning Elite Setups..."],
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
        axios.get(URL).catch(() => ({ data: {} })),
        axios.get(URL + "/performance").catch(() => ({ data: {} }))
      ]);
      setData(prev => ({
        ...mainRes.data,
        winRate: perfRes.data.winRate || prev.winRate || 0,
        recent: perfRes.data.recent || prev.recent || [],
        logs: mainRes.data.logs?.slice(-30) || prev.logs || []  // ← NEW: logs from backend
      }));
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 8000);  // Faster refresh for logs
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    await fetchData();
    setScanning(false);
  };

  // Equity Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.recent?.length) return;
    const ctx = canvas.getContext('2d')!;
    const points = data.recent;
    const values = points.map((p: any) => p.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    points.forEach((point: any, i: number) => {
      const x = (i / (points.length - 1)) * canvas.width;
      const y = canvas.height - ((point.equity - min) / range) * (canvas.height - 60) + 30;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data.recent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-20 h-20 text-purple-500 animate-spin" />
      </div>
    );
  }

  const equity = Number(data.equity || 100000);
  const unreal = Number(data.unrealized || 0);
  const winRate = Number(data.winRate || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b-4 border-purple-600">
        <div className="max-w-5xl mx-auto px-5 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v100 ELITE
          </h1>
          <span className="px-6 py-2 rounded-full text-lg md:text-xl font-black bg-gradient-to-r from-emerald-500 to-cyan-600">
            {data.mode || "PAPER"}
          </span>
        </div>
      </header>

      <main className="pt-28 px-4 max-w-5xl mx-auto space-y-8 pb-20">

        <div className="text-center -mt-6">
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent leading-tight">
            ELITE SNIPER
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white/10 rounded-2xl p-5 border-2 border-purple-500 text-center">
            <p className="text-2xl md:text-3xl font-black text-purple-400">${equity.toLocaleString()}</p>
            <p className="text-xs md:text-base text-gray-400 mt-1">Equity</p>
          </div>
          <div className={`bg-white/10 rounded-2xl p-5 border-2 ${unreal >= 0 ? 'border-green-500' : 'border-red-500'} text-center`}>
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 text-green-400" />
            <p className={`text-2xl md:text-3xl font-black ${unreal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {unreal >= 0 ? '+' : '-'}${Math.abs(unreal).toLocaleString()}
            </p>
            <p className="text-xs md:text-base text-gray-400 mt-1">Unrealized</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 border-2 border-yellow-500 text-center">
            <p className="text-3xl md:text-4xl font-black text-yellow-400">{winRate}%</p>
            <p className="text-xs md:text-base text-gray-400 mt-1">Win Rate</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 border-2 border-orange-500 text-center">
            <p className="text-3xl md:text-4xl font-black text-orange-400">{data.positions || 0}</p>
            <p className="text-xs md:text-base text-gray-400 mt-1">Positions</p>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-black/60 rounded-2xl p-6 border-2 border-cyan-500">
          <h3 className="text-xl md:text-2xl font-black text-center text-cyan-400 mb-4">LIVE EQUITY CURVE</h3>
          <canvas ref={canvasRef} width={900} height={240} className="w-full rounded-xl bg-black/40" />
        </div>

        {/* REAL-TIME LOGS & CANDIDATES */}
        <div className="bg-black/70 rounded-2xl p-6 border-2 border-green-500">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-7 h-7 text-green-400" />
            <h3 className="text-xl md:text-2xl font-black text-green-400">LIVE BOT LOGS</h3>
          </div>
          <div className="bg-black/80 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs md:text-sm text-gray-300">
            {data.logs?.length > 0 ? (
              data.logs.map((log: string, i: number) => (
                <div key={i} className="py-1 border-b border-gray-800">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">Scanning for elite setups...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Rockets */}
        {data.rockets && data.rockets[0] !== "Scanning Elite Setups..." && (
          <div className="bg-black/60 rounded-2xl p-6 border-2 border-yellow-500">
            <h3 className="text-xl md:text-2xl font-black text-center text-yellow-400 mb-5">ELITE ROCKETS FIRED</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.rockets.map((rocket: string, i: number) => {
                const [symbol, gain, pattern = ""] = rocket.split(' ');
                const cleanPattern = pattern?.replace(/[[\]]/g, '') || "";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-800 to-pink-800 rounded-xl p-4 text-center border border-yellow-500">
                    <p className="text-lg md:text-2xl font-black">{symbol}</p>
                    <p className="text-base md:text-xl text-green-400">{gain}</p>
                    {cleanPattern && <p className="text-xs text-cyan-300 mt-1">{cleanPattern}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Force Scan */}
        <div className="text-center pt-6">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-20 py-10 md:px-28 md:py-12 text-2xl md:text-4xl font-black rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all shadow-2xl border-4 md:border-6 border-purple-400 flex items-center gap-6 mx-auto disabled:opacity-60"
          >
            <RefreshCw className={`w-12 h-12 md:w-16 md:h-16 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>

      </main>
    </div>
  );
}