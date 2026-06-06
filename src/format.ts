export function normalizeRedisValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, mapValue]) => [
        String(key),
        normalizeRedisValue(mapValue),
      ])
    );
  }

  if (value instanceof Set) {
    return Array.from(value.values()).map((item) => normalizeRedisValue(item));
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeRedisValue(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, objectValue]) => [
        key,
        normalizeRedisValue(objectValue),
      ])
    );
  }

  return value;
}

export function jsonText(value: unknown): string {
  return JSON.stringify(normalizeRedisValue(value), null, 2);
}

export function commandResult(command: string, result: unknown): Record<string, unknown> {
  return {
    command,
    result: normalizeRedisValue(result),
  };
}
