#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getConnectionLabel, isReadOnlyMode } from './config.js';
import { jsonText } from './format.js';
import {
  redisClientList,
  redisCommand,
  redisCommandList,
  redisConfigGet,
  redisDbSize,
  redisDel,
  redisExists,
  redisExpire,
  redisGet,
  redisHDel,
  redisHGet,
  redisHGetAll,
  redisHSet,
  redisIncrBy,
  redisInfo,
  redisKeys,
  redisLPop,
  redisLPush,
  redisLRange,
  redisMGet,
  redisMSet,
  redisPing,
  redisPublish,
  redisRename,
  redisRPop,
  redisRPush,
  redisSAdd,
  redisScan,
  redisSRem,
  redisSMembers,
  redisSet,
  redisTime,
  redisTtl,
  redisType,
  redisUnlink,
  redisXAdd,
  redisXRange,
  redisZAdd,
  redisZRange,
  redisZRem,
} from './toolHandlers.js';

const server = new McpServer({
  name: 'easy-redis-mcp',
  version: '1.0.1',
  description: `Redis Server: ${getConnectionLabel()}`,
});

const manualText = readFileSync(fileURLToPath(new URL('../MANUAL.md', import.meta.url)), 'utf8');

const redisArgSchema = z.union([z.string(), z.number(), z.boolean()]);
const redisArgsSchema = z.array(redisArgSchema);
const jsonResponse = (value: unknown) => ({
  content: [{ type: 'text' as const, text: jsonText(value) }],
});

server.registerTool(
  'redis_manual',
  {
    description: 'Return the Redis MCP manual. Use this first when you are unsure how to use redis_command, typed Redis tools, or when an operation fails and you need the safe usage rules, key-type rules, or command composition guidance.',
    inputSchema: z.object({}),
  },
  async () => ({
    content: [{ type: 'text', text: manualText }],
  })
);

server.registerTool(
  'redis_command',
  {
    description: 'Execute a Redis command with arguments. In REDIS_MODE=read, only read-only commands are allowed. REDIS_MODEL is accepted as a backward-compatible alias.',
    inputSchema: z.object({
      command: z.string().min(1).describe('Redis command name, such as GET, SET, HGETALL, or INFO.'),
      args: redisArgsSchema.optional().default([]).describe('Command arguments in order.'),
    }),
  },
  async ({ command, args }) => jsonResponse(await redisCommand(command, args))
);

server.registerTool(
  'redis_ping',
  {
    description: 'Ping Redis and optionally echo a message.',
    inputSchema: z.object({
      message: z.string().optional(),
    }),
  },
  async ({ message }) => jsonResponse(await redisPing(message))
);

server.registerTool('redis_info', {
  description: 'Return Redis INFO output, optionally for a specific section.',
  inputSchema: z.object({ section: z.string().optional() }),
}, async ({ section }) => jsonResponse(await redisInfo(section)));

server.registerTool('redis_dbsize', {
  description: 'Return the number of keys in the selected Redis database.',
  inputSchema: z.object({}),
}, async () => jsonResponse(await redisDbSize()));

server.registerTool('redis_time', {
  description: 'Return Redis server time.',
  inputSchema: z.object({}),
}, async () => jsonResponse(await redisTime()));

server.registerTool('redis_client_list', {
  description: 'Return CLIENT LIST output.',
  inputSchema: z.object({}),
}, async () => jsonResponse(await redisClientList()));

server.registerTool('redis_config_get', {
  description: 'Read Redis configuration values with CONFIG GET.',
  inputSchema: z.object({ parameter: z.string().min(1).describe('Config parameter pattern, for example maxmemory or *.') }),
}, async ({ parameter }) => jsonResponse(await redisConfigGet(parameter)));

server.registerTool('redis_command_list', {
  description: 'List Redis commands supported by the server.',
  inputSchema: z.object({}),
}, async () => jsonResponse(await redisCommandList()));

server.registerTool('redis_get', {
  description: 'Get a string value by key.',
  inputSchema: z.object({ key: z.string().min(1) }),
}, async ({ key }) => jsonResponse(await redisGet(key)));

server.registerTool('redis_mget', {
  description: 'Get multiple string values by key.',
  inputSchema: z.object({ keys: z.array(z.string().min(1)).min(1) }),
}, async ({ keys }) => jsonResponse(await redisMGet(keys)));

