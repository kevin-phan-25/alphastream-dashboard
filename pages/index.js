import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../styles/Home.module.css'; // Your existing styles

export default function Home() {
  const [data, setData] = useState({
    equity: 99998.93,
    positions: 0,
    dailyLoss: 0,
    lastScan: '11:52:29 AM',
    winRate: 0,
    trades: [],
    logs: ['Waiting for data...']
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.json?t=' + Date.now());
        if (response.ok) {
          const newData = await response.json();
          setData(newData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  const chartData = data.trades.slice().reverse().map((trade, index) => ({
    name: `Trade ${index + 1}`,
    equity: data.equity + (trade.pnl || 0)
  }));

  return (
    <div className={styles.container}>
      {/* Your existing sidebar - settings, risk limits, panels */}
      <div className={styles.sidebar}>
        <div className={styles.settings}>
          <h3>Settings</h3>
          <input type="text" defaultValue="Alphastream" placeholder="Bot Name" />
          <input type="file" accept="image/*" />
          <div className={styles.themeToggle}>
            <button>🌙</button>
            <button>☀️</button>
          </div>
        </div>
        <div className={styles.riskLimits}>
          <h3>Risk Limits</h3>
          <label>Daily Loss Cap: <input type="number" defaultValue={300} /> $</label>
          <label>Max Positions: <input type="number" defaultValue={3} /></label>
          <label>Max Drawdown: <input type="number" defaultValue={15} /> %</label>
        </div>
        <div className={styles.panels}>
          <label><input type="checkbox" defaultChecked /> Equity</label>
          <label><input type="checkbox" defaultChecked /> Daily P&L</label>
          <label><input type="checkbox" defaultChecked /> Positions</label>
        </div>
      </div>

      {/* Your existing main content */}
      <div className={styles.main}>
        <div className={styles.header}>
          <div className={styles.botInfo}>
            <img src="/avatar-placeholder.png" alt="Avatar" className={styles.avatar} />
            <div>
              <h1>Alphastream</h1>
              <p>@Kevin_Phan25 • {new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} EST</p>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.label}>Win Rate</div>
              <div className={styles.value}>{data.winRate}%</div>
            </div>
            <button className={styles.resetBtn}>Reset</button>
          </div>
        </div>

        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.label}>Equity</div>
            <div className={styles.value}>$ {data.equity.toLocaleString()}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Positions</div>
            <div className={styles.value}>{data.positions}/3</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Daily Loss</div>
            <div className={styles.value}>$ {data.dailyLoss}/300</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Last Scan</div>
            <div className={styles.value}>{data.lastScan}</div>
          </div>
        </div>

        <div className={styles.chartSection}>
          <h3>Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="equity" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.activitySection}>
          <h3>Live Activity</h3>
          <div className={styles.activityLog}>
            {data.logs.map((log, index) => (
              <div key={index} className={styles.logEntry}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
