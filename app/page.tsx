'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Zap, AlertTriangle, TrendingUp, Clock, Settings, Sun, Moon, Palette, User, Save, X } from 'lucide-react';

interface Log {
  type: string;
  data: any;
  t: string;
}

interface Settings {
  botName: string;
  avatar: string;
  theme: 'dark' | 'light';
  accentColor: string;
  dailyLossCap: number;
  maxPositions: number;
  drawdownShutoff: number;
  showEquity: boolean;
  showPositions: boolean;
  showLoss: boolean;
  showChart: boolean;
  showFeed: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  botName: 'AlphaStream',
  avatar: 'KP',
  theme: 'dark',
  accentColor: '#10b981',
  dailyLossCap: 300,
  maxPositions: 3,
  drawdownShutoff: 15,
  showEquity: true,
  showPositions: true,
  showLoss: true,
  showChart: true,
  showFeed: true,
};

const ACCENT_PRESETS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
};

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [equity, setEquity] = useState(25000);
  const [positions, setPositions] = useState(0);
  const [dailyLoss, setDailyLoss] = useState(0);
  const [lastScan, setLastScan] = useState('Never');
  const [pnlData, setPnlData] = useState<{time: string; equity: number}[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('alphastream-settings');
    if (saved) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('alphastream-settings', JSON.stringify(settings));
    setShowSettings(false);
    window.location.reload(); // Apply theme
  };

  // SSE Connection
  useEffect(() => {
    const evtSource = new EventSource('/api/sse');
    evtSource.onmessage = (event) => {
      const log: Log = JSON.parse(event.data);
      setLogs(prev => [log, ...prev].slice(0, 100));

      if (log.type === 'STATS') {
        setEquity(log.data.equity);
        setPositions(log.data.positions);
        setDailyLoss(log.data.dailyLoss);
        setPnlData(prev => [...prev, { time: new Date(log.t).toLocaleTimeString(), equity: log.data.equity }].slice(-50));
      }
      if (log.type === 'SCAN') setLastScan(new Date(log.t).toLocaleTimeString());
      if (log.type === 'TRADE') setPositions(prev => prev + 1);
      if (log.type === 'CLOSED') setPositions(prev => prev - 1);
    };
    evtSource.onerror = () => evtSource.close();
    return () => evtSource.close();
  }, []);

  const accent = settings.accentColor;

  return (
    <>
      <div className={`min-h-screen transition-colors ${settings.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 w-64 h-full bg-slate-900 p-6 overflow-y-auto">
              <SettingsPanel settings={settings} setSettings={setSettings} saveSettings={saveSettings} accent={accent} />
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block lg:border-r lg:border-slate-800">
          <div className="p-6">
            <SettingsPanel settings={settings} setSettings={setSettings} saveSettings={saveSettings} accent={accent} />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: accent }}>
                    {settings.avatar}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold" style={{ color: accent }}>
                      {settings.botName}
                    </h1>
                    <p className="text-lg opacity-70">@{new Date().toLocaleTimeString()} EST • @Kevin_Phan25</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-3 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {settings.showEquity && (
                <StatCard icon={DollarSign} label="Equity" value={`$${Number(equity).toLocaleString()}`} color={accent} />
              )}
              {settings.showPositions && (
                <StatCard icon={Zap} label="Positions" value={`${positions}/${settings.maxPositions}`} color={accent} />
              )}
              {settings.showLoss && (
                <StatCard
                  icon={AlertTriangle}
                  label="Daily Loss"
                  value={`$${dailyLoss.toFixed(0)}/${settings.dailyLossCap}`}
                  color={dailyLoss > settings.dailyLossCap * 0.8 ? '#ef4444' : accent}
                />
              )}
              <StatCard icon={Clock} label="Last Scan" value={lastScan} color={accent} />
            </div>

            {/* Chart */}
            {settings.showChart && (
              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-800 mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" style={{ color: accent }} />
                  Equity Curve
                </h2>
                <div className="h-80">
                  <ResponsiveContainer>
                    <LineChart data={pnlData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
                      <Line type="monotone" dataKey="equity" stroke={accent} strokeWidth={4} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Live Feed */}
            {settings.showFeed && (
              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-800">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6" style={{ color: accent }} />
                  Live Activity
                </h2>
                <div className="font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
                  {logs.length === 0 && <p className="text-center py-8 opacity-50">Waiting for data...</p>}
                  {logs.map((log, i) => (
                    <LogItem key={i} log={log} accent={accent} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Components
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="w-10 h-10" style={{ color }} />
      </div>
    </div>
  );
}

function LogItem({ log, accent }: { log: Log; accent: string }) {
  const colors: any = {
    TRADE: 'bg-emerald-900/40 border-emerald-500',
    CLOSED: 'bg-blue-900/40 border-blue-500',
    SHUTOFF: 'bg-red-900/60 border-red-500',
    HEARTBEAT: 'bg-gray-800/50',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[log.type] || 'bg-gray-800/50'}`}>
      <span className="text-slate-500">[{new Date(log.t).toLocaleTimeString()}]</span>{' '}
      <span className="font-bold" style={{ color: accent }}>{log.type}</span>{' '}
      {log.data.symbol && <span className="font-bold text-emerald-400">{log.data.symbol}</span>}
      {log.data.msg && <span>→ {log.data.msg}</span>}
      {log.data.profit && <span className="text-emerald-400"> P&L: ${log.data.profit}</span>}
    </div>
  );
}

