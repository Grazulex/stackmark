// Dashboard HTML template (inline, no external dependencies)

export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stackmark Dashboard</title>
  <style>
    :root {
      --bg: #0d1117;
      --bg-secondary: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --success: #3fb950;
      --warning: #d29922;
      --danger: #f85149;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .logo-icon { font-size: 1.75rem; }
    .last-update { color: var(--text-muted); font-size: 0.875rem; }
    .stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-secondary);
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    .stat-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .stat-dot.running { background: var(--success); }
    .stat-dot.stopped { background: var(--text-muted); }
    .stat-dot.partial { background: var(--warning); }
    .stack-list { display: flex; flex-direction: column; gap: 1rem; }
    .stack {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      transition: border-color 0.2s;
    }
    .stack:hover { border-color: var(--accent); }
    .stack-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-indicator.running { background: var(--success); box-shadow: 0 0 8px var(--success); }
    .status-indicator.stopped { background: var(--text-muted); }
    .status-indicator.partial { background: var(--warning); box-shadow: 0 0 8px var(--warning); }
    .stack-name { font-size: 1.125rem; font-weight: 600; }
    .stack-url {
      color: var(--accent);
      text-decoration: none;
      margin-left: auto;
      font-size: 0.875rem;
    }
    .stack-url:hover { text-decoration: underline; }
    .stack-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
      font-size: 0.875rem;
    }
    .detail {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      color: var(--text-muted);
    }
    .detail-icon { flex-shrink: 0; }
    .detail-value { color: var(--text); word-break: break-all; }
    .ports-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .port-badge {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-family: monospace;
    }
    .port-badge a {
      color: var(--accent);
      text-decoration: none;
    }
    .port-badge a:hover { text-decoration: underline; }
    .containers {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
    .container-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .container-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .container-dot.running { background: var(--success); }
    .container-dot.exited { background: var(--danger); }
    .container-dot.paused { background: var(--warning); }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }
    .autostart-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      margin-left: 0.5rem;
    }
    .autostart-badge.enabled {
      background: rgba(63, 185, 80, 0.2);
      color: var(--success);
    }
    .autostart-badge.disabled {
      background: rgba(139, 148, 158, 0.2);
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">
        <span class="logo-icon">🐳</span>
        <span>Stackmark</span>
      </div>
      <div class="last-update">Last update: <span id="lastUpdate">--:--:--</span></div>
    </header>

    <div class="stats" id="stats"></div>
    <div class="stack-list" id="stackList"></div>
  </div>

  <script>
    const API_URL = '/api/stacks';
    const REFRESH_INTERVAL = 3000;

    function formatTime(date) {
      return date.toLocaleTimeString();
    }

    function renderStats(stacks) {
      const running = stacks.filter(s => s.status === 'running').length;
      const stopped = stacks.filter(s => s.status === 'stopped').length;
      const partial = stacks.filter(s => s.status === 'partial').length;

      document.getElementById('stats').innerHTML = \`
        <div class="stat">
          <span class="stat-dot running"></span>
          <span>\${running} running</span>
        </div>
        <div class="stat">
          <span class="stat-dot stopped"></span>
          <span>\${stopped} stopped</span>
        </div>
        \${partial > 0 ? \`
        <div class="stat">
          <span class="stat-dot partial"></span>
          <span>\${partial} partial</span>
        </div>
        \` : ''}
      \`;
    }

    function renderStack(stack) {
      const ports = stack.actualPorts || stack.portMappings || [];
      const mainUrl = stack.mainUrl;
      const containers = stack.containers || [];
      const autostartEnabled = stack.autostart !== false;

      return \`
        <div class="stack">
          <div class="stack-header">
            <span class="status-indicator \${stack.status}"></span>
            <span class="stack-name">\${stack.name}</span>
            <span class="autostart-badge \${autostartEnabled ? 'enabled' : 'disabled'}">
              \${autostartEnabled ? '↻ autostart' : '↻ manual'}
            </span>
            \${mainUrl ? \`<a href="\${mainUrl}" target="_blank" class="stack-url">\${mainUrl} →</a>\` : ''}
          </div>

          <div class="stack-details">
            <div class="detail">
              <span class="detail-icon">📁</span>
              <span class="detail-value">\${stack.path}</span>
            </div>
            <div class="detail">
              <span class="detail-icon">📦</span>
              <span class="detail-value">\${containers.length} container\${containers.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          \${ports.length > 0 ? \`
          <div class="ports-list">
            \${ports.map(p => \`
              <span class="port-badge">
                <a href="http://localhost:\${p.external}" target="_blank">\${p.service}:\${p.internal}</a> → :\${p.external}
              </span>
            \`).join('')}
          </div>
          \` : ''}

          \${containers.length > 0 ? \`
          <div class="containers">
            \${containers.map(c => \`
              <div class="container-item">
                <span class="container-dot \${c.state}"></span>
                <span>\${c.name}</span>
                <span style="color: var(--text-muted)">\${c.status}</span>
              </div>
            \`).join('')}
          </div>
          \` : ''}
        </div>
      \`;
    }

    function renderStacks(stacks) {
      const list = document.getElementById('stackList');

      if (stacks.length === 0) {
        list.innerHTML = \`
          <div class="empty-state">
            <p>No stacks registered</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem;">
              Use <code>stackmark add &lt;name&gt;</code> to add a stack
            </p>
          </div>
        \`;
        return;
      }

      list.innerHTML = stacks.map(renderStack).join('');
    }

    async function fetchAndRender() {
      try {
        const res = await fetch(API_URL);
        const stacks = await res.json();

        renderStats(stacks);
        renderStacks(stacks);
        document.getElementById('lastUpdate').textContent = formatTime(new Date());
      } catch (err) {
        console.error('Failed to fetch stacks:', err);
      }
    }

    // Initial fetch
    fetchAndRender();

    // Auto-refresh
    setInterval(fetchAndRender, REFRESH_INTERVAL);
  </script>
</body>
</html>`;
}
