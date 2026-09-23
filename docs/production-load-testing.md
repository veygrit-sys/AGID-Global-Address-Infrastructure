# AGID Production Load Testing

本番環境への負荷テストは、最初から大きい負荷をかけず、read-only canary として始めます。
このリポジトリの標準 runner は、誤操作で本番を叩かないように dry-run を既定値にしています。

## Safety Gates

- `https://` のみ許可します。
- `AGID_LOAD_TEST_ALLOWED_HOSTS` に入っていないホストは拒否します。
- 実トラフィックには `AGID_LOAD_TEST_ACK=I_UNDERSTAND_THIS_HITS_PRODUCTION` が必要です。
- `GET` / `HEAD` だけ許可します。
- request body は送りません。
- response body は保存しません。
- raw address、recipient、witness、private key らしい path は拒否します。
- 既定上限は `20 rps`、`120 seconds`、`10 concurrency` です。

## Dry Run

```bash
AGID_LOAD_TEST_BASE_URL=https://example.agid.example \
AGID_LOAD_TEST_ALLOWED_HOSTS=example.agid.example \
npm run loadtest:prod:dry-run
```

## Execute

```bash
AGID_LOAD_TEST_BASE_URL=https://example.agid.example \
AGID_LOAD_TEST_ALLOWED_HOSTS=example.agid.example \
AGID_LOAD_TEST_ACK=I_UNDERSTAND_THIS_HITS_PRODUCTION \
AGID_LOAD_TEST_RPS=2 \
AGID_LOAD_TEST_DURATION_SECONDS=30 \
npm run loadtest:prod
```

## Endpoint Selection

Default endpoints are read-only:

- `/api/health`
- `/api/address-resolution/capabilities`
- `/api/address/verify/capabilities`

Custom endpoints can be passed as repeated args:

```bash
npm run loadtest:prod:dry-run -- --endpoint=/api/health --endpoint=address-element:/api/address-element/capabilities:200:1
```

## Stop Conditions

The runner stops early when one of these trips:

- consecutive failures exceed the configured threshold
- observed error rate burns past the configured budget
- p95 latency exceeds the configured budget

For a real production window, use this order:

1. dry-run
2. single endpoint, `1-2 rps`, `30 seconds`
3. read-only capability endpoints, `2-5 rps`, `2 minutes`
4. canary user traffic mirror, no private payloads
5. broader load only after monitoring, rollback, and owner approval are ready
