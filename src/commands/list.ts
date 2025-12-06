import { getAllStacks } from '../utils/config.js';
import { getStackStatus } from '../core/docker.js';
import { logger } from '../utils/logger.js';
import { colors, icons } from '../utils/colors.js';
import type { Stack, PortMapping } from '../utils/types.js';

// Services that are typically web servers (priority order)
const WEB_SERVICES = ['nginx', 'web', 'app', 'frontend', 'client', 'apache', 'caddy'];

function getMainWebUrl(portMappings: PortMapping[]): string | null {
  if (!portMappings || portMappings.length === 0) {
    return null;
  }

  let port: number | null = null;

  // First try to find a known web service with port 80
  for (const serviceName of WEB_SERVICES) {
    const mapping = portMappings.find(m =>
      m.service.toLowerCase().includes(serviceName) && m.internal === 80
    );
    if (mapping) {
      port = mapping.external;
      break;
    }
  }

  // Then try any service with internal port 80
  if (!port) {
    const port80 = portMappings.find(m => m.internal === 80);
    if (port80) port = port80.external;
  }

  // Then try common web ports
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

  // Always use localhost (more reliable)
  return `http://localhost:${port}`;
}

export function listCommand(): void {
  const stacks = getAllStacks();

  if (stacks.length === 0) {
    logger.info('No stacks registered');
    logger.dim('  Use "stackmark add <name> --path <path>" to add a stack');
    return;
  }

  console.log();
  console.log(colors.brand(`  ${icons.stack} Stacks`));
  console.log();

  for (const stack of stacks) {
    const { status, actualPorts } = getStackStatus(stack);

    // Use actual running ports if available, otherwise fall back to config
    const ports = actualPorts.length > 0 ? actualPorts : (stack.portMappings || []);
    const url = getMainWebUrl(ports);

    logger.stack(stack.name, status);

    // Show main URL prominently
    if (url) {
      console.log(`    ${icons.arrow} ${colors.accent(url)}`);
    }

    logger.dim(`    ${stack.path}`);

    // Show autostart status
    const autostartEnabled = stack.autostart !== false; // default true for backwards compat
    const autostartIcon = autostartEnabled ? colors.success('↻') : colors.muted('↻');
    const autostartText = autostartEnabled ? 'autostart' : 'no autostart';
    logger.dim(`    ${autostartIcon} ${autostartText}`);

    // Show other ports compactly (use actual ports when running)
    if (ports.length > 0) {
      const otherPorts = ports
        .filter(m => m.internal !== 80) // Exclude main web port
        .map(m => `${m.service}:${m.external}`)
        .join(', ');
      if (otherPorts) {
        logger.dim(`    Other: ${otherPorts}`);
      }
    }

    console.log();
  }
}
