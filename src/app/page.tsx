// app/page.tsx — AlphaStream v10000 Dashboard (Vercel Safe)
'use client';
import { RefreshCw, Activity, Brain, Zap, TrendingUp, Cpu, Trophy, Flame } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // YOUR CLOUD RUN BOT URL — CHANGE THIS
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const [mainRes, statsRes] = await Promise.all([
        axios.get(`${BOT_URL}/`).catch(() => ({ data: {} })),
        axios.get(`${BOT_URL}/stats`).catch(() => ({ data: {} }))
      ]);
      setData(mainRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-16 h-16 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 border-b border-purple-700 px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AlphaStream v10000
            </h1>
          </div>
          <span className="px-6 py-2 rounded-full text-sm font-bold bg-emerald-600">
            PAPER MODE
          </span>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-3xl p-10 border border-purple-700">
          <div className="text-6xl font-black text-transparent bg-clip bg-gradient-to-r from-cyan-300 to-purple-400">
            {data.equity || "$100,000"}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6">
          <div className="bg-gray-900/80 rounded-2xl p-6 border border-purple-700 text-center">
            <TrendingUp className="w-10 h-10 mx-auto text-purple-400 mb-2" />
            <div className="text-4xl font-bold">{data.positions?.length || 0}</div>
            <div className="text-gray-500 text-sm">POS</div>
          </div>
          <div className="bg-gray-900/80 rounded-2xl p-6 border border-pink-700 text-center">
            <Zap className="w-10 h-10 mx-auto text-pink-400 mb-2" />
            <div className="text-4xl font-bold">{data.rockets?.length || 0}</div>
            <div className="text-gray-500 text-sm">ROCKETS</div>
          </div>
          {/* Add more stat cards as needed */}
        </div>

        <div className="bg-black/90 rounded-3xl p-8 border-2 border-green-700">
          <h2 className="text-2xl font-bold text-green-400 text-center mb-6">NEURO LOGS</h2>
          <div className="bg-black/80 rounded-2xl p-6 h-96 overflow-y-auto font-mono text-sm">
            {data.logs?.slice(-40).map((log: string, i: number) => (
              <div key={i} className="py-2 border-b border-gray-800 last:border-0 text-gray-300">
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-10">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-40 py-8 text-3xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition-all disabled:opacity-50 border-4 border-purple-800"
          >
            <RefreshCw className={`inline w-12 h-12 mr-6 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "HUNTING..." : "FORCE HUNT"}
          </button>
        </div>
      </main>
    </div>
  );
}
