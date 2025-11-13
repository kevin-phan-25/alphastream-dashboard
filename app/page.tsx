// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Zap, AlertTriangle, TrendingUp, Clock, Settings, Sun, Moon, Save, Trophy, AlertOctagon } from 'lucide-react';

interface Log { type: string; data: any; t: string; raw: string; }
interface Trade { id: string; symbol: string; entry: number; qty: number; pnl: number; time: string; status: 'open' | 'closed'; }
interface Stats { total: number; wins: number; }
interface Settings {
  botName: string; avatar: string; theme: 'dark' | 'light'; accentColor: string;
  dailyLossCap: number; maxPositions: number; drawdownShutoff: number;
  showEquity: boolean; showPositions: boolean; showLoss: boolean; showChart: boolean; showFeed: boolean; showTrades: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  botName: 'AlphaStream', avatar: 'KP', theme: 'dark', accentColor: '#10b981',
  dailyLossCap: 300, maxPositions: 3, drawdownShutoff: 15,
  showEquity: true, showPositions: true, showLoss: true, showChart: true, showFeed: true, showTrades: true,
};

const ACCENT_PRESETS = { emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7', orange: '#f97316', red: '#ef4444' };

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [equity, setEquity] = useState(99998.93);
  const [positions, setPositions] = useState(0);
  const [dailyLoss, setDailyLoss] = useState(0);
  const [lastScan, setLastScan] = useState('Never');
  const [pnlData, setPnlData] = useState<{time: string; equity: number}[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, wins: 0 });
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('alphastream-settings');
    if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
  }, []);

  const saveSettings = () => {
    localStorage.setItem('alphastream-settings', JSON.stringify(settings));
    window.location.reload();
  };

  useEffect(() => {
    const evtSource = new EventSource('/api/sse');
    evtSource.onmessage = (e) => {
      const raw = e.data;
      const parts = raw.split('\t');
      const t = parts[0];
      const type = parts[1];
      const dataStr = parts.slice(2).join('\t');
      const log: Log = { type, data: {}, t, raw };

      // Parse known types
      if (type === 'STATS') {
        const equityMatch = dataStr.match(/Equity: \$?([\d,]+\.?\d*)/);
        const lossMatch = dataStr.match(/Daily Loss: \$?([\d,]+\.?\d*)/);
        const posMatch = dataStr.match(/Positions: (\d+)/);
        if (equityMatch) setEquity(parseFloat(equityMatch[1].replace(/,/g, '')));
        if (lossMatch) setDailyLoss(parseFloat(lossMatch[1].replace(/,/g, '')));
        if (posMatch) setPositions(+posMatch[1]);
        setPnlData(prev => [...prev, { time: new Date(t).toLocaleTimeString(), equity: equity }].slice(-50));
      }

      if (type === 'SCAN') {
        setLastScan(new Date(t).toLocaleTimeString());
      }

      if (type === 'TRADE') {
        const symbolMatch = dataStr.match(/symbol: ([A-Z]+)/);
        const priceMatch = dataStr.match(/price: ([\d.]+)/);
        const qtyMatch = dataStr.match(/qty: (\d+)/);
        if (symbolMatch && priceMatch && qtyMatch) {
          const newTrade: Trade = {
            id: Math.random().toString(36).substr(2, 9),
            symbol: symbolMatch[1],
            entry: +priceMatch[1],
            qty: +qtyMatch[1],
            pnl: 0,
            time: new Date(t).toLocaleTimeString(),
            status: 'open'
          };
          setLiveTrades(prev => [newTrade, ...prev]);
          setPositions(p => p + 1);
        }
      }

      if (type === 'CLOSED') {
        const symbolMatch = dataStr.match(/symbol: ([A-Z]+)/);
        const profitMatch = dataStr.match(/profit: ([\d.-]+)/);
        if (symbolMatch && profitMatch) {
          const profit = +profitMatch[1];
          setLiveTrades(prev => prev.filter(t => t.symbol !== symbolMatch[1]));
          setPositions(p => p - 1);
          setStats(s => ({
            total: s.total + 1,
            wins: s.wins + (profit > 0 ? 1 : 0)
          }));
        }
      }

      setLogs(prev => [log, ...prev].slice(0, 100));
    };
    return () => evtSource.close();
  }, [equity]);

  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
  const theme = settings.theme;
  const accent = settings.accentColor;
  const glass = theme === 'dark' ? 'glass' : 'glass-light';
  const muted = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';

  return (
    <div className={`h-screen flex overflow-hidden ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900/80 border-r border-slate-800">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <SettingsPanel settings={settings} setSettings={setSettings} saveSettings={saveSettings} accent={accent} theme={theme} />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 w-64 h-full bg-slate-900 p-6 overflow-y-auto">
            <SettingsPanel settings={settings} setSettings={setSettings} saveSettings={saveSettings} accent={accent} theme={theme} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className={`p-6 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-950/90' : 'border-gray-300 bg-white/90'} backdrop-blur-sm flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{ backgroundColor: accent }}>
              {settings.avatar}
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: accent }}>{settings.botName}</h1>
              <p className={`text-sm ${muted}`}>@{new Date().toLocaleTimeString()} EST • @Kevin_Phan25</p>
            </div>
          </div>

          {/* Win Rate + NUCLEAR Badge */}
          <div className="flex items-center gap-3">
            {logs.some(l => l.type === 'NUCLEAR_MODE') && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/70 border border-orange-600 animate-pulse">
                <AlertOctagon className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-300">NUCLEAR</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-700">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">{winRate}% Win Rate</span>
            </div>
          </div>

          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-slate-800/50">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {settings.showEquity && <StatCard icon={DollarSign} label="Equity" value={`$${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={accent} />}
            {settings.showPositions && <StatCard icon={Zap} label="Positions" value={`${positions}/${settings.maxPositions}`} color={accent} />}
            {settings.showLoss && <StatCard icon={AlertTriangle} label="Daily Loss" value={`$${dailyLoss}/${settings.dailyLossCap}`} color={dailyLoss > settings.dailyLossCap * 0.8 ? '#ef4444' : accent} />}
            <StatCard icon={Clock} label="Last Scan" value={lastScan} color={accent} />
          </div>

          {/* Live Trades */}
          {settings.showTrades && liveTrades.length > 0 && (
            <div className={`${glass} rounded-2xl p-5 border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: accent }} /> Live Trades ({liveTrades.length})
              </h2>
              <div className="space-y-2">
                {liveTrades.map(trade => (
                  <div key={trade.id} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/50'} border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">{trade.symbol}</span>
                      <span className="text-xs opacity-70">@{trade.entry.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">x{trade.qty}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700">
                        LIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {settings.showChart && (
            <div className={`${glass} rounded-2xl p-6 border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" style={{ color: accent }} /> Equity Curve</h2>
              <div className="h-64"><ResponsiveContainer><LineChart data={pnlData}><CartesianGrid stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} /><XAxis dataKey="time" stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} /><YAxis stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} /><Tooltip contentStyle={{ background: theme === 'dark' ? '#1e293b' : '#ffffff', border: 'none' }} /><Line type="monotone" dataKey="equity" stroke={accent} strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
            </div>
          )}

          {/* Live Activity – PARSES YOUR LOGS */}
          {settings.showFeed && (
            <div className={`${glass} rounded-2xl p-6 border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5" style={{ color: accent }} /> Live Activity</h2>
              <div className="text-xs font-mono space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? <p className={`text-center py-8 ${muted}`}>Waiting...</p> : logs.map((log, i) => <LogItem key={i} log={log} accent={accent} theme={theme} />)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Enhanced LogItem with NUCLEAR_MODE
function LogItem({ log, accent, theme }: { log: Log; accent: string; theme: string }) {
  const type = log.type;
  const isNuclear = type === 'NUCLEAR_MODE';
  const isDash = type.includes('DASH_OK');
  const isScan = type === 'SCAN';
  const isFail = type.includes('FAIL');

  const bg = theme === 'dark' 
    ? (isNuclear ? 'bg-orange-900/70 border-orange-600' : 
       isDash ? 'bg-blue-900/40 border-blue-500' :
       isScan ? 'bg-emerald-900/40 border-emerald-500' :
       isFail ? 'bg-red-900/60 border-red-500' :
       'bg-gray-800/50')
    : (isNuclear ? 'bg-orange-100 border-orange-400 text-orange-800' :
       isDash ? 'bg-blue-100 border-blue-400 text-blue-800' :
       isScan ? 'bg-emerald-100 border-emerald-400 text-emerald-800' :
       isFail ? 'bg-red-100 border-red-400 text-red-800' :
       'bg-gray-100');

  return (
    <div className={`p-3 rounded-lg border ${bg} ${isNuclear ? 'animate-pulse' : ''}`}>
      <span className={theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}>
        [{new Date(log.t).toLocaleTimeString()}]
      </span>{' '}
      <span className={`font-bold ${isNuclear ? 'text-orange-300' : ''}`} style={isNuclear ? {} : { color: accent }}>
        {type}
      </span>{' '}
      <span className={theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>
        {log.raw.split('\t').slice(2).join(' ')}
      </span>
    </div>
  );
}

// StatCard, SettingsPanel → unchanged (use previous)
