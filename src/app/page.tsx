'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Activity, Trophy, Skull, TrendingUp, Package, LineChart } from 'lucide-react';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [bot, setBot] = useState<any>({});
  const [perf, setPerf] = useState<any>({ trades: [], stats: {}, equityCurve: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [showPositions, setShowPositions] = useState(false);

  const BOT_URL = "https://alphastream-autopilot-1017433009054.us-east1.run.app";

  const fetchAll = async () => {
    try {
      const [botRes, perfRes] = await Promise.all([
        axios.get(BOT_URL),
        axios.get(`${BOT_URL}/performance`)
      ]);

      const equityRaw = (botRes.data.equity || "$100000").toString().replace(/[$,]/g, '');
      const unrealRaw = (botRes.data.unrealized || "0").toString().replace(/[$,+]/g, '');

      setBot({
        ...botRes.data,
        equity: `$${parseFloat(equityRaw).toLocaleString()}`,
        unrealized: parseFloat(unrealRaw) >= 0 ? `+$${Math.abs(parseFloat(unrealRaw)).toLocaleString()}` : `–$${Math.abs(parseFloat(unrealRaw)).toLocaleString()}`
      });
      setPerf(perfRes.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 10000);
    return () => clearInterval(i);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Activity className="w-32 h-32 text-purple-500 animate-spin" />
    </div>
  );

  const { stats = {}, equityCurve = [] } = perf;
  const positionsCount = bot.positions || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 text-white pb-20">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/95 border-b-2 border-purple-600">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AlphaStream v98
            </h1>
            <p className="text-xl text-orange-400 font-bold">WARRIOR PATTERN SNIPER</p>
          </div>
          <span className="px-10 py-4 rounded-full text-3xl font-black bg-gradient-to-r from-emerald-500 to-green-600 shadow-2xl">
            {bot.mode || "LIVE"} MODE
          </span>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-7xl mx-auto space-y-12">
        <h2 className="text-8xl font-black text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
          LOW-FLOAT SNIPER
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-purple-500">
            <p className="text-5xl font-black text-purple-300">{bot.equity}</p>
            <p className="text-xl text-gray-300">Equity</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-green-500">
            <TrendingUp className="w-16 h-16 mx-auto text-green-400 mb-2" />
            <p className={`text-5xl font-black ${bot.unrealized?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
              {bot.unrealized}
            </p>
            <p className="text-xl text-gray-300">Unrealized</p>
          </div>
          <div onClick={() => setShowTrades(true)} className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-yellow-500 hover:scale-110 cursor-pointer transition">
            <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-3" />
            <p className="text-6xl font-black text-yellow-400">{stats.winRate || "0.0"}%</p>
            <p className="text-xl text-gray-300">Win Rate ({stats.trades || 0} trades)</p>
          </div>
          <div onClick={() => setShowPositions(true)} className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border-2 border-orange-500 hover:scale-110 cursor-pointer transition">
            <Package className="w-20 h-20 mx-auto text-orange-400 mb-3" />
            <p className="text-6xl font-black text-orange-300">{positionsCount}</p>
            <p className="text-xl text-gray-300">Positions</p>
          </div>
        </div>

        {/* LIVE EQUITY CURVE */}
        <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-cyan-500">
          <h3 className="text-5xl font-black text-center text-cyan-400 mb-8 flex items-center justify-center gap-4">
            <LineChart className="w-12 h-12" /> LIVE EQUITY CURVE
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine
                type="monotone"
                data={equityCurve}
                stroke="#a855f7"
                strokeWidth={4}
                dot={false}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#888" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis stroke="#888" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111" border: "none" }
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="equity" stroke="#a855f7" strokeWidth={4} dot={false} />
              </RechartsLine>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rockets */}
        {bot.rockets?.length > 0 && (
          <div className="bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border-4 border-yellow-500">
            <h3 className="text-5xl font-black text-center text-yellow-400 mb-8">ROCKET HITS</h3>
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

        {/* Force Scan */}
        <div className="text-center pt-10">
          <button
            onClick={async () => {
              setScanning(true);
              await axios.post(`${BOT_URL}/scan`).catch(() => {});
              setScanning(false);
              setTimeout(fetchAll, 1500);
            }}
            className="px-40 py-16 text-6xl font-black rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all shadow-2xl border-8 border-purple-400 flex items-center justify-center gap-12 mx-auto"
          >
            <RefreshCw className={`w-24 h-24 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? "SNIPING..." : "FORCE SCAN"}
          </button>
        </div>
      </main>

      {/* Trade History Modal */}
      {showTrades && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" onClick={() => setShowTrades(false)}>
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-3xl p-12 max-w-5xl w-full max-h-screen overflow-y-auto border-4 border-yellow-500" onClick={e => e.stopPropagation()}>
            <h2 className="text-6xl font-black text-center text-yellow-400 mb-10">FULL TRADE HISTORY</h2>
            {perf.trades.length === 0 ? (
              <p className="text-center text-4xl text-gray-400">Waiting for first Warrior hit...</p>
            ) : (
              <div className="space-y-4">
                {perf.trades.reverse().map((t: any, i: number) => (
                  <div key={i} className={`p-6 rounded-2xl border-4 ${t.result === 'WIN' ? 'bg-green-900/70 border-green-500' : 'bg-red-900/70 border-red-500'}`}>
                    <div className="flex justify-between items-center text-3xl">
                      <div className="flex items-center gap-6">
                        {t.result === 'WIN' ? <Trophy className="w-12 h-12 text-yellow-400" /> : <Skull className="w-12 h-12 text-red-400" />}
                        <span className="font-bold">{t.symbol}</span>
                        <span className="text-xl text-gray-300">{t.pattern}</span>
                        <span className="text-lg text-gray-400">{t.time}</span>
                      </div>
                      <span className={`font-black text-4xl ${t.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.pnlPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowTrades(false)} className="mt-10 w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl text-3xl font-bold">
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Positions Modal */}
      {showPositions && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" onClick={() => setShowPositions(false)}>
          <div className="bg-gradient-to-br from-orange-900 to-black rounded-3xl p-12 max-w-3xl w-full border-4 border-orange-500" onClick={e => e.stopPropagation()}">
            <h2 className="text-6xl font-black text-center text-orange-400 mb-10">CURRENT POSITIONS</h2>
            {positionsCount === 0 ? (
              <p className="text-5xl text-center text-gray-400 font-bold">NO ACTIVE POSITIONS</p>
            ) : (
              <div className="space-y-6 text-2xl">
                {bot.positions?.map((p: any) => (
                  <div key={p.symbol} className="bg-white/10 rounded-2xl p-6 border-2 border-orange-400">
                    <div className="flex justify-between">
                      <span className="font-bold text-3xl">{p.symbol}</span>
                      <span>{p.qty} @ ${parseFloat(p.entry).toFixed(2)}</span>
                    </div>
                    <div className={`text-2xl font-bold ${p.current > p.entry ? 'text-green-400' : 'text-red-400'}`}>
                      ${parseFloat(p.current).toFixed(2)} → {((p.current - p.entry)/p.entry*100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowPositions(false)} className="mt-10 w-full py-5 bg-orange-600 hover:bg-orange-700 rounded-2xl text-3xl font-bold">
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
