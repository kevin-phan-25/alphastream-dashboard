// api/trades.js
import pool from '../db/pool.js';
export default async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM trades ORDER BY created_at DESC LIMIT 50');
  res.json(rows);
};
