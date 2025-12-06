import { syncHosts } from '../core/hosts.js';
import { logger } from '../utils/logger.js';

export function hostsSyncCommand(): void {
  logger.info('Syncing hosts...');

  try {
    const { added, removed } = syncHosts();

    if (added.length > 0) {
      logger.success(`Added: ${added.join(', ')}`);
    }

    if (removed.length > 0) {
      logger.success(`Removed: ${removed.join(', ')}`);
    }

    if (added.length === 0 && removed.length === 0) {
      logger.info('Hosts already in sync');
    }
  } catch (err) {
    logger.error(`Failed to sync hosts: ${(err as Error).message}`);
    logger.dim('  Make sure you have sudo privileges');
    process.exit(1);
  }
}
