import { assertCommandAllowed, assertWriteAllowed } from './commandPolicy.js';
import { commandResult } from './format.js';
import { getRedisClient } from './redisClient.js';

type RedisArgument = string | number | boolean;

function toArg(value: RedisArgument): string {
  return String(value);
}

function toArgs(values: RedisArgument[] = []): string[] {
  return values.map((value) => toArg(value));
}

async function send(command: string, args: RedisArgument[] = []): Promise<Record<string, unknown>> {
  const stringArgs = toArgs(args);
  assertCommandAllowed(command, stringArgs);

  const client = await getRedisClient();
  const result = await client.sendCommand([command, ...stringArgs]);
  return commandResult([command, ...stringArgs].join(' '), result);
}

export async function redisCommand(command: string, args: RedisArgument[] = []): Promise<Record<string, unknown>> {
  return send(command, args);
}

export async function redisPing(message?: string): Promise<Record<string, unknown>> {
  return send('PING', message ? [message] : []);
}

export async function redisInfo(section?: string): Promise<Record<string, unknown>> {
  return send('INFO', section ? [section] : []);
}

export async function redisDbSize(): Promise<Record<string, unknown>> {
  return send('DBSIZE');
}

export async function redisTime(): Promise<Record<string, unknown>> {
  return send('TIME');
}

export async function redisClientList(): Promise<Record<string, unknown>> {
  return send('CLIENT', ['LIST']);
}

export async function redisConfigGet(parameter: string): Promise<Record<string, unknown>> {
  return send('CONFIG', ['GET', parameter]);
}

export async function redisCommandList(): Promise<Record<string, unknown>> {
  return send('COMMAND', ['LIST']);
}

export async function redisGet(key: string): Promise<Record<string, unknown>> {
  return send('GET', [key]);
}

export async function redisMGet(keys: string[]): Promise<Record<string, unknown>> {
  return send('MGET', keys);
}

export async function redisSet(
  key: string,
  value: RedisArgument,
  options: { expireSeconds?: number; expireMilliseconds?: number; nx?: boolean; xx?: boolean } = {}
): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_set');

  const args: RedisArgument[] = [key, value];

  if (options.expireSeconds !== undefined) {
    args.push('EX', options.expireSeconds);
  }

  if (options.expireMilliseconds !== undefined) {
    args.push('PX', options.expireMilliseconds);
  }

  if (options.nx) {
    args.push('NX');
  }

  if (options.xx) {
    args.push('XX');
  }

  return send('SET', args);
}

export async function redisMSet(entries: Record<string, RedisArgument>): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_mset');
  return send('MSET', Object.entries(entries).flatMap(([key, value]) => [key, value]));
}

export async function redisDel(keys: string[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_del');
  return send('DEL', keys);
}

export async function redisUnlink(keys: string[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_unlink');
  return send('UNLINK', keys);
}

export async function redisExists(keys: string[]): Promise<Record<string, unknown>> {
  return send('EXISTS', keys);
}

export async function redisExpire(key: string, seconds: number): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_expire');
  return send('EXPIRE', [key, seconds]);
}

export async function redisTtl(key: string): Promise<Record<string, unknown>> {
  return send('TTL', [key]);
}

export async function redisType(key: string): Promise<Record<string, unknown>> {
  return send('TYPE', [key]);
}

export async function redisRename(key: string, newKey: string): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_rename');
  return send('RENAME', [key, newKey]);
}

export async function redisScan(
  cursor = '0',
  pattern?: string,
  count?: number,
  type?: string
): Promise<Record<string, unknown>> {
  const args: RedisArgument[] = [cursor];

  if (pattern) {
    args.push('MATCH', pattern);
  }

  if (count !== undefined) {
    args.push('COUNT', count);
  }

  if (type) {
    args.push('TYPE', type);
  }

  return send('SCAN', args);
}

export async function redisKeys(pattern: string): Promise<Record<string, unknown>> {
  return send('KEYS', [pattern]);
}

export async function redisIncrBy(key: string, increment: number): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_incrby');
  return send('INCRBY', [key, increment]);
}

export async function redisHGet(key: string, field: string): Promise<Record<string, unknown>> {
  return send('HGET', [key, field]);
}

export async function redisHSet(key: string, fields: Record<string, RedisArgument>): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_hset');
  return send('HSET', [key, ...Object.entries(fields).flatMap(([field, value]) => [field, value])]);
}

export async function redisHGetAll(key: string): Promise<Record<string, unknown>> {
  return send('HGETALL', [key]);
}

export async function redisHDel(key: string, fields: string[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_hdel');
  return send('HDEL', [key, ...fields]);
}

export async function redisLPush(key: string, values: RedisArgument[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_lpush');
  return send('LPUSH', [key, ...values]);
}

export async function redisRPush(key: string, values: RedisArgument[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_rpush');
  return send('RPUSH', [key, ...values]);
}

export async function redisLPop(key: string, count?: number): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_lpop');
  return send('LPOP', count === undefined ? [key] : [key, count]);
}

export async function redisRPop(key: string, count?: number): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_rpop');
  return send('RPOP', count === undefined ? [key] : [key, count]);
}

export async function redisLRange(key: string, start: number, stop: number): Promise<Record<string, unknown>> {
  return send('LRANGE', [key, start, stop]);
}

export async function redisSAdd(key: string, members: RedisArgument[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_sadd');
  return send('SADD', [key, ...members]);
}

export async function redisSRem(key: string, members: RedisArgument[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_srem');
  return send('SREM', [key, ...members]);
}

export async function redisSMembers(key: string): Promise<Record<string, unknown>> {
  return send('SMEMBERS', [key]);
}

export async function redisZAdd(
  key: string,
  members: Array<{ score: number; value: RedisArgument }>
): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_zadd');
  return send('ZADD', [key, ...members.flatMap((member) => [member.score, member.value])]);
}

export async function redisZRem(key: string, members: RedisArgument[]): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_zrem');
  return send('ZREM', [key, ...members]);
}

export async function redisZRange(
  key: string,
  start: number,
  stop: number,
  withScores = false
): Promise<Record<string, unknown>> {
  return send('ZRANGE', withScores ? [key, start, stop, 'WITHSCORES'] : [key, start, stop]);
}

export async function redisXAdd(
  key: string,
  id: string,
  fields: Record<string, RedisArgument>
): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_xadd');
  return send('XADD', [key, id, ...Object.entries(fields).flatMap(([field, value]) => [field, value])]);
}

export async function redisXRange(
  key: string,
  start = '-',
  end = '+',
  count?: number
): Promise<Record<string, unknown>> {
  const args: RedisArgument[] = [key, start, end];

  if (count !== undefined) {
    args.push('COUNT', count);
  }

  return send('XRANGE', args);
}

export async function redisPublish(channel: string, message: RedisArgument): Promise<Record<string, unknown>> {
  assertWriteAllowed('redis_publish');
  return send('PUBLISH', [channel, message]);
}
