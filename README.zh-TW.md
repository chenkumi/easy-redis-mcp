# easy-redis-mcp

使用官方 `redis` Node.js client 的高效能 Redis MCP Server。

## 使用方式

```bash
npx -y easy-redis-mcp
```

## 環境變數

| 名稱 | 說明 | 預設值 |
| --- | --- | --- |
| `REDIS_HOST` | Redis IP 或 hostname | `127.0.0.1` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_DB` | Database | `0` |
| `REDIS_USERNAME` | 預設使用者名稱 | `default` |
| `REDIS_PWD` | 預設密碼 | 空字串 |
| `REDIS_SSL` | 啟用或停用 SSL/TLS | `false` |
| `REDIS_SSL_CA_PATH` | 驗證 server 的 CA 憑證 | 空 |
| `REDIS_SSL_KEYFILE` | client private key file | 空 |
| `REDIS_SSL_CERTFILE` | client certificate file | 空 |
| `REDIS_SSL_CERT_REQS` | 是否驗證 server 憑證：`required` 或 `none` | `required` |
| `REDIS_SSL_CA_CERTS` | trusted CA certificates file path | 空 |
| `REDIS_CLUSTER_MODE` | 啟用 Redis Cluster mode | `false` |
| `REDIS_MODEL` | 權限模式：`readwrite` 或 `read` | `readwrite` |

## MCP Tools

本專案提供常用 Redis typed tools，也提供 `redis_command` 作為完整 Redis command fallback。

讀取工具包含：`redis_ping`、`redis_info`、`redis_dbsize`、`redis_time`、`redis_get`、`redis_mget`、`redis_exists`、`redis_ttl`、`redis_type`、`redis_scan`、`redis_keys`、`redis_hget`、`redis_hgetall`、`redis_lrange`、`redis_smembers`、`redis_zrange`、`redis_xrange`。

`REDIS_MODEL=readwrite` 時會額外開放寫入工具：`redis_set`、`redis_mset`、`redis_del`、`redis_unlink`、`redis_expire`、`redis_rename`、`redis_incrby`、`redis_hset`、`redis_hdel`、`redis_lpush`、`redis_rpush`、`redis_lpop`、`redis_rpop`、`redis_sadd`、`redis_srem`、`redis_zadd`、`redis_zrem`、`redis_xadd`、`redis_publish`。

`redis_command` 範例：

```json
{
  "command": "GET",
  "args": ["my-key"]
}
```

當 `REDIS_MODEL=read` 時，會拒絕寫入、管理、未知與 blocking commands。

## 開發

```bash
npm install
npm run build
npm test
```
