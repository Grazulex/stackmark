import { getAllStacks } from '../utils/config.js';
import { getStackStatus } from '../core/docker.js';
import { colors, icons, stackStatusIcon, stackStatusText } from '../utils/colors.js';
import type { Stack, PortMapping, StackStatus } from '../utils/types.js';

// ANSI escape codes
const MOVE_HOME = '\x1B[H';           // Move cursor to top-left
const CLEAR_SCREEN = '\x1B[2J\x1B[H'; // Clear screen and move home
const CLEAR_LINE = '\x1B[2K';         // Clear current line
const HIDE_CURSOR = '\x1B[?25l';
const SHOW_CURSOR = '\x1B[?25h';

// Services that are typically web servers (priority order)
const WEB_SERVICES = ['nginx', 'web', 'app', 'frontend', 'client', 'apache', 'caddy'];

function getMainWebUrl(portMappings: PortMapping[]): string | null {
  if (!portMappings || portMappings.length === 0) {
    return null;
  }

  let port: number | null = null;

  for (const serviceName of WEB_SERVICES) {
    const mapping = portMappings.find(m =>
      m.service.toLowerCase().includes(serviceName) && m.internal === 80
    );
    if (mapping) {
      port = mapping.external;
      break;
    }
  }

  if (!port) {
    const port80 = portMappings.find(m => m.internal === 80);
    if (port80) port = port80.external;
  }

  if (!port) {
    const webPorts = [443, 8080, 3000, 8000, 5000];
    for (const p of webPorts) {
      const mapping = portMappings.find(m => m.internal === p);
      if (mapping) {
        port = mapping.external;
        break;
      }
    }
  }

  if (!port) return null;
  return `http://localhost:${port}`;
}

function renderDashboard(): string {
  const stacks = getAllStacks();
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(colors.brand('  ┌─────────────────────────────────────────────────────────┐'));
  lines.push(colors.brand('  │') + colors.accent('  🐳 STACKMARK DASHBOARD') + '                                ' + colors.brand('│'));
  lines.push(colors.brand('  │') + colors.muted('  Press q to quit • Auto-refresh every 2s') + '              ' + colors.brand('│'));
  lines.push(colors.brand('  └─────────────────────────────────────────────────────────┘'));
  lines.push('');

  if (stacks.length === 0) {
    lines.push(colors.muted('  No stacks registered'));
    lines.push(colors.muted('  Use "stackmark add" to register a stack'));
    return lines.join('\n');
  }

  // Stats
  let running = 0;
  let stopped = 0;
  let partial = 0;

  const stackData: { stack: Stack; status: StackStatus; ports: PortMapping[]; containers: number }[] = [];

  for (const stack of stacks) {
    const { status, actualPorts, containers } = getStackStatus(stack);
    const ports = actualPorts.length > 0 ? actualPorts : (stack.portMappings || []);

    stackData.push({ stack, status, ports, containers: containers.length });

    if (status === 'running') running++;
    else if (status === 'stopped') stopped++;
    else partial++;
  }

  // Stats bar
  lines.push(`  ${colors.running(`● ${running} running`)}  ${colors.stopped(`○ ${stopped} stopped`)}  ${partial > 0 ? colors.warning(`◐ ${partial} partial`) : ''}`);
  lines.push('');
  lines.push(colors.muted('  ─────────────────────────────────────────────────────────'));
  lines.push('');

  // Stack list
  for (const { stack, status, ports, containers } of stackData) {
    const url = getMainWebUrl(ports);
    const statusIcon = stackStatusIcon(status);
    const statusTxt = stackStatusText(status);

    // Main line: icon + name + status
    let line = `  ${statusIcon} ${colors.highlight(stack.name.padEnd(20))} ${statusTxt}`;

    // Add URL if available
    if (url && status === 'running') {
      line += `  ${colors.accent(url)}`;
    }

    lines.push(line);

    // Container count for running stacks
    if (status === 'running' && containers > 0) {
      lines.push(colors.muted(`     └─ ${containers} container${containers > 1 ? 's' : ''}`));
    }

    // Path (dimmed)
    lines.push(colors.muted(`     ${stack.path}`));
    lines.push('');
  }

  // Footer
  lines.push(colors.muted('  ─────────────────────────────────────────────────────────'));
  lines.push('');
  lines.push(colors.muted(`  Last update: ${new Date().toLocaleTimeString()}`));

  return lines.join('\n');
}

export function dashboardCommand(): void {
  let isRunning = true;

  // Hide cursor
  process.stdout.write(HIDE_CURSOR);

  // Handle cleanup
  const cleanup = () => {
    isRunning = false;
    process.stdout.write(SHOW_CURSOR);
    process.stdout.write(CLEAR_SCREEN);
    console.log(colors.muted('  Dashboard closed'));
    process.exit(0);
  };

  // Handle Ctrl+C
  process.on('SIGINT', cleanup);

  // Setup raw input mode for key detection
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (key: string) => {
      // q or Q or Ctrl+C to quit
      if (key === 'q' || key === 'Q' || key === '\u0003') {
        cleanup();
      }
    });
  }

  let firstRender = true;

  // Render function
  const render = () => {
    if (!isRunning) return;

    if (firstRender) {
      // Clear screen completely on first render
      process.stdout.write(CLEAR_SCREEN);
      firstRender = false;
    } else {
      // Just move cursor home on subsequent renders (no flicker)
      process.stdout.write(MOVE_HOME);
    }

    // Get dashboard content and add line clearing to each line
    const content = renderDashboard();
    const lines = content.split('\n').map(line => CLEAR_LINE + line);
    process.stdout.write(lines.join('\n'));
  };

  // Initial render
  render();

  // Auto-refresh every 2 seconds
  const interval = setInterval(() => {
    if (isRunning) {
      render();
    } else {
      clearInterval(interval);
    }
  }, 2000);
}
