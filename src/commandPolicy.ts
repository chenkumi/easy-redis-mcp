import { isReadOnlyMode } from './config.js';

export type RedisCommandAccess = 'read' | 'write' | 'admin' | 'blocking' | 'unknown';

const WRITE_COMMANDS = new Set([
  'append', 'bitop', 'bitfield', 'bitfield_ro', 'copy', 'decr', 'decrby', 'del',
  'expire', 'expireat', 'expiretime', 'getdel', 'getex', 'hdel', 'hincrby',
  'hincrbyfloat', 'hmset', 'hset', 'hsetnx', 'incr', 'incrby', 'incrbyfloat',
  'lmove', 'lmpop', 'lpop', 'lpos', 'lpush', 'lpushx', 'lrem', 'lset', 'ltrim',
  'migrate', 'move', 'mset', 'msetnx', 'persist', 'pexpire', 'pexpireat',
  'pexpiretime', 'pfadd', 'pfmerge', 'psetex', 'publish', 'rename', 'renamenx',
  'restore', 'rpop', 'rpoplpush', 'rpush', 'rpushx', 'sadd', 'sdiffstore',
  'set', 'setbit', 'setex', 'setnx', 'setrange', 'sinterstore', 'smove', 'spop',
  'srem', 'sunionstore', 'touch', 'unlink', 'xack', 'xadd', 'xautoclaim',
  'xclaim', 'xdel', 'xgroup', 'xreadgroup', 'xsetid', 'xtrim', 'zadd',
  'zdiffstore', 'zincrby', 'zinterstore', 'zmpop', 'zpopmax', 'zpopmin',
  'zrangestore', 'zrem', 'zremrangebylex', 'zremrangebyrank', 'zremrangebyscore',
  'zunionstore',
]);

const ADMIN_COMMANDS = new Set([
  'acl', 'bgrewriteaof', 'bgsave', 'client', 'cluster', 'command', 'config',
  'dbsize', 'debug', 'failover', 'flushall', 'flushdb', 'lastsave', 'latency',
  'memory', 'module', 'monitor', 'psync', 'replconf', 'replicaof', 'restore-asking',
  'role', 'save', 'shutdown', 'slaveof', 'slowlog', 'swapdb', 'sync', 'time',
]);

const READ_ADMIN_COMMANDS = new Set([
  'client|list', 'client|info', 'client|getname', 'client|id',
  'command', 'command|count', 'command|docs', 'command|info', 'command|list',
  'config|get', 'dbsize', 'info', 'lastsave', 'latency|latest', 'memory|usage',
  'role', 'slowlog|get', 'time',
]);

const BLOCKING_COMMANDS = new Set([
  'blmove', 'blmpop', 'blpop', 'brpop', 'brpoplpush', 'bzmpop', 'bzpopmax',
  'bzpopmin', 'subscribe', 'psubscribe', 'ssubscribe',
]);

const READ_COMMANDS = new Set([
  'bitcount', 'bitpos', 'dump', 'echo', 'exists', 'expiretime', 'geodist',
  'geohash', 'geopos', 'georadius_ro', 'georadiusbymember_ro', 'geosearch',
  'get', 'getbit', 'getrange', 'hexists', 'hget', 'hgetall', 'hkeys', 'hlen',
  'hmget', 'hrandfield', 'hscan', 'hstrlen', 'hvals', 'keys', 'lcs', 'lindex',
  'llen', 'lrange', 'mget', 'object', 'persist', 'pexpiretime', 'pfcount',
  'pttl', 'randomkey', 'scan', 'scard', 'sdiff', 'sinter', 'sintercard',
  'sismember', 'smembers', 'smismember', 'sort_ro', 'srandmember', 'sscan',
  'strlen', 'sunion', 'ttl', 'type', 'xinfo', 'xlen', 'xpending', 'xrange',
  'xread', 'xrevrange', 'zcard', 'zcount', 'zdiff', 'zinter', 'zintercard',
  'zlexcount', 'zmscore', 'zrandmember', 'zrange', 'zrangebylex',
  'zrangebyscore', 'zrank', 'zrevrange', 'zrevrangebylex', 'zrevrangebyscore',
  'zrevrank', 'zscan', 'zscore', 'zunion',
]);

function normalizeCommandPart(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

export function classifyCommand(command: string, args: string[] = []): RedisCommandAccess {
  const normalized = normalizeCommandPart(command);
  const subCommand = normalizeCommandPart(args[0]);
  const compound = subCommand ? `${normalized}|${subCommand}` : normalized;

  if (!normalized) {
    return 'unknown';
  }

  if (BLOCKING_COMMANDS.has(normalized)) {
    return 'blocking';
  }

  if (normalized === 'xread' && args.some((arg) => arg.toLowerCase() === 'block')) {
    return 'blocking';
  }

  if (READ_ADMIN_COMMANDS.has(compound) || READ_ADMIN_COMMANDS.has(normalized)) {
    return 'read';
  }

  if (ADMIN_COMMANDS.has(normalized)) {
    return 'admin';
  }

  if (WRITE_COMMANDS.has(normalized)) {
    return 'write';
  }

  if (READ_COMMANDS.has(normalized)) {
    return 'read';
  }

  return 'unknown';
}

export function assertCommandAllowed(command: string, args: string[] = []): void {
  const access = classifyCommand(command, args);

  if (access === 'blocking') {
    throw new Error(`Redis command "${command}" is blocking and is not supported by this MCP server.`);
  }

  if (isReadOnlyMode() && access !== 'read') {
    throw new Error(`Redis command "${command}" is not allowed when REDIS_MODEL=read. Classified access: ${access}.`);
  }
}

export function assertWriteAllowed(operation: string): void {
  if (isReadOnlyMode()) {
    throw new Error(`${operation} is not allowed when REDIS_MODEL=read.`);
  }
}
