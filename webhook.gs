const WEBHOOK_URL = 'https://alphastream-dashboard.vercel.app/webhook'; // YOUR VERCEL URL

function sendToDashboard(type, data) {
  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ type, data }),
    muteHttpExceptions: true
  });
}

// Use in your bot's runAll():
function runAll() {
  // Your existing bot code...
  const candidates = scanLowFloatPenny(); // or scanRossMicroPullback()
  
  // Send to dashboard
  sendToDashboard('SCANNER', candidates);
  
  // Execute trades...
  candidates.forEach(executeTrade);
}
