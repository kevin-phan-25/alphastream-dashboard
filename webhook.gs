// webhook.gs — Add to your main script
const WEBHOOK_URL = 'https://yourdomain.com/webhook'; // ← CHANGE

function pushToDashboard(type, data) {
  const payload = { type, data };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  try {
    UrlFetchApp.fetch(WEBHOOK_URL, options);
  } catch (e) {
    Logger.log('WEBHOOK FAILED: ' + e);
  }
}

// Hook into your existing functions
function scanRossMicroPullback() {
  const candidates = /* your logic */;
  pushToDashboard('SCANNER', candidates);
  return candidates;
}

function logTrade(stock, event, exitPrice, notes) {
  // ... existing
  pushToDashboard('TRADE', {
    symbol: stock.symbol,
    strategy: stock.strategy,
    entry: stock.price,
    exit: exitPrice,
    pnl: exitPrice ? (exitPrice - stock.price) * stock.qty : 0,
    result: exitPrice > stock.price ? 'WIN' : 'LOSS'
  });
}
