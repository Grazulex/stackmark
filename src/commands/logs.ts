import { streamLogs } from '../core/docker.js';
import { logger } from '../utils/logger.js';
import { resolveStack } from '../utils/resolve-stack.js';

interface LogsOptions {
  follow?: boolean;
}

export function logsCommand(name: string | undefined, options: LogsOptions): void {
  const stack = resolveStack(name);

  try {
    streamLogs(stack, options.follow);
  } catch (err) {
    logger.error(`Failed to get logs: ${(err as Error).message}`);
    process.exit(1);
  }
}
