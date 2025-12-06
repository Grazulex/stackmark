import { resolve } from 'path';
import { getStack, getStackByPath } from './config.js';
import { logger } from './logger.js';
import type { Stack } from './types.js';

export function resolveStack(nameOrUndefined?: string): Stack {
  // If name provided, look it up directly
  if (nameOrUndefined) {
    const stack = getStack(nameOrUndefined);
    if (!stack) {
      logger.error(`Stack "${nameOrUndefined}" not found`);
      process.exit(1);
    }
    return stack;
  }

  // No name provided, try to detect from current directory
  const currentPath = resolve(process.cwd());
  const stack = getStackByPath(currentPath);

  if (!stack) {
    logger.error('No stack name provided and current directory is not a registered stack');
    logger.dim('  Use "stackmark <command> <name>" or run from a stack directory');
    process.exit(1);
  }

  logger.dim(`  Detected stack: ${stack.name}`);
  return stack;
}
