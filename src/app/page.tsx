'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Brain, Zap, TrendingUp, Shield } from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  const fetch = async () => {
    try {
      const res = await axios.get(CORE_URL);
      setCore(res.data);
    } catch {}
    try {
      const res = await axios.get(`${ML_URL}/insights`);
      setML(res.data);
    } catch {}
  };

  const forceScan = async () => {
    setScanning(true);
    await axios.post(`${CORE_URL}/scan`).catch(() => {});
    setTimeout(() => {
      fetch();
      setScanning(false);
    }, 2000);
  };

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 8000);
    return () => clearInterval(id);
  }, []);

  if (!core) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const equity = core.equity ? `$${parseFloat(core.equity).toLocaleString()}` : "$0";
  const positions = core.positionsList || [];
  const rockets = core.rockets || [];
  const heal = core.healMode || ml?.healMode;

  return (
    <div className="min-h-screen bg-black text-gray-300 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-cyan-400">AlphaStream</h1>
          <div className="text-sm flex items-center gap-2">
            {heal && <Shield className="w-4 h-4 text-orange-400" />}
            <span className={heal ? "text-orange-400" : "text-green-400"}>
              {heal ? "HEAL MODE" : "LIVE"}
            </span>
            • {core.timeET}
          </div>
        </div>
        <button
          onClick={forceScan}
          disabled={scanning}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded flex items-center gap-2 text-black font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? "SCANNING" : "SCAN"}
        </button>
      </div>

      {/* Equity */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4 text-center">
        <div className="text-sm text-gray-500">EQUITY</div>
        <div className="text-3xl font-bold text-cyan-400">{equity}</div>
        <div className="text-xs text-gray-500 mt-1">
          Drawdown: {core.drawdown || "0%"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900 rounded p-3 text-center">
          <Zap className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
          <div className="font-bold">{positions.length}/{core.maxPositions || 5}</div>
          <div className="text-xs text-gray-500">POS</div>
        </div>
        <div className="bg-gray-900 rounded p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto text-green-400 mb-1" />
          <div className="font-bold">{rockets.length}</div>
          <div className="text-xs text-gray-500">ROCKETS</div>
        </div>
        <div className="bg-gray-900 rounded p-3 text-center">
          <Brain className="w-5 h-5 mx-auto text-purple-400 mb-1" />
          <div className="font-bold">{ml?.trainingStep || 0}</div>
          <div className="text-xs text-gray-500">STEP</div>
        </div>
      </div>

      {/* Positions */}
      {positions.length > 0 ? (
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <div className="text-sm font-bold text-green-400 mb-2">POSITIONS</div>
          {positions.map((p: any) => (
            <div key={p.symbol} className="flex justify-between text-sm py-1">
              <span>{p.symbol} ×{p.qty}</span>
              <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-6 text-center text-gray-500 mb-4">
          No positions
        </div>
      )}

      {/* Rockets */}
      <div className="bg-gray-900 rounded-lg p-3 mb-4">
        <div className="text-sm font-bold text-yellow-400 mb-2">ROCKETS ({rockets.length})</div>
        <div className="flex flex-wrap gap-2">
          {rockets.length > 0 ? rockets.map((r: string) => (
            <span key={r} className="text-xs bg-yellow-900/50 px-2 py-1 rounded">
              {r}
            </span>
          )) : <span className="text-gray-500">None</span>}
        </div>
      </div>

      {/* ML Brain */}
      <div className="bg-gray-900 rounded-lg p-3">
        <div className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4" /> NEURO BRAIN
        </div>
        {ml ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Gap: <span className="text-cyan-400">{ml.gapThreshold}%</span></div>
            <div>Risk: <span className="text-yellow-400">{(ml.riskMultiplier*100).toFixed(1)}%</span></div>
            <div>Trail: <span className="text-orange-400">{(ml.trailPct*100).toFixed(1)}%</span></div>
            <div>Heal: <span className={ml.healMode ? "text-orange-400" : "text-gray-500"}>{ml.healMode ? "ON" : "OFF"}</span></div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">ML warming up...</div>
        )}
      </div>
    </div>
  );
}
