// app.js - Client-side logic for dashboard
const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
let chart = null;

// WebSocket handlers
ws.onopen = () => console.log('WebSocket connected');
ws.onclose = () => console.log('WebSocket disconnected');
ws.onerror = (e) => console.error('WebSocket error', e);

ws.onmessage = (e) => {
  try {
    const msg = JSON.parse(e.data);
    console.log('Message received:', msg.type);
    if (msg.type === 'INIT') {
      renderScanner(msg.data.scanner || []);
      renderTrades(msg.data.trades || []);
      renderStats(msg.data.stats || {});
    } else if (msg.type === 'SCANNER') {
      renderScanner(msg.data || []);
    } else if (msg.type === 'TRADE') {
      const trades = [msg.data, ...getTrades()].slice(0, 20);
      renderTrades(trades);
      setTrades(trades);
    } else if (msg.type === 'STATS') {
      renderStats(msg.data);
    }
  } catch (error) {
    console.error('Parse error:', error);
  }
};

// Render functions
function renderScanner(candidates) {
  const el = document.getElementById('scanner');
  if (!candidates.length) {
    el.innerHTML = '<div class="col-12 text-center text-muted">No candidates — Waiting for scan...</div>';
    return;
  }
  el.innerHTML = candidates.map(c => `
    <div class="col-md-6 p-2">
      <div class="scanner-item card p-2 text-center" onclick="loadChart('${c.symbol}')">
        <strong>${c.symbol}</strong><br>
        <small>${c.strategy || '—'} | Score: ${c.score?.toFixed(0)}</small>
      </div>
    </div>
  `).join('');
}

function renderTrades(trades) {
  const el = document.getElementById('trades');
  el.innerHTML = trades.length ? trades.map(t => `
    <div class="text-small ${t.pnl > 0 ? 'text-success' : 'text-danger'}">
      ${t.symbol} | ${t.strategy} | PnL: $${t.pnl.toFixed(2)}
    </div>
  `).join('') : 'No trades yet';
}

function renderStats(stats) {
  document.getElementById('mode-badge').textContent = stats.mode || 'COLD';
  document.getElementById('mode-badge').className = 'badge ' + (stats.mode === 'HOT' ? 'badge-hot' : 'badge-cold');
  document.getElementById('stats').innerHTML = `
    Win Rate: <strong>${stats.winRate?.toFixed(1) || 0}%</strong><br>
    PnL: <strong class="${stats.pnl >= 0 ? 'text-success' : 'text-danger'}">$${stats.pnl?.toFixed(2) || 0}</strong><br>
    Mode: <strong>${stats.mode || 'COLD'}</strong>
  `;
}

// Local storage for trades (offline fallback)
function getTrades() {
  try { return JSON.parse(localStorage.getItem('trades') || '[]'); } catch { return []; }
}
function setTrades(trades) {
  localStorage.setItem('trades', JSON.stringify(trades));
}

// Chart loading
async function loadChart(symbol) {
  document.getElementById('chart-symbol').textContent = symbol;
  try {
    const res = await fetch(`/chart/${symbol}`);
    if (!res.ok) throw new Error('Chart data failed');
    const bars = await res.json();
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'), {
      type: 'candlestick',
      data: { datasets: [{ label: symbol, data: bars.map(b => ({ x: b.t, o: b.o, h: b.h, l: b.l, c: b.c })) }] },
      options: { animation: false, scales: { x: { type: 'time', time: { unit: 'minute' }}}}
    });
    detectAndDrawRossPatterns(bars);
  } catch (e) {
    console.error('Chart load error:', e);
    document.getElementById('chart-symbol').textContent = 'Chart failed — Check POLYGON_KEY';
  }
}

// Pattern detection
function detectAndDrawRossPatterns(bars) {
  const overlay = document.getElementById('pattern-overlay');
  overlay.innerHTML = '';
  if (bars.length < 20) return;

  // Bull Flag (simple detection)
  const recent = bars.slice(-15);
  const pole = recent.slice(0, 3).every((b, i, arr) => i === 0 || b.c > arr[i-1].c);
  if (pole) {
    const flagHigh = Math.max(...recent.slice(3, -1).map(b => b.h));
    const breakout = recent[recent.length - 1];
    if (breakout.c > flagHigh * 1.01) {
      drawPattern(overlay, { left: 15, right: 90, top: 10, bottom: 40 }, 'BULL FLAG', '#00ff88');
    }
  }

  // Flat Top
  const highs = bars.slice(-10, -2).map(b => b.h);
  const resistance = Math.max(...highs);
  const variation = highs.reduce((s, h) => s + Math.abs(h - resistance), 0) / highs.length;
  if (variation < resistance * 0.02) {
    const breakout = bars[bars.length - 1];
    if (breakout.c > resistance * 1.01) {
      drawPattern(overlay, { left: 40, right: 85, top: 15, bottom: 35 }, 'FLAT TOP', '#ffcc00');
    }
  }
}

function drawPattern(container, { left, right, top, bottom }, label, color) {
  const div = document.createElement('div');
  div.className = 'ross-pattern';
  div.style.position = 'absolute';
  div.style.left = `${left}%`;
  div.style.top = `${top}%`;
  div.style.width = `${right - left}%`;
  div.style.height = `${bottom - top}%`;
  div.style.border = `2px dashed ${color}`;
  div.innerHTML = `<div style="position:absolute;top:-20px;left:0;background:${color};color:black;padding:2px 6px;font-size:10px;border-radius:3px;">${label}</div>`;
  container.appendChild(div);
}

// Pattern guide (12 placeholders — replace with real Base64 from your PDF images)
const warriorImages = [
  { label: "Pattern Guide Cover", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Bull Flag Breakout", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Bull Flag 1-min", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Bull Flag 5→1-min", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Bear Flag 1-min", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Bear Flag 5-min", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Flat Top Breakout", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Flat Top Example 1", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Flat Top Example 2", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "False Breakout Trap", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Bull Flag Trap 1", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" },
  { label: "Bull Flag Trap 2", src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" }
];

document.addEventListener('DOMContentLoaded', () => {
  const guide = document.getElementById('pattern-guide');
  guide.innerHTML = warriorImages.map(img => `
    <div class="col-6 mb-2">
      <img src="${img.src}" class="pattern-img" alt="${img.label}">
      <div class="pattern-label">${img.label}</div>
    </div>
  `).join('');
});
</script>
</body>
</html>
