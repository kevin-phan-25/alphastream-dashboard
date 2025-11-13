// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Zap, AlertTriangle, TrendingUp, Clock, Settings, Sun, Moon, Save, XCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface Log { type: string; data: any; t: string; }
interface Trade { id: string; symbol: string; entry: number; qty: number; pnl: number; time: string; status: 'open' | 'closed'; }
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
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equity, setEquity] = useState(99998.93);
  const [positions, setPositions] = useState(0);
  const [dailyLoss, setDailyLoss] = useState(0);
  const [lastScan, setLastScan] = useState('11:52:29 AM');
  const [pnlData, setPnlData] = useState<{time: string; equity: number}[]>([]);
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
      const log: Log = JSON.parse(e.data);
      setLogs(prev => [log, ...prev].slice(0, 100));

      if (log.type === 'STATS') {
        setEquity(log.data.equity);
        setPositions(log.data.positions);
        setDailyLoss(log.data.dailyLoss);
        setPnlData(prev => [...prev, { time: new Date(log.t).toLocaleTimeString(), equity: log.data.equity }].slice(-50));
      }
      if (log.type === 'SCAN') setLastScan(new Date(log.t).toLocaleTimeString());

      if (log.type === 'TRADE') {
        const newTrade: Trade = {
          id: Math.random().toString(36).substr(2, 9),
          symbol: log.data.symbol,
          entry: log.data.price,
          qty: log.data.qty,
          pnl: 0,
          time: new Date(log.t).toLocaleTimeString(),
          status: 'open'
        };
        setTrades(prev => [newTrade, ...prev]);
        setPositions(p => p + 1);
      }

      if (log.type === 'CLOSED') {
        setTrades(prev => prev.map(t =>
          t.status === 'open' && t.symbol === log.data.symbol
            ? { ...t, pnl: log.data.profit, status: 'closed' }
            : t
        ));
        setPositions(p => p - 1);
      }
    };
    return () => evtSource.close();
  }, []);

  const theme = settings.theme;
  const accent = settings.accentColor;
  const glass = theme === 'dark' ? 'glass' : 'glass-light';
  const textColor = theme === 'dark' ? 'text-slate-100' : 'text-gray-900';
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
        <header className={`p-6 border-b border-slate-800 ${theme === 'dark' ? 'bg-slate-950/90' : 'bg-white/90'} backdrop-blur-sm flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{ backgroundColor: accent }}>
              {settings.avatar}
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: accent }}>{settings.botName}</h1>
              <p className={`text-sm ${muted}`}>@{new Date().toLocaleTimeString()} EST • @Kevin_Phan25</p>
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

          {/* Live Trades Table */}
          {settings.showTrades && trades.length > 0 && (
            <div className={`${glass} rounded-2xl p-6 border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: accent }} /> Live Trades
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-right py-2">Entry</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">P&L</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id} className={`border-b ${theme === 'dark' ? 'border-slate-800' : 'border-gray-200'}`}>
                        <td className="py-2 font-mono">{trade.symbol}</td>
                        <td className="text-right py-2">${trade.entry.toFixed(2)}</td>
                        <td className="text-right py-2">{trade.qty}</td>
                        <td className={`text-right py-2 font-bold ${trade.pnl > 0 ? 'text-emerald-400' : trade.pnl < 0 ? 'text-red-400' : ''}`}>
                          {trade.pnl !== 0 ? `${trade.pnl > 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '—'}
                        </td>
                        <td className="text-center py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${trade.status === 'open' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-blue-900/50 text-blue-300'}`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chart */}
          {settings.showChart && (
            <div className={`${glass} rounded-2xl p-6 border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" style={{ color: accent }} /> Equity Curve</h2>
              <div className="h-64"><ResponsiveContainer><LineChart data={pnlData}><CartesianGrid stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} /><XAxis dataKey="time" stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} /><YAxis stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} /><Tooltip contentStyle={{ background: theme === 'dark' ? '#1e293b' : '#ffffff', border: 'none', color: theme === 'dark' ? '#e2e8f0' : '#111827' }} /><Line type="monotone" dataKey="equity" stroke={accent} strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
            </div>
          )}

          {/* Feed */}
          {settings.showFeed && (
            <div className={`${glass} rounded-2xl p-6 border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5" style={{ color: accent }} /> Live Activity</h2>
              <div className="text-sm font-mono space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? <p className={`text-center py-8 ${muted}`}>Waiting for data...</p> : logs.map((log, i) => <LogItem key={i} log={log} accent={accent} theme={theme} />)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Components
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-slate-900/40 dark:bg-slate-900/40 light:bg-white/70 backdrop-blur rounded-xl p-5 border border-slate-700 dark:border-slate-700 light:border-gray-300 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-70">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-9 h-9 opacity-80" style={{ color }} />
      </div>
    </div>
  );
}

function LogItem({ log, accent, theme }: { log: Log; accent: string; theme: string }) {
  const colors: any = { 
    TRADE: theme === 'dark' ? 'bg-emerald-900/40 border-emerald-500' : 'bg-emerald-100 border-emerald-400 text-emerald-800',
    CLOSED: theme === 'dark' ? 'bg-blue-900/40 border-blue-500' : 'bg-blue-100 border-blue-400 text-blue-800',
    SHUTOFF: theme === 'dark' ? 'bg-red-900/60 border-red-500' : 'bg-red-100 border-red-400 text-red-800',
    HEARTBEAT: theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
  };
  return (
    <div className={`p-3 rounded-lg border text-xs ${colors[log.type] || (theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100')}`}>
      <span className={theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}>[{new Date(log.t).toLocaleTimeString()}]</span>{' '}
      <span className="font-bold" style={{ color: accent }}>{log.type}</span>{' '}
      {log.data.symbol && <span className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}>{log.data.symbol}</span>}
      {log.data.profit && <span className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}> P&L: ${log.data.profit}</span>}
    </div>
  );
}

