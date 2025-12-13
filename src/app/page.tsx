'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Brain,
  Zap,
  RefreshCw,
  TrendingUp,
  Shield,
  Activity,
  DollarSign,
  Package
} from 'lucide-react';

// Use your actual deployed Core URL
const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [coreData, setCoreData] = useState<any>(null);
  const [mlData, setMLData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCore = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 10000 });
      setCoreData(res.data);
      setError(null);
    } catch (err) {
      setError("Core offline");
    }
  };

  const fetchML = async () => {
    if (!ML_URL) return;
    try {
      const res = await axios.get(`${ML_URL}/insights`, { timeout: 10000 });
      setMLData(res.data);
    } catch (err) {
      // ML may be cold — silent fail
    }
  };

  const forceScan = async () => {
    setLoading(true);
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 15000 });
      setTimeout(() => {
        fetchCore();
        setLoading(false);
      }, 2000);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCore();
    fetchML();

    const coreInterval = setInterval(fetchCore, 8000);
    const mlInterval = setInterval(fetchML, 20000);

    return () => {
      clearInterval(coreInterval);
      clearInterval(mlInterval);
    };
  }, []);

  if (!coreData) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center text-xl">
        Loading AlphaStream...
      </div>
    );
  }

  const equity = coreData.equity ? parseFloat(coreData.equity).toLocaleString() : "0";
  const peak = coreData.peakEquity ? parseFloat(coreData.peakEquity).toLocaleString() : equity;
  const drawdown = coreData.drawdown || "0.0%";
  const positions = coreData.positionsList || [];
  const rockets = coreData.rockets || [];
  const healMode = coreData.healMode || mlData?.healMode || false;

  return (
    <div className="min-h-screen bg-black text-gray-200 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              AlphaStream v300000
            </h1>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
              {healMode ? (
                <span className="text-orange-400 flex items-center gap-1">
                  <Shield className="w-4 h-4" /> HEAL MODE
                </span>
              ) : (
                <span className="text-green-400">TRADING LIVE</span>
              )}
              • {coreData.timeET}
            </div>
          </div>
        </div>
        <button
          onClick={forceScan}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-lg font-bold text-black shadow-lg disabled:opacity-60 transition"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "SCANNING..." : "FORCE SCAN"}
        </button>
      </div>

      {/* Equity Hero */}
      <div className="bg-gradient-to-r from-purple-900/30 via-black to-cyan-900/30 rounded-2xl p-6 mb-6 border border-purple-600/50">
        <div className="text-center">
          <div className="text-gray-400 mb-2">LIVE ALPACA EQUITY</div>
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            ${equity}
          </div>
          <div className="text-sm text-gray-500 mt-3">
            Peak: ${peak} • Drawdown: <span className="text-orange-400">{drawdown}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<DollarSign />} label="Positions" value={`${positions.length}/${coreData.maxPositions || 5}`} />
        <StatCard icon={<Zap />} label="Rockets Found" value={rockets.length} color="text-yellow-400" />
        <StatCard icon={<TrendingUp />} label="Config Gap" value={`${coreData.config?.minGapPct || 20}%`} />
        <StatCard icon={<Package />} label="Risk/Trade" value={`${(coreData.config?.riskPerTrade * 100 || 2).toFixed(1)}%`} />
      </div>

      {/* Positions List */}
      {positions.length > 0 ? (
        <Panel title="Live Positions">
          <div className="space-y-2">
            {positions.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-gray-900/50 rounded-lg p-3">
                <div>
                  <span className="font-bold text-cyan-400">{p.symbol}</span>
                  <span className="text-gray-500 ml-2">×{p.qty}</span>
                </div>
                <div className={`font-bold ${p.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct?.toFixed(1) || '0.0'}%
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel title="Positions">
          <div className="text-center text-gray-500 py-8">No open positions</div>
        </Panel>
      )}

      {/* Rockets */}
      <Panel title={`Rockets Detected (${rockets.length})`}>
        {rockets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {rockets.map((r: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full text-black font-bold text-xs">
                {r}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">Waiting for gappers...</div>
        )}
      </Panel>

      {/* ML Brain */}
      <Panel title="NeuroSelf Brain (Rainbow DQN)" icon={<Brain className="w-5 h-5 text-purple-400 animate-pulse" />}>
        {mlData ? (
          <div className="grid grid-cols-2 gap-4">
            <Insight label="Gap Threshold" value={`${mlData.gapThreshold}%`} />
            <Insight label="Risk Multiplier" value={`${(mlData.riskMultiplier * 100).toFixed(2)}%`} />
            <Insight label="Trail %" value={`${(mlData.trailPct * 100).toFixed(1)}%`} />
            <Insight label="Heal Mode" value={mlData.healMode ? "ON" : "OFF"} color={mlData.healMode ? "text-orange-400" : "text-gray-500"} />
            <div className="col-span-2 text-center text-purple-400 font-bold">
              Training Step: {mlData.trainingStep?.toLocaleString() || 0}
            </div>
            <div className="col-span-2 text-center text-xs text-gray-500">
              Buffer: {mlData.bufferSize?.toLocaleString() || 0} experiences
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6">
            ML brain warming up... (cold start)
          </div>
        )}
      </Panel>

      {/* Logs */}
      <Panel title="Live Logs">
        <div className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto bg-black/50 rounded p-3">
          {coreData.logs?.slice(-20).reverse().map((log: string, i: number) => {
            const text = log.split("] ")[1] || log;
            let color = "text-gray-500";
            if (text.includes("ENTRY")) color = "text-cyan-400 font-bold";
            if (text.includes("SELL") || text.includes("FLATTEN")) color = "text-green-400";
            if (text.includes("TRAILING") || text.includes("PARTIAL")) color = "text-yellow-400";
            if (text.includes("error") || text.includes("failed")) color = "text-red-400";
            if (text.includes("ML") || text.includes("insights")) color = "text-purple-400";
            return <div key={i} className={color}>{text}</div>;
          }) || <div className="text-center text-gray-600">No logs yet</div>}
        </div>
      </Panel>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 mt-8">
        Intraday Momentum • AMEX/NASDAQ/NYSE Only • Kelly Sizing • Partial Profits • Self-Learning DQN
      </div>
    </div>
  );
}

// UI Components
function StatCard({ icon, label, value, color = "text-cyan-400" }: any) {
  return (
    <div className="bg-gray-900/70 rounded-xl p-4 text-center border border-gray-800">
      <div className={`w-8 h-8 mx-auto mb-2 ${color}`}>{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Insight({ label, value, color = "text-cyan-400" }: any) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: any) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-3 text-purple-400 font-bold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
