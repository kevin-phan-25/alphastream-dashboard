'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw,
  Brain,
  Zap,
  TrendingUp,
  Shield,
  Terminal,
  Settings
} from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 8000 });
      setCore(res.data);
      setError(null);
    } catch {
      setError("Core offline");
    }

    try {
      const res = await axios.get(`${ML_URL}/insights`, { timeout: 8000 });
      setML(res.data);
    } catch {
      setML(null);
    }
  };

  const forceScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 8000 });
    } catch {}
    setTimeout(() => {
      fetchAll();
      setScanning(false);
    }, 2500);
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 8000);
    return () => clearInterval(id);
  }, []);

  if (!core) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
        {error || "Loading AlphaStream..."}
      </div>
    );
  }

  const equity = `$${Number(core.equity || 0).toLocaleString()}`;
  const positions = core.positionsList || [];
  const rockets = core.rockets || [];
  const logs = core.logs || [];
  const heal = core.healMode || ml?.healMode;

  return (
    <div className="min-h-screen bg-black text-gray-300 p-3 text-sm">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-lg font-bold text-cyan-400">AlphaStream</h1>
          <div className="flex items-center gap-2 text-xs">
            {heal && <Shield className="w-3 h-3 text-orange-400" />}
            <span className={heal ? "text-orange-400" : "text-green-400"}>
              {heal ? "HEAL MODE" : "LIVE"}
            </span>
            • {core.timeET}
          </div>
        </div>

        <button
          onClick={forceScan}
          disabled={scanning}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded flex items-center gap-2 text-black font-bold text-xs"
        >
          <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? "SCANNING" : "SCAN"}
        </button>
      </div>

      {/* EQUITY */}
      <div className="bg-gray-900 rounded p-3 text-center mb-3">
        <div className="text-xs text-gray-500">EQUITY</div>
        <div className="text-2xl font-bold text-cyan-400">{equity}</div>
        <div className="text-[10px] text-gray-500">
          Drawdown: {core.drawdown}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Stat icon={<Zap className="w-4 h-4 text-yellow-400" />} value={`${positions.length}/${core.maxPositions}`} label="POS" />
        <Stat icon={<TrendingUp className="w-4 h-4 text-green-400" />} value={rockets.length} label="ROCKETS" />
        <Stat icon={<Brain className="w-4 h-4 text-purple-400" />} value={ml?.trainingStep || 0} label="ML STEP" />
        <Stat icon={<Settings className="w-4 h-4 text-cyan-400" />} value={`${(core.config?.riskPerTrade * 100).toFixed(1)}%`} label="RISK" />
      </div>

      {/* POSITIONS */}
      <Panel title="POSITIONS" color="text-green-400">
        {positions.length ? positions.map((p: any) => (
          <Row key={p.symbol}>
            <span>{p.symbol} ×{p.qty}</span>
            <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
              {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(1)}%
            </span>
          </Row>
        )) : <Empty>No positions</Empty>}
      </Panel>

      {/* ROCKETS */}
      <Panel title={`ROCKETS (${rockets.length})`} color="text-yellow-400">
        <div className="flex flex-wrap gap-1">
          {rockets.length ? rockets.map((r: string) => (
            <span key={r} className="bg-yellow-900/40 px-2 py-0.5 rounded text-[10px]">
              {r}
            </span>
          )) : <Empty>None</Empty>}
        </div>
      </Panel>

      {/* ML INSIGHTS */}
      <Panel title="NEURO BRAIN" color="text-purple-400" icon={<Brain className="w-3 h-3" />}>
        {ml ? (
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <div>Gap: <span className="text-cyan-400">{ml.gapThreshold}%</span></div>
            <div>Risk: <span className="text-yellow-400">{(ml.riskMultiplier * 100).toFixed(1)}%</span></div>
            <div>Trail: <span className="text-orange-400">{(ml.trailPct * 100).toFixed(1)}%</span></div>
            <div>Heal: <span className={ml.healMode ? "text-orange-400" : "text-gray-500"}>
              {ml.healMode ? "ON" : "OFF"}
            </span></div>
          </div>
        ) : (
          <Empty>ML warming up…</Empty>
        )}
      </Panel>

      {/* LOGS */}
      <Panel title="LIVE LOGS" color="text-cyan-400" icon={<Terminal className="w-3 h-3" />}>
        <div className="bg-black rounded p-2 text-[10px] font-mono max-h-48 overflow-y-auto space-y-1">
          {logs.length ? logs.map((l: string, i: number) => (
            <div key={i} className="text-gray-400">{l}</div>
          )) : <div className="text-gray-600">No logs yet</div>}
        </div>
      </Panel>

    </div>
  );
}

/* =======================
   UI HELPERS
======================= */
function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-gray-900 rounded p-2 text-center">
      <div className="mx-auto mb-0.5">{icon}</div>
      <div className="font-bold">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function Panel({ title, children, color, icon }: any) {
  return (
    <div className="bg-gray-900 rounded p-2 mb-3">
      <div className={`text-xs font-bold mb-1 flex items-center gap-1 ${color}`}>
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: any) {
  return <div className="flex justify-between py-0.5">{children}</div>;
}

function Empty({ children }: any) {
  return <div className="text-gray-500 text-xs text-center py-2">{children}</div>;
}
