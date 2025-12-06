import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { updateStack } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { resolveStack } from '../utils/resolve-stack.js';
import { colors } from '../utils/colors.js';
import type { Stack } from '../utils/types.js';

function getComposeFile(stack: Stack): string | null {
  const files = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
  for (const file of files) {
    const path = join(stack.path, file);
    if (existsSync(path)) return path;
  }
  return null;
}

function getContainerIds(stack: Stack): string[] {
  const composeFile = getComposeFile(stack);
  if (!composeFile) return [];

  try {
    const output = execSync(
      `docker compose -f "${composeFile}" ps -q`,
      { cwd: stack.path, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return output.trim().split('\n').filter(id => id.trim());
  } catch {
    return [];
  }
}

function updateContainersRestartPolicy(containerIds: string[], policy: string): boolean {
  if (containerIds.length === 0) return true;

  try {
    for (const id of containerIds) {
      execSync(`docker update --restart=${policy} ${id}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function autostartEnableCommand(name?: string): Promise<void> {
  const stack = resolveStack(name);
  const restartPolicy = 'unless-stopped';

  // Update running containers
  const containerIds = getContainerIds(stack);
  if (containerIds.length > 0) {
    const success = updateContainersRestartPolicy(containerIds, restartPolicy);
    if (success) {
      logger.dim(`Updated ${containerIds.length} container(s) restart policy to "${restartPolicy}"`);
    } else {
      logger.warning('Could not update some containers (they may not be running)');
    }
  }

  // Save preference
  updateStack(stack.name, { autostart: true });

  logger.success(`Autostart ${colors.accent('enabled')} for "${stack.name}"`);
  logger.dim('Containers will restart automatically on system boot');
}

export async function autostartDisableCommand(name?: string): Promise<void> {
  const stack = resolveStack(name);
  const restartPolicy = 'no';

  // Update running containers
  const containerIds = getContainerIds(stack);
  if (containerIds.length > 0) {
    const success = updateContainersRestartPolicy(containerIds, restartPolicy);
    if (success) {
      logger.dim(`Updated ${containerIds.length} container(s) restart policy to "${restartPolicy}"`);
    } else {
      logger.warning('Could not update some containers (they may not be running)');
    }
  }

  // Save preference
  updateStack(stack.name, { autostart: false });

  logger.success(`Autostart ${colors.accent('disabled')} for "${stack.name}"`);
  logger.dim('Containers will NOT restart automatically on system boot');
}
