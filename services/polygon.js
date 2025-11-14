import axios from 'axios';
import { log } from '../utils/logger.js';

const client = axios.create({
  baseURL: 'https://api.polygon.io',
  params: { apiKey: process.env.POLYGON_KEY }
});

export const getGappers = async () => {
  try {
    const { data } = await client.get('/v3/reference/tickers', {
      params: { market: 'stocks', active: true, type: 'CS', limit: 1000 }
    });

    const candidates = [];
    for (const t of data.results.slice(0, 500)) {
      if (!t.ticker || t.ticker.includes('^') || t.ticker.includes('.')) continue;

      const snap = await client.get(`/v2/snapshot/locale/us/markets/stocks/tickers`, {
        params: { tickers: t.ticker }
      }).catch(() => ({ data: { ticker: {} } }));

      const s = snap.data.ticker;
      const price = s.lastTrade?.p || s.day?.c || s.prevDay?.c || 0;
      const vol = s.day?.v || 0;
      const prevClose = s.prevDay?.c || price;

      if (price < 1 || price > 20 || vol < 500000) continue;
      const rvol = vol / (prevClose * 100000);
      if (rvol < 2.5) continue;

      const marketCap = t.market_cap || 0;
      const floatShares = t.share_class_shares_outstanding || t.total_shares_outstanding || 0;
      if (marketCap > 500000000 || floatShares > 20000000) continue;

      candidates.push({ sym: t.ticker, price, vol, rvol, marketCap, float: floatShares });
    }

    candidates.sort((a, b) => b.rvol - a.rvol);
    return candidates.slice(0, 20);
  } catch (err) {
    log('POLYGON_FAIL', '', err.message);
    return [];
  }
};

export const getBars = async (symbol) => {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 2 * 3600 * 1000).toISOString().split('T')[0];
  try {
    const { data } = await client.get(`/v2/aggs/ticker/${symbol}/range/1/minute/${from}/${to}`, {
      params: { adjusted: true, limit: 500 }
    });
    return data.results || [];
  } catch (err) {
    return [];
  }
};
