import axios from 'axios';
import { log } from '../utils/logger.js';

const ALPACA_BASE = process.env.PAPER_ONLY === 'true'
  ? 'https://paper-api.alpaca.markets/v2'
  : 'https://api.alpaca.markets/v2';

const client = axios.create({
  baseURL: ALPACA_BASE,
  headers: {
    'APCA-API-KEY-ID': process.env.ALPACA_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET
  }
});

export const getEquity = async () => {
  try {
    const { data } = await client.get('/account');
    return parseFloat(data.cash || data.equity || 25000);
  } catch (err) {
    log('ALPACA_ERROR', '', err.message);
    return 25000;
  }
};

export const getPositions = async () => {
  try {
    const { data } = await client.get('/positions');
    return data;
  } catch (err) {
    return [];
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
    const { data } = await client.post('/orders', payload);
    await log('EXECUTED', sig.symbol, `BUY @${sig.price} ×${sig.qty}`);
    return true;
  } catch (err) {
    await log('ORDER_FAIL', sig.symbol, err.response?.data?.message || err.message);
    return false;
  }
};

export const closePosition = async (symbol) => {
  try {
    await client.delete(`/positions/${symbol}`);
    return true;
  } catch (err) {
    return false;
  }
};
