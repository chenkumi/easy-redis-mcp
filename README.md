# easy-redis-mcp

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that lets AI assistants inspect and operate Redis through a structured tool interface.

This project uses Node.js, TypeScript, the official MCP SDK, and the official `redis` Node.js client. It communicates over stdio and supports standalone Redis, Redis Cluster, TLS, and read-only operation.

繁體中文說明請參閱 [README.zh-TW.md](README.zh-TW.md).

## Features

- Typed tools for strings, hashes, lists, sets, sorted sets, streams, and server information
- Generic `redis_command` fallback for commands without a dedicated tool
- Standalone Redis and Redis Cluster connections
- Username/password authentication
- TLS connections with optional CA and client certificates
- Read-only mode that hides typed write tools and restricts generic commands

## Requirements

- Node.js 18 or newer
- npm
- A reachable Redis server or Redis Cluster

## Installation

Run the server directly with `npx`:

```bash
npx -y easy-redis-mcp
```

For local development after cloning the repository:

```bash
cd easy-redis-mcp
npm install
npm run build
```

## Configuration

Configure the server with environment variables in your MCP client configuration or shell environment.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `REDIS_HOST` | No | `127.0.0.1` | Redis host name or IP address |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_DB` | No | `0` | Database number for standalone Redis |
| `REDIS_USERNAME` | No | `default` | Redis ACL username |
| `REDIS_PWD` | No | empty | Redis password |
| `REDIS_SSL` | No | `false` | Enable TLS when set to `true` |
| `REDIS_SSL_CA_PATH` | No | empty | Path to a CA certificate used to verify the server |
| `REDIS_SSL_KEYFILE` | No | empty | Path to the client private key |
| `REDIS_SSL_CERTFILE` | No | empty | Path to the client certificate |
| `REDIS_SSL_CERT_REQS` | No | `required` | Server certificate verification: `required` or `none` |
| `REDIS_SSL_CA_CERTS` | No | empty | Alternative path to a trusted CA certificate file |
| `REDIS_CLUSTER_MODE` | No | `false` | Connect through a Redis Cluster root node when `true` |
| `REDIS_MODEL` | No | `readwrite` | Permission mode: `readwrite` or `read` |

Example shell configuration:

```bash
REDIS_HOST=localhost REDIS_PORT=6379 REDIS_PWD=your_password npx -y easy-redis-mcp
```

In PowerShell:

```powershell
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:REDIS_PWD = "your_password"
npx -y easy-redis-mcp
```

The server normally runs through an MCP client. Starting it directly opens a stdio transport and does not provide an HTTP endpoint.

## Claude Desktop Example

Add the server to the Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "easy-redis-mcp": {
      "command": "npx",
      "args": ["-y", "easy-redis-mcp"],
      "env": {
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379",
        "REDIS_DB": "0",
        "REDIS_USERNAME": "default",
        "REDIS_PWD": "YOUR PASSWORD",
        "REDIS_MODEL": "readwrite"
      }
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

## Codex config.toml Example

```toml
[mcp_servers.easy-redis-mcp]
command = "npx"
args = ["-y", "easy-redis-mcp"]
enabled = true

[mcp_servers.easy-redis-mcp.env]
REDIS_HOST = "localhost"
REDIS_PORT = "6379"
REDIS_DB = "0"
REDIS_USERNAME = "default"
REDIS_PWD = "YOUR PASSWORD"
REDIS_MODEL = "readwrite"
```

## OpenCode opencode.jsonc Example

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "easy-redis-mcp": {
      "type": "local",
      "command": ["npx", "-y", "easy-redis-mcp"],
      "enabled": true,
      "environment": {
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379",
        "REDIS_DB": "0",
        "REDIS_USERNAME": "default",
        "REDIS_PWD": "YOUR PASSWORD",
        "REDIS_MODEL": "readwrite"
      }
    }
  }
}
```

## TLS Example

```json
{
  "mcpServers": {
    "easy-redis-mcp": {
      "command": "npx",
      "args": ["-y", "easy-redis-mcp"],
      "env": {
        "REDIS_HOST": "redis.example.com",
        "REDIS_PORT": "6380",
        "REDIS_USERNAME": "app_user",
        "REDIS_PWD": "YOUR PASSWORD",
        "REDIS_SSL": "true",
        "REDIS_SSL_CA_PATH": "/path/to/ca.pem",
        "REDIS_SSL_CERT_REQS": "required"
      }
    }
  }
}
```

Set `REDIS_SSL_KEYFILE` and `REDIS_SSL_CERTFILE` as well when the Redis server requires mutual TLS. Avoid `REDIS_SSL_CERT_REQS=none` outside controlled development environments.