server.registerTool('redis_exists', {
  description: 'Check how many keys exist.',
  inputSchema: z.object({ keys: z.array(z.string().min(1)).min(1) }),
}, async ({ keys }) => jsonResponse(await redisExists(keys)));

server.registerTool('redis_ttl', {
  description: 'Return key TTL in seconds.',
  inputSchema: z.object({ key: z.string().min(1) }),
}, async ({ key }) => jsonResponse(await redisTtl(key)));

server.registerTool('redis_type', {
  description: 'Return key type.',
  inputSchema: z.object({ key: z.string().min(1) }),
}, async ({ key }) => jsonResponse(await redisType(key)));

server.registerTool('redis_scan', {
  description: 'Run SCAN with optional MATCH, COUNT, and TYPE.',
  inputSchema: z.object({
    cursor: z.string().optional().default('0'),
    pattern: z.string().optional(),
    count: z.number().int().positive().optional(),
    type: z.string().optional(),
  }),
}, async ({ cursor, pattern, count, type }) => jsonResponse(await redisScan(cursor, pattern, count, type)));

server.registerTool('redis_keys', {
  description: 'Run KEYS for a pattern. Prefer redis_scan for large databases.',
  inputSchema: z.object({ pattern: z.string().min(1) }),
}, async ({ pattern }) => jsonResponse(await redisKeys(pattern)));

server.registerTool('redis_hget', {
  description: 'Get a hash field value.',
  inputSchema: z.object({ key: z.string().min(1), field: z.string().min(1) }),
}, async ({ key, field }) => jsonResponse(await redisHGet(key, field)));

server.registerTool('redis_hgetall', {
  description: 'Get all fields and values in a hash.',
  inputSchema: z.object({ key: z.string().min(1) }),
}, async ({ key }) => jsonResponse(await redisHGetAll(key)));

server.registerTool('redis_lrange', {
  description: 'Return list elements in a range.',
  inputSchema: z.object({ key: z.string().min(1), start: z.number().int(), stop: z.number().int() }),
}, async ({ key, start, stop }) => jsonResponse(await redisLRange(key, start, stop)));

server.registerTool('redis_smembers', {
  description: 'Return all members of a set.',
  inputSchema: z.object({ key: z.string().min(1) }),
}, async ({ key }) => jsonResponse(await redisSMembers(key)));

server.registerTool('redis_zrange', {
  description: 'Return sorted set members by index range.',
  inputSchema: z.object({
    key: z.string().min(1),
    start: z.number().int(),
    stop: z.number().int(),
    withScores: z.boolean().optional().default(false),
  }),
}, async ({ key, start, stop, withScores }) => jsonResponse(await redisZRange(key, start, stop, withScores)));

server.registerTool('redis_xrange', {
  description: 'Return stream entries by id range.',
  inputSchema: z.object({
    key: z.string().min(1),
    start: z.string().optional().default('-'),
    end: z.string().optional().default('+'),
    count: z.number().int().positive().optional(),
  }),
}, async ({ key, start, end, count }) => jsonResponse(await redisXRange(key, start, end, count)));

