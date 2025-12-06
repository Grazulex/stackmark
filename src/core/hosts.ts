import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import type { Stack } from '../utils/types.js';
import { getAllStacks } from '../utils/config.js';
import { getStackStatus } from './docker.js';

const HOSTS_FILE = '/etc/hosts';
const STACKMARK_START = '# >>> STACKMARK MANAGED - DO NOT EDIT';
const STACKMARK_END = '# <<< STACKMARK MANAGED';

interface HostEntry {
  ip: string;
  domain: string;
  stack: string;
}

function readHostsFile(): string {
  return readFileSync(HOSTS_FILE, 'utf-8');
}

function writeHostsFile(content: string): void {
  execSync(`echo "${content.replace(/"/g, '\\"')}" | sudo tee ${HOSTS_FILE} > /dev/null`, {
    stdio: 'inherit',
  });
}

function extractStackmarkSection(content: string): { before: string; managed: string; after: string } {
  const startIdx = content.indexOf(STACKMARK_START);
  const endIdx = content.indexOf(STACKMARK_END);

  if (startIdx === -1 || endIdx === -1) {
    return { before: content.trimEnd(), managed: '', after: '' };
  }

  return {
    before: content.substring(0, startIdx).trimEnd(),
    managed: content.substring(startIdx + STACKMARK_START.length, endIdx).trim(),
    after: content.substring(endIdx + STACKMARK_END.length).trim(),
  };
}

function buildManagedSection(entries: HostEntry[]): string {
  if (entries.length === 0) return '';

  const lines = [STACKMARK_START];

  const byStack = entries.reduce((acc, entry) => {
    if (!acc[entry.stack]) acc[entry.stack] = [];
    acc[entry.stack].push(entry);
    return acc;
  }, {} as Record<string, HostEntry[]>);

  for (const [stack, stackEntries] of Object.entries(byStack)) {
    lines.push(`# Stack: ${stack}`);
    for (const entry of stackEntries) {
      lines.push(`${entry.ip}\t${entry.domain}`);
    }
  }

  lines.push(STACKMARK_END);
  return lines.join('\n');
}

export function syncHosts(): { added: string[]; removed: string[] } {
  const stacks = getAllStacks();
  const entries: HostEntry[] = [];

  for (const stack of stacks) {
    if (!stack.domains || stack.domains.length === 0) continue;

    const { status } = getStackStatus(stack);
    if (status === 'running' || status === 'partial') {
      for (const domain of stack.domains) {
        entries.push({ ip: '127.0.0.1', domain, stack: stack.name });
      }
    }
  }

  const content = readHostsFile();
  const { before, managed, after } = extractStackmarkSection(content);

  const oldDomains = new Set(
    managed.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split(/\s+/)[1])
      .filter(Boolean)
  );

  const newDomains = new Set(entries.map(e => e.domain));

  const added = entries.map(e => e.domain).filter(d => !oldDomains.has(d));
  const removed = [...oldDomains].filter(d => !newDomains.has(d));

  const managedSection = buildManagedSection(entries);
  const parts = [before];
  if (managedSection) parts.push('', managedSection);
  if (after) parts.push('', after);

  const newContent = parts.join('\n') + '\n';

  if (newContent !== content) {
    writeHostsFile(newContent);
  }

  return { added, removed };
}

export function addHostsForStack(stack: Stack): string[] {
  if (!stack.domains || stack.domains.length === 0) return [];

  const content = readHostsFile();
  const { before, managed, after } = extractStackmarkSection(content);

  const existingEntries: HostEntry[] = managed
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const parts = line.split(/\s+/);
      return { ip: parts[0], domain: parts[1], stack: 'unknown' };
    });

  const newEntries = stack.domains.map(domain => ({
    ip: '127.0.0.1',
    domain,
    stack: stack.name,
  }));

  const allEntries = [...existingEntries.filter(e => !stack.domains!.includes(e.domain)), ...newEntries];
  const managedSection = buildManagedSection(allEntries);

  const parts = [before];
  if (managedSection) parts.push('', managedSection);
  if (after) parts.push('', after);

  writeHostsFile(parts.join('\n') + '\n');
  return stack.domains;
}

export function removeHostsForStack(stack: Stack): string[] {
  if (!stack.domains || stack.domains.length === 0) return [];

  const content = readHostsFile();
  const { before, managed, after } = extractStackmarkSection(content);

  const remainingLines = managed
    .split('\n')
    .filter(line => {
      if (!line.trim() || line.startsWith('#')) return true;
      const domain = line.split(/\s+/)[1];
      return !stack.domains!.includes(domain);
    });

  const remainingEntries: HostEntry[] = remainingLines
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const parts = line.split(/\s+/);
      return { ip: parts[0], domain: parts[1], stack: 'unknown' };
    });

  const managedSection = buildManagedSection(remainingEntries);

  const parts = [before];
  if (managedSection) parts.push('', managedSection);
  if (after) parts.push('', after);

  writeHostsFile(parts.join('\n') + '\n');
  return stack.domains;
}
