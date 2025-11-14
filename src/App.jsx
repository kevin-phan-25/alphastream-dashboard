import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Trades from './components/Trades';
import Logs from './components/Logs';
import './App.css';

function App({ apiUrl }) {
  const [data, setData] = useState({ trades: [], logs: [], status: 'loading' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [apiUrl]);

  const fetchData = async () => {
    try {
      const [tradesRes, logsRes] = await Promise.all([
        axios.get(`${apiUrl}/trades`),
        axios.get(`${apiUrl}/logs`)
      ]);
      setData({
        trades: tradesRes.data,
        logs: logsRes.data,
        status: 'live'
      });
    } catch (err) {
      console.error('API Error:', err);
      setData(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleScan = async () => {
    try {
      await axios.post(`${apiUrl}/scan`);
      fetchData(); // Refresh
    } catch (err) {
      console.error('Scan Error:', err);
    }
  };

  const handleClose = async () => {
    try {
      await axios.post(`${apiUrl}/close`);
      fetchData();
    } catch (err) {
      console.error('Close Error:', err);
    }
  };

  return (
    <div className="App">
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/trades">Trades</Link>
        <Link to="/logs">Logs</Link>
        <button onClick={handleScan}>Manual Scan</button>
        <button onClick={handleClose}>Close All</button>
        <span>Status: {data.status}</span>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard data={data} />} />
        <Route path="/trades" element={<Trades trades={data.trades} />} />
        <Route path="/logs" element={<Logs logs={data.logs} />} />
      </Routes>
    </div>
  );
}

export default App;