if (!isReadOnlyMode()) {
  server.registerTool('redis_set', {
    description: 'Set a string key value with optional EX/PX/NX/XX modifiers.',
    inputSchema: z.object({
      key: z.string().min(1),
      value: redisArgSchema,
      expireSeconds: z.number().int().positive().optional(),
      expireMilliseconds: z.number().int().positive().optional(),
      nx: z.boolean().optional().default(false),
      xx: z.boolean().optional().default(false),
    }),
  }, async ({ key, value, expireSeconds, expireMilliseconds, nx, xx }) => jsonResponse(await redisSet(key, value, {
    expireSeconds,
    expireMilliseconds,
    nx,
    xx,
  })));

  server.registerTool('redis_mset', {
    description: 'Set multiple string key-value pairs.',
    inputSchema: z.object({ entries: z.record(z.string(), redisArgSchema) }),
  }, async ({ entries }) => jsonResponse(await redisMSet(entries)));

  server.registerTool('redis_del', {
    description: 'Delete one or more keys.',
    inputSchema: z.object({ keys: z.array(z.string().min(1)).min(1) }),
  }, async ({ keys }) => jsonResponse(await redisDel(keys)));

  server.registerTool('redis_unlink', {
    description: 'Asynchronously delete one or more keys.',
    inputSchema: z.object({ keys: z.array(z.string().min(1)).min(1) }),
  }, async ({ keys }) => jsonResponse(await redisUnlink(keys)));

  server.registerTool('redis_expire', {
    description: 'Set key expiration in seconds.',
    inputSchema: z.object({ key: z.string().min(1), seconds: z.number().int().positive() }),
  }, async ({ key, seconds }) => jsonResponse(await redisExpire(key, seconds)));

  server.registerTool('redis_rename', {
    description: 'Rename a key.',
    inputSchema: z.object({ key: z.string().min(1), newKey: z.string().min(1) }),
  }, async ({ key, newKey }) => jsonResponse(await redisRename(key, newKey)));

  server.registerTool('redis_incrby', {
    description: 'Increment an integer key by a value.',
    inputSchema: z.object({ key: z.string().min(1), increment: z.number().int() }),
  }, async ({ key, increment }) => jsonResponse(await redisIncrBy(key, increment)));

  server.registerTool('redis_hset', {
    description: 'Set one or more hash fields.',
    inputSchema: z.object({ key: z.string().min(1), fields: z.record(z.string(), redisArgSchema) }),
  }, async ({ key, fields }) => jsonResponse(await redisHSet(key, fields)));

  server.registerTool('redis_hdel', {
    description: 'Delete one or more hash fields.',
    inputSchema: z.object({ key: z.string().min(1), fields: z.array(z.string().min(1)).min(1) }),
  }, async ({ key, fields }) => jsonResponse(await redisHDel(key, fields)));

  server.registerTool('redis_lpush', {
    description: 'Push values to the head of a list.',
    inputSchema: z.object({ key: z.string().min(1), values: redisArgsSchema.min(1) }),
  }, async ({ key, values }) => jsonResponse(await redisLPush(key, values)));

  server.registerTool('redis_rpush', {
    description: 'Push values to the tail of a list.',
    inputSchema: z.object({ key: z.string().min(1), values: redisArgsSchema.min(1) }),
  }, async ({ key, values }) => jsonResponse(await redisRPush(key, values)));

  server.registerTool('redis_lpop', {
    description: 'Pop one or more values from the head of a list.',
    inputSchema: z.object({ key: z.string().min(1), count: z.number().int().positive().optional() }),
  }, async ({ key, count }) => jsonResponse(await redisLPop(key, count)));

  server.registerTool('redis_rpop', {
    description: 'Pop one or more values from the tail of a list.',
    inputSchema: z.object({ key: z.string().min(1), count: z.number().int().positive().optional() }),
  }, async ({ key, count }) => jsonResponse(await redisRPop(key, count)));

  server.registerTool('redis_sadd', {
    description: 'Add members to a set.',
    inputSchema: z.object({ key: z.string().min(1), members: redisArgsSchema.min(1) }),
  }, async ({ key, members }) => jsonResponse(await redisSAdd(key, members)));

  server.registerTool('redis_srem', {
    description: 'Remove members from a set.',
    inputSchema: z.object({ key: z.string().min(1), members: redisArgsSchema.min(1) }),
  }, async ({ key, members }) => jsonResponse(await redisSRem(key, members)));

  server.registerTool('redis_zadd', {
    description: 'Add scored members to a sorted set.',
    inputSchema: z.object({
      key: z.string().min(1),
      members: z.array(z.object({ score: z.number(), value: redisArgSchema })).min(1),
    }),
  }, async ({ key, members }) => jsonResponse(await redisZAdd(key, members)));

  server.registerTool('redis_zrem', {
    description: 'Remove members from a sorted set.',
    inputSchema: z.object({ key: z.string().min(1), members: redisArgsSchema.min(1) }),
  }, async ({ key, members }) => jsonResponse(await redisZRem(key, members)));

  server.registerTool('redis_xadd', {
    description: 'Append an entry to a stream.',
    inputSchema: z.object({
      key: z.string().min(1),
      id: z.string().optional().default('*'),
      fields: z.record(z.string(), redisArgSchema),
    }),
  }, async ({ key, id, fields }) => jsonResponse(await redisXAdd(key, id, fields)));

  server.registerTool('redis_publish', {
    description: 'Publish a message to a Redis channel.',
    inputSchema: z.object({ channel: z.string().min(1), message: redisArgSchema }),
  }, async ({ channel, message }) => jsonResponse(await redisPublish(channel, message)));
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Redis MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
