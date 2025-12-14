'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RefreshCw, Brain, Zap, TrendingUp, Shield,
  Terminal, AlertTriangle, Play, X
} from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL   = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [scan, setScan] = useState<any>(null);
  const [chartPos, setChartPos] = useState<any>(null);

  const [coreError, setCoreError] = useState(false);
  const [mlError, setMLError] = useState(false);

  /* ---------- DATA BUFFERS ---------- */
  const [pnlHistory, setPnlHistory] = useState<Record<string, number[]>>({});

  /* ---------- FETCHERS ---------- */
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
      const pos = res.data || [];
      setPositions(pos);

      setPnlHistory(prev => {
        const next = { ...prev };
        pos.forEach((p: any) => {
          next[p.symbol] = [...(next[p.symbol] || []), p.pnl].slice(-60);
        });
        return next;
      });
    } catch {}
  };

  const fetchScan = async () => {
    try {
      const res = await axios.get(`${CORE_URL}/scan-progress`);
      setScan(res.data);
    } catch {}
  };

  const fetchML = async () => {
    try {
      const res = await axios.get(`${ML_URL}/insights`);
      setML(res.data);
      setMLError(false);
    } catch {
      setMLError(true);
    }
  };

  /* ---------- ACTIONS ---------- */
  const panic = () => axios.post(`${CORE_URL}/panic`).catch(() => {});
  const resume = () => axios.post(`${CORE_URL}/resume`).catch(() => {});
  const scanNow = () => axios.post(`${CORE_URL}/scan`).catch(() => {});

  /* ---------- EFFECT ---------- */
  useEffect(() => {
    fetchCore();
    fetchPositions();
    fetchScan();
    fetchML();

    const i1 = setInterval(fetchCore, 8000);
    const i2 = setInterval(fetchPositions, 5000);
    const i3 = setInterval(fetchScan, 2000);
    const i4 = setInterval(fetchML, 20000);

    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); clearInterval(i4); };
  }, []);

  if (!core && !coreError) return <Loader />;
  if (coreError) return <Offline retry={fetchCore} />;

  /* ---------- DERIVED ---------- */
  const heal = core.healMode || ml?.healMode;
  const equity = `$${Number(core.equity || 0).toLocaleString()}`;
  const losses = core.dailyLossesToday || 0;

  const mlConfidence = ml
    ? Math.min(
        100,
        Math.floor(
          (ml.trainingStep / 30000) * 50 +
          (ml.bufferSize / 5000) * 30 +
          (ml.healMode ? -20 : 20)
        )
      )
    : 0;

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-black text-gray-300 p-3 text-sm">

      {/* HEADER */}
      <Header heal={heal} core={core} mlError={mlError}
        scanNow={scanNow} panic={panic} resume={resume}
        breaker={losses >= 4} />

      {/* LOSS ALERT */}
      {losses >= 3 && (
        <div className={`mb-3 p-2 rounded text-xs text-center ${
          losses >= 4 ? "bg-red-800 text-white" : "bg-yellow-700 text-black"
        }`}>
          {losses >= 4
            ? "DAILY CIRCUIT BREAKER ACTIVE — Trading Halted"
            : `WARNING: ${losses}/4 losses today`}
        </div>
      )}

      {/* SCAN PROGRESS */}
      {scan?.active && <ScanBar scan={scan} />}

      {/* EQUITY */}
      <Equity equity={equity} drawdown={core.drawdown} />

      {/* STATS */}
      <Stats core={core} positions={positions} ml={ml} />

      {/* ML CONFIDENCE */}
      <MLConfidence value={mlConfidence} />

      {/* POSITIONS */}
      <Panel title="POSITIONS" color="text-green-400">
        {positions.length ? positions.map(p => (
          <div
            key={p.symbol}
            onClick={() => setChartPos(p)}
            className="flex justify-between py-1 cursor-pointer hover:bg-gray-800 px-1 rounded"
          >
            <span>{p.symbol} ×{p.qty}</span>
            <span className={p.pnl >= 0 ? "text-green-400" : "text-red-400"}>
              {p.pnl.toFixed(2)}
            </span>
          </div>
        )) : <Empty>No positions</Empty>}
      </Panel>

      {/* LOGS */}
      <Panel title="LIVE LOGS" color="text-cyan-400">
        <div className="font-mono text-[10px] max-h-48 overflow-y-auto">
          {core.logs?.slice(-40).map((l: string, i: number) =>
            <div key={i} className="text-gray-500">{l}</div>
          )}
        </div>
      </Panel>

      {/* MODAL */}
      {chartPos && (
        <ChartModal
          pos={chartPos}
          history={pnlHistory[chartPos.symbol] || []}
          onClose={() => setChartPos(null)}
        />
      )}
    </div>
  );
}

/* ===================== COMPONENTS ===================== */

