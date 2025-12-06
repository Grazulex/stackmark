// Service definitions for docker-compose generation

export interface ServiceVersion {
  value: string;
  label: string;
  default?: boolean;
}

export interface ServiceDefinition {
  name: string;
  key: string;
  category: 'runtime' | 'webserver' | 'database' | 'cache' | 'tools';
  versions: ServiceVersion[];
  getService: (version: string, projectName: string) => Record<string, unknown>;
  getVolumes?: () => Record<string, unknown>;
}

// PHP Service
export const phpService: ServiceDefinition = {
  name: 'PHP',
  key: 'php',
  category: 'runtime',
  versions: [
    { value: '8.3', label: 'PHP 8.3', default: true },
    { value: '8.2', label: 'PHP 8.2' },
    { value: '8.1', label: 'PHP 8.1' },
  ],
  getService: (version, projectName) => ({
    app: {
      build: {
        context: '.',
        dockerfile: 'Dockerfile',
        args: {
          PHP_VERSION: version,
        },
      },
      restart: 'no',
      volumes: ['.:/var/www/html'],
      networks: [projectName],
    },
  }),
};

// Node.js Service
export const nodeService: ServiceDefinition = {
  name: 'Node.js',
  key: 'node',
  category: 'runtime',
  versions: [
    { value: '22', label: 'Node.js 22 (LTS)', default: true },
    { value: '20', label: 'Node.js 20 (LTS)' },
    { value: '18', label: 'Node.js 18' },
  ],
  getService: (version, projectName) => ({
    app: {
      image: `node:${version}-alpine`,
      restart: 'no',
      working_dir: '/app',
      volumes: ['.:/app'],
      networks: [projectName],
      command: 'npm run dev',
      ports: ['3000:3000'],
    },
  }),
};

// Nginx Service
export const nginxService: ServiceDefinition = {
  name: 'Nginx',
  key: 'nginx',
  category: 'webserver',
  versions: [
    { value: 'alpine', label: 'Latest (Alpine)', default: true },
    { value: '1.25-alpine', label: '1.25 (Alpine)' },
  ],
  getService: (version, projectName) => ({
    nginx: {
      image: `nginx:${version}`,
      restart: 'no',
      ports: ['80:80'],
      volumes: [
        '.:/var/www/html',
        './docker/nginx/default.conf:/etc/nginx/conf.d/default.conf',
      ],
      networks: [projectName],
      depends_on: ['app'],
    },
  }),
};

// MySQL Service
export const mysqlService: ServiceDefinition = {
  name: 'MySQL',
  key: 'mysql',
  category: 'database',
  versions: [
    { value: '8.0', label: 'MySQL 8.0', default: true },
    { value: '5.7', label: 'MySQL 5.7' },
  ],
  getService: (version, projectName) => ({
    db: {
      image: `mysql:${version}`,
      restart: 'no',
      ports: ['3306:3306'],
      environment: {
        MYSQL_ROOT_PASSWORD: 'secret',
        MYSQL_DATABASE: projectName,
        MYSQL_USER: projectName,
        MYSQL_PASSWORD: 'secret',
      },
      volumes: [`${projectName}-db:/var/lib/mysql`],
      networks: [projectName],
    },
  }),
  getVolumes: () => ({}), // Volume name is dynamic
};

// MariaDB Service
export const mariadbService: ServiceDefinition = {
  name: 'MariaDB',
  key: 'mariadb',
  category: 'database',
  versions: [
    { value: '11', label: 'MariaDB 11', default: true },
    { value: '10.11', label: 'MariaDB 10.11' },
  ],
  getService: (version, projectName) => ({
    db: {
      image: `mariadb:${version}`,
      restart: 'no',
      ports: ['3306:3306'],
      environment: {
        MARIADB_ROOT_PASSWORD: 'secret',
        MARIADB_DATABASE: projectName,
        MARIADB_USER: projectName,
        MARIADB_PASSWORD: 'secret',
      },
      volumes: [`${projectName}-db:/var/lib/mysql`],
      networks: [projectName],
    },
  }),
};

