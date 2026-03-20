<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PHX6 ROME Dashboard</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div id="app">
  <header>
    <div class="header-left">
      <h1>🚛 PHX6 ROME Dashboard</h1>
      <span class="subtitle">CRET Actionable Backlog</span>
    </div>
    <div id="freshness"></div>
  </header>

  <!-- Tab Bar -->
  <nav id="tab-bar">
    <button class="tab active" data-tab="tscore">🔴 Green-to-Red Predictor</button>
    <button class="tab" data-tab="yms">📍 YMS Activity</button>
  </nav>

  <!-- ==================== TAB 1: T-Score ==================== -->
  <div id="tab-tscore" class="tab-content">
    <div id="upload-section">
      <div class="upload-card">
        <h2>PHX6 Green-to-Red Predictor</h2>
        <p class="upload-desc">Upload the ROME T-Score Deep Dive → 1.0 Trailer Backlog Raw Data CSV</p>
        <div class="upload-box" id="drop-zone">
          <div class="upload-icon">📄</div>
          <p>Drop CSV file here or <label for="file-input" class="file-label">click to browse</label></p>
          <input type="file" id="file-input" accept=".csv" hidden>
        </div>
        <p class="hint">ROME QuickSight → T-Score Deep Dive → 1.0 Trailer Backlog Raw Data → Export CSV</p>
        <p class="hint">All trailers shown — use the Actionable filter to focus on actionable only</p>
      </div>
    </div>

    <div id="dashboard" class="hidden">
      <div id="cret-backlog-bar">
        <div class="backlog-section">
          <span class="crets-label">📦 CRET Backlog</span>
          <span class="crets-stat" id="cret-trailers"></span>
          <span class="crets-stat" id="cret-visible"></span>
          <span class="crets-stat" id="cret-assumed"></span>
        </div>
        <div class="backlog-section">
          <span class="crets-stat" id="cret-total-units"></span>
          <span class="crets-stat" id="cret-avg-upt"></span>
        </div>
        <div class="backlog-section">
          <span class="filter-label">Daily Plan:</span>
          <input type="number" id="daily-plan-input" min="1" value="" placeholder="e.g. 151128" class="upt-input">
          <span class="crets-stat" id="cret-backlog-days"></span>
        </div>
      </div>
      <div id="summary-cards"></div>
      <div id="crets-bar"></div>
      <div id="filters">
        <div class="filter-group">
          <span class="filter-label">Actionable:</span>
          <select id="filter-actionable"><option value="">All</option><option value="Y">Actionable Only</option><option value="N">Non-Actionable Only</option></select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Status:</span>
          <div class="checkbox-group" id="filter-status">
            <label><input type="checkbox" value="GREEN" checked> <span class="dot dot-green"></span> Green</label>
            <label><input type="checkbox" value="YELLOW" checked> <span class="dot dot-yellow"></span> Yellow</label>
            <label><input type="checkbox" value="RED" checked> <span class="dot dot-red"></span> Red</label>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">Flags:</span>
          <label class="toggle"><input type="checkbox" id="filter-tts-expired"> TTS Expired</label>
          <label class="toggle"><input type="checkbox" id="filter-atrisk"> At Risk (≤2d)</label>
        </div>
        <div class="filter-group">
          <select id="filter-carrier"><option value="">All Carriers</option></select>
          <select id="filter-sort-type"><option value="">All Sort Types</option></select>
        </div>
        <button id="btn-export">📥 Export</button>
        <button id="btn-reset" class="btn-secondary">↺ Reset</button>
      </div>
      <div id="table-container"><table id="main-table"><thead><tr id="table-head"></tr></thead><tbody id="table-body"></tbody></table></div>
      <div id="row-count"></div>
      <details id="info-section">
        <summary>ℹ️ How T-Score & SLA Thresholds Work</summary>
        <div class="info-content">
          <div class="info-cols">
            <div>
              <h3>SLA Thresholds</h3>
              <table class="info-table"><tr><th>Metric</th><th>RED Threshold</th></tr><tr><td>OHT</td><td>&gt; 8 days</td></tr><tr><td>TTS</td><td>&gt; 30 days</td></tr><tr><td>FBA TTA</td><td>&gt; 60 days</td></tr></table>
              <h3>Status Logic</h3>
              <table class="info-table"><tr><td><span class="badge bg-red">RED</span></td><td>days_until_red ≤ 0</td></tr><tr><td><span class="badge bg-yellow">YELLOW</span></td><td>≤ 2</td></tr><tr><td><span class="badge bg-green">GREEN</span></td><td>&gt; 2</td></tr></table>
            </div>
            <div>
              <h3>Dwell Curve</h3>
              <code>Day 0:15  Day 5:350(Yellow)
Day 7:1,550  Day 9:3,550(Red)
After Day 6: +1,000/day</code>
              <h3>Prediction</h3>
              <code>days_to_red = first day where
dwell + tts + fba ≥ 3,550</code>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>

  <!-- ==================== TAB 2: YMS Activity ==================== -->
  <div id="tab-yms" class="tab-content hidden">
    <div id="yms-upload-section">
      <div class="upload-card">
        <h2>📍 YMS Activity Tracker</h2>
        <p class="upload-desc">Upload a YMS export to track trailer movement, dock status, and yard dwell splits</p>
        <div class="upload-box" id="yms-drop-zone">
          <div class="upload-icon">📄</div>
          <p>Drop YMS CSV here or <label for="yms-file-input" class="file-label">click to browse</label></p>
          <input type="file" id="yms-file-input" accept=".csv" hidden>
        </div>
        <p class="hint">Any CSV with trailer yard/dock fields — the tool auto-detects columns</p>
        <p class="hint">💡 Upload ROME CSV to the Green-to-Red tab first — YMS will auto-enrich with T-Score, units, and TTS data</p>
      </div>
    </div>

    <div id="yms-dashboard" class="hidden">
      <div id="yms-cret-bar"></div>
      <div id="yms-summary-cards"></div>
      <div id="yms-filters">
        <div class="filter-group">
          <span class="filter-label">Location:</span>
          <select id="yms-filter-location"><option value="">All</option><option value="DOCK">Dock</option><option value="YARD">Yard</option><option value="OVERFLOW">Overflow</option><option value="PROB SOLVE">Prob Solve</option></select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Category:</span>
          <select id="yms-filter-category"><option value="">All</option></select>
        </div>
        <div class="filter-group">
          <label class="toggle"><input type="checkbox" id="yms-filter-stale"> Near Red (≤2d)</label>
          <label class="toggle"><input type="checkbox" id="yms-filter-hide-storage" checked> Hide Storage/Waste</label>
        </div>
        <div class="filter-group">
          <select id="yms-filter-owner"><option value="">All Owners</option></select>
        </div>
        <button id="yms-btn-export">📥 Export</button>
      </div>
      <div id="yms-table-container"><table id="yms-table"><thead><tr id="yms-table-head"></tr></thead><tbody id="yms-table-body"></tbody></table></div>
      <div id="yms-row-count"></div>
    </div>
  </div>

  <!-- Shared Detail Panel -->
  <div id="detail-overlay" class="hidden">
    <div id="detail-panel">
      <button id="detail-close">✕</button>
      <div id="detail-content"></div>
    </div>
  </div>
</div>
<script src="app.js"></script>
<script src="yms.js"></script>
<script>
// Tab switching
document.querySelectorAll('#tab-bar .tab').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#tab-bar .tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  };
});
</script>
</body>
</html>
