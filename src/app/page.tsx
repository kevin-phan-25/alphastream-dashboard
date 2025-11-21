'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Skull, TrendingUp, Package } from 'lucide-react';

export default function Home() {
  const [bot, setBot] = useState<any>({});
  const [trades, setTrades] = useState<any>({ trades: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [showPositions, setShowPositions] = useState(false);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchAll = async () => {
    try {
      const [botRes, tradesRes] = await Promise.all([
        axios.get(BOT_URL, { timeout: 12000 }),
        axios.get(`${BOT_URL}/trades`, { timeout: 10000 }).catch(() => ({ data: { trades: [], stats: {} } }))
      ]);

      const equityRaw = (botRes.data.equity || "$100000").toString().replace(/[$,]/g, '');
      const unrealRaw = (botRes.data.unrealized || "0").toString().replace(/[$,+]/g, '');

      setBot({
        ...botRes.data,
        equity: `$${parseFloat(equityRaw || "100000").toLocaleString()}`,
        unrealized: parseFloat(unrealRaw) >= 0 
          ? `+$${Math.abs(parseFloat(unrealRaw)).toLocaleString()}` 
          : `–$${Math.abs(parseFloat(unrealRaw)).toLocaleString()}`
      });
      setTrades(tradesRes.data);
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();                                 // ← Fixed: was fetch()
    const i = setInterval(fetchAll, 9000);      // ← Fixed: was fetch
    return () => clearInterval(i);
  }, []);

  const triggerScan = async () => {
    setScanning(true);
    await axios.post(`${BOT_URL}/scan`).catch(() => {});
    setScanning(false);
    setTimeout(fetchAll, 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-32 h-32 text-purple-500 animate-spin" />
      <p className="ml-6 text-4xl text-purple-400">Connecting to v98...</p>
    </div>
  );

  const stats = trades.stats || {};
  const positionsCount = bot.positions || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b-2 border-purple-600">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v98
            </h1>
            <p className="text-xl text-orange-400 font-bold">ELITE Pattern Engine</p>
          </div>
          <div className="text-right">
            <span className="px-8 py-3 rounded-full text-2xl font-black bg-gradient-to-r from-emerald-500 to-green-600">
              {bot.mode === "LIVE" ? "LIVE MODE" : "PAPER MODE"}
            </span>
            <p className="text-sm text-gray-400 mt-1">
              {bot.mode === "LIVE" ? "Real money on Alpaca" : "Simulated (no risk)"}
            </p>
          </div>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-7xl mx-auto space-y-12">
        <h2 className="text-7xl font-black text-center bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
          LOW-FLOAT SNIPER
        </h2>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-purple-500 hover:scale-105 transition">
            <p className="text-5xl font-black text-purple-300">{bot.equity || "$100,000"}</p>
            <p className="text-xl text-gray-300">Equity</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-green-500 hover:scale-105 transition">
            <TrendingUp className="w-16 h-16 mx-auto text-green-400 mb-2" />
            <p className={`text-5xl font-black ${bot.unrealized?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
              {bot.unrealized || "+$0"}
            </p>
            <p className="text-xl text-gray-300">Unrealized</p>
          </div>

          {/* Clickable Win Rate */}
          <div 
            onClick={() => setShowTrades(true)}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-yellow-500 hover:scale-110 transition cursor-pointer"
          >
            <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-3" />
            <p className="text-6xl font-black text-yellow-400">{stats.winRate || "0.0"}%</p>
            <p className="text-xl text-gray-300">Win Rate ({stats.trades || 0} trades)</p>
          </div>

          {/* Clickable Positions */}
          <div 
            onClick={() => setShowPositions(true)}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-orange-500 hover:scale-110 cursor-pointer transition"
          >
            <Package className="w-20 h-20 mx-auto text-orange-400 mb-3" />
            <p className="text-6xl font-black text-orange-300">{positionsCount}</p>
            <p className="text-xl text-gray-300">Active Positions</p>
          </div>
        </div>

        {/* Rockets Section */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-yellow-500">
            <h3 className="text-5xl font-black text-center text-yellow-400 mb-8">
              ROCKETS DETECTED
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {bot.rockets.map((r: string, i: number) => {
                const symbol = r.split('+')[0].trim();
                const pct = r.split('+')[1]?.split(' ')[0];
                const pattern = r.match(/\[(.*?)\]/)?.[1]?.toUpperCase() || "MOMO";
                return (
                  <div key={i} className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-2xl p-6 text-center hover:scale-110 transition">
                    <p className="text-4xl font-black">{symbol}</p>
                    <p className="text-3xl text-green-400">+{pct}</p>
                    <p className="text-sm font-bold text-cyan-300">{pattern}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Force Scan Button */}
        <div className="text-center pt-8">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="px-32 py-14 text-5xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 transition-all shadow-2xl border-8 border-purple-400 flex items-center justify-center gap-10 mx-auto"
          >
            <RefreshCw className={`w-20 h-20 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SCANNING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>

      {/* Trade History Modal */}
      {showTrades && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-8" onClick={() => setShowTrades(false)}>
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-3xl p-10 max-w-4xl w-full max-h-screen overflow-y-auto border-4 border-purple-500" onClick={e => e.stopPropagation()}>
            <h2 className="text-5xl font-black text-center text-yellow-400 mb-8">TRADE HISTORY</h2>
            {trades.trades.length === 0 ? (
              <p className="text-center text-3xl text-gray-400">No trades yet — waiting for first ELITE hit</p>
            ) : (
              <div className="space-y-4">
                {trades.trades.slice().reverse().map((t: any, i: number) => (
                  <div key={i} className={`p-5 rounded-2xl border-4 ${t.result === 'WIN' ? 'bg-green-900/60 border-green-500' : 'bg-red-900/60 border-red-500'}`}>
                    <div className="flex justify-between items-center text-2xl">
                      <div className="flex items-center gap-4">
                        {t.result === 'WIN' ? <Trophy className="w-10 h-10 text-yellow-400" /> : <Skull className="w-10 h-10 text-red-400" />}
                        <span className="font-bold">{t.symbol}</span>
                        <span className="text-gray-300">{t.pattern.toUpperCase()}</span>
                      </div>
                      <span className={`font-black ${t.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.pnlPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowTrades(false)} className="mt-8 w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl text-2xl font-bold">
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Current Positions Modal */}
      {showPositions && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-8" onClick={() => setShowPositions(false)}>
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-3xl p-10 max-w-3xl w-full border-4 border-orange-500" onClick={e => e.stopPropagation()}>
            <h2 className="text-5xl font-black text-center text-orange-400 mb-8">CURRENT POSITIONS</h2>
            {positionsCount === 0 ? (
              <p className="text-4xl text-center text-gray-400 font-bold">NO ACTIVE POSITIONS</p>
            ) : (
              <div className="space-y-4 text-2xl">
                {bot.positions?.map((p: any) => (
                  <div key={p.symbol} className="bg-white/10 rounded-xl p-6 border-2 border-orange-500">
                    <div className="flex justify-between">
                      <span className="font-bold">{p.symbol}</span>
                      <span>{p.qty} shares @ ${parseFloat(p.entry).toFixed(2)}</span>
                    </div>
                    <div className={`mt-2 ${p.current > p.entry ? 'text-green-400' : 'text-red-400'}`}>
                      Current: ${parseFloat(p.current).toFixed(2)} → {((p.current - p.entry)/p.entry*100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowPositions(false)} className="mt-8 w-full py-4 bg-orange-600 hover:bg-orange-700 rounded-xl text-2xl font-bold">
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
