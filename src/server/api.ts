// API routes for the web dashboard

import type { IncomingMessage, ServerResponse } from 'http';
import { getAllStacks } from '../utils/config.js';
import { getStackStatus } from '../core/docker.js';
import type { PortMapping } from '../utils/types.js';

// Services that are typically web servers (priority order)
const WEB_SERVICES = ['nginx', 'web', 'app', 'frontend', 'client', 'apache', 'caddy'];

function getMainWebUrl(portMappings: PortMapping[]): string | null {
  if (!portMappings || portMappings.length === 0) {
    return null;
  }

  let port: number | null = null;

  // First try to find a known web service with port 80
  for (const serviceName of WEB_SERVICES) {
    const mapping = portMappings.find(m =>
      m.service.toLowerCase().includes(serviceName) && m.internal === 80
    );
    if (mapping) {
      port = mapping.external;
      break;
    }
  }

  // Then try any service with internal port 80
  if (!port) {
    const port80 = portMappings.find(m => m.internal === 80);
    if (port80) port = port80.external;
  }

  // Then try common web ports
  if (!port) {
    const webPorts = [443, 8080, 3000, 8000, 5000];
    for (const p of webPorts) {
      const mapping = portMappings.find(m => m.internal === p);
      if (mapping) {
        port = mapping.external;
        break;
      }
    }
  }

  if (!port) return null;

  return `http://localhost:${port}`;
}

interface StackResponse {
  name: string;
  path: string;
  status: string;
  autostart: boolean;
  domains?: string[];
  portMappings?: PortMapping[];
  actualPorts: PortMapping[];
  mainUrl: string | null;
  containers: Array<{
    name: string;
    status: string;
    state: string;
  }>;
}

export function getStacksData(): StackResponse[] {
  const stacks = getAllStacks();

  return stacks.map(stack => {
    const { status, containers, actualPorts } = getStackStatus(stack);

    // Use actual running ports if available, otherwise fall back to config
    const ports = actualPorts.length > 0 ? actualPorts : (stack.portMappings || []);
    const mainUrl = getMainWebUrl(ports);

    return {
      name: stack.name,
      path: stack.path,
      status,
      autostart: stack.autostart !== false,
      domains: stack.domains,
      portMappings: stack.portMappings,
      actualPorts,
      mainUrl,
      containers,
    };
  });
}

export function handleApiRequest(req: IncomingMessage, res: ServerResponse): boolean {
  const url = req.url || '';

  if (url === '/api/stacks' && req.method === 'GET') {
    const data = getStacksData();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    res.end(JSON.stringify(data));
    return true;
  }

  return false;
}
