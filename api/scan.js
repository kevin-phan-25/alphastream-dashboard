// api/scan.js
import { scan } from '../services/scanner.js';
export default async (req, res) => { await scan(); res.json({ ok: true }); };

// api/close.js
import { closeAll } from '../services/alpaca.js';
export default async (req, res) => { await closeAll(); res.json({ ok: true }); };

// api/trades.js
import pool from '../db/pool.js';
export default async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM trades ORDER BY created_at DESC LIMIT 50');
  res.json(rows);
};

// api/logs.js
import pool from '../db/pool.js';
export default async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
};
