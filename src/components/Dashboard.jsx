import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = ({ data }) => {
  // Mock P&L data — replace with real from backend
  const chartData = [
    { name: 'Mon', pnl: 400 },
    { name: 'Tue', pnl: 300 },
    { name: 'Wed', pnl: 500 },
    { name: 'Thu', pnl: 280 },
    { name: 'Fri', pnl: 600 },
  ];

  return (
    <div>
      <h1>AlphaStream v20.9.6 Dashboard</h1>
      <div className="stats">
        <div>Active Positions: {data.trades.filter(t => t.status === 'FILLED').length}</div>
        <div>Total P&L: ${data.trades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2)}</div>
        <div>Logs: {data.logs.length}</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pnl" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Dashboard;
