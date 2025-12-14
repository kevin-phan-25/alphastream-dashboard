'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Brain, Shield } from 'lucide-react';

const CORE_URL = "https://alphastream-core-1017433009054.us-east1.run.app";
const ML_URL = "https://alphastream-ml-1017433009054.us-east1.run.app";

export default function Dashboard() {
  const [core, setCore] = useState<any>(null);
  const [ml, setML] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const c = await axios.get(CORE_URL);
      const m = await axios.get(`${ML_URL}/insights`);
      setCore(c.data);
      setML(m.data);
    };
    load();
    const i = setInterval(load, 8000);
    return () => clearInterval(i);
  }, []);

  if (!core) return <div className="bg-black text-gray-500 p-6">Loading…</div>;

  return (
    <div className="bg-black min-h-screen text-gray-300 p-4 text-sm">

      {ml?.driftDetected && (
        <div className="bg-red-900/60 border border-red-500 p-2 rounded mb-3 text-center text-xs">
          ⚠ ML PERFORMANCE DEGRADING — RISK REDUCED
        </div>
      )}

      <div className="bg-gray-900 p-3 rounded mb-3">
        <div className="flex justify-between">
          <span>ML Confidence</span>
          <span className="text-cyan-400">{ml?.confidence ?? 0}%</span>
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

      <div className="bg-gray-900 p-3 rounded">
        <div className="font-bold mb-2 flex items-center gap-1">
          <Brain className="w-4 h-4 text-purple-400" /> POSITIONS
        </div>
        {core.positionsList?.map((p: any) => (
          <div key={p.symbol} className="flex justify-between text-xs py-1">
            <span>{p.symbol}</span>
            <span className="text-purple-400">
              ML {p.mlConviction ?? "—"}%
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
