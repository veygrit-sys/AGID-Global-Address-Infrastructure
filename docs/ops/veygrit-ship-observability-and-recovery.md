# Veygrit -ship observability and recovery

## Production contract

- Every HTTP response returns `X-Request-ID` and `X-AGID-Request-ID`. A caller-supplied ID is accepted only when it is 8–100 safe ASCII characters; otherwise the server generates a UUID.
- Logs are one JSON object per line. They contain a stable route template, status class, duration, carrier operation, and error code. Request/response bodies, query strings, headers, addresses, labels, credentials, signed URLs, and customer identifiers are forbidden.
- `/api/internal/veygrit-ship/metrics` is protected by `X-Veygrit-Internal-Key`; it is never a guest or public endpoint.
- Metrics labels are bounded to carrier (`ups` or `dhl`), operation, outcome, stable route, method, and status class. Do not add request, merchant, shipment, tracking, email, or address labels.

## Release metrics and alerts

| Signal | Limited-release objective | Alert |
| --- | ---: | --- |
| UPS/DHL operation success ratio | >= 99% over 5m, minimum 20 operations | 10m below objective |
| Rating p95 | <= 2 seconds | 10m above objective |
| Label/return-label failure ratio | <= 1%, minimum 10 attempts | 10m above objective, critical |
| Webhook event-to-acceptance p95 | <= 60 seconds | 10m above objective |
| Metrics presence | present continuously | missing for 15m, critical |

Prometheus rules live in `config/observability/veygrit-ship-alerts.yml`. Route alerts to the primary on-call and create a paging integration before live-label access is enabled.

## Backup policy and restore test

- PostgreSQL: provider-managed continuous backup/PITR plus a daily encrypted backup. Retain daily backups 35 days and monthly backups 12 months.
- Label objects: private bucket/container, encryption, object versioning, lifecycle retention, and cross-region copy where the provider permits it. Never copy labels to logs or analytics.
- Run a PostgreSQL restore drill monthly and a full PostgreSQL + synthetic object-storage recovery drill quarterly.
- The recovery target must be an empty database created from `template0`, isolated from production networking and named with `restore_drill`, `dr_test`, or `disaster_recovery`.

Dry safety test:

```powershell
npm run verify:veygrit-ship-backup-restore
```

Real isolated drill:

```powershell
$env:VEYGRIT_SHIP_BACKUP_SOURCE_DATABASE_URL='<secret reference resolved only in the drill runner>'
$env:VEYGRIT_SHIP_RESTORE_TARGET_DATABASE_URL='<isolated empty restore_drill database>'
$env:VEYGRIT_SHIP_RESTORE_DRILL_CONFIRM='RESTORE_DRILL_ONLY'
npm run drill:veygrit-ship-backup-restore
```

The script uses custom-format `pg_dump`, restores with `pg_restore --single-transaction --exit-on-error`, compares every `veygrit_ship_*` row count, prints no connection string or PII, and deletes its temporary archive. A count match is a minimum check; quarterly drills must additionally sample application reads, FK constraints, worker claims, signed-download issuance, and a synthetic non-PII PDF/ZPL object round trip.

## Release gates

Run `npm run verify:veygrit-ship-operations`. CI must install with `npm ci`. Carrier, database, and multi-cloud secret/object-storage dependencies are exact-version pinned and checked against `package-lock.json`. A failing secret scan, lock check, test, audit, or restore drill blocks promotion.
