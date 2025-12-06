import chalk from 'chalk';

export const colors = {
  // Semantic colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  muted: chalk.gray,
  highlight: chalk.bold.white,

  // Stack status
  running: chalk.green,
  stopped: chalk.gray,
  partial: chalk.yellow,

  // UI elements
  brand: chalk.hex('#FF6B6B').bold,
  accent: chalk.hex('#4ECDC4'),
  dim: chalk.dim,
};

export const icons = {
  // Status
  success: '✔',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',

  // Stack status
  running: '●',
  stopped: '○',
  partial: '◐',

  // Actions
  docker: '🐳',
  stack: '📦',
  start: '▶',
  stop: '■',
  restart: '↻',
  logs: '📋',
  hosts: '🌐',

  // UI
  arrow: '→',
  bullet: '•',
  check: '✓',
  cross: '✗',
  dot: '·',
};

export function stackStatusIcon(status: 'running' | 'stopped' | 'partial'): string {
  const iconMap = {
    running: colors.running(icons.running),
    stopped: colors.stopped(icons.stopped),
    partial: colors.warning(icons.partial),
  };
  return iconMap[status];
}

export function stackStatusText(status: 'running' | 'stopped' | 'partial'): string {
  const colorMap = {
    running: colors.running,
    stopped: colors.stopped,
    partial: colors.warning,
  };
  return colorMap[status](status);
}
