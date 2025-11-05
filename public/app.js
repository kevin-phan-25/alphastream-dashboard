// public/app.js (Modernized v2.0)
import { Chart } from 'chart.js/auto';  // ES6 import for charts

// Preload sample patterns (optional - for instant load)
const PRELOADED_PATTERNS = [
  { name: 'Bull Flag', message: 'Bull flag breakout detected in commit analysis', date: '2025-11-05', url: '#', sha: 'abc1234' },
  { name: 'Ascending Triangle', message: 'Triangle consolidation breaking up', date: '2025-11-04', url: '#', sha: 'def5678' }
];

// Global state
let events = [];
let pnlChart, winRateChart;
let eventSource = null;

// Connect to SSE for live updates
function connectSSE() {
  eventSource = new EventSource('/events');
  console.log('SSE Connected - Waiting for GAS data...');

  eventSource.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      if (event.type === 'heartbeat') return;
      handleEvent(event);
    } catch (err) {
      console.error('SSE Error:', err);
    }
  };

  eventSource.onerror = () => {
    console.warn('SSE Disconnected - Reconnecting...');
    setTimeout(connectSSE, 5000);
  };
}

// Handle incoming events from GAS
function handleEvent(event) {
  events.unshift(event);
  if (events.length > 100) events.pop();  // Keep recent

  const { type, data } = event;

  if (type === 'STATS') updateStats(data);
  if (type === 'SCANNER') updateScanner(data);
  if (type === 'TRADE') {
    updateTrades(data);
    updateCharts(data);  // Update PnL/Win Rate charts
  }
}

// Update Stats Section
function updateStats(data) {
  const el = document.getElementById('stats');
  el.classList.remove('animate-pulse');
  el.innerHTML = `
    <div class="bg-blue-900 p-4 rounded-lg">
      <h3 class="text-lg font-bold">Win Rate</h3>
      <p class="text-2xl text-green-400">${data.winRate || 0}%</p>
    </div>
    <div class="bg-green-900 p-4 rounded-lg">
      <h3 class="text-lg font-bold">Total PnL</h3>
      <p class="text-2xl ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}">$${data.pnl?.toFixed(2) || 0}</p>
    </div>
    <div class="bg-purple-900 p-4 rounded-lg">
      <h3 class="text-lg font-bold">Mode</h3>
      <p class="text-xl">${data.mode || 'HOT (Gap & Go)'}</p>
    </div>
  `;
}

// Update Scanner
function updateScanner(data) {
  const container = document.getElementById('scanner');
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="text-gray-500 py-8 text-center">No active scans</div>';
    return;
  }
  container.innerHTML = data.map(s => `
    <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
      <h3 class="font-bold text-green-400">${s.symbol}</h3>
      <p class="text-sm text-gray-300">${s.strategy} @ $${s.price?.toFixed(2)}</p>
    </div>
  `).join('');
}

// Update Trades List
function updateTrades(data) {
  const container = document.getElementById('trades');
  const row = document.createElement('div');
  row.className = `p-4 rounded-lg ${data.result === 'WIN' ? 'bg-green-900 border-l-4 border-green-500' : 'bg-red-900 border-l-4 border-red-500'}`;
  row.innerHTML = `
    <div class="flex justify-between items-center">
      <span class="font-bold">${data.symbol} - ${data.strategy}</span>
      <span class="text-lg ${data.result === 'WIN' ? 'text-green-400' : 'text-red-400'}">${data.result}</span>
    </div>
    <p class="text-sm text-gray-300">PnL: $${data.pnl?.toFixed(2) || 0}</p>
  `;
  container.insertBefore(row, container.firstChild);
  if (container.children.length > 20) container.removeChild(container.lastChild);
}

// Update Charts (PnL & Win Rate)
function updateCharts(tradeData) {
  const pnlData = events.filter(e => e.type === 'TRADE').map(e => e.data.pnl || 0);
  const winData = events.filter(e => e.type === 'TRADE' && e.data.result === 'WIN').length / Math.max(1, events.filter(e => e.type === 'TRADE').length) * 100;

  // PnL Chart (Line)
  if (pnlChart) pnlChart.destroy();
  const pnlCtx = document.getElementById('pnlChart').getContext('2d');
  pnlChart = new Chart(pnlCtx, {
    type: 'line',
    data: { labels: events.slice(0, 10).map((_, i) => `Trade ${i+1}`), datasets: [{ label: 'PnL ($)', data: pnlData.slice(-10), borderColor: '#10b981', tension: 0.1 }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // Win Rate Chart (Doughnut)
  if (winRateChart) winRateChart.destroy();
  const winCtx = document.getElementById('winRateChart').getContext('2d');
  winRateChart = new Chart(winCtx, {
    type: 'doughnut',
    data: { labels: ['Wins', 'Losses'], datasets: [{ data: [winData, 100 - winData], backgroundColor: ['#10b981', '#ef4444'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

// Load Patterns (with preload fallback)
async function loadPatterns() {
  try {
    const res = await fetch('/patterns', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    renderPatterns(json.patterns || []);
  } catch (err) {
    console.error('Patterns fetch failed:', err);
    // Fallback to preloaded
    renderPatterns(PRELOADED_PATTERNS);
  }
}

function renderPatterns(list) {
  const container = document.getElementById('patterns');
  container.innerHTML = '';  // Clear loading

  if (!list || list.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No recent patterns detected. Add a commit with "bull flag" to test!</div>';
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition">
      <h3 class="font-bold text-blue-400">${escapeHtml(p.name)}</h3>
      <p class="text-sm text-gray-300 mb-2">${escapeHtml(p.message)}</p>
      <p class="text-xs text-gray-500 mb-2">${escapeHtml(p.date)}</p>
      <a href="${p.url}" target="_blank" class="text-cyan-400 hover:underline">View Commit (${p.sha})</a>
    </div>
  `).join('');
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Init
connectSSE();
loadPatterns();  // Initial load
setInterval(loadPatterns, 300000);  // Poll fallback
