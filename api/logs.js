// api/logs.js
import pool from '../db/pool.js';
export default async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
};
