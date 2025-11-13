// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Zap, AlertTriangle, TrendingUp, Clock, Settings, Sun, Moon, Save } from 'lucide-react';

interface Log { type: string; data: any; t: string; }
interface Settings {
  botName: string; avatar: string; theme: 'dark' | 'light'; accentColor: string;
  dailyLossCap: number; maxPositions: number; drawdownShutoff: number;
  showEquity: boolean; showPositions: boolean; showLoss: boolean; showChart: boolean; showFeed: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  botName: 'AlphaStream', avatar: 'KP', theme: 'dark', accentColor: '#10b981',
  dailyLossCap: 300, maxPositions: 3, drawdownShutoff: 15,
  showEquity: true, showPositions: true, showLoss: true, showChart: true, showFeed: true,
};

const ACCENT_PRESETS = { emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7', orange: '#f97316', red: '#ef4444' };

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [equity, setEquity] = useState(25000);
  const [positions, setPositions] = useState(0);
  const [dailyLoss, setDailyLoss] = useState(0);
  const [lastScan, setLastScan] = useState('Never');
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
      if (log.type === 'TRADE') setPositions(p => p + 1);
      if (log.type === 'CLOSED') setPositions(p => p - 1);
    };
    evtSource.onerror = () => evtSource.close();
    return () => evtSource.close();
  }, []);

  const accent = settings.accentColor;

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-slate-900 border-r border-slate-800 h-full overflow-y-auto p-6">
        <SettingsPanel settings={settings} setSettings={setSettings} saveSettings={saveSettings} accent={accent} />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 w-64 h-full bg-slate-900 p-6 overflow-y-auto">
            <SettingsPanel settings={settings} setSettings={setSettings} saveSettings={saveSettings} accent={accent} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col h-full">
        <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: accent }}>
              {settings.avatar}
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: accent }}>{settings.botName}</h1>
              <p className="text-sm opacity-70">@{new Date().toLocaleTimeString()} EST • @Kevin_Phan25</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded bg-slate-800">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {settings.showEquity && <StatCard icon={DollarSign} label="Equity" value={`$${equity.toLocaleString()}`} color={accent} />}
            {settings.showPositions && <StatCard icon={Zap} label="Positions" value={`${positions}/${settings.maxPositions}`} color={accent} />}
            {settings.showLoss && <StatCard icon={AlertTriangle} label="Daily Loss" value={`$${dailyLoss}/${settings.dailyLossCap}`} color={dailyLoss > settings.dailyLossCap * 0.8 ? '#ef4444' : accent} />}
            <StatCard icon={Clock} label="Last Scan" value={lastScan} color={accent} />
          </div>

          {settings.showChart && (
            <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" style={{ color: accent }} /> Equity Curve</h2>
              <div className="h-64"><ResponsiveContainer><LineChart data={pnlData}><CartesianGrid stroke="#334155" /><XAxis dataKey="time" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} /><Line type="monotone" dataKey="equity" stroke={accent} strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
            </div>
          )}

          {settings.showFeed && (
            <div className="bg-slate-900/50 backdrop-blur rounded-xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5" style={{ color: accent }} /> Live Activity</h2>
              <div className="text-sm font-mono space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? <p className="text-center py-8 opacity-50">Waiting...</p> : logs.map((log, i) => <LogItem key={i} log={log} accent={accent} />)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Components (same as before)
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-slate-900/50 backdrop-blur rounded-lg p-4 border border-slate-800">
      <div className="flex items-center justify-between">
        <div><p className="text-slate-400 text-xs">{label}</p><p className="text-xl font-bold">{value}</p></div>
        <Icon className="w-8 h-8" style={{ color }} />
      </div>
    </div>
  );
}

