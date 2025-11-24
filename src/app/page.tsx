'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Package, TrendingUp } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  const URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const [b, p] = await Promise.all([axios.get(URL), axios.get(URL + "/performance")]);
      setData({ ...b.data, perf: p.data });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); const i = setInterval(fetch, 10000); return () => clearInterval(i); }, []);

  const scan = async () => {
    setScanning(true);
    await axios.post(`${URL}/scan`).catch(() => {});
    setScanning(false);
    setTimeout(fetch, 1500);
  };

  // Equity Curve
  useEffect(() => {
    const c = canvas.current;
    if (!c || !data.perf?.recent?.length) return;
    const ctx = c.getContext('2d')!;
    const pts = data.perf.recent;
    const min = Math.min(...pts.map((p: any) => p.equity));
    const max = Math.max(...pts.map((p: any) => p.equity));
    const range = max - min || 1;

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    pts.forEach((p: any, i: number) => {
      const x = (i / (pts.length - 1)) * c.width;
      const y = c.height - ((p.equity - min) / range) * c.height * 0.85 + 30;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data.perf?.recent]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="w-32 h-32 text-purple-500 animate-spin" /></div>;

  const unreal = data.unrealized >= 0 ? `+$${Math.abs(data.unrealized).toFixed(0)}` : `–$${Math.abs(data.unrealized).toFixed(0)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white">
      <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b-4 border-purple-600">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AlphaStream v100
          </h1>
          <span className="px-8 py-3 rounded-full text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-600">
            {data.mode} MODE
          </span>
        </div>
      </header>

      <main className="pt-28 px-6 max-w-5xl mx-auto space-y-8">
        <h2 className="text-6xl font-black text-center bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          ELITE SNIPER
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-2xl p-6 text-center border-2 border-purple-500">
            <p className="text-4xl font-black">${Number(data.equity || 100000).toLocaleString()}</p>
            <p className="text-gray-300">Equity</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 text-center border-2 border-green-500">
            <TrendingUp className="w-14 h-14 mx-auto text-green-400 mb-1" />
            <p className={`text-4xl font-black ${data.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>{unreal}</p>
            <p className="text-gray-300">Unrealized</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 text-center border-2 border-yellow-500">
            <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-1" />
            <p className="text-5xl font-black text-yellow-400">{data.perf?.stats?.winRate || "0.0"}%</p>
            <p className="text-gray-300">Win Rate</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 text-center border-2 border-orange-500">
            <Package className="w-16 h-16 mx-auto text-orange-400 mb-1" />
            <p className="text-5xl font-black text-orange-300">{data.positions || 0}</p>
            <p className="text-gray-300">Positions</p>
          </div>
        </div>

        <div className="bg-black/60 rounded-3xl p-8 border-4 border-cyan-500">
          <h3 className="text-3xl font-black text-center text-cyan-400 mb-4">LIVE EQUITY CURVE</h3>
          <canvas ref={canvas} width={1000} height={280} className="w-full rounded-xl" />
        </div>

        {data.rockets?.length > 0 && (
          <div className="bg-black/60 rounded-3xl p-8 border-4 border-yellow-500">
            <h3 className="text-3xl font-black text-center text-yellow-400 mb-4">ELITE ROCKETS</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {data.rockets.map((r: string, i: number) => (
                <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black">{r.split(' ')[0]}</p>
                  <p className="text-xl text-green-400">{r.split(' ')[1]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-6">
          <button
            onClick={scan}
            disabled={scanning}
            className="px-32 py-12 text-5xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all shadow-2xl border-8 border-purple-400 flex items-center gap-10 mx-auto"
          >
            <RefreshCw className={`w-20 h-20 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING" : "FORCE SCAN"}
          </button>
        </div>
      </main>
    </div>
  );
}
