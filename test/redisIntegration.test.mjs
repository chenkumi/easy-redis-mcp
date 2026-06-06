import assert from 'node:assert/strict';
import test from 'node:test';
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
} from '../build/toolHandlers.js';
import { closeRedisClient } from '../build/redisClient.js';

const prefix = `easy-redis-mcp:test:${process.pid}`;

function key(name) {
  return `${prefix}:${name}`;
}

async function deletePattern(pattern) {
  const keys = await redisKeys(pattern);
  if (Array.isArray(keys.result) && keys.result.length > 0) {
    await redisDel(keys.result);
  }
}

test.before(async () => {
  await deletePattern(`${prefix}:*`);
});

test.after(async () => {
  try {
    await deletePattern(`${prefix}:*`);
  } finally {
    await closeRedisClient();
  }
});

test('server and metadata tools work', async () => {
  const ping = await redisPing();
  assert.equal(ping.result, 'PONG');

  const echoPing = await redisPing('hello');
  assert.equal(echoPing.result, 'hello');

  const info = await redisInfo('server');
  assert.equal(typeof info.result, 'string');
  assert.match(info.result, /redis_version:/);

  const dbsize = await redisDbSize();
  assert.equal(typeof dbsize.result, 'number');

  const time = await redisTime();
  assert.equal(Array.isArray(time.result), true);
  assert.equal(time.result.length, 2);

  const clients = await redisClientList();
  assert.equal(typeof clients.result, 'string');

  const config = await redisConfigGet('databases');
  assert.equal(Array.isArray(config.result), true);

  const commands = await redisCommandList();
  assert.equal(Array.isArray(commands.result), true);
  assert.ok(commands.result.includes('get'));
});

test('string and key lifecycle tools work', async () => {
  const stringKey = key('string');
  const secondKey = key('string2');
  const renamedKey = key('renamed');
  const unlinkKey = key('unlink');

  const set = await redisSet(stringKey, 'hello', { expireSeconds: 30 });
  assert.equal(set.result, 'OK');

  const get = await redisGet(stringKey);
  assert.equal(get.result, 'hello');

  const ttl = await redisTtl(stringKey);
  assert.equal(typeof ttl.result, 'number');
  assert.ok(ttl.result > 0);

  const type = await redisType(stringKey);
  assert.equal(type.result, 'string');

  const exists = await redisExists([stringKey, key('missing')]);
  assert.equal(exists.result, 1);

  const increment = await redisIncrBy(key('counter'), 3);
  assert.equal(increment.result, 3);

  const mset = await redisMSet({ [secondKey]: 'two', [key('string3')]: 3 });
  assert.equal(mset.result, 'OK');

  const mget = await redisMGet([stringKey, secondKey, key('missing')]);
  assert.deepEqual(mget.result, ['hello', 'two', null]);

  const expire = await redisExpire(secondKey, 30);
  assert.equal(expire.result, 1);

  const rename = await redisRename(secondKey, renamedKey);
  assert.equal(rename.result, 'OK');
  assert.equal((await redisGet(renamedKey)).result, 'two');

  await redisSet(unlinkKey, 'gone');
  const unlinked = await redisUnlink([unlinkKey]);
  assert.equal(unlinked.result, 1);

  const deleted = await redisDel([stringKey, renamedKey, key('string3'), key('counter')]);
  assert.equal(deleted.result, 4);
});

test('scan and keys tools work', async () => {
  await redisSet(key('scan:a'), 'a');
  await redisSet(key('scan:b'), 'b');

  const keys = await redisKeys(`${prefix}:scan:*`);
  assert.deepEqual(new Set(keys.result), new Set([key('scan:a'), key('scan:b')]));

  const scan = await redisScan('0', `${prefix}:scan:*`, 20, 'string');
  assert.equal(Array.isArray(scan.result), true);
  assert.equal(scan.result.length, 2);
  assert.equal(Array.isArray(scan.result[1]), true);
  assert.ok(scan.result[1].includes(key('scan:a')));
  assert.ok(scan.result[1].includes(key('scan:b')));
});

test('hash tools work', async () => {
  const hashKey = key('hash');

  const hset = await redisHSet(hashKey, { name: 'codex', score: 42, active: true });
  assert.equal(hset.result, 3);

  const hget = await redisHGet(hashKey, 'name');
  assert.equal(hget.result, 'codex');

  const hgetall = await redisHGetAll(hashKey);
  assert.deepEqual(hgetall.result, ['name', 'codex', 'score', '42', 'active', 'true']);

  const hdel = await redisHDel(hashKey, ['active']);
  assert.equal(hdel.result, 1);
  assert.equal((await redisHGet(hashKey, 'active')).result, null);
});

test('list tools work', async () => {
  const leftKey = key('list:left');
  const rightKey = key('list:right');

  const lpush = await redisLPush(leftKey, ['b', 'a']);
  assert.equal(lpush.result, 2);

  const rpush = await redisRPush(rightKey, ['a', 'b']);
  assert.equal(rpush.result, 2);

  const lrange = await redisLRange(leftKey, 0, -1);
  assert.deepEqual(lrange.result, ['a', 'b']);

  const lpop = await redisLPop(leftKey);
  assert.equal(lpop.result, 'a');

  const rpop = await redisRPop(rightKey);
  assert.equal(rpop.result, 'b');
});

test('set tools work', async () => {
  const setKey = key('set');

  const sadd = await redisSAdd(setKey, ['a', 'b', 'c']);
  assert.equal(sadd.result, 3);

  const members = await redisSMembers(setKey);
  assert.deepEqual(new Set(members.result), new Set(['a', 'b', 'c']));

  const srem = await redisSRem(setKey, ['b']);
  assert.equal(srem.result, 1);

  const afterRemove = await redisSMembers(setKey);
  assert.deepEqual(new Set(afterRemove.result), new Set(['a', 'c']));
});

test('sorted set tools work', async () => {
  const zsetKey = key('zset');

  const zadd = await redisZAdd(zsetKey, [
    { score: 2, value: 'b' },
    { score: 1, value: 'a' },
    { score: 3, value: 'c' },
  ]);
  assert.equal(zadd.result, 3);

  const zrange = await redisZRange(zsetKey, 0, -1);
  assert.deepEqual(zrange.result, ['a', 'b', 'c']);

  const zrangeWithScores = await redisZRange(zsetKey, 0, 1, true);
  assert.deepEqual(zrangeWithScores.result, ['a', '1', 'b', '2']);

  const zrem = await redisZRem(zsetKey, ['b']);
  assert.equal(zrem.result, 1);
  assert.deepEqual((await redisZRange(zsetKey, 0, -1)).result, ['a', 'c']);
});

test('stream and publish tools work', async () => {
  const streamKey = key('stream');

  const xadd = await redisXAdd(streamKey, '*', { event: 'created', id: 1 });
  assert.equal(typeof xadd.result, 'string');

  const xrange = await redisXRange(streamKey, '-', '+', 10);
  assert.equal(Array.isArray(xrange.result), true);
  assert.equal(xrange.result.length, 1);
  assert.equal(xrange.result[0][0], xadd.result);

  const publish = await redisPublish(key('channel'), 'message');
  assert.equal(publish.result, 0);
});

test('raw redis_command fallback works and rejects unsupported blocking commands', async () => {
  await redisCommand('SET', [key('raw'), 'value']);
  const get = await redisCommand('GET', [key('raw')]);
  assert.equal(get.result, 'value');

  await assert.rejects(
    () => redisCommand('BLPOP', [key('raw'), '1']),
    /blocking/
  );
});