## Redis Cluster Example

```json
{
  "mcpServers": {
    "easy-redis-mcp": {
      "command": "npx",
      "args": ["-y", "easy-redis-mcp"],
      "env": {
        "REDIS_HOST": "redis-cluster.example.com",
        "REDIS_PORT": "6379",
        "REDIS_USERNAME": "default",
        "REDIS_PWD": "YOUR PASSWORD",
        "REDIS_CLUSTER_MODE": "true"
      }
    }
  }
}
```

`REDIS_HOST` and `REDIS_PORT` identify the initial cluster root node. `REDIS_DB` is not used for cluster connections because Redis Cluster supports database `0` only.

## Available Tools

### Read and Inspection Tools

| Tool | Description |
| --- | --- |
| `redis_ping` | Ping Redis and optionally echo a message |
| `redis_info` | Return server information, optionally for one section |
| `redis_dbsize` | Return the number of keys in the selected database |
| `redis_time` | Return Redis server time |
| `redis_client_list` | Return connected client information |
| `redis_config_get` | Read Redis configuration values |
| `redis_command_list` | List commands supported by the Redis server |
| `redis_get`, `redis_mget` | Read one or more string values |
| `redis_exists`, `redis_ttl`, `redis_type` | Inspect key state and metadata |
| `redis_scan`, `redis_keys` | Find keys by pattern |
| `redis_hget`, `redis_hgetall` | Read hash data |
| `redis_lrange` | Read a list range |
| `redis_smembers` | Read all set members |
| `redis_zrange` | Read a sorted set range, optionally with scores |
| `redis_xrange` | Read stream entries by ID range |

Prefer `redis_scan` over `redis_keys` for large or production databases because `KEYS` can block Redis while scanning the entire keyspace.

### Write Tools

These tools are registered only when `REDIS_MODEL=readwrite`:

| Tool | Description |
| --- | --- |
| `redis_set`, `redis_mset` | Set one or more string values |
| `redis_del`, `redis_unlink` | Delete one or more keys |
| `redis_expire`, `redis_rename`, `redis_incrby` | Modify key metadata or integer values |
| `redis_hset`, `redis_hdel` | Modify hash fields |
| `redis_lpush`, `redis_rpush`, `redis_lpop`, `redis_rpop` | Modify lists |
| `redis_sadd`, `redis_srem` | Modify sets |
| `redis_zadd`, `redis_zrem` | Modify sorted sets |
| `redis_xadd` | Append a stream entry |
| `redis_publish` | Publish a message to a channel |

### Generic Command Tool

`redis_command` provides access to Redis commands that do not have dedicated tools:

```json
{
  "command": "GET",
  "args": ["my-key"]
}
```

Blocking commands such as `BLPOP`, `SUBSCRIBE`, and `XREAD ... BLOCK` are rejected because they are not suitable for a request/response MCP tool.

When `REDIS_MODEL=read`, `redis_command` permits only commands classified as read-only. Write, administrative, blocking, and unknown commands are rejected.

## Read-Only Mode

Set the following variable when the assistant should only inspect Redis:

```env
REDIS_MODEL=read
```

In this mode, typed write tools are not registered and the generic command policy allows only recognized read commands. Redis ACL permissions remain the final security boundary, so use a dedicated read-only Redis user whenever possible.

## Security Notes

- Use a dedicated Redis ACL user with only the commands and key patterns the assistant needs.
- Use `REDIS_MODEL=read` for inspection and reporting workloads.
- Treat MCP configuration files containing `REDIS_PWD` as sensitive.
- Use TLS when connecting across untrusted networks.
- Keep `REDIS_SSL_CERT_REQS=required` in production.
- Prefer `redis_scan` to `redis_keys` on large databases.
- Review write operations before using the server against production data.
- Do not commit passwords, private keys, or certificates to source control.

## Development

Run TypeScript in watch mode:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the test suite:

```bash
npm test
```

The integration tests require a reachable Redis instance configured through the Redis environment variables.

## Project Structure

```text
src/
  commandPolicy.ts Redis command classification and read-only enforcement
  config.ts        Environment-driven connection and permission settings
  format.ts        MCP response formatting
  index.ts         MCP server and tool registration
  redisClient.ts   Standalone, cluster, authentication, and TLS connections
  toolHandlers.ts  Redis tool implementations
test/
  commandPolicy.test.mjs    Command policy tests
  redisIntegration.test.mjs Redis integration tests
```

## License

MIT. See [LICENSE.md](LICENSE.md).
