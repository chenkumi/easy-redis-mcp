# easy-redis-mcp

一個輕量的 [Model Context Protocol（MCP）](https://modelcontextprotocol.io/)伺服器，讓 AI 助理透過結構化工具檢視與操作 Redis。

本專案使用 Node.js、TypeScript、官方 MCP SDK，以及官方 `redis` Node.js client。伺服器透過 stdio 通訊，並支援單機 Redis、Redis Cluster、TLS 與唯讀模式。

English documentation is available in [README.md](README.md).

## 功能特色

- 提供字串、Hash、List、Set、Sorted Set、Stream 與伺服器資訊的 typed tools
- 提供通用 `redis_command`，補足沒有專用工具的 Redis commands
- 支援單機 Redis 與 Redis Cluster
- 支援使用者名稱與密碼驗證
- 支援 TLS、CA 憑證與 client certificate
- 唯讀模式會隱藏寫入工具，並限制通用指令的權限

## 系統需求

- Node.js 18 或更新版本
- npm
- 可連線的 Redis Server 或 Redis Cluster

## 安裝

使用 `npx` 直接執行：

```bash
npx -y easy-redis-mcp
```

Clone repository 後進行本機開發：

```bash
cd easy-redis-mcp
npm install
npm run build
```

## 設定

請透過 MCP client 設定或 shell environment variables 設定連線資訊。

| 變數 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `REDIS_HOST` | 否 | `127.0.0.1` | Redis hostname 或 IP address |
| `REDIS_PORT` | 否 | `6379` | Redis port |
| `REDIS_DB` | 否 | `0` | 單機 Redis 使用的 database number |
| `REDIS_USERNAME` | 否 | `default` | Redis ACL 使用者名稱 |
| `REDIS_PWD` | 否 | 空字串 | Redis 密碼 |
| `REDIS_SSL` | 否 | `false` | 設為 `true` 時啟用 TLS |
| `REDIS_SSL_CA_PATH` | 否 | 空 | 用來驗證伺服器的 CA certificate 路徑 |
| `REDIS_SSL_KEYFILE` | 否 | 空 | Client private key 路徑 |
| `REDIS_SSL_CERTFILE` | 否 | 空 | Client certificate 路徑 |
| `REDIS_SSL_CERT_REQS` | 否 | `required` | Server certificate 驗證方式：`required` 或 `none` |
| `REDIS_SSL_CA_CERTS` | 否 | 空 | Trusted CA certificate file 的替代路徑 |
| `REDIS_CLUSTER_MODE` | 否 | `false` | 設為 `true` 時透過 Redis Cluster root node 連線 |
| `REDIS_MODEL` | 否 | `readwrite` | 權限模式：`readwrite` 或 `read` |

Shell 設定範例：

```bash
REDIS_HOST=localhost REDIS_PORT=6379 REDIS_PWD=your_password npx -y easy-redis-mcp
```

PowerShell 設定範例：

```powershell
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:REDIS_PWD = "your_password"
npx -y easy-redis-mcp
```

此伺服器通常由 MCP client 啟動。直接執行時會開啟 stdio transport，不會提供 HTTP endpoint。

## Claude Desktop 設定範例

將伺服器加入 Claude Desktop 的 MCP 設定：

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

更新設定後請重新啟動 Claude Desktop。

## Codex config.toml 設定範例

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

## OpenCode opencode.jsonc 設定範例

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

## TLS 設定範例

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

若 Redis Server 要求 mutual TLS，請一併設定 `REDIS_SSL_KEYFILE` 與 `REDIS_SSL_CERTFILE`。除非是受控的開發環境，請勿使用 `REDIS_SSL_CERT_REQS=none`。

## Redis Cluster 設定範例

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

`REDIS_HOST` 與 `REDIS_PORT` 用來指定初始 cluster root node。Redis Cluster 僅支援 database `0`，因此 cluster 連線不會使用 `REDIS_DB`。

## 可用工具

### 讀取與檢視工具

| 工具 | 說明 |
| --- | --- |
| `redis_ping` | Ping Redis，並可選擇回傳指定訊息 |
| `redis_info` | 取得伺服器資訊，可指定單一 section |
| `redis_dbsize` | 取得目前 database 的 key 數量 |
| `redis_time` | 取得 Redis Server 時間 |
| `redis_client_list` | 取得已連線的 client 資訊 |
| `redis_config_get` | 讀取 Redis configuration values |
| `redis_command_list` | 列出 Redis Server 支援的 commands |
| `redis_get`、`redis_mget` | 讀取一個或多個字串值 |
| `redis_exists`、`redis_ttl`、`redis_type` | 檢視 key 狀態與 metadata |
| `redis_scan`、`redis_keys` | 依 pattern 尋找 keys |
| `redis_hget`、`redis_hgetall` | 讀取 Hash 資料 |
| `redis_lrange` | 讀取 List 範圍 |
| `redis_smembers` | 讀取所有 Set members |
| `redis_zrange` | 讀取 Sorted Set 範圍，可選擇包含 scores |
| `redis_xrange` | 依 ID 範圍讀取 Stream entries |

大型或正式環境的 database 應優先使用 `redis_scan`，因為 `KEYS` 掃描完整 keyspace 時可能阻塞 Redis。

### 寫入工具

下列工具僅在 `REDIS_MODEL=readwrite` 時註冊：

| 工具 | 說明 |
| --- | --- |
| `redis_set`、`redis_mset` | 設定一個或多個字串值 |
| `redis_del`、`redis_unlink` | 刪除一個或多個 keys |
| `redis_expire`、`redis_rename`、`redis_incrby` | 修改 key metadata 或整數值 |
| `redis_hset`、`redis_hdel` | 修改 Hash fields |
| `redis_lpush`、`redis_rpush`、`redis_lpop`、`redis_rpop` | 修改 Lists |
| `redis_sadd`、`redis_srem` | 修改 Sets |
| `redis_zadd`、`redis_zrem` | 修改 Sorted Sets |
| `redis_xadd` | 新增 Stream entry |
| `redis_publish` | 發布訊息至 channel |

### 通用指令工具

`redis_command` 可執行沒有專用工具的 Redis commands：

```json
{
  "command": "GET",
  "args": ["my-key"]
}
```

`BLPOP`、`SUBSCRIBE`、`XREAD ... BLOCK` 等 blocking commands 不適合 request/response 型態的 MCP tool，因此會被拒絕。

當 `REDIS_MODEL=read` 時，`redis_command` 僅允許被分類為唯讀的 commands；寫入、管理、blocking 與未知 commands 都會被拒絕。

## 唯讀模式

當 AI 助理只需要檢視 Redis 時，請設定：

```env
REDIS_MODEL=read
```

在此模式下，不會註冊 typed write tools，通用指令政策也只允許已知的 read commands。Redis ACL 權限仍是最終的安全邊界，因此建議同時使用專用的唯讀 Redis user。

## 安全注意事項

- 使用專用 Redis ACL user，僅授予助理需要的 commands 與 key patterns。
- 檢視與報表用途請使用 `REDIS_MODEL=read`。
- 包含 `REDIS_PWD` 的 MCP 設定檔應視為敏感資料。
- 透過不受信任的網路連線時應啟用 TLS。
- 正式環境請維持 `REDIS_SSL_CERT_REQS=required`。
- 大型 database 應優先使用 `redis_scan`，避免使用 `redis_keys`。
- 對正式環境執行寫入操作前，請先確認操作內容。
- 請勿將密碼、private keys 或 certificates commit 到 source control。

## 開發

以 watch mode 執行 TypeScript：

```bash
npm run dev
```

建立 production build：

```bash
npm run build
```

執行測試：

```bash
npm test
```

Integration tests 需要可連線的 Redis instance，連線資訊使用相同的 Redis environment variables。

## 專案結構

```text
src/
  commandPolicy.ts Redis command 分類與唯讀權限限制
  config.ts        以環境變數管理連線與權限設定
  format.ts        MCP response 格式化
  index.ts         MCP server 與工具註冊
  redisClient.ts   單機、Cluster、驗證與 TLS 連線
  toolHandlers.ts  Redis 工具實作
test/
  commandPolicy.test.mjs    Command policy tests
  redisIntegration.test.mjs Redis integration tests
```

## 授權

本專案採用 MIT License，請參閱 [LICENSE.md](LICENSE.md)。
