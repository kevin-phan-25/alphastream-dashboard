'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Crown } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // THIS IS YOUR BOT — ROOT URL RETURNS FULL DATA
  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetch = async () => {
    try {
      const res = await axios.get(BOT_URL);
      setData(res.data);
    } catch (e) {
      console.log("Connecting...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 7000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const scan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setTimeout(() => setScanning(false), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  const isLive = data.mode === "LIVE";

  return (
    <div className="min-h-screen bg-black text-white font-mono text-sm">
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-4 py-2 flex justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <h1 className="font-bold text-purple-400">AlphaStream v505</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded text-xs font-bold ${isLive ? "bg-red-600" : "bg-emerald-600"}`}>
            {isLive ? "LIVE" : "PAPER"}
          </span>
          <span className="text-cyan-400 text-xs">{data.activeAccount || "Unknown"}</span>
        </div>
      </header>

      <main className="pt-14 px-4 max-w-xl mx-auto space-y-4 pb-24">
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-6 text-center border border-purple-700">
          <div className="text-4xl font-black">{data.equity || "$0"}</div>
          <div className={`text-2xl font-bold mt-2 ${data.unrealized?.includes('+') ? "text-green-400" : "text-red-400"}`}>
            {data.unrealized || "+$0"}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-gray-900/80 rounded-lg p-3 border border-purple-700">
            <div className="text-xl font-bold text-purple-400">{data.positions || 0}/3</div>
            <div className="text-xs text-gray-500">Pos</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-700">
            <div className="text-xl font-bold text-cyan-400">{data.rockets?.length || 0}</div>
            <div className="text-xs text-gray-500">Rockets</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-yellow-700">
            <div className="text-xl font-bold text-yellow-400">{data.winRate || "0.0"}%</div>
            <div className="text-xs text-gray-500">Win</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 border border-green-700">
            <div className="text-xl font-bold text-green-400">1:2.8</div>
            <div className="text-xs text-gray-500">RR</div>
          </div>
        </div>

        <div className="bg-black/90 rounded-xl p-4 border border-green-700">
          <h3 className="text-green-400 font-bold text-sm mb-2">LOGS</h3>
          <div className="bg-black/70 rounded p-3 h-64 overflow-y-auto text-xs font-mono text-gray-300">
            {data.logs?.length > 0 ? data.logs.map((l: string, i: number) => (
              <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">{l}</div>
            )) : <div className="text-gray-600">Waiting for signal...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="text-center pt-4">
  <button onClick={scan} disabled={scanning}
            className="px-12 py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition disabled:opacity-50">
            <RefreshCw className={`inline w-5 h-5 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING" : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-6 text-cyan-400 text-xs">
          ELITE PRINTING ACTIVE
        </div>
      </main>
    </div>
  );
}
