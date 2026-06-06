import { createClient, createCluster } from 'redis';
import { config, readOptionalFile } from './config.js';

type RedisConnection = {
  isReady?: boolean;
  connect: () => Promise<unknown>;
  quit: () => Promise<unknown>;
  sendCommand: (args: string[]) => Promise<unknown>;
  [key: string]: unknown;
};

let clientPromise: Promise<RedisConnection> | undefined;

function tlsSocketOptions(): Record<string, unknown> {
  if (!config.ssl) {
    return {};
  }

  const ca = readOptionalFile(config.sslCaPath) ?? readOptionalFile(config.sslCaCerts);
  const key = readOptionalFile(config.sslKeyFile);
  const cert = readOptionalFile(config.sslCertFile);

  return {
    tls: true,
    rejectUnauthorized: config.sslCertReqs === 'required',
    ...(ca ? { ca } : {}),
    ...(key ? { key } : {}),
    ...(cert ? { cert } : {}),
  };
}

function authOptions(): Record<string, unknown> {
  return {
    ...(config.username ? { username: config.username } : {}),
    ...(config.password ? { password: config.password } : {}),
  };
}

async function createRedisConnection(): Promise<RedisConnection> {
  const socket = {
    host: config.host,
    port: config.port,
    ...tlsSocketOptions(),
  };

  const connection = config.clusterMode
    ? createCluster({
      rootNodes: [{ socket }],
      defaults: {
        ...authOptions(),
        socket: tlsSocketOptions(),
      },
    } as never)
    : createClient({
      ...authOptions(),
      database: config.db,
      socket,
    } as never);

  const typedConnection = connection as unknown as RedisConnection;
  connection.on('error', (error: Error) => {
    console.error('Redis client error:', error.message);
  });

  await typedConnection.connect();
  return typedConnection;
}

export async function getRedisClient(): Promise<RedisConnection> {
  clientPromise ??= createRedisConnection();
  return clientPromise;
}

export async function closeRedisClient(): Promise<void> {
  if (!clientPromise) {
    return;
  }

  const client = await clientPromise;
  await client.quit();
  clientPromise = undefined;
}
