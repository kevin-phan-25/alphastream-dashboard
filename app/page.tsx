'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface Log {
  type: string;
  data: any;
  t: string;
}

export default function AlphaStreamDashboard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [equity, setEquity] = useState('100000');
  const [positions, setPositions] = useState(0);
  const [dailyLoss, setDailyLoss] = useState('0');
  const [lastScan, setLastScan] = useState('Never');
  const [marketStatus, setMarketStatus] = useState<'PAUSE' | 'NUCLEAR'>('PAUSE');
  const [pnlData, setPnlData] = useState<{ time: string; equity: string }[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const evtSource = useRef<EventSource | null>(null);

  useEffect(() => {
    evtSource.current = new EventSource('/api/sse');

    evtSource.current.onopen = () => {
      setIsConnected(true);
    };

    evtSource.current.onmessage = (e) => {
      const log: Log = JSON.parse(e.data);
      setLogs(prev => [log, ...prev].slice(0, 100));

      // === STATS UPDATE ===
      if (log.type === 'STATS') {
        setEquity(log.data.equity || equity);
        setPositions(log.data.positions || positions);
        setDailyLoss(log.data.dailyLoss || dailyLoss);
        setPnlData(prev => [...prev, {
          time: new Date(log.t).toLocaleTimeString(),
          equity: log.data.equity
        }].slice(-50));
      }

      // === LAST SCAN UPDATE (FIXED) ===
      if (log.type === 'SCAN') {
        setLastScan(new Date(log.t).toLocaleTimeString());
      }

      // === MARKET STATUS ===
      if (log.type === 'PAUSE') {
        setMarketStatus('PAUSE');
      }
      if (log.type === 'MARKET_CONFIRMED') {
        setMarketStatus('NUCLEAR');
      }

      // === TRADE EXECUTED ===
      if (log.type === 'TRADE') {
        setTrades(prev => [{
          symbol: log.data.symbol,
          entry: log.data.entry,
          qty: log.data.qty,
          time: new Date(log.t).toLocaleTimeString(),
          status: 'OPEN'
        }, ...prev].slice(0, 10));
      }

      // === POSITION CLOSED ===
      if (log.type === 'CLOSED') {
        setTrades(prev => prev.map(t => 
          t.symbol === log.data.symbol 
            ? { ...t, status: 'CLOSED', profit: log.data.profit }
            : t
        ));
      }

      // === SHUTOFF ===
      if (log.type === 'SHUTOFF') {
        setMarketStatus('PAUSE');
      }
    };

    evtSource.current.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      evtSource.current?.close();
    };
  }, []);

  const pnlChange = pnlData.length > 1 
    ? ((parseFloat(equity) - parseFloat(pnlData[0].equity)) / parseFloat(pnlData[0].equity) * 100).toFixed(2)
    : '0';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                AlphaStream v19.8.1
              </h1>
              <p className="text-gray-400">Dynamic Penny Hunter | $1–$20 Movers Only</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isConnected ? "default" : "destructive"} className="px-3 py-1">
                {isConnected ? (
                  <><Activity className="w-4 h-4 mr-1" /> LIVE</>
                ) : (
                  <><AlertCircle className="w-4 h-4 mr-1" /> OFFLINE</>
                )}
              </Badge>
              <Badge variant={marketStatus === 'NUCLEAR' ? "default" : "secondary"}>
                {marketStatus === 'NUCLEAR' ? (
                  <><TrendingUp className="w-4 h-4 mr-1" /> NUCLEAR MODE</>
                ) : (
                  <><AlertCircle className="w-4 h-4 mr-1" /> PAUSED</>
                )}
              </Badge>
            </div>
          </div>

          {/* METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Account Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${parseFloat(equity).toLocaleString()}</div>
                <p className="text-xs text-gray-400">
                  {parseFloat(pnlChange) > 0 ? '+' : ''}{pnlChange}% today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{positions}/3</div>
                <p className="text-xs text-gray-400">Max 3 concurrent</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Daily Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dailyLoss}</div>
                <p className="text-xs text-gray-400">Cap: $300</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Last Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lastScan}</div>
                <p className="text-xs text-gray-400">Every 60s</p>
              </CardContent>
            </Card>
          </div>

          {/* P&L CHART */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Real-Time P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pnlData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ACTIVE TRADES */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Active Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No active trades</p>
              ) : (
                <div className="space-y-3">
                  {trades.map((trade, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-semibold">{trade.symbol}</div>
                        <div className="text-sm text-gray-400">
                          Entry: ${trade.entry} × {trade.qty} shares
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={trade.status === 'OPEN' ? 'default' : trade.profit > 0 ? 'default' : 'destructive'}>
                          {trade.status === 'OPEN' ? 'LIVE' : trade.profit > 0 ? `+$${trade.profit}` : `-$${Math.abs(trade.profit)}`}
                        </Badge>
                        <div className="text-xs text-gray-400">{trade.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LOGS */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Live Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                {logs.slice(0, 20).map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-500">
                      {new Date(log.t).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {log.type}
                    </Badge>
                    {log.data.symbol && <span className="font-semibold">{log.data.symbol}</span>}
                    <span className="text-gray-400">
                      {log.type === 'SCAN' && `${log.data.tickersScanned} scanned → ${log.data.signals} signals`}
                      {log.type === 'TRADE' && `EXECUTED @ $${log.data.entry}`}
                      {log.type === 'NUCLEAR_MODE' && 'NUCLEAR UNLOCKED'}
                      {log.type === 'MARKET_WEAK' && 'Waiting for SPY/VIX'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FOOTER */}
          <div className="text-center text-gray-500 text-sm">
            <p>AlphaStream v19.8.1 — 75%+ Win Rate | Dynamic $1–$20 Movers</p>
            <p className="mt-1">@Kevin_Phan25</p>
          </div>
        </div>
      </div>
    </>
  );
}
