'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Brain } from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);
  const [mlError, setMLError] = useState(false);

  // Fetch Core & ML data
  useEffect(() => {
    const load = async () => {
      // Always fetch core
      try {
        const c = await axios.get(CORE_URL, { timeout: 10000 });
        setCore(c.data);
      } catch (e) {
        console.error("Core fetch failed", e);
        setCore(null);
      }

      // Try fetching ML, but don't block
      try {
        const m = await axios.get(`${ML_URL}/insights`, { timeout: 10000 });
        setML(m.data);
        setMLError(false);
      } catch (e) {
        console.warn("ML fetch failed", e);
        setML(null);
        setMLError(true);
      }
    };

    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!core) {
    return (
      <div className="bg-black text-gray-500 p-6 min-h-screen flex items-center justify-center">
        Connecting to Core…
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-gray-300 p-4 text-sm">

      {/* ML Drift Alert */}
      {ml?.driftDetected && (
        <div className="bg-red-900/60 border border-red-500 p-2 rounded mb-3 text-center text-xs">
          ⚠ ML PERFORMANCE DEGRADING — RISK REDUCED
        </div>
      )}

      {/* ML Offline */}
      {mlError && (
        <div className="bg-gray-900/40 border border-gray-600 p-2 rounded mb-3 text-center text-xs text-gray-400">
          ⚠ ML Offline
        </div>
      )}

      {/* ML Confidence Bar */}
      <div className="bg-gray-900 p-3 rounded mb-3">
        <div className="flex justify-between">
          <span>ML Confidence</span>
          <span className="text-cyan-400">{ml?.confidence ?? "—"}%</span>
        </div>
        <div className="h-2 bg-black rounded mt-1">
          <div
            className={`h-2 rounded ${
              ml?.confidence < 30 ? "bg-red-500" :
              ml?.confidence < 70 ? "bg-yellow-400" :
              "bg-green-400"
            }`}
            style={{ width: `${ml?.confidence ?? 0}%` }}
          />
        </div>
      </div>

      {/* Positions from Core */}
      <div className="bg-gray-900 p-3 rounded">
        <div className="font-bold mb-2 flex items-center gap-1">
          <Brain className="w-4 h-4 text-purple-400" /> POSITIONS
        </div>
        {core.positionsList?.length ? (
          core.positionsList.map((p: any) => (
            <div key={p.symbol} className="flex justify-between text-xs py-1 border-b border-gray-800 last:border-b-0">
              <span>{p.symbol} ×{p.qty}</span>
              <span className={p.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}%
              </span>
              <span className="text-purple-400 ml-2">
                ML {p.mlConviction ?? "—"}%
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center py-2">No positions</div>
        )}
      </div>

      {/* Heal Mode Indicator */}
      {core.healMode && (
        <div className="bg-orange-900/60 border border-orange-500 p-2 rounded mt-3 text-center text-xs text-orange-400">
          🛡 HEAL MODE ACTIVE
        </div>
      )}

    </div>
  );
}
