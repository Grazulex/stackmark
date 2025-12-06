import { exec } from 'child_process';
import { logger } from '../utils/logger.js';
import { resolveStack } from '../utils/resolve-stack.js';
import { colors } from '../utils/colors.js';
import type { Stack } from '../utils/types.js';

// Services that are typically web servers (priority order)
const WEB_SERVICES = ['nginx', 'web', 'app', 'frontend', 'client', 'apache', 'caddy'];

function getMainWebPort(stack: Stack): number | null {
  if (!stack.portMappings || stack.portMappings.length === 0) {
    return null;
  }

  // First try to find a known web service
  for (const serviceName of WEB_SERVICES) {
    const mapping = stack.portMappings.find(m =>
      m.service.toLowerCase().includes(serviceName) && m.internal === 80
    );
    if (mapping) return mapping.external;
  }

  // Then try any service with internal port 80
  const port80 = stack.portMappings.find(m => m.internal === 80);
  if (port80) return port80.external;

  // Then try any service with internal port 443, 8080, 3000
  const webPorts = [443, 8080, 3000, 8000, 5000];
  for (const port of webPorts) {
    const mapping = stack.portMappings.find(m => m.internal === port);
    if (mapping) return mapping.external;
  }

  // Return the first port as fallback
  return stack.portMappings[0].external;
}

function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;

  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "${url}"`;
  } else {
    // Linux - try xdg-open, then fallback to common browsers
    command = `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || x-www-browser "${url}" 2>/dev/null || gnome-open "${url}" 2>/dev/null`;
  }

  exec(command, (err) => {
    if (err) {
      logger.error(`Could not open browser: ${err.message}`);
      logger.dim(`  Try opening manually: ${url}`);
    }
  });
}

export function openCommand(name?: string): void {
  const stack = resolveStack(name);

  const port = getMainWebPort(stack);

  if (!port) {
    logger.error(`No web port found for "${stack.name}"`);
    return;
  }

  // Always use localhost (more reliable, domains need /etc/hosts setup)
  const url = `http://localhost:${port}`;

  logger.info(`Opening ${colors.accent(url)}`);
  openBrowser(url);
}