const Loader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
    Connecting to AlphaStream…
  </div>
);

const Offline = ({ retry }: any) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-400">
    <div className="text-xl mb-3">Core Offline</div>
    <button onClick={retry} className="px-4 py-2 bg-red-600 rounded text-white">
      Retry
    </button>
  </div>
);

const Header = ({ heal, core, mlError, scanNow, panic, resume, breaker }: any) => (
  <div className="flex justify-between items-center mb-3">
    <div>
      <h1 className="text-lg font-bold text-cyan-400">AlphaStream</h1>
      <div className="text-xs flex gap-2">
        {heal && <Shield className="w-3 h-3 text-orange-400" />}
        <span className={heal ? "text-orange-400" : "text-green-400"}>
          {heal ? "HEAL MODE" : "LIVE"}
        </span>
        • {core.timeET}
        {mlError && <span className="text-red-400">ML Offline</span>}
      </div>
    </div>

    <div className="flex gap-2">
      <Btn onClick={scanNow} icon={<RefreshCw className="w-3 h-3" />} text="SCAN" />
      <Btn onClick={panic} disabled={breaker}
        icon={<AlertTriangle className="w-3 h-3" />} text="PANIC" red />
      <Btn onClick={resume} icon={<Play className="w-3 h-3" />} text="RESUME" green />
    </div>
  </div>
);

const Btn = ({ onClick, icon, text, red, green, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 rounded flex gap-1 items-center text-xs font-bold
      ${red ? "bg-red-600 text-white" :
      green ? "bg-green-600 text-black" :
      "bg-cyan-600 text-black"}
      ${disabled && "opacity-40"}`}
  >
    {icon}{text}
  </button>
);

const ScanBar = ({ scan }: any) => (
  <div className="bg-gray-900 rounded p-2 mb-3">
    <div className="text-xs mb-1">
      Scanning {scan.symbol} ({scan.current}/{scan.total})
    </div>
    <div className="w-full bg-gray-800 h-2 rounded">
      <div className="bg-cyan-500 h-2 rounded"
        style={{ width: `${(scan.current / scan.total) * 100}%` }} />
    </div>
  </div>
);

const Equity = ({ equity, drawdown }: any) => (
  <div className="bg-gray-900 rounded p-3 text-center mb-3">
    <div className="text-xs text-gray-500">EQUITY</div>
    <div className="text-2xl font-bold text-cyan-400">{equity}</div>
    <div className="text-[10px] text-gray-500">Drawdown: {drawdown}</div>
  </div>
);

const Stats = ({ core, positions, ml }: any) => (
  <div className="grid grid-cols-4 gap-2 mb-3">
    <Stat icon={<Zap />} value={`${positions.length}/${core.maxPositions}`} label="POS" />
    <Stat icon={<TrendingUp />} value={core.rockets?.length || 0} label="ROCKETS" />
    <Stat icon={<Brain />} value={ml?.trainingStep ?? "—"} label="ML STEP" />
    <Stat icon={<Terminal />} value={`${(core.config?.riskPerTrade * 100).toFixed(1)}%`} label="RISK" />
  </div>
);

const MLConfidence = ({ value }: any) => (
  <div className="bg-gray-900 rounded p-2 mb-3">
    <div className="text-xs mb-1">ML Confidence</div>
    <div className="w-full bg-gray-800 h-2 rounded">
      <div
        className={`h-2 rounded ${
          value < 40 ? "bg-red-500" :
          value < 70 ? "bg-yellow-400" :
          "bg-green-500"
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const ChartModal = ({ pos, history, onClose }: any) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div className="bg-gray-900 rounded p-4 w-80">
      <div className="flex justify-between mb-2">
        <div className="font-bold">{pos.symbol}</div>
        <X className="w-4 h-4 cursor-pointer" onClick={onClose} />
      </div>
      <div className="flex gap-1 h-24">
        {history.map((v: number, i: number) => (
          <div key={i}
            className={`w-1 ${v >= 0 ? "bg-green-400" : "bg-red-400"}`}
            style={{ height: `${Math.min(100, Math.abs(v) * 10)}%` }}
          />
        ))}
      </div>
      <div className="text-xs mt-2">PnL Sparkline</div>
    </div>
  </div>
);

const Stat = ({ icon, value, label }: any) => (
  <div className="bg-gray-900 rounded p-2 text-center">
    <div className="mx-auto mb-1">{icon}</div>
    <div className="font-bold">{value}</div>
    <div className="text-[10px] text-gray-500">{label}</div>
  </div>
);

const Panel = ({ title, children, color }: any) => (
  <div className="bg-gray-900 rounded p-2 mb-3">
    <div className={`text-xs font-bold mb-1 ${color}`}>{title}</div>
    {children}
  </div>
);

const Empty = ({ children }: any) => (
  <div className="text-gray-500 text-xs text-center py-2">{children}</div>
);
