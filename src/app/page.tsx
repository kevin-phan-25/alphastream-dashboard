'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [rockets, setRockets] = useState<any[]>([]);
  const [ml, setML] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [coreError, setCoreError] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  /* ==================== FETCH FUNCTIONS ==================== */
  const fetchCore = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 12000 });
      setCore(res.data);
      setRockets(res.data.rockets || []);
      setCoreError(false);
    } catch (err) {
      console.error("Core fetch failed", err);
      setCoreError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await axios.get(`${CORE_URL}`, { timeout: 8000 });
      const openPositions = (res.data.positionsList || []).map((p: any) => ({
        ...p,
        pnlPct: p.current && p.entry ? ((p.current - p.entry) / p.entry) * 100 : 0,
      }));
      setPositions(openPositions);
    } catch (err) {
      console.error("Positions fetch failed", err);
    }
  };

  const fetchML = async () => {
    try {
      const res = await axios.get(`${ML_URL}/insights`, { timeout: 10000 });
      setML(res.data);
    } catch (err) {
      console.error("ML fetch failed", err);
    }
  };

  const forceScan = async () => {
    setScanLoading(true);
    try {
      await axios.post(`${CORE_URL}/scan`, {}, { timeout: 20000 });
      await fetchCore();
      await fetchPositions();
    } catch (err) {
      console.error("Force scan failed", err);
    } finally {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    fetchCore();
    fetchPositions();
    fetchML();

    const intervals = [
      setInterval(fetchCore, 8000),
      setInterval(fetchPositions, 5000),
      setInterval(fetchML, 20000),
    ];

    return () => intervals.forEach(clearInterval);
  }, []);

  if (loading) return <Loader />;
  if (coreError) return <Offline retry={fetchCore} />;

  const equity = `$${Number(core.equity?.live || core.equity || 0).toLocaleString()}`;

  const mlConfidence = ml
    ? Math.min(
        100,
        Math.floor(
          ((ml.step || 0) / 500) * 40 +
          ((ml.bufferSize || 0) / 8000) * 30 +
          (ml.epsilon < 0.3 ? 20 : 10) +
          10
        )
      )
    : 0;

  const getSession = () => {
    const now = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" });
    const [h, m] = now.split(":").map(x => parseInt(x));
    if ((h >= 4 && h < 9) || (h === 9 && m <= 29)) return "PREMARKET";
    if ((h === 9 && m >= 30) || (h > 9 && h < 16)) return "MARKET";
    return "CLOSED";
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 p-3 text-xs">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-base font-bold text-cyan-400">AlphaStream</h1>
          <div className="text-2xs flex items-center gap-2 mt-1">
            <span className="text-green-400 font-bold">{getSession()}</span>
            <span>• {core.timeET || "--:--"}</span>
          </div>
        </div>

        <button
          onClick={forceScan}
          disabled={scanLoading}
          className="px-6 py-1.5 bg-cyan-600 rounded flex items-center gap-1.5 text-black font-bold text-2xs hover:bg-cyan-500 disabled:opacity-50 transition"
        >
          {scanLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {scanLoading ? "SCANNING" : "FORCE SCAN"}
        </button>
      </div>

      {/* EQUITY */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded p-2 text-center mb-3 border border-purple-700">
        <div className="text-2xs text-gray-400">LIVE ALPACA EQUITY</div>
        <div className="text-xl font-bold text-white mt-0.5">{equity}</div>
      </div>

      {/* ML CONFIDENCE GAUGE */}
      <div className="bg-gray-900 rounded p-3 mb-3 border border-purple-600">
        <div className="text-purple-400 font-bold text-center text-2xs mb-2">RAINBOW DQN CONFIDENCE</div>

        <div className="relative w-28 h-28 mx-auto">
          <svg viewBox="0 0 36 36" className="transform -rotate-90 w-full h-full">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5" />
            <defs>
              <linearGradient id="grad">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="2.5"
              strokeDasharray={`${mlConfidence} 100`}
              className="transition-all duration-1000"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-bold text-white">{mlConfidence}%</div>
            <div className="text-2xs text-gray-400 mt-0.5">
              {mlConfidence < 40 ? "LEARNING" : mlConfidence < 70 ? "CAUTIOUS" : "CONFIDENT"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-2xs">
          <div><span className="text-gray-500">Epsilon:</span> <span className="font-bold text-cyan-400">{ml?.epsilon?.toFixed(3) ?? "—"}</span></div>
          <div><span className="text-gray-500">Step:</span> <span className="font-bold text-yellow-400">{ml?.step || 0}</span></div>
          <div><span className="text-gray-500">Buffer:</span> <span className="font-bold text-green-400">{ml?.bufferSize || 0}</span></div>
          <div><span className="text-gray-500">Last Train:</span> <span className="font-bold text-purple-400">{ml?.lastTrained ? new Date(ml.lastTrained).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}</span></div>
        </div>
      </div>

      {/* ROCKET ALERTS */}
      <Panel title="TOP ROCKETS" color="text-yellow-400">
        {rockets.length > 0 ? (
          <div className="space-y-1 text-2xs">
            {rockets.map((r: any, i: number) => (
              <div key={i} className="flex justify-between py-1 border-b border-gray-800">
                <span className="font-bold">{r.symbol || r}</span>
                <span className="text-gray-400">{r.gap ? `${r.gap.toFixed(1)}%` : ""}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-2 text-2xs">No gap alerts</div>
        )}
      </Panel>

      {/* POSITIONS */}
      <Panel title="LIVE POSITIONS" color="text-green-400">
        {positions.length > 0 ? (
          <div className="space-y-1 text-2xs">
            {positions.map((p: any) => (
              <div key={p.symbol} className="flex justify-between py-1 border-b border-gray-800">
                <span className="font-bold">{p.symbol} ×{p.qty}</span>
                <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                  {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4 text-2xs">No open positions</div>
        )}
      </Panel>

      {/* LOGS */}
      <Panel title="LIVE LOGS" color="text-cyan-400">
        <div className="font-mono text-2xs max-h-48 overflow-y-auto space-y-0.5 bg-black/50 p-2 rounded">
          {core.logs?.slice(-20).map((log: string, i: number) => (
            <div key={i} className="text-gray-400">{log}</div>
          )) || <div className="text-gray-600 text-center py-6">Waiting for activity...</div>}
        </div>
      </Panel>
    </div>
  );
}

/* ==================== COMPONENTS ==================== */
const Loader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
  </div>
);

const Offline = ({ retry }: { retry: () => void }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-400">
    <AlertTriangle className="w-12 h-12 mb-4" />
    <div className="text-lg mb-4">Bot Offline</div>
    <button onClick={retry} className="px-5 py-2 bg-red-600 rounded text-white text-sm font-bold">
      Retry
    </button>
  </div>
);

const Panel = ({ title, children, color }: any) => (
  <div className="bg-gray-900 rounded p-3 mb-3 border border-gray-800">
    <div className={`text-xs font-bold mb-2 ${color}`}>{title}</div>
    {children}
  </div>
);
