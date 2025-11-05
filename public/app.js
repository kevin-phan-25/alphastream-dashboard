// public/app.js
const events = [];
let eventSource = null;

function connectSSE() {
  eventSource = new EventSource('/events');

  eventSource.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      if (event.type === 'heartbeat') return;
      handleEvent(event);
    } catch (err) {
      console.error('SSE parse error:', err);
    }
  };

  eventSource.onerror = () => {
    console.warn('SSE disconnected. Reconnecting...');
    setTimeout(connectSSE, 3000);
  };
}

function handleEvent(event) {
  const { type, data, timestamp } = event;

  // Keep only last 50 events
  events.unshift(event);
  if (events.length > 50) events.pop();

  // Update UI
  if (type === 'STATS') updateStats(data);
  if (type === 'SCANNER') updateScanner(data);
  if (type === 'TRADE') updateTrade(data);
}

function updateStats(data) {
  const el = document.getElementById('stats');
  if (!el) return;
  el.innerHTML = `
    <div><strong>Win Rate:</strong> ${data.winRate}%</div>
    <div><strong>PnL:</strong> $${data.pnl.toFixed(2)}</div>
    <div><strong>Mode:</strong> ${data.mode}</div>
  `;
}

function updateScanner(data) {
  const container = document.getElementById('scanner');
  if (!container) return;
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="no-patterns">No active scans</div>';
    return;
  }
  container.innerHTML = data.map(s => `
    <div class="pattern-card">
      <h3>${s.symbol}</h3>
      <p>${s.strategy} @ $${s.price?.toFixed(2)}</p>
    </div>
  `).join('');
}

function updateTrade(data) {
  const container = document.getElementById('trades');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'trade-row';
  row.innerHTML = `
    <strong>${data.symbol}</strong> 
    <span class="${data.result}">${data.result}</span> 
    $${data.pnl?.toFixed(2) || '0.00'}
  `;
  container.prepend(row);
  // Keep only last 10
  if (container.children.length > 10) container.removeChild(container.lastChild);
}

// Start SSE
connectSSE();

// Optional: Poll /patterns every 5 min (fallback)
setInterval(() => fetch('/patterns').catch(() => {}), 300000);
