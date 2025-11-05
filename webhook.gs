const WEBHOOK_URL = 'https://YOUR-RAILWAY-APP.up.railway.app/webhook'; // ← CHANGE THIS

function pushToDashboard(type, data) {
  if (!WEBHOOK_URL) return;
  const payload = { type, data };
  try {
    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) { Logger.log('WEBHOOK ERR: ' + e); }
}

// Example: In your scanner
function scanRossMicroPullback() {
  const candidates = [ /* your logic */ ];
  pushToDashboard('SCANNER', candidates);
  return candidates;
}

// Example: In trade exit
function logTrade(event, stock, exitPrice) {
  if (event === 'EXIT') {
    pushToDashboard('TRADE', {
      symbol: stock.symbol,
      strategy: stock.strategy,
      entry: stock.price,
      exit: exitPrice,
      pnl: (exitPrice - stock.price) * stock.qty,
      result: exitPrice > stock.price ? 'WIN' : 'LOSS'
    });
  }
}
