import { existsSync } from 'fs';
import { resolve, basename } from 'path';
import { addStack, stackExists, pathIsStack } from '../utils/config.js';
import { scanPorts, allocatePorts } from '../core/ports.js';
import { logger } from '../utils/logger.js';
import { colors } from '../utils/colors.js';

interface AddOptions {
  path?: string;
  domain?: string[];
}

export function addCommand(name: string | undefined, options: AddOptions): void {
  const stackPath = resolve(options.path || process.cwd());
  const stackName = name || basename(stackPath);

  if (!existsSync(stackPath)) {
    logger.error(`Path does not exist: ${stackPath}`);
    process.exit(1);
  }

  if (stackExists(stackName)) {
    logger.error(`Stack "${stackName}" already exists`);
    process.exit(1);
  }

  if (pathIsStack(stackPath)) {
    logger.error(`Path already registered as a stack`);
    process.exit(1);
  }

  // Scan and allocate unique ports
  const originalPorts = scanPorts(stackPath);
  const portMappings = allocatePorts(originalPorts);

  const domains = options.domain || [];

  addStack({ name: stackName, path: stackPath, domains, portMappings });

  logger.success(`Stack "${stackName}" added`);
  logger.dim(`  Path: ${stackPath}`);

  if (portMappings.length > 0) {
    logger.info('Port mappings (auto-allocated):');
    for (const mapping of portMappings) {
      const original = originalPorts.find(p => p.service === mapping.service && p.internal === mapping.internal);
      const originalPort = original?.external || mapping.internal;
      logger.dim(`  ${mapping.service}: ${colors.accent(String(mapping.external))}:${mapping.internal} ${colors.muted(`(was ${originalPort})`)}`);
    }
  }

  if (domains.length > 0) {
    logger.dim(`  Domains: ${domains.join(', ')}`);
  }
}
