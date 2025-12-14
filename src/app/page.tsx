'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw, Brain, Zap, TrendingUp,
  Shield, Terminal, AlertTriangle, Play
} from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL   = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [scan, setScan] = useState<any>(null);

  const [coreError, setCoreError] = useState(false);
  const [mlError, setMLError] = useState(false);

  /* ---------- CORE ---------- */
  const fetchCore = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 12000 });
      setCore(res.data);
      setCoreError(false);
    } catch {
      setCoreError(true);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await axios.get(`${CORE_URL}/positions`, { timeout: 8000 });
      setPositions(res.data || []);
    } catch {
      setPositions([]);
    }
  };

  const fetchScanProgress = async () => {
    try {
      const res = await axios.get(`${CORE_URL}/scan-progress`, { timeout: 5000 });
      setScan(res.data);
    } catch {
      setScan(null);
    }
  };

  /* ---------- ML ---------- */
  const fetchML = async () => {
    try {
      const res = await axios.get(`${ML_URL}/insights`, { timeout: 15000 });
      setML(res.data);
      setMLError(false);
    } catch {
      setMLError(true);
      setML(null);
    }
  };

  /* ---------- ACTIONS ---------- */
  const forceScan = async () => {
    await axios.post(`${CORE_URL}/scan`).catch(() => {});
  };

  const panic = async () => {
    await axios.post(`${CORE_URL}/panic`).catch(() => {});
    fetchCore();
  };

  const resume = async () => {
    await axios.post(`${CORE_URL}/resume`).catch(() => {});
    fetchCore();
  };

  /* ---------- EFFECT ---------- */
  useEffect(() => {
    fetchCore();
    fetchPositions();
    fetchScanProgress();
    fetchML();

    const i1 = setInterval(fetchCore, 8000);
    const i2 = setInterval(fetchPositions, 6000);
    const i3 = setInterval(fetchScanProgress, 2000);
    const i4 = setInterval(fetchML, 20000);

    return () => {
      clearInterval(i1); clearInterval(i2);
      clearInterval(i3); clearInterval(i4);
    };
  }, []);

  if (!core && !coreError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
        Connecting to AlphaStream…
      </div>
    );
  }

  if (coreError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-400">
        <div className="text-xl mb-3">Core Service Offline</div>
        <button onClick={fetchCore}
          className="px-4 py-2 bg-red-600 rounded text-white">
          Retry
        </button>
      </div>
    );
  }

  const heal = core.healMode || ml?.healMode;
  const equity = `$${Number(core.equity || 0).toLocaleString()}`;

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
            {mlError && <span className="text-red-400 ml-2">ML Offline</span>}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={forceScan}
            className="px-3 py-1.5 bg-cyan-600 rounded flex gap-1 text-black text-xs font-bold">
            <RefreshCw className={`w-3 h-3 ${scan?.active ? 'animate-spin' : ''}`} />
            SCAN
          </button>

          <button onClick={panic}
            className="px-3 py-1.5 bg-red-600 rounded text-xs font-bold text-white">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            PANIC
          </button>

          <button onClick={resume}
            className="px-3 py-1.5 bg-green-600 rounded text-xs font-bold text-black">
            <Play className="w-3 h-3 inline mr-1" />
            RESUME
          </button>
        </div>
      </div>

      {/* SCAN PROGRESS */}
      {scan?.active && (
        <div className="bg-gray-900 rounded p-2 mb-3">
          <div className="text-xs text-gray-400 mb-1">
            Scanning {scan.symbol} ({scan.current}/{scan.total})
          </div>
          <div className="w-full bg-gray-800 rounded h-2">
            <div
              className="bg-cyan-500 h-2 rounded"
              style={{ width: `${(scan.current / scan.total) * 100}%` }}
            />
          </div>
        </div>
      )}

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
        <Stat icon={<Zap className="w-4 h-4 text-yellow-400" />}
          value={`${positions.length}/${core.maxPositions}`} label="POS" />
        <Stat icon={<TrendingUp className="w-4 h-4 text-green-400" />}
          value={core.rockets?.length || 0} label="ROCKETS" />
        <Stat icon={<Brain className="w-4 h-4 text-purple-400" />}
          value={ml?.trainingStep ?? "—"} label="ML STEP" />
        <Stat icon={<Terminal className="w-4 h-4 text-cyan-400" />}
          value={`${((core.config?.riskPerTrade || 0) * 100).toFixed(1)}%`} label="RISK" />
      </div>

      {/* POSITIONS */}
      <Panel title="POSITIONS" color="text-green-400">
        {positions.length ? positions.map(p => (
          <Row key={p.symbol}>
            <span>{p.symbol} ×{p.qty}</span>
            <span className={p.pnl >= 0 ? "text-green-400" : "text-red-400"}>
              {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(2)}
            </span>
          </Row>
        )) : <Empty>No positions</Empty>}
      </Panel>

      {/* ML */}
      <Panel title="NEURO BRAIN" color="text-purple-400">
        {ml ? (
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <div>Gap: <span className="text-cyan-400">{ml.gapThreshold}%</span></div>
            <div>Risk: <span className="text-yellow-400">{(ml.riskMultiplier * 100).toFixed(1)}%</span></div>
            <div>Trail: <span className="text-orange-400">{(ml.trailPct * 100).toFixed(1)}%</span></div>
            <div>Heal: {ml.healMode ? "ON" : "OFF"}</div>
          </div>
        ) : <Empty>ML warming up…</Empty>}
      </Panel>

    </div>
  );
}

/* UI HELPERS */
function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-gray-900 rounded p-2 text-center">
      <div className="mx-auto mb-0.5">{icon}</div>
      <div className="font-bold">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function Panel({ title, children, color }: any) {
  return (
    <div className="bg-gray-900 rounded p-2 mb-3">
      <div className={`text-xs font-bold mb-1 ${color}`}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }: any) {
  return <div className="flex justify-between py-0.5 text-xs">{children}</div>;
}

function Empty({ children }: any) {
  return <div className="text-gray-500 text-xs text-center py-2">{children}</div>;
}
