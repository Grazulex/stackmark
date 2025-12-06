import { removeStack, getStack } from '../utils/config.js';
import { removeHostsForStack } from '../core/hosts.js';
import { logger } from '../utils/logger.js';

export function removeCommand(name: string): void {
  const stack = getStack(name);

  if (!stack) {
    logger.error(`Stack "${name}" not found`);
    process.exit(1);
  }

  if (stack.domains && stack.domains.length > 0) {
    removeHostsForStack(stack);
  }

  removeStack(name);
  logger.success(`Stack "${name}" removed`);
}
