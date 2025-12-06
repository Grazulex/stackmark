import { spawn, execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { generateOverrideYaml, scanServices } from './ports.js';
import type { Stack, StackStatus, ContainerInfo, PortMapping } from '../utils/types.js';

function getComposeFile(stack: Stack): string | null {
  const files = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
  for (const file of files) {
    const path = join(stack.path, file);
    if (existsSync(path)) return path;
  }
  return null;
}

interface ComposeResult {
  success: boolean;
  output: string;
}

interface ComposeOptions {
  useOverride?: boolean;
  streamOutput?: boolean;
  applyRestartPolicy?: boolean;
}

function runCompose(stack: Stack, args: string[], options: ComposeOptions = {}): Promise<ComposeResult> {
  const { useOverride = false, streamOutput = false, applyRestartPolicy = false } = options;

  return new Promise((resolve) => {
    const composeFile = getComposeFile(stack);
    if (!composeFile) {
      resolve({ success: false, output: `No docker-compose file found in ${stack.path}` });
      return;
    }

    const hasPortMappings = stack.portMappings && stack.portMappings.length > 0;
    const shouldApplyRestart = applyRestartPolicy && stack.autostart === false;
    const shouldOverride = (useOverride && hasPortMappings) || shouldApplyRestart;

    let overrideFile: string | null = null;

    const composeArgs = ['compose', '--progress=plain', '-f', composeFile];
    if (shouldOverride) {
      overrideFile = join(tmpdir(), `stackmark-${stack.name}-${Date.now()}.yml`);
      const allServices = shouldApplyRestart ? scanServices(stack.path) : undefined;
      const restartPolicy = shouldApplyRestart ? 'no' : undefined;
      const overrideYaml = generateOverrideYaml(
        hasPortMappings && useOverride ? stack.portMappings! : [],
        restartPolicy,
        allServices
      );
      if (overrideYaml) {
        writeFileSync(overrideFile, overrideYaml);
        composeArgs.push('-f', overrideFile);
      } else {
        overrideFile = null;
      }
    }
    composeArgs.push(...args);

    let output = '';

    const proc = spawn('docker', composeArgs, {
      cwd: stack.path,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (streamOutput) {
        process.stdout.write(text);
      }
    });

    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (streamOutput) {
        // Write to stdout to avoid buffering issues between stdout/stderr
        process.stdout.write(text);
      }
    });

    let exitCode: number | null = null;
    let stdoutEnded = false;
    let stderrEnded = false;

    const tryResolve = () => {
      if (exitCode !== null && stdoutEnded && stderrEnded) {
        // Cleanup temp file
        if (overrideFile && existsSync(overrideFile)) {
          try { unlinkSync(overrideFile); } catch {}
        }
        resolve({ success: exitCode === 0, output: output.trim() });
      }
    };

    proc.stdout?.on('end', () => {
      stdoutEnded = true;
      tryResolve();
    });

    proc.stderr?.on('end', () => {
      stderrEnded = true;
      tryResolve();
    });

    proc.on('close', (code) => {
      exitCode = code;
      tryResolve();
    });

    proc.on('error', (err) => {
      // Cleanup temp file
      if (overrideFile && existsSync(overrideFile)) {
        try { unlinkSync(overrideFile); } catch {}
      }
      resolve({ success: false, output: err.message });
    });
  });
}

export async function startStack(stack: Stack, useOverride: boolean = true): Promise<void> {
  // Stream output in real-time for start (can take time to pull/build)
  const result = await runCompose(stack, ['up', '-d'], {
    useOverride,
    streamOutput: true,
    applyRestartPolicy: true,
  });
  if (!result.success) {
    throw new Error(result.output || 'Failed to start stack');
  }
}

export async function stopStack(stack: Stack): Promise<void> {
  const result = await runCompose(stack, ['down'], { streamOutput: true });
  if (!result.success) {
    throw new Error(result.output || 'Failed to stop stack');
  }
}

export async function restartStack(stack: Stack, useOverride: boolean = true): Promise<void> {
  // For restart, we need to do down + up to apply port changes
  // Simple restart doesn't recreate containers with new ports
  const downResult = await runCompose(stack, ['down'], { streamOutput: true });
  if (!downResult.success) {
    throw new Error(downResult.output || 'Failed to stop stack');
  }
  const upResult = await runCompose(stack, ['up', '-d'], {
    useOverride,
    streamOutput: true,
    applyRestartPolicy: true,
  });
  if (!upResult.success) {
    throw new Error(upResult.output || 'Failed to start stack');
  }
}

export function streamLogs(stack: Stack, follow: boolean = false): void {
  const composeFile = getComposeFile(stack);
  if (!composeFile) {
    throw new Error(`No docker-compose file found in ${stack.path}`);
  }

  const args = ['compose', '-f', composeFile, 'logs'];
  if (follow) args.push('-f');

  spawn('docker', args, {
    cwd: stack.path,
    stdio: 'inherit',
  });
}

interface Publisher {
  URL: string;
  TargetPort: number;
  PublishedPort: number;
  Protocol: string;
}

export function getStackStatus(stack: Stack): { status: StackStatus; containers: ContainerInfo[]; actualPorts: PortMapping[] } {
  const composeFile = getComposeFile(stack);
  if (!composeFile) {
    return { status: 'stopped', containers: [], actualPorts: [] };
  }

  try {
    const output = execSync(
      `docker compose -f "${composeFile}" ps --format json`,
      { cwd: stack.path, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    if (!output.trim()) {
      return { status: 'stopped', containers: [], actualPorts: [] };
    }

    const containers: ContainerInfo[] = [];
    const actualPorts: PortMapping[] = [];
    const seenPorts = new Set<string>();

    output
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .forEach(line => {
        const data = JSON.parse(line);
        const service = data.Service || data.Name;

        containers.push({
          name: data.Name || service,
          status: data.Status || '',
          state: (data.State || 'exited').toLowerCase() as ContainerInfo['state'],
        });

        // Extract actual ports from Publishers
        if (data.Publishers && Array.isArray(data.Publishers)) {
          for (const pub of data.Publishers as Publisher[]) {
            if (pub.PublishedPort > 0 && pub.URL === '0.0.0.0') {
              const key = `${service}:${pub.TargetPort}:${pub.PublishedPort}`;
              if (!seenPorts.has(key)) {
                seenPorts.add(key);
                actualPorts.push({
                  service,
                  internal: pub.TargetPort,
                  external: pub.PublishedPort,
                });
              }
            }
          }
        }
      });

    if (containers.length === 0) {
      return { status: 'stopped', containers: [], actualPorts: [] };
    }

    const runningCount = containers.filter(c => c.state === 'running').length;
    const status: StackStatus =
      runningCount === containers.length ? 'running'
      : runningCount === 0 ? 'stopped'
      : 'partial';

    return { status, containers, actualPorts };
  } catch {
    return { status: 'stopped', containers: [], actualPorts: [] };
  }
}
