import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { loadConfig, saveConfig } from '../utils/config.js';
import type { PortMapping } from '../utils/types.js';

const BASE_PORT = 9000; // Start allocating from port 9000

interface ComposeService {
  ports?: (string | { published?: number; target?: number })[];
}

interface ComposeFile {
  services?: Record<string, ComposeService>;
}

function getComposeFilePath(stackPath: string): string | null {
  const files = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
  for (const file of files) {
    const path = join(stackPath, file);
    if (existsSync(path)) return path;
  }
  return null;
}

function parsePort(portStr: string): { external: number; internal: number } | null {
  // Handle formats: "8000:80", "8000:80/tcp", "127.0.0.1:8000:80"
  const parts = portStr.replace(/\/\w+$/, '').split(':');

  if (parts.length === 2) {
    // "8000:80"
    return { external: parseInt(parts[0]), internal: parseInt(parts[1]) };
  } else if (parts.length === 3) {
    // "127.0.0.1:8000:80"
    return { external: parseInt(parts[1]), internal: parseInt(parts[2]) };
  }

  return null;
}

export function scanPorts(stackPath: string): PortMapping[] {
  const composePath = getComposeFilePath(stackPath);
  if (!composePath) return [];

  const content = readFileSync(composePath, 'utf-8');
  const compose: ComposeFile = parse(content);

  if (!compose?.services) return [];

  const mappings: PortMapping[] = [];

  for (const [serviceName, service] of Object.entries(compose.services)) {
    if (!service.ports) continue;

    for (const port of service.ports) {
      if (typeof port === 'string') {
        const parsed = parsePort(port);
        if (parsed && parsed.external !== parsed.internal) {
          // Only track ports that are exposed externally
          mappings.push({
            service: serviceName,
            internal: parsed.internal,
            external: parsed.external,
          });
        } else if (parsed) {
          mappings.push({
            service: serviceName,
            internal: parsed.internal,
            external: parsed.external,
          });
        }
      } else if (typeof port === 'object' && port.published && port.target) {
        mappings.push({
          service: serviceName,
          internal: port.target,
          external: port.published,
        });
      }
    }
  }

  return mappings;
}

export function allocatePorts(portMappings: PortMapping[]): PortMapping[] {
  const config = loadConfig();
  let nextPort = config.nextPort || BASE_PORT;

  // Get all already allocated ports
  const usedPorts = new Set<number>();
  for (const stack of Object.values(config.stacks)) {
    if (stack.portMappings) {
      for (const mapping of stack.portMappings) {
        usedPorts.add(mapping.external);
      }
    }
  }

  // Allocate new unique ports
  const allocated: PortMapping[] = [];
  for (const mapping of portMappings) {
    while (usedPorts.has(nextPort)) {
      nextPort++;
    }
    allocated.push({
      service: mapping.service,
      internal: mapping.internal,
      external: nextPort,
    });
    usedPorts.add(nextPort);
    nextPort++;
  }

  // Save next port for future allocations
  config.nextPort = nextPort;
  saveConfig(config);

  return allocated;
}

export function scanServices(stackPath: string): string[] {
  const composePath = getComposeFilePath(stackPath);
  if (!composePath) return [];

  const content = readFileSync(composePath, 'utf-8');
  const compose: ComposeFile = parse(content);

  if (!compose?.services) return [];
  return Object.keys(compose.services);
}

export function generateOverrideYaml(
  portMappings: PortMapping[],
  restartPolicy?: string,
  allServices?: string[]
): string {
  const services: Record<string, { ports?: string[]; restart?: string }> = {};

  // Add port mappings
  for (const mapping of portMappings) {
    if (!services[mapping.service]) {
      services[mapping.service] = {};
    }
    if (!services[mapping.service].ports) {
      services[mapping.service].ports = [];
    }
    services[mapping.service].ports!.push(`${mapping.external}:${mapping.internal}`);
  }

  // Add restart policy for all services if specified
  if (restartPolicy && allServices) {
    for (const service of allServices) {
      if (!services[service]) {
        services[service] = {};
      }
      services[service].restart = restartPolicy;
    }
  }

  if (Object.keys(services).length === 0) return '';

  // Use !override to completely replace ports instead of merging
  // This is supported in Docker Compose V2+
  let yaml = 'services:\n';
  for (const [service, config] of Object.entries(services)) {
    yaml += `  ${service}:\n`;
    if (config.ports && config.ports.length > 0) {
      yaml += `    ports: !override\n`;
      for (const port of config.ports) {
        yaml += `      - "${port}"\n`;
      }
    }
    if (config.restart) {
      yaml += `    restart: "${config.restart}"\n`;
    }
  }

  return yaml;
}