function LogItem({ log, accent }: { log: Log; accent: string }) {
  const colors: any = { TRADE: 'bg-emerald-900/40 border-emerald-500', CLOSED: 'bg-blue-900/40 border-blue-500', SHUTOFF: 'bg-red-900/60 border-red-500', HEARTBEAT: 'bg-gray-800/50' };
  return (
    <div className={`p-2 rounded border text-xs ${colors[log.type] || 'bg-gray-800/50'}`}>
      <span className="text-slate-500">[{new Date(log.t).toLocaleTimeString()}]</span>{' '}
      <span className="font-bold" style={{ color: accent }}>{log.type}</span>{' '}
      {log.data.symbol && <span className="text-emerald-400">{log.data.symbol}</span>}
      {log.data.profit && <span className="text-emerald-400"> P&L: ${log.data.profit}</span>}
    </div>
  );
}

function SettingsPanel({ settings, setSettings, saveSettings, accent }: any) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between"><h2 className="text-xl font-bold">Settings</h2><button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-xs opacity-70">Reset</button></div>

      <div><label>Bot Name</label><input value={settings.botName} onChange={e => setSettings({ ...settings, botName: e.target.value })} className="w-full mt-1 px-3 py-1 bg-slate-800 rounded" /></div>
      <div><label>Avatar</label><input value={settings.avatar} onChange={e => setSettings({ ...settings, avatar: e.target.value.slice(0,3) })} maxLength={3} className="w-full mt-1 px-3 py-1 bg-slate-800 rounded text-center font-bold" /></div>

      <div><label>Theme</label><div className="flex gap-1 mt-1">
        <button onClick={() => setSettings({ ...settings, theme: 'dark' })} className={`flex-1 py-1 rounded ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-800'}`}><Moon className="w-4 h-4 mx-auto" /></button>
        <button onClick={() => setSettings({ ...settings, theme: 'light' })} className={`flex-1 py-1 rounded ${settings.theme === 'light' ? 'bg-slate-700' : 'bg-slate-800'}`}><Sun className="w-4 h-4 mx-auto" /></button>
      </div></div>

      <div><label>Accent</label><div className="grid grid-cols-5 gap-1 mt-1">
        {Object.entries(ACCENT_PRESETS).map(([n, c]) => (
          <button key={n} onClick={() => setSettings({ ...settings, accentColor: c })} className={`h-8 rounded border-2 ${settings.accentColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
        ))}
      </div></div>

      <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
        <label className="font-bold text-emerald-400">Risk Limits</label>
        <div className="space-y-2 mt-2 text-xs">
          <div className="flex justify-between"><span>Daily Loss Cap</span><span>${settings.dailyLossCap}</span></div>
          <input type="number" value={settings.dailyLossCap} onChange={e => setSettings({ ...settings, dailyLossCap: +e.target.value })} className="w-full px-2 py-1 bg-slate-700 rounded" />
          <div className="flex justify-between"><span>Max Positions</span><span>{settings.maxPositions}</span></div>
          <input type="number" value={settings.maxPositions} onChange={e => setSettings({ ...settings, maxPositions: +e.target.value })} className="w-full px-2 py-1 bg-slate-700 rounded" />
          <div className="flex justify-between"><span>Max Drawdown</span><span>{settings.drawdownShutoff}%</span></div>
          <input type="number" value={settings.drawdownShutoff} onChange={e => setSettings({ ...settings, drawdownShutoff: +e.target.value })} className="w-full px-2 py-1 bg-slate-700 rounded" />
        </div>
      </div>

      <div><label>Show Panels</label><div className="space-y-1 mt-1">
        {['showEquity', 'showPositions', 'showLoss', 'showChart', 'showFeed'].map(k => (
          <label key={k} className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={settings[k]} onChange={e => setSettings({ ...settings, [k]: e.target.checked })} />
            <span>{k.replace('show', '').replace('Loss', ' Daily Loss')}</span>
          </label>
        ))}
      </div></div>

      <button onClick={saveSettings} className="w-full py-2 rounded font-bold flex items-center justify-center gap-1 mt-4" style={{ backgroundColor: accent }}>
        <Save className="w-4 h-4" /> Save & Apply
      </button>
    </div>
  );
}
