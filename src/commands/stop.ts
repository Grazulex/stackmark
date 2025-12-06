import { stopStack } from '../core/docker.js';
import { removeHostsForStack } from '../core/hosts.js';
import { logger } from '../utils/logger.js';
import { resolveStack } from '../utils/resolve-stack.js';

export async function stopCommand(name?: string): Promise<void> {
  const stack = resolveStack(name);

  logger.info(`Stopping ${stack.name}...`);

  try {
    await stopStack(stack);

    // Try to clean hosts (non-blocking)
    if (stack.domains && stack.domains.length > 0) {
      try {
        removeHostsForStack(stack);
        logger.dim(`Hosts cleaned: ${stack.domains.join(', ')}`);
      } catch {
        logger.warning(`Could not update /etc/hosts (needs sudo)`);
        logger.dim(`  Run: sudo stackmark hosts sync`);
      }
    }

    logger.success(`Stack "${stack.name}" stopped`);
  } catch (err) {
    logger.error(`Failed to stop ${stack.name}: ${(err as Error).message}`);
    process.exit(1);
  }
}
