async function loadPatterns() {
  try {
    const res = await fetch('/patterns', { cache: "no-store" });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    renderPatterns(json.patterns || []);
  } catch (err) {
    console.error('Pattern fetch failed:', err);
    const container = document.getElementById('patterns');
    if (container) {
      container.innerHTML = `<div class="error">Pattern fetch failed: ${err.message}</div>`;
    }
  }
}

function renderPatterns(list) {
  const container = document.getElementById('patterns');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = '<div class="no-patterns">No recent patterns detected</div>';
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="pattern-card">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.message)}</p>
      <small>${escapeHtml(p.date)}</small><br/>
      <a href="${p.url}" target="_blank" rel="noopener noreferrer">View Commit (${p.sha})</a>
    </div>
  `).join('');
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// Initial load + poll every 5 minutes
loadPatterns();
setInterval(loadPatterns, 300000);
