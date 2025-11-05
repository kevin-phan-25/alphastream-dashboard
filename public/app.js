const ws = new WebSocket('wss://' + location.host);
let chart;

ws.onmessage = e => {
  const { type, data } = JSON.parse(e.data);
  if (type === 'INIT') {
    renderScanner(data.scanner);
    renderTrades(data.trades);
    renderStats(data.stats);
  } else if (type === 'SCANNER') {
    renderScanner(data);
  } else if (type === 'TRADE') {
    renderTrades([data, ...getTrades()].slice(0, 10));
  } else if (type === 'STATS') {
    renderStats(data);
  }
};

function renderScanner(list) {
  document.getElementById('scanner').innerHTML = list.map(s => `<div>${s.symbol} | ${s.strategy} | Score: ${s.score}</div>`).join('') || 'No signals';
}

function renderTrades(list) {
  const tbody = document.getElementById('trades');
  tbody.innerHTML = list.map(t => `<tr><td>${new Date(t.time).toLocaleTimeString()}</td><td>${t.symbol}</td><td>${t.strategy}</td><td class="${t.pnl > 0 ? 'win' : 'loss'}">${t.result}</td><td class="${t.pnl > 0 ? 'win' : 'loss'}">${t.pnl}</td></tr>`).join('') || '<tr><td colspan="5">No trades</td></tr>';
}

function renderStats(s) {
  document.getElementById('mode').textContent = s.mode || 'COLD';
  document.getElementById('winrate').textContent = s.winRate + '%';
  document.getElementById('pnl').textContent = '$' + s.pnl.toFixed(2);
}

function getTrades() {
  return JSON.parse(localStorage.getItem('trades') || '[]');
}

function loadChart(symbol) {
  // Placeholder for chart
  console.log('Loading chart for', symbol);
}
