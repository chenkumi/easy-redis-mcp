# easy-redis-mcp

High performance Redis MCP Server using the official `redis` Node.js client.

## Usage

```bash
npx -y easy-redis-mcp
```

## Environment

| Name | Description | Default |
| --- | --- | --- |
| `REDIS_HOST` | Redis IP or hostname | `127.0.0.1` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_DB` | Database | `0` |
| `REDIS_USERNAME` | Default database username | `default` |
| `REDIS_PWD` | Default database password | empty |
| `REDIS_SSL` | Enables or disables SSL/TLS | `false` |
| `REDIS_SSL_CA_PATH` | CA certificate for verifying server | empty |
| `REDIS_SSL_KEYFILE` | Client private key file | empty |
| `REDIS_SSL_CERTFILE` | Client certificate file | empty |
| `REDIS_SSL_CERT_REQS` | Verify server certificate: `required` or `none` | `required` |
| `REDIS_SSL_CA_CERTS` | Path to trusted CA certificates file | empty |
| `REDIS_CLUSTER_MODE` | Enable Redis Cluster mode | `false` |
| `REDIS_MODEL` | Permission model: `readwrite` or `read` | `readwrite` |

## Tools

The server provides typed Redis tools for common operations and a generic `redis_command` fallback for the full Redis command surface.

Read tools include `redis_ping`, `redis_info`, `redis_dbsize`, `redis_time`, `redis_get`, `redis_mget`, `redis_exists`, `redis_ttl`, `redis_type`, `redis_scan`, `redis_keys`, `redis_hget`, `redis_hgetall`, `redis_lrange`, `redis_smembers`, `redis_zrange`, and `redis_xrange`.

Write tools are available when `REDIS_MODEL=readwrite`, including `redis_set`, `redis_mset`, `redis_del`, `redis_unlink`, `redis_expire`, `redis_rename`, `redis_incrby`, `redis_hset`, `redis_hdel`, `redis_lpush`, `redis_rpush`, `redis_lpop`, `redis_rpop`, `redis_sadd`, `redis_srem`, `redis_zadd`, `redis_zrem`, `redis_xadd`, and `redis_publish`.

`redis_command` accepts:

```json
{
  "command": "GET",
  "args": ["my-key"]
}
```

When `REDIS_MODEL=read`, write, admin, unknown, and blocking commands are rejected.

## Development

```bash
npm install
npm run build
npm test
```
