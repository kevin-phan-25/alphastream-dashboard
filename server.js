import express from 'express';
import cors from 'cors';
import pool from './db/pool.js';
import { scan } from './services/scanner.js';
import { closeAll } from './jobs/closePositions.js';
import { dashboard } from './services/dashboard.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/trades', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM trades ORDER BY created_at DESC LIMIT 50');
  res.json(rows);
});

app.get('/api/logs', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
});

app.post('/api/scan', async (req, res) => {
  await scan();
  res.json({ status: 'scanned' });
});

app.post('/api/close', async (req, res) => {
  await closeAll();
  res.json({ status: 'closed' });
});

app.get('/api/ping', (req, res) => {
  dashboard('PING', { msg: 'Node.js backend alive' });
  res.json({ status: 'ok', version: 'v20.9.6' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
});
