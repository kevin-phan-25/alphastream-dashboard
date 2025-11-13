'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Zap, AlertTriangle, TrendingUp, Clock, Settings, Sun, Moon, Palette, Save, X } from 'lucide-react';

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
    window.location.reload();
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
    <div className={`h-screen transition-colors ${settings.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'} m-0 p-0`}>
      
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
      <div className="hidden lg:block lg:w-64 lg:border-r lg:border-slate-800 lg:bg-slate-950 h-screen m-0 p-0">
        <div className="sticky top-0 h-full p-6 overflow-y-auto m-0 pt-0">
          <SettingsPanel settings={settings} setSettings={setSettings} saveSettings={saveSettings} accent={accent} />
        </div>
      </div>

      {/* Main Content – ABSOLUTE ZERO TOP */}
      <div className="lg:pl-64 h-full m-0 p-0">
        <div className="h-full px-4 lg:px-8 m-0 p-0 pt-0"> {/* ZERO PT */}
          <div className="flex flex-col h-full m-0 p-0">
            {/* Header – ZERO MARGIN */}
            <header className="mb-8 mt-0 !mt-0 flex-shrink-0 p-0 m-0"> {/* !mt-0 overrides */}
              <div className="flex items-center justify-between p-0 m-0">
                <div className="flex items-center gap-4 p-0 m-0">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: accent }}>
                    {settings.avatar}
                  </div>
                  <div className="p-0 m-0">
                    <h1 className="text-4xl font-bold m-0 p-0" style={{ color: accent }}>
                      {settings.botName}
                    </h1>
                    <p className="text-lg opacity-70 m-0 p-0">@{new Date().toLocaleTimeString()} EST • @Kevin_Phan25</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-3 rounded-lg bg-slate-800 hover:bg-slate-700 m-0"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto space-y-8 p-0 m-0">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-0 m-0">
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
                <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-800 m-0">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 m-0 p-0">
                    <TrendingUp className="w-6 h-6" style={{ color: accent }} />
                    Equity Curve
                  </h2>
                  <div className="h-80 m-0 p-0">
                    <ResponsiveContainer className="m-0 p-0">
                      <LineChart data={pnlData} className="m-0 p-0">
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
                <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-800 m-0">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 m-0 p-0">
                    <Activity className="w-6 h-6" style={{ color: accent }} />
                    Live Activity
                  </h2>
                  <div className="font-mono text-sm space-y-2 max-h-96 overflow-y-auto m-0 p-0">
                    {logs.length === 0 && <p className="text-center py-8 opacity-50 m-0 p-0">Waiting for data...</p>}
                    {logs.map((log, i) => (
                      <LogItem key={i} log={log} accent={accent} />
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

// Components (unchanged, with m-0 p-0 for safety)
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-slate-800 m-0 p-0">
      <div className="flex items-center justify-between m-0 p-0">
        <div className="m-0 p-0">
          <p className="text-slate-400 text-sm m-0 p-0">{label}</p>
          <p className="text-2xl font-bold m-0 p-0">{value}</p>
        </div>
        <Icon className="w-10 h-10 m-0 p-0" style={{ color }} />
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
    <div className={`p-3 rounded-lg border ${colors[log.type] || 'bg-gray-800/50'} m-0 p-0`}>
      <span className="text-slate-500 m-0 p-0">[{new Date(log.t).toLocaleTimeString()}]</span>{' '}
      <span className="font-bold m-0 p-0" style={{ color: accent }}>{log.type}</span>{' '}
      {log.data.symbol && <span className="font-bold text-emerald-400 m-0 p-0">{log.data.symbol}</span>}
      {log.data.msg && <span className="m-0 p-0">→ {log.data.msg}</span>}
      {log.data.profit && <span className="text-emerald-400 m-0 p-0"> P&L: ${log.data.profit}</span>}
    </div>
  );
}

function SettingsPanel({ settings, setSettings, saveSettings, accent }: any) {
  return (
    <div className="space-y-6 m-0 p-0">
      <div className="flex items-center justify-between mb-6 m-0 p-0">
        <h2 className="text-2xl font-bold m-0 p-0">Settings</h2>
        <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-sm opacity-70 hover:opacity-100 m-0 p-0">
          Reset
        </button>
      </div>

      <div className="m-0 p-0">
        <label className="text-sm opacity-70 m-0 p-0">Bot Name</label>
        <input
          value={settings.botName}
          onChange={e => setSettings({ ...settings, botName: e.target.value })}
          className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-lg m-0 p-0"
        />
      </div>

      <div className="m-0 p-0">
        <label className="text-sm opacity-70 m-0 p-0">Avatar Letters</label>
        <input
          value={settings.avatar}
          onChange={e => setSettings({ ...settings, avatar: e.target.value.slice(0, 3) })}
          maxLength={3}
          className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-lg text-center text-2xl font-bold m-0 p-0"
        />
      </div>

      <div className="m-0 p-0">
        <label className="text-sm opacity-70 m-0 p-0">Theme</label>
        <div className="flex gap-2 mt-2 m-0 p-0">
          <button
            onClick={() => setSettings({ ...settings, theme: 'dark' })}
            className={`flex-1 py-2 rounded-lg ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-800'} m-0 p-0`}
          >
            <Moon className="w-5 h-5 mx-auto m-0 p-0" />
          </button>
          <button
            onClick={() => setSettings({ ...settings, theme: 'light' })}
            className={`flex-1 py-2 rounded-lg ${settings.theme === 'light' ? 'bg-slate-700' : 'bg-slate-800'} m-0 p-0`}
          >
            <Sun className="w-5 h-5 mx-auto m-0 p-0" />
          </button>
        </div>
      </div>

      <div className="m-0 p-0">
        <label className="text-sm opacity-70 m-0 p-0">Accent Color</label>
        <div className="grid grid-cols-5 gap-2 mt-2 m-0 p-0">
          {Object.entries(ACCENT_PRESETS).map(([name, color]) => (
            <button
              key={name}
              onClick={() => setSettings({ ...settings, accentColor: color })}
              className={`w-full h-10 rounded-lg border-2 ${settings.accentColor === color ? 'border-white' : 'border-transparent'} m-0 p-0`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* RISK LIMITS */}
      <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 m-0 p-0">
        <label className="text-sm font-bold text-emerald-400 m-0 p-0">Risk Limits</label>
        
        <div className="space-y-3 m-0 p-0">
          <div className="flex justify-between items-center m-0 p-0">
            <span className="text-sm opacity-75 m-0 p-0">Daily Loss Cap</span>
            <span className="font-mono text-emerald-300 m-0 p-0">${settings.dailyLossCap}</span>
          </div>
          <input
            type="number"
            value={settings.dailyLossCap}
            onChange={e => setSettings({ ...settings, dailyLossCap: +e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm m-0 p-0"
            placeholder="e.g. 300"
          />

          <div className="flex justify-between items-center m-0 p-0">
            <span className="text-sm opacity-75 m-0 p-0">Max Positions</span>
            <span className="font-mono text-emerald-300 m-0 p-0">{settings.maxPositions}</span>
          </div>
          <input
            type="number"
            value={settings.maxPositions}
            onChange={e => setSettings({ ...settings, maxPositions: +e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm m-0 p-0"
            placeholder="e.g. 3"
          />

          <div className="flex justify-between items-center m-0 p-0">
            <span className="text-sm opacity-75 m-0 p-0">Max Drawdown</span>
            <span className="font-mono text-emerald-300 m-0 p-0">{settings.drawdownShutoff}%</span>
          </div>
          <input
            type="number"
            value={settings.drawdownShutoff}
            onChange={e => setSettings({ ...settings, drawdownShutoff: +e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm m-0 p-0"
            placeholder="e.g. 15"
          />
        </div>
      </div>

      <div className="m-0 p-0">
        <label className="text-sm opacity-70 m-0 p-0">Show Panels</label>
        <div className="space-y-2 mt-2 m-0 p-0">
          {['showEquity', 'showPositions', 'showLoss', 'showChart', 'showFeed'].map(key => (
            <label key={key} className="flex items-center gap-2 m-0 p-0">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={e => setSettings({ ...settings, [key]: e.target.checked })}
                className="m-0 p-0"
              />
              <span className="text-sm m-0 p-0">{key.replace('show', '').replace('Loss', ' Daily Loss')}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-20 m-0 p-0" />
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="w-full py-2 text-xs opacity-60 hover:opacity-100 mb-4 m-0 p-0"
      >
        Back to Top
      </button>

      <button
        onClick={saveSettings}
        className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition hover:opacity-90 m-0 p-0"
        style={{ backgroundColor: accent }}
      >
        <Save className="w-5 h-5 m-0 p-0" /> Save & Apply
      </button>
    </div>
  );
}
