#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { restartCommand } from './commands/restart.js';
import { statusCommand } from './commands/status.js';
import { logsCommand } from './commands/logs.js';
import { hostsSyncCommand } from './commands/hosts.js';
import { openCommand } from './commands/open.js';
import { initCommand } from './commands/init.js';
import { dashboardCommand } from './commands/dashboard.js';
import { colors } from './utils/colors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;

const banner = `
${colors.brand('┌─────────────────────────────────────┐')}
${colors.brand('│')}  ${colors.accent('🐳 STACKMARK')}                       ${colors.brand('│')}
${colors.brand('│')}  ${colors.muted('Docker stack management CLI')}        ${colors.brand('│')}
${colors.brand('└─────────────────────────────────────┘')}
`;

const program = new Command();

program
  .name('stackmark')
  .description('Docker stack management CLI for local development')
  .version(VERSION, '-v, --version', 'Show version information')
  .configureOutput({
    outputError: (str, write) => write(colors.error(str)),
  })
  .addHelpText('beforeAll', banner);

program
  .command('init')
  .description('Generate a docker-compose.yml with interactive prompts')
  .action(initCommand);

program
  .command('add [name]')
  .description('Register a new stack (defaults to current directory)')
  .option('-p, --path <path>', 'Path to the docker-compose project (default: current dir)')
  .option('-d, --domain <domain...>', 'Local domains (e.g., myapp.local)')
  .action(addCommand);

program
  .command('remove <name>')
  .alias('rm')
  .description('Remove a registered stack')
  .action(removeCommand);

program
  .command('list')
  .alias('ls')
  .description('List all registered stacks')
  .action(listCommand);

program
  .command('start [name]')
  .description('Start a stack (auto-detects if in stack directory)')
  .option('--no-override', 'Use original ports from docker-compose.yml')
  .action(startCommand);

program
  .command('stop [name]')
  .description('Stop a stack (auto-detects if in stack directory)')
  .action(stopCommand);

program
  .command('restart [name]')
  .description('Restart a stack (auto-detects if in stack directory)')
  .option('--no-override', 'Use original ports from docker-compose.yml')
  .action(restartCommand);

program
  .command('status [name]')
  .description('Show stack status (auto-detects if in stack directory)')
  .option('-a, --all', 'Show all stacks (ignore auto-detection)')
  .action(statusCommand);

program
  .command('logs [name]')
  .description('Show stack logs (auto-detects if in stack directory)')
  .option('-f, --follow', 'Follow log output')
  .action(logsCommand);

program
  .command('open [name]')
  .description('Open stack in browser (auto-detects if in stack directory)')
  .action(openCommand);

program
  .command('dashboard')
  .alias('dash')
  .description('Interactive dashboard with auto-refresh (press q to quit)')
  .action(dashboardCommand);

const hosts = program
  .command('hosts')
  .description('Manage /etc/hosts entries');

hosts
  .command('sync')
  .description('Sync hosts with running stacks')
  .action(hostsSyncCommand);

program.parse();
