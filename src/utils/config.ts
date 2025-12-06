import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse, stringify } from 'yaml';
import type { Config, Stack } from './types.js';

const CONFIG_DIR = join(homedir(), '.stackmark');
const CONFIG_FILE = join(CONFIG_DIR, 'config.yml');

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getDefaultConfig(): Config {
  return { stacks: {} };
}

export function loadConfig(): Config {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return getDefaultConfig();
  }
  const content = readFileSync(CONFIG_FILE, 'utf-8');
  return parse(content) || getDefaultConfig();
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, stringify(config), 'utf-8');
}

export function getStack(name: string): Stack | null {
  const config = loadConfig();
  const stackData = config.stacks[name];
  if (!stackData) return null;
  return { name, ...stackData };
}

export function getAllStacks(): Stack[] {
  const config = loadConfig();
  return Object.entries(config.stacks).map(([name, data]) => ({
    name,
    ...data,
  }));
}

export function addStack(stack: Stack): void {
  const config = loadConfig();
  const { name, ...data } = stack;
  config.stacks[name] = data;
  saveConfig(config);
}

export function removeStack(name: string): boolean {
  const config = loadConfig();
  if (!config.stacks[name]) return false;
  delete config.stacks[name];
  saveConfig(config);
  return true;
}

export function stackExists(name: string): boolean {
  const config = loadConfig();
  return !!config.stacks[name];
}

export function getStackByPath(searchPath: string): Stack | null {
  const config = loadConfig();
  for (const [name, data] of Object.entries(config.stacks)) {
    if (data.path === searchPath) {
      return { name, ...data };
    }
  }
  return null;
}

export function pathIsStack(searchPath: string): boolean {
  return getStackByPath(searchPath) !== null;
}
