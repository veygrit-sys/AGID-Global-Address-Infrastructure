# Address Scale Architecture

This document defines the high-load store, cache, and bulk-processing posture for AGID/AOID address operations.

## Store Roles

Postgres is the primary ledger for multi-server operation. It owns the append-only event log, temporal address history, durable nullifier source, spatial indexes, CQRS read models, and audit metadata.

Redis is the hot path, not the source of truth. It is used for read-through cache, rate limits, short-lived nullifier checks, revocation freshness cache, singleflight locks, and stream-style worker fan-out.

MongoDB is the redacted document-evidence store. It is useful for variable public-source evidence, audit bundles, feedback labels, and import metadata. It must use JSON schema validation and must not become a schema-free private address document store.

SQLite remains the local/offline store for POS devices, disaster sites, and development. In production it should be used for local durable queues and CRDT/vector-clock sync, not as the shared multi-server ledger.

## Bulk Processing

Bulk jobs are planned as idempotent workers with an outbox pattern:

- `resolve-addresses`
- `verify-addresses`
- `dispatch-webhooks`
- `rebuild-materialized-view`
- `replay-event-log`
- `sync-offline-pos`
- `export-audit-bundle`
- `train-feedback-model`

Every job must carry a domain-separated idempotency key, use retries with a dead-letter queue, and keep enough redacted metadata to replay from the event log.

## Cache Policy

Cache keys must contain public IDs, commitments, or fingerprints only. They must not contain raw address text, raw AGID/AOID, proof codes, phone numbers, room numbers, or full QR/NFC payloads.

Recommended cache classes:

- `public-agid`: long TTL for public grid/rule data.
- `address-verification`: medium TTL for postal and reverse-geocode validation.
- `nullifier-used`: short TTL, backed by a durable ledger.
- `revocation-freshness`: very short TTL for issuer and credential freshness.
- `issuer-trust`: medium TTL, invalidated by registry root changes.
- `terminal-session`: short TTL for POS staff/device sessions.
- `trade-compliance`: long TTL for public tariff or HS-code supporting data.

High-risk mode shortens TTLs, disables stale-while-revalidate for sensitive state, and forbids raw payload caching.

## API Contract

The runtime exposes:

- `GET /api/address-scale/capabilities`
- `POST /api/address-scale/topology`

The topology endpoint accepts workload and capacity signals, then returns a Redis/Postgres/Mongo/SQLite plan with store roles, worker settings, cache TTLs, indexes, CQRS/event-sourcing posture, warnings, and privacy guarantees.

The endpoint rejects private material such as raw address strings, raw AGID/AOID values, proof codes, API keys, tokens, and secrets.
