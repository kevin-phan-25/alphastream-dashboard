'use client';
import { RefreshCw, Brain, Zap, Shield, TrendingUp, Rocket, AlertCircle } from 'lucide-react';
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
      const res = await axios.get(BOT_URL, { timeout: 12000 });
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError("Bot offline — retrying...");
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
    try { await axios.post(`${BOT_URL}/scan`, {}, { timeout: 10000 }); } catch {}
    setTimeout(() => setScanning(false), 2000);
  };

  const liveEquity = data.equity ? `$${parseFloat(data.equity).toLocaleString()}` : "$0";
  const positions = data.positionsList || [];
  const rockets = data.rockets || [];
  const config = data.config || {};
  const healMode = data.healMode || false;
  const totalTrades = data.stats?.totalTrades || 0;
  const winningTrades = data.stats?.winningTrades || 0;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "—";
  const drawdown = data.drawdown || "0.0%";

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Crisp gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-gray-900/5 to-cyan-900/10" />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-gray-900/95 px-4 py-3 z-50 border-b border-purple-600/30">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-400 animate-pulse-soft" />
            <h1 className="text-lg font-bold text-purple-300">AlphaStream v300000</h1>
          </div>
          <div className="flex items-center gap-4">
            {healMode && <Shield className="w-6 h-6 text-orange-400 animate-pulse-soft" />}
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${error ? 'bg-red-600/60' : healMode ? 'bg-orange-600/60' : 'bg-green-600/60'}`}>
              {error ? "OFFLINE" : healMode ? "HEAL" : "LIVE"}
            </span>
            <span className="text-cyan-300 text-sm">{data.timeET || "--:-- ET"}</span>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-6 pb-20">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Equity */}
        <div className="bg-gray-800/70 rounded-2xl p-6 text-center border border-purple-600/30">
          <div className="text-sm text-gray-300 mb-1">LIVE EQUITY</div>
          <div className="text-4xl font-bold text-cyan-300 animate-pulse-soft">{liveEquity}</div>
          <div className="text-sm text-gray-300 mt-3">
            Drawdown: <span className="text-orange-400">{drawdown}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800/70 rounded-xl p-4 text-center border border-purple-600/30">
            <Zap className="w-7 h-7 mx-auto text-purple-400 mb-2 animate-pulse-soft" />
            <div className="text-xl font-bold">{positions.length}/{config.maxPositions || 5}</div>
            <div className="text-xs text-gray-300">POS</div>
          </div>
          <div className="bg-gray-800/70 rounded-xl p-4 text-center border border-cyan-600/30">
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(Math.min(rockets.length, 4))].map((_, i) => (
                <Rocket key={i} className="w-6 h-6 text-cyan-400 animate-float-subtle" style={{ animationDelay: `${i*0.3}s` }} />
              ))}
            </div>
            <div className="text-xl font-bold">{rockets.length}</div>
            <div className="text-xs text-gray-300">ROCKETS</div>
          </div>
          <div className="bg-gray-800/70 rounded-xl p-4 text-center border border-green-600/30">
            <TrendingUp className="w-7 h-7 mx-auto text-green-400 mb-2 animate-pulse-soft" />
            <div className="text-xl font-bold text-green-400">{winRate}%</div>
            <div className="text-xs text-gray-300">WIN RATE</div>
          </div>
          <div className="bg-gray-800/70 rounded-xl p-4 text-center border border-yellow-600/30">
            <div className="text-xl font-bold">{totalTrades}</div>
            <div className="text-xs text-gray-300">TRADES</div>
          </div>
        </div>

        {/* Positions */}
        {positions.length > 0 ? (
          <div className="bg-gray-800/70 rounded-2xl p-4 border border-green-600/30">
            <div className="text-green-400 font-bold mb-3 text-center">POSITIONS</div>
            <div className="space-y-2">
              {positions.slice(0, 8).map((p: any, i: number) => (
                <div key={i} className="flex justify-between py-2 px-3 bg-gray-900/40 rounded-lg">
                  <span className="font-bold">{p.symbol} ×{p.qty}</span>
                  <span className={parseFloat(p.pnlPct || 0) >= 0 ? "text-green-400" : "text-red-400"}>
                    {parseFloat(p.pnlPct || 0) >= 0 ? "+" : ""}{parseFloat(p.pnlPct || 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-2xl p-8 text-center text-gray-400 border border-dashed border-gray-600">
            No open positions
          </div>
        )}

        {/* Brain Status */}
        <div className="bg-gray-800/70 rounded-2xl p-5 border border-purple-600/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-purple-400">NEURO BRAIN</span>
            <Brain className="w-8 h-8 text-purple-400 animate-pulse-soft" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>Risk: <span className="text-yellow-400 font-bold">{(config.riskPerTrade * 100).toFixed(1)}%</span></div>
            <div>Gap: <span className="text-cyan-400 font-bold">{config.minGapPct}%</span></div>
            <div>Trail: <span className="text-orange-400 font-bold">{(config.trailingStopPct * 100).toFixed(1)}%</span></div>
            <div>Heal: <span className={healMode ? "text-orange-400" : "text-gray-400"}>{healMode ? "ON" : "OFF"}</span></div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-green-700/30">
          <div className="text-green-400 font-bold mb-2 text-center">LIVE LOGS</div>
          <div className="bg-gray-900/40 rounded-lg p-3 h-32 overflow-y-auto font-mono text-xs">
            {data.logs?.slice(-12).map((log: string, i: number) => {
              const text = log.split("] ")[1] || log;
              let color = "text-gray-400";
              if (text.includes("ENTRY")) color = "text-cyan-400";
              if (text.includes("SELL") || text.includes("FLATTEN")) color = "text-green-400";
              if (text.includes("failed") || text.includes("error")) color = "text-red-400";
              if (text.includes("ML") || text.includes("insights")) color = "text-purple-400";
              return <div key={i} className={`py-0.5 ${color}`}>{text}</div>;
            }) || <div className="text-center text-gray-400 py-8">Waiting...</div>}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Force Scan */}
        <div className="text-center">
          <button
            onClick={forceScan}
            disabled={scanning || !!error}
            className="px-12 py-4 text-lg font-bold rounded-full bg-gradient-to-r from-purple-500/80 to-cyan-500/80 hover:from-purple-400 hover:to-cyan-400 transition-all duration-500 disabled:opacity-50 border border-purple-700/40 shadow-md"
          >
            <RefreshCw className={`inline w-6 h-6 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : error ? "OFFLINE" : "FORCE SCAN"}
          </button>
        </div>

        <div className="text-center py-4 text-purple-400 text-sm font-bold">
          v300000 • RAINBOW DQN • SELF-LEARNING TRADER
        </div>
      </main>

      {/* Animations */}
      <style jsx>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 3.5s ease-in-out infinite;
        }
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-float-subtle {
          animation: float-subtle 4.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