function SettingsPanel({ settings, setSettings, saveSettings, accent, theme }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Settings</h2>
        <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-xs opacity-70 hover:opacity-100">Reset</button>
      </div>

      <div><label className="text-xs opacity-70">Bot Name</label><input value={settings.botName} onChange={e => setSettings({ ...settings, botName: e.target.value })} className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-lg text-sm" /></div>
      <div><label className="text-xs opacity-70">Avatar</label><input value={settings.avatar} onChange={e => setSettings({ ...settings, avatar: e.target.value.slice(0,3) })} maxLength={3} className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-lg text-center font-bold text-xl" /></div>

      <div><label className="text-xs opacity-70">Theme</label><div className="flex gap-2 mt-2">
        <button onClick={() => setSettings({ ...settings, theme: 'dark' })} className={`flex-1 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-800'}`}><Moon className="w-5 h-5 mx-auto" /></button>
        <button onClick={() => setSettings({ ...settings, theme: 'light' })} className={`flex-1 py-2 rounded-lg ${theme === 'light' ? 'bg-slate-700' : 'bg-slate-800'}`}><Sun className="w-5 h-5 mx-auto" /></button>
      </div></div>

      <div><label className="text-xs opacity-70">Accent</label><div className="grid grid-cols-5 gap-2 mt-2">
        {Object.entries(ACCENT_PRESETS).map(([n, c]) => (
          <button key={n} onClick={() => setSettings({ ...settings, accentColor: c })} className={`h-10 rounded-lg border-2 ${settings.accentColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
        ))}
      </div></div>

      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <label className="text-sm font-bold text-emerald-400">Risk Limits</label>
        <div className="space-y-3 mt-3">
          <div><span className="text-xs opacity-75">Daily Loss Cap</span><span className="float-right font-mono text-emerald-300">${settings.dailyLossCap}</span></div>
          <input type="number" value={settings.dailyLossCap} onChange={e => setSettings({ ...settings, dailyLossCap: +e.target.value })} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm" />
          <div><span className="text-xs opacity-75">Max Positions</span><span className="float-right font-mono text-emerald-300">{settings.maxPositions}</span></div>
          <input type="number" value={settings.maxPositions} onChange={e => setSettings({ ...settings, maxPositions: +e.target.value })} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm" />
          <div><span className="text-xs opacity-75">Max Drawdown</span><span className="float-right font-mono text-emerald-300">{settings.drawdownShutoff}%</span></div>
          <input type="number" value={settings.drawdownShutoff} onChange={e => setSettings({ ...settings, drawdownShutoff: +e.target.value })} className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm" />
        </div>
      </div>

      <div><label className="text-xs opacity-70">Show Panels</label><div className="space-y-2 mt-2">
        {['showEquity', 'showPositions', 'showLoss', 'showChart', 'showFeed', 'showTrades'].map(k => (
          <label key={k} className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={settings[k]} onChange={e => setSettings({ ...settings, [k]: e.target.checked })} />
            <span>{k.replace('show', '').replace('Loss', ' Daily Loss').replace('Trades', ' Live Trades')}</span>
          </label>
        ))}
      </div></div>

      <button onClick={saveSettings} className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition hover:opacity-90" style={{ backgroundColor: accent }}>
        <Save className="w-5 h-5" /> Save & Apply
      </button>
    </div>
  );
}
