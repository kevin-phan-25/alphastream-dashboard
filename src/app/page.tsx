'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  RefreshCw,
  Zap,
  Activity,
  Loader2,
  Sun,
  Moon,
  AlertCircle,
  DollarSign,
  Wallet,
  Globe,
  Bot
} from 'lucide-react';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="h-24 flex items-center justify-center text-gray-500 text-xs">Loading...</div>
});

type Rocket = {
  symbol: string;
  gap: string;
  price: string;
  rvol: string;
  mlAction: number;
  mlPriority: boolean;
  mlConfidence: number;
};

export default function Dashboard() {
  const [core, setCore] = useState<any>({});
  const [equityHistory, setEquityHistory] = useState<{ time: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [liveRockets, setLiveRockets] = useState<Rocket[]>([]);
  const [flashRockets, setFlashRockets] = useState<Set<string>>(new Set());

  const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://alphastream-core-1017433009054.us-east1.run.app";

  const fetchData = async () => {
    try {
      const res = await axios.get(CORE_URL, { timeout: 12000 });
      const data = res.data || {};
      const equity = Number(data.equity || 0);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCore({ ...data, mlConnected: data.mlConnected ?? false, universeSize: data.universeSize ?? (data.watchlist?.length || 0) });
      setEquityHistory(prev => [...prev, { time, equity }].slice(-30));
      setLastUpdate(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" }));

      if (Array.isArray(data.rockets)) setLiveRockets(data.rockets);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Cannot reach core service");
    } finally { setLoading(false); }
  };

  const forceScan = async () => {
    if (scanning) return;
    setScanning(true); setMessage("Scanning...");
    try {
      const res = await axios.post(`${CORE_URL}/scan`);
      setMessage("Triggered!");
      if (res.data?.rockets && Array.isArray(res.data.rockets)) {
        const newSymbols = res.data.rockets.map((r: Rocket) => r.symbol);
        setFlashRockets(new Set(newSymbols));
        setLiveRockets(res.data.rockets);
        setTimeout(() => setFlashRockets(new Set()), 2000);
      }
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("Failed"); setTimeout(() => setMessage(""), 2500);
    } finally { setScanning(false); fetchData(); }
  };

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 15000); return () => clearInterval(id); }, []);
  useEffect(() => { if (typeof window !== 'undefined') document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);

  if (loading) return (
    <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center gap-2 text-sm">
      <Activity className="w-6 h-6 animate-pulse" /> Connecting...
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-2 p-3 text-center text-sm">
      <AlertCircle className="w-8 h-8" /> {error}
      <button onClick={fetchData} className="px-3 py-1 bg-cyan-600 rounded text-xs mt-2">Retry</button>
    </div>
  );

  const positions = Array.isArray(core.positions) ? core.positions : [];
  const rockets = liveRockets || [];
  const logs = Array.isArray(core.tradeLog) ? core.tradeLog : [];
  const equityChartData = { labels: equityHistory.map(d => d.time), datasets: [{ data: equityHistory.map(d => d.equity), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)', fill: true, tension: 0.3 }] };

  const getActionDetails = (action: number = 2, priority: boolean = false, confidence: number = 50) => {
    const labels = ["BUY STRONG","BUY","HOLD","SKIP","SELL"];
    const colors = ["text-green-400","text-green-300","text-yellow-400","text-gray-400","text-red-400"];
    return { label: labels[action] || "HOLD", color: colors[action] || "text-gray-400", confidence, isPriority: priority };
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors`}>
      <div className="max-w-5xl mx-auto p-2">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-lg font-bold text-cyan-400">AlphaStream AI</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className={`${core.mlConnected ? 'text-green-400' : 'text-red-400'}`}>ML {core.mlConnected ? 'ONLINE' : 'OFFLINE'}</span>
            <span className="text-gray-500">{lastUpdate}</span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1 rounded bg-gray-800">{darkMode ? <Sun className="w-3 h-3 text-yellow-400"/> : <Moon className="w-3 h-3"/>}</button>
          </div>
        </div>

        {message && <div className="mb-2 p-1 bg-cyan-900/50 border border-cyan-600 rounded text-center text-cyan-300 text-xs">{message}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 text-xs">
          <div className="bg-gray-900/50 p-2 rounded border border-cyan-700 text-center">
            <DollarSign className="w-4 h-4 mx-auto mb-0.5 text-cyan-400" />
            <div>Equity</div>
            <div className="font-bold text-sm">${Number(core.equity||0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded border border-purple-700 text-center">
            <Wallet className="w-4 h-4 mx-auto mb-0.5 text-purple-400" /> BP
            <div className="font-bold text-sm">${Number(core.buyingPower||0).toLocaleString()}</div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded border border-green-700 text-center">
            <Zap className="w-4 h-4 mx-auto mb-0.5 text-green-400" /> Rockets
            <div className="font-bold text-sm text-green-400">{rockets.length}</div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded border border-yellow-700 text-center">
            <Globe className="w-4 h-4 mx-auto mb-0.5 text-yellow-400" /> Universe
            <div className="font-bold text-sm text-yellow-400">{core.universeSize||0}</div>
          </div>
          <div className="bg-gray-900/50 p-2 rounded border border-pink-700 text-center">
            <Bot className="w-4 h-4 mx-auto mb-0.5 text-pink-400" /> ML
            <div className="font-bold text-sm text-pink-400">{core.mlConnected ? "Online":"Offline"}</div>
          </div>
        </div>

        {/* Equity Chart */}
        <div className="bg-gray-900/50 p-2 rounded border border-gray-700 mb-3">
          <h2 className="text-xs font-bold text-cyan-400 mb-1">Equity Curve</h2>
          <div className="h-24">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500 text-xs">Loading...</div>}>
              <Line data={equityChartData} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{display:false}} }}/>
            </Suspense>
          </div>
        </div>

        {/* Rainbow DQN */}
        {rockets.length>0 && <div className="mb-3">
          <h2 className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1"><Bot className="w-4 h-4"/> Rainbow DQN</h2>
          <div className="space-y-2">
            {rockets.map((r: Rocket, i: number)=>{
              const ml=getActionDetails(r.mlAction,r.mlPriority,r.mlConfidence);
              const flash=flashRockets.has(r.symbol);
              return (
                <div key={i} className={`bg-gray-900/60 p-2 rounded border border-purple-800 shadow-sm transition-all ${flash?'animate-pulse border-purple-400':''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold text-sm">{r.symbol}</div>
                      <div className="text-[10px] text-gray-400">Gap +{r.gap}% • RVOL {r.rvol} • ${r.price}</div>
                    </div>
                    {ml.isPriority && <div className="bg-green-900 text-green-300 text-[9px] font-bold px-2 py-0.5 rounded-full">HIGH</div>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-bold ${ml.color}`}>{ml.label}</div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] text-gray-400">AI Confidence</div>
                      <div className="w-28 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 transition-all" style={{width:`${ml.confidence}%`}}/>
                      </div>
                      <div className="text-[9px] text-cyan-300">{ml.confidence}%</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>}

        {/* Rockets Grid */}
        <div className="mb-3">
          <h2 className="text-xs font-bold text-yellow-400 mb-1">Today's Rockets ({rockets.length})</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
            {rockets.length>0?rockets.map((r: Rocket, i: number)=>(
              <div key={i} className="bg-gray-900/50 p-2 rounded border border-yellow-600 text-center hover:border-yellow-400 transition">
                <div className="font-medium">{r.symbol}</div>
                <div className="text-lg text-yellow-400 font-bold mt-0.5">+{r.gap}%</div>
                <div className="text-[10px] text-green-400 mt-0.5">RVOL {r.rvol}</div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 transition-all" style={{width:`${r.mlConfidence}%`}}/>
                </div>
              </div>
            )):<div className="col-span-full text-center text-gray-500 py-6 text-xs">No gappers yet</div>}
          </div>
        </div>

        {/* Live Positions */}
        <div className="mb-3">
          <h2 className="text-xs font-bold text-green-400 mb-1">Live Positions ({positions.length})</h2>
          <div className="space-y-1">
            {positions.length>0?positions.map((p: any, i: number)=>{
              const pnl=Number(p.unrealized_plpc||0);
              return <div key={i} className="bg-gray-900/50 p-2 rounded border border-green-700 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold">{p.symbol} ×{p.qty}</div>
                  <div className="text-[9px] text-gray-400">Entry: ${Number(p.avg_entry_price||0).toFixed(2)}</div>
                </div>
                <div className={`font-bold ${pnl>=0?'text-green-400':'text-red-400'}`}>{pnl>=0?'+':''}{pnl.toFixed(1)}%</div>
              </div>
            }):<div className="text-center text-gray-500 py-6 text-xs">No open positions</div>}
          </div>
        </div>

        {/* Logs */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-cyan-400 mb-1">Execution Log</h2>
          <div className="bg-gray-900/50 p-2 rounded text-[10px] font-mono max-h-40 overflow-y-auto border border-gray-800">
            {logs.length===0?<p className="text-center text-gray-500 py-4">No activity yet</p>:logs.slice(-15).reverse().map((l: any, i: number)=>(
              <div key={i} className="py-1 border-b border-gray-800 last:border-0 text-gray-300">{typeof l==='string'?l:`${l.time||''} ${l.message||''}`}</div>
            ))}
          </div>
        </div>

        {/* Force Scan Button */}
        <button onClick={forceScan} disabled={scanning} className={`fixed bottom-3 left-1/2 -translate-x-1/2 w-11/12 max-w-sm py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg z-50 transition-all ${scanning?'bg-gray-700 text-gray-400':'bg-cyan-500 hover:bg-cyan-400 text-black'}`}>
          {scanning?<Loader2 className="w-5 h-5 animate-spin"/>:<RefreshCw className="w-5 h-5"/>} {scanning?"SCANNING...":"FORCE SCAN"}
        </button>
      </div>
    </div>
  )
}
