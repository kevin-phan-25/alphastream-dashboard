'use client';
import {
  RefreshCw, Brain, Zap, Shield, AlertCircle, TrendingUp, Rocket
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [data, setData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const BOT_URL = "https://alphastream-core-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(BOT_URL, { timeout: 10000 });
      setData(res.data);
      setError(null);
    } catch {
      setError("Bot offline — retrying...");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 9000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.logs]);

  const forceScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${BOT_URL}/scan`, {}, { timeout: 10000 });
    } catch {}
    setTimeout(() => setScanning(false), 1500);
  };

  const equity = data.equity
    ? `$${parseFloat(data.equity).toLocaleString()}`
    : "$0";

  const positions = data.positionsList || [];
  const rockets = data.rockets || [];
  const config = data.config || {};
  const healMode = data.healMode || false;

  const totalTrades = data.stats?.totalTrades || 0;
  const wins = data.stats?.winningTrades || 0;
  const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(1) : "—";

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700/5 via-black to-cyan-700/5 pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-gray-900/95 border-b border-purple-500/30 px-3 py-2 z-50">
        <div className="flex justify-between items-center max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-sm text-purple-300">
              AlphaStream
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {healMode && <Shield className="w-4 h-4 text-orange-400" />}
            <span className={`px-2 py-0.5 rounded-full font-bold
              ${error ? "bg-red-600" : healMode ? "bg-orange-600" : "bg-green-600"}`}>
              {error ? "OFFLINE" : healMode ? "HEAL" : "LIVE"}
            </span>
            <span className="text-cyan-300">{data.timeET || "--:-- ET"}</span>
          </div>
        </div>
      </header>

      <main className="pt-14 px-3 max-w-xl mx-auto space-y-4 pb-12 relative z-10">

        {error && (
          <div className="bg-red-900/40 border border-red-500/40 rounded-lg p-2 text-center text-xs">
            <AlertCircle className="w-4 h-4 mx-auto mb-1 text-red-400" />
            {error}
          </div>
        )}

        {/* Equity */}
        <div className="bg-gray-800/80 rounded-xl p-4 text-center border border-purple-500/30">
          <div className="text-xs text-gray-400">LIVE EQUITY</div>
          <div className="text-2xl font-bold text-cyan-300">{equity}</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <Stat icon={<Zap className="w-4 h-4" />} value={`${positions.length}/${config.maxPositions || 5}`} label="POS" />
          <Stat icon={<Rocket className="w-4 h-4" />} value={rockets.length} label="ROCKETS" />
          <Stat icon={<TrendingUp className="w-4 h-4" />} value={`${winRate}%`} label="WIN" />
          <Stat value={totalTrades} label="TRADES" />
        </div>

        {/* Positions */}
        <div className="bg-gray-800/80 rounded-xl p-3 border border-green-500/30">
          <div className="text-xs font-bold text-green-400 mb-2 text-center">
            POSITIONS
          </div>

          {positions.length ? (
            <div className="space-y-1 text-xs">
              {positions.slice(0, 6).map((p: any, i: number) => (
                <div key={i} className="flex justify-between bg-black/40 px-2 py-1 rounded">
                  <span>{p.symbol} ×{p.qty}</span>
                  <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                    {p.pnlPct?.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-xs py-3">
              No open positions
            </div>
          )}
        </div>

        {/* Brain */}
        <div className="bg-gray-800/80 rounded-xl p-3 border border-purple-500/30 text-xs">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-purple-400">NEURO BRAIN</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>Risk: <span className="text-yellow-400">{((config.riskPerTrade || 0) * 100).toFixed(1)}%</span></div>
            <div>Gap: <span className="text-cyan-400">{config.minGapPct || 0}%</span></div>
            <div>Trail: <span className="text-orange-400">{((config.trailingStopPct || 0) * 100).toFixed(1)}%</span></div>
            <div>Heal: <span className={healMode ? "text-orange-400" : "text-gray-500"}>{healMode ? "ON" : "OFF"}</span></div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-800/70 rounded-xl p-3 border border-green-600/30">
          <div className="text-xs font-bold text-green-400 text-center mb-1">LOGS</div>
          <div className="bg-black/40 rounded p-2 h-24 overflow-y-auto font-mono text-[10px]">
            {data.logs?.slice(-10).map((log: string, i: number) => (
              <div key={i} className="text-gray-400">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Force Scan */}
        <div className="text-center pt-2">
          <button
            onClick={forceScan}
            disabled={scanning || !!error}
            className="px-8 py-2 text-sm font-bold rounded-full
              bg-gradient-to-r from-purple-500 to-cyan-500
              hover:from-purple-400 hover:to-cyan-400
              disabled:opacity-50 shadow relative z-20"
          >
            <RefreshCw className={`inline w-4 h-4 mr-1 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "SCANNING" : error ? "OFFLINE" : "FORCE SCAN"}
          </button>
        </div>

      </main>
    </div>
  );
}

function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-gray-800/80 rounded-lg p-2 text-center border border-gray-700/40">
      {icon && <div className="flex justify-center text-purple-400 mb-1">{icon}</div>}
      <div className="font-bold">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}
