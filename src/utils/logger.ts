import { colors, icons, stackStatusIcon } from './colors.js';

export const logger = {
  info: (msg: string) => console.log(colors.info(icons.info), msg),
  success: (msg: string) => console.log(colors.success(icons.success), msg),
  warning: (msg: string) => console.log(colors.warning(icons.warning), msg),
  error: (msg: string) => console.log(colors.error(icons.error), msg),
  stack: (name: string, status: 'running' | 'stopped' | 'partial') => {
    console.log(`  ${stackStatusIcon(status)} ${name}`);
  },
  dim: (msg: string) => console.log(colors.dim(msg)),
  log: (msg: string) => console.log(msg),
  brand: (msg: string) => console.log(colors.brand(msg)),
  accent: (msg: string) => console.log(colors.accent(msg)),
};
