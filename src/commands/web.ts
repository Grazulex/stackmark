// Web dashboard command

import { exec } from 'child_process';
import { startServer } from '../server/index.js';
import { logger } from '../utils/logger.js';
import { colors } from '../utils/colors.js';

const DEFAULT_PORT = 3456;

interface WebOptions {
  port?: string;
  open?: boolean;
}

function openBrowser(url: string): void {
  const platform = process.platform;
  let cmd: string;

  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else {
    // Linux - try xdg-open, then common browsers
    cmd = `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || x-www-browser "${url}" 2>/dev/null || gnome-open "${url}" 2>/dev/null`;
  }

  exec(cmd, (err) => {
    if (err) {
      logger.dim(`  Could not open browser automatically. Please visit: ${url}`);
    }
  });
}

export function webCommand(options: WebOptions): void {
  const port = options.port ? parseInt(options.port, 10) : DEFAULT_PORT;

  if (isNaN(port) || port < 1 || port > 65535) {
    logger.error(`Invalid port number: ${options.port}`);
    process.exit(1);
  }

  const url = `http://localhost:${port}`;

  startServer({
    port,
    onListening: (p) => {
      console.log();
      console.log(colors.brand('  🐳 Stackmark Dashboard'));
      console.log();
      console.log(`  ${colors.success('●')} Server running at ${colors.accent(url)}`);
      console.log();
      logger.dim('  Press Ctrl+C to stop');
      console.log();

      // Open browser if --open flag is set
      if (options.open) {
        openBrowser(url);
      }
    },
    onError: (err) => {
      logger.error(err.message);
      process.exit(1);
    },
  });
}
