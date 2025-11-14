import { getPositions, closePosition } from '../services/alpaca.js';
import { dashboard } from '../services/dashboard.js';
import { log } from '../utils/logger.js';
import pool from '../db/pool.js';

export const closeAll = async () => {
  const positions = await getPositions();
  let totalPnL = 0;

  for (const p of positions) {
    const pnl = parseFloat(p.unrealized_pl || 0);
    totalPnL += pnl;
    await closePosition(p.symbol);
    await log('CLOSED', p.symbol, `P&L: $${pnl.toFixed(2)}`);
    await dashboard('EXIT', { symbol: p.symbol, pnl });
  }

  if (totalPnL !== 0) {
    const { rows } = await pool.query('SELECT daily_loss FROM risk LIMIT 1');
    const newLoss = rows[0].daily_loss + totalPnL;
    await pool.query('UPDATE risk SET daily_loss = $1', [newLoss]);
    if (totalPnL < 0) await dashboard('DAILY_PNL', { pnl: totalPnL });
  }
};
