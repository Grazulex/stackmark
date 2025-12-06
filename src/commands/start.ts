import { startStack } from '../core/docker.js';
import { addHostsForStack } from '../core/hosts.js';
import { logger } from '../utils/logger.js';
import { resolveStack } from '../utils/resolve-stack.js';
import { colors } from '../utils/colors.js';

interface StartOptions {
  override?: boolean;  // --no-override sets this to false
}

export async function startCommand(name?: string, options: StartOptions = {}): Promise<void> {
  const stack = resolveStack(name);
  const useOverride = options.override !== false;  // default true, false if --no-override

  logger.info(`Starting ${stack.name}...`);

  // Show port mappings (or original ports warning)
  if (useOverride && stack.portMappings && stack.portMappings.length > 0) {
    logger.info('Ports (override):');
    for (const mapping of stack.portMappings) {
      logger.dim(`  ${mapping.service}: ${colors.accent(`localhost:${mapping.external}`)} → :${mapping.internal}`);
    }
  } else if (!useOverride) {
    logger.warning('Using original ports (no override)');
  }

  try {
    await startStack(stack, useOverride);

    // Try to update hosts (non-blocking)
    if (stack.domains && stack.domains.length > 0) {
      try {
        addHostsForStack(stack);
        logger.dim(`Hosts updated: ${stack.domains.join(', ')}`);
      } catch {
        logger.warning(`Could not update /etc/hosts (needs sudo)`);
        logger.dim(`  Run: sudo stackmark hosts sync`);
      }
    }

    logger.success(`Stack "${stack.name}" started`);
  } catch (err) {
    logger.error(`Failed to start ${stack.name}: ${(err as Error).message}`);
    process.exit(1);
  }
}