// PostgreSQL Service
export const postgresService: ServiceDefinition = {
  name: 'PostgreSQL',
  key: 'postgres',
  category: 'database',
  versions: [
    { value: '16', label: 'PostgreSQL 16', default: true },
    { value: '15', label: 'PostgreSQL 15' },
    { value: '14', label: 'PostgreSQL 14' },
  ],
  getService: (version, projectName) => ({
    db: {
      image: `postgres:${version}-alpine`,
      restart: 'no',
      ports: ['5432:5432'],
      environment: {
        POSTGRES_DB: projectName,
        POSTGRES_USER: projectName,
        POSTGRES_PASSWORD: 'secret',
      },
      volumes: [`${projectName}-db:/var/lib/postgresql/data`],
      networks: [projectName],
    },
  }),
};

// Redis Service
export const redisService: ServiceDefinition = {
  name: 'Redis',
  key: 'redis',
  category: 'cache',
  versions: [
    { value: '7', label: 'Redis 7', default: true },
    { value: '6', label: 'Redis 6' },
  ],
  getService: (version, projectName) => ({
    redis: {
      image: `redis:${version}-alpine`,
      restart: 'no',
      ports: ['6379:6379'],
      volumes: [`${projectName}-redis:/data`],
      networks: [projectName],
    },
  }),
};

// Memcached Service
export const memcachedService: ServiceDefinition = {
  name: 'Memcached',
  key: 'memcached',
  category: 'cache',
  versions: [
    { value: 'latest', label: 'Latest', default: true },
  ],
  getService: (version, projectName) => ({
    memcached: {
      image: `memcached:${version}-alpine`,
      restart: 'no',
      ports: ['11211:11211'],
      networks: [projectName],
    },
  }),
};

// Mailpit Service
export const mailpitService: ServiceDefinition = {
  name: 'Mailpit',
  key: 'mailpit',
  category: 'tools',
  versions: [
    { value: 'latest', label: 'Latest', default: true },
  ],
  getService: (_version, projectName) => ({
    mailpit: {
      image: 'axllent/mailpit',
      restart: 'no',
      ports: ['1025:1025', '8025:8025'],
      networks: [projectName],
    },
  }),
};

// MinIO Service (S3 compatible)
export const minioService: ServiceDefinition = {
  name: 'MinIO (S3)',
  key: 'minio',
  category: 'tools',
  versions: [
    { value: 'latest', label: 'Latest', default: true },
  ],
  getService: (_version, projectName) => ({
    minio: {
      image: 'minio/minio',
      restart: 'no',
      ports: ['9000:9000', '9001:9001'],
      environment: {
        MINIO_ROOT_USER: 'minioadmin',
        MINIO_ROOT_PASSWORD: 'minioadmin',
      },
      volumes: [`${projectName}-minio:/data`],
      command: 'server /data --console-address ":9001"',
      networks: [projectName],
    },
  }),
};

// phpMyAdmin Service
export const phpmyadminService: ServiceDefinition = {
  name: 'phpMyAdmin',
  key: 'phpmyadmin',
  category: 'tools',
  versions: [
    { value: 'latest', label: 'Latest', default: true },
  ],
  getService: (_version, projectName) => ({
    phpmyadmin: {
      image: 'phpmyadmin',
      restart: 'no',
      ports: ['8080:80'],
      environment: {
        PMA_HOST: 'db',
        PMA_USER: projectName,
        PMA_PASSWORD: 'secret',
      },
      networks: [projectName],
      depends_on: ['db'],
    },
  }),
};

// All services grouped by category
export const allServices: ServiceDefinition[] = [
  phpService,
  nodeService,
  nginxService,
  mysqlService,
  mariadbService,
  postgresService,
  redisService,
  memcachedService,
  mailpitService,
  minioService,
  phpmyadminService,
];

export const servicesByCategory = {
  runtime: allServices.filter(s => s.category === 'runtime'),
  webserver: allServices.filter(s => s.category === 'webserver'),
  database: allServices.filter(s => s.category === 'database'),
  cache: allServices.filter(s => s.category === 'cache'),
  tools: allServices.filter(s => s.category === 'tools'),
};
