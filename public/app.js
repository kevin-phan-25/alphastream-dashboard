const ws = new WebSocket(`wss://${location.host}`);
let chart = null;

ws.onmessage = e => {
  const {type, data, timestamp} = JSON.parse(e.data);
  if (type === 'INIT') {
    renderScanner(data.scanner);
    renderTrades(data.trades);
    renderStats(data.stats);
  }
  if (type === 'SCANNER') renderScanner(data);
  if (type === 'TRADE') renderTrades([data, ...getTrades()].slice(0,20));
  if (type === 'STATS') renderStats(data);
};

function renderScanner(list) {
  const el = document.getElementById('scanner');
  el.innerHTML = list.map(s => `
    <div class="col-6 col-md-4 col-lg-3 mb-2">
      <div class="scanner-item card p-2 text-center" onclick="loadChart('${s.symbol}')">
        <strong>${s.symbol}</strong><br>
        <small>${s.price.toFixed(2)}</small>
      </div>
    </div>`).join('');
}

function renderTrades(list) {
  const el = document.getElementById('trades');
  el.innerHTML = list.map(t => `<div>${t.symbol} ${t.side} ${t.shares} @ ${t.price} → ${t.pnl>0?'🟢':'🔴'} $${t.pnl.toFixed(2)}</div>`).join('');
  setTrades(list);
}
function getTrades(){ try {return JSON.parse(localStorage.getItem('trades')||'[]')}catch(e){return[]} }
function setTrades(v){ localStorage.setItem('trades',JSON.stringify(v)) }

function renderStats(s) {
  document.getElementById('mode-badge').textContent = s.mode;
  document.getElementById('mode-badge').className = 'badge ' + (s.mode==='HOT'?'badge-hot':'badge-cold');
  document.getElementById('stats').innerHTML = `
    Win Rate: <strong>${s.winRate.toFixed(1)}%</strong><br>
    P&L: <strong style="color:${s.pnl>=0?'#0f0':'#f55'}">$${s.pnl.toFixed(2)}</strong>
  `;
}

async function loadChart(sym) {
  document.getElementById('chart-symbol').textContent = sym;
  const resp = await fetch(`/chart/${sym}`);
  const bars = await resp.json();
  if (!chart) {
    chart = new Chart(document.getElementById('chart'), {
      type: 'candlestick',
      data: { datasets: [{ label: sym, data: [] }] },
      options: { animation: false, scales: { x: { type: 'time' } } }
    });
  }
  chart.data.datasets[0].data = bars.map(b=>({x:b.t, o:b.o, h:b.h, l:b.l, c:b.c}));
  chart.update();
}

// ---- PATTERN GUIDE (12 BASE64 images) ----
const guide = [
  {label:"Bull Flag Breakout", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA... (full base64 from your PDF – see below)"},
  {label:"Bull Flag", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Bull Flag 5‑min → 1‑min", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Bear Flag Breakdown (1‑min)", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Bear Flag (5‑min)", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Bull Flags & Flat Tops", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"False Breakout Trap", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Bull Flag Trap", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Bull Flag Trap (cont.)", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Flat Top Breakout", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Flat Top Breakout (chart)", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."},
  {label:"Flat Top Breakout (cont.)", src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."}
];

document.getElementById('pattern-guide').innerHTML = guide.map(g=>`
  <div class="col-6 col-md-4 mb-2">
    <img class="pattern-img" src="${g.src}" alt="${g.label}">
    <div class="pattern-label">${g.label}</div>
  </div>`).join('');
