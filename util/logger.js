import pool from '../db/pool.js';

export const log = async (event, symbol = '', note = '') => {
  try {
    await pool.query(
      'INSERT INTO logs (event, symbol, note) VALUES ($1, $2, $3)',
      [event, symbol, note]
    );
    console.log(`[${new Date().toISOString()}] ${event} | ${symbol} | ${note}`);
  } catch (err) {
    console.error('LOG ERROR:', err);
  }
};
