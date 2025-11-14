import axios from 'axios';
import { log } from '../utils/logger.js';

const BASE = process.env.PAPER_ONLY === 'true'
  ? 'https://paper-api.alpaca.markets/v2'
  : 'https://api.alpaca.markets/v2';

const client = axios.create({
  baseURL: BASE,
  headers: {
    'APCA-API-KEY-ID': process.env.ALPACA_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET
  }
});

export const getEquity = async () => {
  try {
    const { data } = await client.get('/account');
    return parseFloat(data.cash || 25000);
  } catch {
    return 25000;
  }
};

export const placeOrder = async (sig) => {
  const payload = {
    symbol: sig.symbol,
    qty: sig.qty,
    side: 'buy',
    type: 'limit',
    limit_price: sig.price,
    time_in_force: 'day',
    order_class: 'bracket',
    take_profit: { limit_price: sig.target },
    stop_loss: { stop_price: sig.stop }
  };

  try {
    await client.post('/orders', payload);
    await log('EXECUTED', sig.symbol, `BUY @${sig.price}`);
    return true;
  } catch (err) {
    await log('ORDER_FAIL', sig.symbol, err.message);
    return false;
  }
};

export const getPositions = async () => {
  try {
    const { data } = await client.get('/positions');
    return data;
  } catch {
    return [];
  }
};

export const closeAll = async () => {
  const positions = await getPositions();
  for (const p of positions) {
    try {
      await client.delete(`/positions/${p.symbol}`);
      await log('CLOSED', p.symbol, `P&L: $${p.unrealized_pl}`);
    } catch {}
  }
};
