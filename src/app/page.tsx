'use client';

import { RefreshCw, Brain, Zap, Shield, Activity } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [data, setData] = useState<any>({});
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
    } catch (err) {
      console.error("Fetch failed:", err);
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
    setTimeout(() => setScanning(false), 2000);
  };

  const winRate = data.stats?.totalTrades
    ? ((data.stats.winningTrades || 0) / data.stats.totalTrades * 100).toFixed(1)
    : "—";

  const healActive = data.mlStatus?.healMode;

  return (
    <div className="min-h-screen bg-black text-white font-mono text-xs">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 bg-black/95 border-b border-purple-800 px-4 py-2 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-sm font-bold text-purple-300">AlphaStream v300000</h1>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            {healActive && <Shield className="w-4 h-4 text-orange-400 animate-pulse" title="Heal Mode Active" />}
            <span className={`px-2 py-0.5 rounded text-2xs font-bold ${healActive ? 'bg-orange-600' : data.status?.includes('TRADING') ? 'bg-green-600' : 'bg-gray-600'}`}>
              {healActive ? "HEAL MODE" : data.status || "LOADING"}
            </span>
            <span className="text-cyan-400 text-2xs">{data.timeET?.slice(11, 19) || "--:--"}</span>
          </div>
        </div>
      </header>

      <main className="pt-14 px-4 max-w-2xl mx-auto space-y-4 pb-20">
        {/* EQUITY */}
        <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl p-4 text-center border border-purple-700">
          <div className="text-2xl font-bold">{data.equity?.simulated || "$100,000"}</div>
          <div className="text-xs text-gray-400 mt-1">
            Live: {data.equity?.live || "N/A"} • Drawdown: {data.drawdown || "0%"}
          </div>
        </div>

        {/* CORE STATS GRID */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-900/80 rounded-lg p-3 text-center border border-purple-600">
            <Zap className="w-5 h-5 mx-auto text-purple-400 mb-1" />
            <div className="text-lg font-bold">{data.positionsOpen || 0}/{data.maxPositions || 5}</div>
            <div className="text-2xs text-gray-500">POSITIONS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 text-center border border-cyan-600">
            <TrendingUp className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <div className="text-lg font-bold">{data.rockets?.length || 0}</div>
            <div className="text-2xs text-gray-500">ROCKETS</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 text-center border border-green-600">
            <div className="text-lg font-bold text-green-400">{winRate}%</div>
            <div className="text-2xs text-gray-500">WIN RATE</div>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-3 text-center border border-yellow-600">
            <div className="text-lg font-bold">{data.stats?.totalTrades || 0}</div>
            <div className="text-2xs text-gray-500">TRADES</div>
          </div>
        </div>

        {/* DQN BRAIN STATUS */}
        <div className="bg-gray-900/90 rounded-xl p-3 border border-purple-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-400 font-bold text-2xs">NEUROSELF DQN BRAIN</span>
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-2xs">
            <div>ε: <span className="text-cyan-400 font-bold">{data.mlStatus?.dqnEpsilon || "1.000"}</span></div>
            <div>Step: <span className="text-yellow-400">{data.mlStatus?.dqnStep || 0}</span></div>
            <div>Sizer: <span className="text-green-400 font-bold">{data.mlStatus?.sizerMultiplier || "1.000"}</span></div>
            <div>Risk: <span className={healActive ? "text-orange-400" : "text-gray-400"}>{(data.config?.riskPerTrade * 100).toFixed(1)}%</span></div>
          </div>
        </div>

        {/* LIVE LOGS */}
        <div className="bg-black/90 rounded-xl p-3 border border-green-700">
          <div className="text-green-400 font-bold text-2xs mb-2 text-center">LIVE NEURO LOGS</div>
          <div className="bg-black/70 rounded p-2 h-32 overflow-y-auto text-2xs font-mono">
            {data.logs?.slice(-15).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              let color = "text-gray-500";
              if (text.includes("ENTRY")) color = "text-cyan-400 font-bold";
              if (text.includes("EXIT") || text.includes("SELL")) color = text.includes("HEAL") ? "text-orange-400" : "text-green-400";
              if (text.includes("STOP")) color = "text-red-400";
              if (text.includes("DQN") || text.includes("SELF-HEAL")) color = "text-purple-400 font-bold";

              return <div key={i} className={`py-0.5 ${color}`}>{text}</div>;
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* FORCE SCAN BUTTON */}
        <div className="text-center pt-4">
          <button
            onClick={forceScan}
            disabled={scanning}
            className="px-12 py-3 text-sm font-bold rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:scale-105 transition-all disabled:opacity-60 border-2 border-purple-800 shadow-xl"
          >
            <RefreshCw className={`inline w-5 h-5 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE NEURO SCAN"}
          </button>
        </div>

        <div className="text-center py-3 text-purple-400 text-2xs font-bold animate-pulse">
          v300000 • DQN SELF-LEARNING • SELF-HEALING • NEURO ADAPTIVE
        </div>
      </main>
    </div>
  );
}
