import { resolve, basename } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import prompts from 'prompts';
import { stringify } from 'yaml';
import { logger } from '../utils/logger.js';
import { colors } from '../utils/colors.js';
import { allServices, servicesByCategory, type ServiceDefinition } from '../templates/services.js';
import { allPresets, type StackPreset } from '../templates/presets.js';

interface SelectedService {
  service: ServiceDefinition;
  version: string;
}

async function selectPreset(): Promise<StackPreset | null> {
  const response = await prompts({
    type: 'select',
    name: 'preset',
    message: 'Choose a stack template',
    choices: allPresets.map(p => ({
      title: `${p.name} ${colors.muted(`- ${p.description}`)}`,
      value: p.key,
    })),
  });

  if (!response.preset) return null;
  return allPresets.find(p => p.key === response.preset) || null;
}

async function selectServices(): Promise<SelectedService[]> {
  const selected: SelectedService[] = [];

  // Runtime
  const runtimeResponse = await prompts({
    type: 'select',
    name: 'runtime',
    message: 'Choose a runtime',
    choices: [
      { title: 'None', value: null },
      ...servicesByCategory.runtime.map(s => ({
        title: s.name,
        value: s.key,
      })),
    ],
  });

  if (runtimeResponse.runtime) {
    const service = allServices.find(s => s.key === runtimeResponse.runtime)!;
    const version = await selectVersion(service);
    if (version) selected.push({ service, version });
  }

  // Webserver (only if PHP selected)
  if (runtimeResponse.runtime === 'php') {
    const webResponse = await prompts({
      type: 'select',
      name: 'webserver',
      message: 'Choose a webserver',
      choices: [
        { title: 'None', value: null },
        ...servicesByCategory.webserver.map(s => ({
          title: s.name,
          value: s.key,
        })),
      ],
    });

    if (webResponse.webserver) {
      const service = allServices.find(s => s.key === webResponse.webserver)!;
      selected.push({ service, version: service.versions[0].value });
    }
  }

  // Database
  const dbResponse = await prompts({
    type: 'select',
    name: 'database',
    message: 'Choose a database',
    choices: [
      { title: 'None', value: null },
      ...servicesByCategory.database.map(s => ({
        title: s.name,
        value: s.key,
      })),
    ],
  });

  if (dbResponse.database) {
    const service = allServices.find(s => s.key === dbResponse.database)!;
    const version = await selectVersion(service);
    if (version) selected.push({ service, version });
  }

  // Cache
  const cacheResponse = await prompts({
    type: 'select',
    name: 'cache',
    message: 'Choose a cache service',
    choices: [
      { title: 'None', value: null },
      ...servicesByCategory.cache.map(s => ({
        title: s.name,
        value: s.key,
      })),
    ],
  });

  if (cacheResponse.cache) {
    const service = allServices.find(s => s.key === cacheResponse.cache)!;
    selected.push({ service, version: service.versions[0].value });
  }

  // Tools (multiselect)
  const toolsResponse = await prompts({
    type: 'multiselect',
    name: 'tools',
    message: 'Choose additional tools (space to select)',
    choices: servicesByCategory.tools.map(s => ({
      title: s.name,
      value: s.key,
    })),
  });

  if (toolsResponse.tools) {
    for (const key of toolsResponse.tools) {
      const service = allServices.find(s => s.key === key)!;
      selected.push({ service, version: service.versions[0].value });
    }
  }

  return selected;
}

async function selectVersion(service: ServiceDefinition): Promise<string | null> {
  if (service.versions.length === 1) {
    return service.versions[0].value;
  }

  const response = await prompts({
    type: 'select',
    name: 'version',
    message: `Choose ${service.name} version`,
    choices: service.versions.map(v => ({
      title: v.label,
      value: v.value,
    })),
    initial: service.versions.findIndex(v => v.default) || 0,
  });

  return response.version || null;
}

