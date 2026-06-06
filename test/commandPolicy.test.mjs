import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { classifyCommand } from '../build/commandPolicy.js';

test('classifies common read commands', () => {
  assert.equal(classifyCommand('GET'), 'read');
  assert.equal(classifyCommand('HGETALL'), 'read');
  assert.equal(classifyCommand('CONFIG', ['GET', '*']), 'read');
});

test('classifies common write and dangerous commands', () => {
  assert.equal(classifyCommand('SET'), 'write');
  assert.equal(classifyCommand('DEL'), 'write');
  assert.equal(classifyCommand('FLUSHDB'), 'admin');
});

test('classifies blocking commands', () => {
  assert.equal(classifyCommand('BLPOP'), 'blocking');
  assert.equal(classifyCommand('XREAD', ['BLOCK', '1000', 'STREAMS', 's', '0']), 'blocking');
});

test('rejects write commands when REDIS_MODEL=read', () => {
  const script = `
    import { assertCommandAllowed } from './build/commandPolicy.js';
    try {
      assertCommandAllowed('SET', ['key', 'value']);
      process.exit(1);
    } catch (error) {
      if (!String(error.message).includes('REDIS_MODEL=read')) {
        console.error(error);
        process.exit(2);
      }
    }
  `;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    env: { ...process.env, REDIS_MODEL: 'read' },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
