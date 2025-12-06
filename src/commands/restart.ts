import { restartStack } from '../core/docker.js';
import { logger } from '../utils/logger.js';
import { resolveStack } from '../utils/resolve-stack.js';
import { colors } from '../utils/colors.js';

interface RestartOptions {
  override?: boolean;  // --no-override sets this to false
}

export async function restartCommand(name?: string, options: RestartOptions = {}): Promise<void> {
  const stack = resolveStack(name);
  const useOverride = options.override !== false;  // default true, false if --no-override

  logger.info(`Restarting ${stack.name}...`);

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
    await restartStack(stack, useOverride);
    logger.success(`Stack "${stack.name}" restarted`);
  } catch (err) {
    logger.error(`Failed to restart ${stack.name}: ${(err as Error).message}`);
    process.exit(1);
  }
}