function SettingsPanel({ settings, setSettings, saveSettings, accent }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-sm opacity-70 hover:opacity-100">
          Reset
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm opacity-70">Bot Name</label>
          <input
            value={settings.botName}
            onChange={e => setSettings({ ...settings, botName: e.target.value })}
            className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm opacity-70">Avatar Letters</label>
          <input
            value={settings.avatar}
            onChange={e => setSettings({ ...settings, avatar: e.target.value.slice(0, 3) })}
            maxLength={3}
            className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-lg text-center text-2xl font-bold"
          />
        </div>

        <div>
          <label className="text-sm opacity-70">Theme</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setSettings({ ...settings, theme: 'dark' })}
              className={`flex-1 py-2 rounded-lg ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-800'}`}
            >
              <Moon className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => setSettings({ ...settings, theme: 'light' })}
              className={`flex-1 py-2 rounded-lg ${settings.theme === 'light' ? 'bg-slate-700' : 'bg-slate-800'}`}
            >
              <Sun className="w-5 h-5 mx-auto" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm opacity-70">Accent Color</label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {Object.entries(ACCENT_PRESETS).map(([name, color]) => (
              <button
                key={name}
                onClick={() => setSettings({ ...settings, accentColor: color })}
                className={`w-full h-10 rounded-lg border-2 ${settings.accentColor === color ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm opacity-70">Risk Limits</label>
          <input type="number" placeholder="Daily Loss Cap" value={settings.dailyLossCap} onChange={e => setSettings({ ...settings, dailyLossCap: +e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded-lg" />
          <input type="number" placeholder="Max Positions" value={settings.maxPositions} onChange={e => setSettings({ ...settings, maxPositions: +e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded-lg" />
          <input type="number" placeholder="Drawdown % Shutoff" value={settings.drawdownShutoff} onChange={e => setSettings({ ...settings, drawdownShutoff: +e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded-lg" />
        </div>

        <div>
          <label className="text-sm opacity-70">Show Panels</label>
          <div className="space-y-2 mt-2">
            {['showEquity', 'showPositions', 'showLoss', 'showChart', 'showFeed'].map(key => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={e => setSettings({ ...settings, [key]: e.target.checked })}
                />
                <span className="text-sm">{key.replace('show', '').replace('Loss', ' Daily Loss')}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={saveSettings}
          className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
          style={{ backgroundColor: accent }}
        >
          <Save className="w-5 h-5" /> Save & Apply
        </button>
      </div>
    </div>
  );
}
