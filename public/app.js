// public/app.js

async function loadPatterns() {
  try {
    const res = await fetch('/patterns');
    const json = await res.json();
    renderPatterns(json.patterns);
  } catch (err) {
    console.error('Pattern fetch failed:', err);
  }
}

// Initial load + 5-minute refresh
loadPatterns();
setInterval(loadPatterns, 300000);

// Existing trade/scanner/stat functions can stay if needed
function renderPatterns(list) {
  const container = document.getElementById('patterns');
  if (!container) return;

  container.innerHTML = list.map(p => `
    <div class="pattern-card">
      <h3>${p.name}</h3>
      <p>${p.message}</p>
      <small>${p.date}</small><br>
      <a href="${p.url}" target="_blank">View Commit (${p.sha})</a>
    </div>
  `).join('') || '<p>No recent patterns detected</p>';
}
