import { resolve } from 'path';
import { getStack, getAllStacks, getStackByPath } from '../utils/config.js';
import { getStackStatus } from '../core/docker.js';
import { logger } from '../utils/logger.js';
import { colors, icons, stackStatusIcon, stackStatusText } from '../utils/colors.js';
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

  return `http://localhost:${port}`;
}

function displayStackStatus(stack: Stack): void {
  const { status, containers, actualPorts } = getStackStatus(stack);

  // Use actual running ports if available, otherwise fall back to config
  const ports = actualPorts.length > 0 ? actualPorts : (stack.portMappings || []);
  const url = getMainWebUrl(ports);

  console.log(`  ${stackStatusIcon(status)} ${colors.highlight(stack.name)} ${stackStatusText(status)}`);

  // Show main URL prominently
  if (url) {
    console.log(`    ${icons.arrow} ${colors.accent(url)}`);
  }

  logger.dim(`    Path: ${stack.path}`);

  if (stack.domains && stack.domains.length > 0) {
    logger.dim(`    Domains: ${stack.domains.join(', ')}`);
  }

  // Show autostart status
  const autostartEnabled = stack.autostart !== false; // default true for backwards compat
  const autostartIcon = autostartEnabled ? colors.success('↻') : colors.muted('↻');
  const autostartText = autostartEnabled ? 'autostart enabled' : 'autostart disabled';
  logger.dim(`    ${autostartIcon} ${autostartText}`);

  // Show other ports compactly (use actual ports when running)
  if (ports.length > 0) {
    const otherPorts = ports
      .filter(m => m.internal !== 80)
      .map(m => `${m.service}:${m.external}`)
      .join(', ');
    if (otherPorts) {
      logger.dim(`    Other: ${otherPorts}`);
    }
  }

  if (containers.length > 0) {
    for (const container of containers) {
      const cIcon = container.state === 'running' ? colors.running('└─')
                  : container.state === 'exited' ? colors.stopped('└─')
                  : colors.warning('└─');
      logger.dim(`    ${cIcon} ${container.name}: ${container.status}`);
    }
  }
}

interface StatusOptions {
  all?: boolean;
}

export function statusCommand(name?: string, options: StatusOptions = {}): void {
  // If name provided, show that stack
  if (name) {
    const stack = getStack(name);
    if (!stack) {
      logger.error(`Stack "${name}" not found`);
      process.exit(1);
    }
    console.log();
    displayStackStatus(stack);
    console.log();
    return;
  }

  // If --all flag or not in a stack directory, show all stacks
  if (!options.all) {
    // Try to detect current directory stack
    const currentPath = resolve(process.cwd());
    const currentStack = getStackByPath(currentPath);

    if (currentStack) {
      logger.dim(`  Detected stack: ${currentStack.name}`);
      console.log();
      displayStackStatus(currentStack);
      console.log();
      return;
    }
  }

  // Show all stacks
  const stacks = getAllStacks();

  if (stacks.length === 0) {
    logger.info('No stacks registered');
    return;
  }

  console.log();
  console.log(colors.brand(`  ${icons.docker} Stack Status`));
  console.log();

  for (const stack of stacks) {
    displayStackStatus(stack);
    console.log();
  }
}
