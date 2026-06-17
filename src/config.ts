import { existsSync, readFileSync } from 'node:fs';

export type RedisModel = 'read' | 'readwrite';
export type RedisSslCertReqs = 'required' | 'none';

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseInteger(value: string | undefined, defaultValue: number): number {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  return Number.isInteger(parsed) ? parsed : defaultValue;
}

function parseModel(value: string | undefined): RedisModel {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'read' ? 'read' : 'readwrite';
}

function parseCertReqs(value: string | undefined): RedisSslCertReqs {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'none' ? 'none' : 'required';
}

function optionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function readOptionalFile(path: string | undefined): string | undefined {
  if (!path) {
    return undefined;
  }

  if (!existsSync(path)) {
    throw new Error(`Redis TLS file does not exist: ${path}`);
  }

  return readFileSync(path, 'utf8');
}

export const config = {
  host: optionalString(process.env.REDIS_HOST) ?? '127.0.0.1',
  port: parseInteger(process.env.REDIS_PORT, 6379),
  db: parseInteger(process.env.REDIS_DB, 0),
  username: optionalString(process.env.REDIS_USERNAME) ?? 'default',
  password: process.env.REDIS_PWD ?? '',
  ssl: parseBoolean(process.env.REDIS_SSL, false),
  sslCaPath: optionalString(process.env.REDIS_SSL_CA_PATH),
  sslKeyFile: optionalString(process.env.REDIS_SSL_KEYFILE),
  sslCertFile: optionalString(process.env.REDIS_SSL_CERTFILE),
  sslCertReqs: parseCertReqs(process.env.REDIS_SSL_CERT_REQS),
  sslCaCerts: optionalString(process.env.REDIS_SSL_CA_CERTS),
  clusterMode: parseBoolean(process.env.REDIS_CLUSTER_MODE, false),
  model: parseModel(process.env.REDIS_MODE ?? process.env.REDIS_MODEL),
};

export function isReadOnlyMode(): boolean {
  return config.model === 'read';
}

export function getConnectionLabel(): string {
  const protocol = config.ssl ? 'rediss' : 'redis';
  const mode = config.clusterMode ? 'cluster' : 'standalone';
  return `${protocol}://${config.host}:${config.port}/${config.db} (${mode}, ${config.model})`;
}
