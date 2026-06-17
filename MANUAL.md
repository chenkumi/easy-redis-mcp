# easy-redis-mcp Manual

`easy-redis-mcp` 是一個用來操作 Redis 的 MCP server，提供 string、hash、list、set、sorted set、stream 與 server 資訊相關工具。

## Overview

適合用在：
- 快取
- session
- queue
- 排行榜
- 短期狀態儲存
- 原子性更新

Redis 不是 SQL 資料庫，所以思考方式不同：
- 不是查表
- 是操作 key 與資料結構

## When to Consult This Manual

如果你遇到以下情況，先看這份手冊：
- 不確定 `redis_command` 或 typed Redis tools 要怎麼用
- 指令回傳錯誤或型別不符
- 不確定 key 對應的是 string、hash、list、set、zset 還是 stream
- 不確定該用 `SCAN` 還是 `KEYS`
- 不確定哪些操作是 read-only，哪些會改動資料

## Modes

- `read`: 只提供讀取相關命令
- `readwrite`: 提供讀寫命令

## Tools

- `redis_command`: 執行一般 Redis 指令
- `redis_ping`
- `redis_info`
- `redis_dbsize`
- `redis_time`
- `redis_client_list`
- `redis_config_get`
- `redis_command_list`
- `redis_get`, `redis_mget`
- `redis_set`, `redis_mset`
- `redis_exists`, `redis_ttl`, `redis_type`
- `redis_scan`, `redis_keys`
- `redis_hget`, `redis_hgetall`, `redis_hset`, `redis_hdel`
- `redis_lrange`, `redis_lpush`, `redis_rpush`, `redis_lpop`, `redis_rpop`
- `redis_smembers`, `redis_sadd`, `redis_srem`
- `redis_zrange`, `redis_zadd`, `redis_zrem`
- `redis_xrange`, `redis_xadd`
- `redis_incrby`
- `redis_expire`
- `redis_del`, `redis_unlink`
- `redis_rename`
- `redis_publish`

## Command Composition Rules

Redis 的使用原則是先確認資料型別，再選命令：

- string：`GET` / `SET`
- hash：`HGET` / `HSET` / `HGETALL`
- list：`LPUSH` / `RPUSH` / `LRANGE`
- set：`SADD` / `SMEMBERS`
- sorted set：`ZADD` / `ZRANGE`
- stream：`XADD` / `XRANGE`

組裝時要注意：
- 一個 key 對應一種主要型別
- 不要拿錯命令操作錯誤型別
- 多 key 命令要注意一致性
- 需要原子性時，優先設計成單一 Redis 命令完成

## Safety Rules

- `SCAN` 比 `KEYS` 更適合大量資料場景
- 不要把 Redis 當成關聯式資料庫
- 大量刪除或批次操作前先確認 key pattern
- 若 key 可能不存在，先檢查 `EXISTS` 或 `TYPE`

## Examples

- 讀取值：
  - `GET user:1:name`
- 寫入值：
  - `SET user:1:name Amy`
- hash 更新：
  - `HSET user:1 profile "..." `
- list 推入：
  - `LPUSH queue:jobs job-1`
- 排行榜：
  - `ZADD leaderboard 100 user:1`

## Troubleshooting

- 若型別不符，先用 `redis_type`
- 若找不到 key，先用 `SCAN`
- 若資料會過期，先看 `TTL`
- 若結果很多，避免直接用 `KEYS`
