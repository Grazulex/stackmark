export interface PortMapping {
  service: string;
  internal: number;
  external: number;
}

export interface Stack {
  name: string;
  path: string;
  domains?: string[];
  portMappings?: PortMapping[];
  autostart?: boolean; // Whether containers should auto-start on system boot (default: true)
}

export interface Config {
  stacks: Record<string, Omit<Stack, 'name'>>;
  nextPort?: number; // Track next available port
}

export type StackStatus = 'running' | 'stopped' | 'partial';

export interface StackInfo extends Stack {
  status: StackStatus;
  containers?: ContainerInfo[];
}

export interface ContainerInfo {
  name: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'restarting';
}