function generateDockerCompose(projectName: string, selectedServices: SelectedService[]): string {
  const services: Record<string, unknown> = {};
  const volumes: Record<string, unknown> = {};
  const networks: Record<string, unknown> = {
    [projectName]: {
      driver: 'bridge',
    },
  };

  // Track which services are selected for depends_on
  const selectedKeys = selectedServices.map(s => s.service.key);

  // Generate services
  for (const { service, version } of selectedServices) {
    const serviceConfig = service.getService(version, projectName);
    Object.assign(services, serviceConfig);
  }

  // Add depends_on for app service (depends on db and redis if they exist)
  if (services.app) {
    const appService = services.app as Record<string, unknown>;
    const dependsOn: string[] = [];
    if (services.db) dependsOn.push('db');
    if (services.redis) dependsOn.push('redis');
    if (dependsOn.length > 0) {
      appService.depends_on = dependsOn;
    }
  }

  // Add depends_on for nginx (depends on app if it exists)
  if (services.nginx && services.app) {
    const nginxService = services.nginx as Record<string, unknown>;
    nginxService.depends_on = ['app'];
  }

  // Collect volume names from services
  for (const serviceDef of Object.values(services) as Record<string, unknown>[]) {
    const serviceVolumes = serviceDef.volumes as string[] | undefined;
    if (serviceVolumes) {
      for (const vol of serviceVolumes) {
        if (typeof vol === 'string' && vol.startsWith(projectName)) {
          const volName = vol.split(':')[0];
          volumes[volName] = {};
        }
      }
    }
  }

  const compose: Record<string, unknown> = {
    services,
  };

  if (Object.keys(volumes).length > 0) {
    compose.volumes = volumes;
  }

  compose.networks = networks;

  return stringify(compose, { indent: 2 });
}

function generateDockerfile(phpVersion: string): string {
  return `ARG PHP_VERSION=${phpVersion}
FROM php:\${PHP_VERSION}-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    git \\
    curl \\
    libpng-dev \\
    libonig-dev \\
    libxml2-dev \\
    libzip-dev \\
    zip \\
    unzip

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

EXPOSE 9000
CMD ["php-fpm"]
`;
}

function generateNginxConfig(): string {
  return `server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\\.(?!well-known).* {
        deny all;
    }
}
`;
}

export async function initCommand(): Promise<void> {
  const cwd = resolve(process.cwd());
  const defaultName = basename(cwd);

  console.log();
  console.log(colors.brand('  🐳 StackMark Init'));
  console.log(colors.muted('  Generate a docker-compose.yml for your project'));
  console.log();

  // Check if docker-compose already exists
  const composeFiles = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
  const existingFile = composeFiles.find(f => existsSync(resolve(cwd, f)));

  if (existingFile) {
    const confirm = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `${existingFile} already exists. Overwrite?`,
      initial: false,
    });

    if (!confirm.overwrite) {
      logger.info('Cancelled');
      return;
    }
  }

  // Get project name
  const nameResponse = await prompts({
    type: 'text',
    name: 'name',
    message: 'Project name',
    initial: defaultName,
    validate: (v) => v.length > 0 || 'Project name is required',
  });

  if (!nameResponse.name) {
    logger.info('Cancelled');
    return;
  }

  const projectName = nameResponse.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Select preset or custom
  const preset = await selectPreset();
  if (!preset) {
    logger.info('Cancelled');
    return;
  }

  let selectedServices: SelectedService[] = [];

  if (preset.key === 'custom') {
    // Custom selection
    selectedServices = await selectServices();
  } else {
    // Use preset services
    for (const presetService of preset.services) {
      const service = allServices.find(s => s.key === presetService.key);
      if (service) {
        const version = presetService.version || service.versions.find(v => v.default)?.value || service.versions[0].value;
        selectedServices.push({ service, version });
      }
    }
  }

  if (selectedServices.length === 0) {
    logger.error('No services selected');
    return;
  }

  // Generate docker-compose.yml
  const dockerCompose = generateDockerCompose(projectName, selectedServices);

  // Write files
  writeFileSync(resolve(cwd, 'docker-compose.yml'), dockerCompose);
  logger.success('Created docker-compose.yml');

  // Generate Dockerfile for PHP projects
  const phpService = selectedServices.find(s => s.service.key === 'php');
  if (phpService) {
    writeFileSync(resolve(cwd, 'Dockerfile'), generateDockerfile(phpService.version));
    logger.success('Created Dockerfile');
  }

  // Generate Nginx config if nginx is selected
  const nginxSelected = selectedServices.find(s => s.service.key === 'nginx');
  if (nginxSelected) {
    const dockerDir = resolve(cwd, 'docker', 'nginx');
    mkdirSync(dockerDir, { recursive: true });
    writeFileSync(resolve(dockerDir, 'default.conf'), generateNginxConfig());
    logger.success('Created docker/nginx/default.conf');
  }

  console.log();
  logger.info('Services configured:');
  for (const { service, version } of selectedServices) {
    logger.dim(`  - ${service.name} ${version}`);
  }

  console.log();
  logger.info('Next steps:');
  logger.dim('  1. Review and customize docker-compose.yml');
  logger.dim('  2. Run: stackmark add');
  logger.dim('  3. Run: stackmark start');
  console.log();
}
