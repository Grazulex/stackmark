// Stack presets - pre-configured service combinations

export interface StackPreset {
  name: string;
  key: string;
  description: string;
  services: {
    key: string;
    version?: string;
  }[];
}

export const laravelPreset: StackPreset = {
  name: 'Laravel',
  key: 'laravel',
  description: 'PHP + Nginx + MySQL + Redis + Mailpit',
  services: [
    { key: 'php', version: '8.3' },
    { key: 'nginx' },
    { key: 'mysql', version: '8.0' },
    { key: 'redis' },
    { key: 'mailpit' },
  ],
};

export const symfonyPreset: StackPreset = {
  name: 'Symfony',
  key: 'symfony',
  description: 'PHP + Nginx + PostgreSQL + Redis + Mailpit',
  services: [
    { key: 'php', version: '8.3' },
    { key: 'nginx' },
    { key: 'postgres', version: '16' },
    { key: 'redis' },
    { key: 'mailpit' },
  ],
};

export const nodePreset: StackPreset = {
  name: 'Node.js',
  key: 'node',
  description: 'Node.js + PostgreSQL + Redis',
  services: [
    { key: 'node', version: '22' },
    { key: 'postgres', version: '16' },
    { key: 'redis' },
  ],
};

export const wordpressPreset: StackPreset = {
  name: 'WordPress',
  key: 'wordpress',
  description: 'PHP + Nginx + MariaDB + Redis + Mailpit',
  services: [
    { key: 'php', version: '8.2' },
    { key: 'nginx' },
    { key: 'mariadb' },
    { key: 'redis' },
    { key: 'mailpit' },
  ],
};

export const apiPreset: StackPreset = {
  name: 'API (Laravel/Lumen)',
  key: 'api',
  description: 'PHP + Nginx + PostgreSQL + Redis',
  services: [
    { key: 'php', version: '8.3' },
    { key: 'nginx' },
    { key: 'postgres', version: '16' },
    { key: 'redis' },
  ],
};

export const customPreset: StackPreset = {
  name: 'Custom',
  key: 'custom',
  description: 'Choose your own services',
  services: [],
};

export const allPresets: StackPreset[] = [
  laravelPreset,
  symfonyPreset,
  nodePreset,
  wordpressPreset,
  apiPreset,
  customPreset,
];
