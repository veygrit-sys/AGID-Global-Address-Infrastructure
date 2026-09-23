# Address Connect and Address Terminal

This document defines two Stripe-inspired AGID/AOID platform layers:

- **Address Connect**: organization, issuer, carrier, endpoint, webhook, trust, revocation, and API-key-reference management.
- **Address Terminal**: POS fleet, QR/NFC/barcode intake devices, printers, cash drawers, electronic measuring instruments, registry sync, offline queue, staff permissions, and handoff reverification views.

## Address Connect

Address Connect is the organization trust and endpoint discovery layer. It connects:

- credential issuers
- delivery carriers
- municipalities
- NGOs
- EC and CMS operators
- warehouses
- POS providers
- customs or trade-compliance services
- auditors

The safe boundary is strict: Address Connect stores organization metadata only. It must not store personal addresses, raw AGID/AOID values, recipient names, phone numbers, unit numbers, proof codes, private keys, raw API keys, or tokens.

The public registry can contain:

- participant id and display name
- roles
- country and region coverage
- trust level and status
- public key commitments
- endpoint references
- webhook topics
- API key references and fingerprints

Raw API keys are never part of the registry. Store only key ids, scopes, fingerprints, status, and rotation metadata.

## Address Terminal

Address Terminal is the fleet and device operation layer for AGID/AOID POS deployments.

Required screens:

- terminal list
- terminal diagnostics
- scan history
- registry sync
- offline queue
- staff permissions
- reverification report
- settings

Required device classes:

- POS terminal
- QR reader
- NFC reader
- barcode reader
- receipt printer
- cash drawer
- electronic measuring instrument

The terminal layer may show scan counts, sync posture, device status, registry freshness, offline queue size, and staff permissions. It must not store raw QR/NFC payloads, raw addresses, raw AGID/AOID values, raw waybill ids, or recipient proof material.

## API Surface

Address Connect:

- `GET /api/address-connect/capabilities`
- `POST /api/address-connect/registry`
- `POST /api/address-connect/discover`

Address Terminal:

- `GET /api/address-terminal/capabilities`
- `POST /api/address-terminal/fleet`

Address Connect Operations:

- `GET /api/address-connect/operations/requirements`
- `POST /api/address-connect/operations/report`

Address Scale:

- `GET /api/address-scale/capabilities`
- `POST /api/address-scale/topology`

Production deployments should replace in-memory snapshots with SQLite, Postgres, Redis, or MongoDB adapters. The adapter contract remains the same: public organization metadata and device telemetry only; AOID private data stays encrypted or local.

For high-load Redis/Postgres/Mongo/SQLite store roles, cache TTLs, and bulk worker planning, see `docs/address-scale-architecture.md`.

## Webhook Operations

Production webhook delivery must be signed, replay-protected, retried safely, and idempotent.

Recommended headers:

- `AGID-Event-Id`: stable public event id for idempotency.
- `AGID-Timestamp`: sender timestamp, checked against a short tolerance window.
- `AGID-Key-Id`: signing key reference, not the key itself.
- `AGID-Signature`: HMAC-SHA256 signature over the canonical event envelope.

Required controls:

- reject unsigned events in production
- reject stale timestamps
- deduplicate by event id before side effects
- retry retryable failures with exponential backoff and jitter
- move exhausted deliveries to a dead-letter queue
- replay dead-letter events only through an operator action
- keep webhook payloads commitment-only or reference-only

The operational report builder in `src/lib/addressConnectOperations.ts` evaluates endpoint coverage, signature failures, retry backlog, dead-letter count, p95 latency, SLA state, and log-retention safety.

## SLA

Mode 0 local-only deployments do not need a public SLA. Hosted Registry API, Address Connect, and multi-organization deployments should define an explicit SLA.

Suggested production objectives:

- monthly registry and webhook dispatch availability: 99.9%
- webhook acknowledgement p95: under 800 ms
- event dispatch retry backlog: cleared within operator policy
- revocation/freshness root age: within the deployment's published freshness target
- incident response: critical webhook signature or dead-letter growth pages an operator

The SLA must be measured separately for:

- API request availability
- webhook dispatch success
- webhook receiver acknowledgement latency
- registry root freshness
- terminal offline queue synchronization

## Monitoring

Monitor these signals as first-class operational health indicators:

- webhook success rate
- webhook p95 and p99 latency
- signature verification failures
- retry queue depth
- dead-letter queue growth
- endpoint status changes
- issuer suspension or revocation
- registry root age
- terminal offline queue growth
- revocation/freshness sync age
- review queue backlog

Critical signals should open an incident. Attention signals should create an operator task. Dashboard summaries must use counts, references, commitments, fingerprints, and receipt ids only.

## Log Retention

Address Connect logs are operational evidence, not an address database.

Default retention policy:

- raw webhook payloads: 0 days
- operational logs: 30 to 90 days
- security logs: 365 days or longer
- audit logs: 365 days or longer

Allowed log fields:

- event id
- topic
- endpoint id
- status code
- latency
- attempt count
- error code
- payload fingerprint
- commitment
- receipt reference
- terminal id
- issuer id
- generated timestamp

Forbidden log fields:

- raw address
- raw AGID
- raw AOID
- recipient name
- phone number
- room number
- proof code
- recipient secret
- private key
- token
- raw API key
- full signature
- raw webhook payload

Audit bundles should be exportable with a hash root so later review can detect tampering without exposing personal address material.

## High-Risk Mode

For humanitarian, evacuation, domestic-violence, refugee, and censorship-risk contexts:

- prefer AGID-S over public AGID
- shorten QR expiry
- revoke after receipt
- keep only commitments and receipts
- avoid precise AGID display
- keep offline queue conflicts as audit-required

Address Connect manages trusted organizations and endpoints. Address Terminal manages local operational evidence. Neither layer is a personal address database.
