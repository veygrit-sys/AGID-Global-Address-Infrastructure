# Address Resolution System

The Address Resolution System (ARS) is the integrated resolver layer for AGID/AOID address workflows. It combines local address parsing, AGID encode/decode, open-source address verification, privacy-preserving entity resolution, public/private separation, federated resolver consensus, Mode 1 server-registry checks, and Address DNS record generation.

## Goals

- Resolve an address request into a clear operator decision: `accept`, `review`, or `reject`.
- Support Mode 0 local-only operation without ZK, Ethereum, gas, or network access.
- Support Mode 1 server-registry checks for revocation, freshness, nullifier, issuer, and commitment status.
- Cluster competing address candidates into same-entity, ambiguous, distinct, or insufficient-evidence outcomes without exposing raw private address identifiers.
- Keep raw address, raw AGID, raw AOID, coordinates, recipient identity, and unit-level details out of federated/public payloads.
- Produce commitment-only Address DNS records for public/private separation.

## API

- `GET /api/address-resolution/capabilities`
- `POST /api/address-resolution/resolve`
- `GET /api/address-resolution/ledger/status`
- `GET /api/address-resolution/ledger/recent?limit=25`
- `GET /api/address-resolution/ledger/:resolutionId`
- `GET /api/address-resolution/ledger/streams/:streamId/events?limit=100`
- `GET /api/address-resolution/ledger/streams/:streamId/snapshot?at=2026-06-17T00:00:00.000Z`

Example request:

```json
{
  "mode": "local-only",
  "domain": "pos:checkout",
  "language": "ja",
  "addressText": "100-0005 Tokyo Chiyoda Marunouchi 1-9-1",
  "address": {
    "country_code": "JP",
    "state": "Tokyo",
    "city": "Chiyoda",
    "road": "Marunouchi",
    "house_number": "1-9-1",
    "postcode": "100-0005"
  },
  "countryCode": "JP",
  "postalCode": "100-0005",
  "lat": 35.681236,
  "lon": 139.767125,
  "entityCandidates": [
    {
      "candidateId": "postal-api-candidate",
      "source": "postal-api",
      "canonical": {
        "country_code": "JP",
        "state": "Tokyo",
        "city": "Chiyoda",
        "road": "Marunouchi",
        "house_number": "1-9-1",
        "postcode": "100-0005"
      },
      "confidence": 0.96
    }
  ]
}
```

## Modes

- `local-only`: local AGID generation, local address verification, local Address DNS record generation. No ZK, Ethereum, gas, or server trust is required.
- `server-registry`: adds Mode 1 registry verification for commitments, revocation, freshness, issuer status, and nullifier state.
- `address-dns`: uses the same public/private boundary while favoring commitment-only Address DNS records.
- `zk-proof`: reserves the same payload contract for local or server-side proof verification.
- `ethereum-registry`: reserves the same payload contract for on-chain commitment, revocation, nullifier, and payment verification.
- `hybrid`: combines the available off-chain and registry signals while preserving the same privacy boundary.

## Output Contract

The main result fields are:

- `status`: `resolved`, `partial`, `unresolved`, `conflict`, `blocked`, or `rejected`.
- `decision`: `accept`, `review`, or `reject`.
- `displayHints.operatorState`: POS-friendly state such as `Address OK` or `Address Review`.
- `verification`: address verification engine result.
- `entityResolution`: privacy-preserving candidate clustering result.
- `federated`: federated resolver consensus result.
- `registryVerification`: optional Mode 1 registry result.
- `addressDnsRecord`: commitment-only Address DNS record.
- `commitments`: address, AGID, AOID, and credential commitments used by public layers.

## Information Engineering Architecture Map

ARS treats address resolution as a stack of information-engineering models, not
only as a geocoding function. The implementation status is intentionally
separated so that the project does not overclaim unfinished safety or scale
properties.

Implementation catalog:

- `src/lib/addressInformationArchitecture.ts`

| Concept | Use in AGID/AOID | Status |
| --- | --- | --- |
| Entity Resolution | Merge spelling variants, aliases, old addresses, and translated addresses into same-entity/review/split decisions. | Implemented |
| Temporal Database | Reconstruct address state at a point in time and support administrative changes or PID merge/split lineage. | Implemented |
| Event Sourcing | Store address resolution, correction, delivery, revocation, and audit facts as append-only evidence. | Implemented |
| CRDT / Vector Clock | Let POS and disaster-field devices work offline, merge later, and surface conflicts for audit. | Implemented |
| Merkle Tree / Transparency Log | Anchor issuer keys, revocation roots, freshness roots, and ledger checkpoints without exposing raw addresses. | Partial |
| Bloom Filter / Cuckoo Filter | Speed up used-nullifier, duplicate candidate, and revocation prechecks before exact ledger lookup. | Planned |
| Inverted Index | Search multilingual place names, postal text, aliases, and natural features. | Implemented |
| Spatial Index | Search nearby AGID cells, named features, roads, islands, water bodies, mountains, deserts, wetlands, and delivery areas. | Implemented |
| CQRS | Split write/audit stores from fast read/display/search views. | Partial |
| CAP / Consistency Model | Define tradeoffs between local POS, server registry, public ledger, and delayed sync. | Partial |
| State Machine | Make waybill, handoff, PID, AOID authority, and audit transitions explicit. | Partial |
| Access Control | Separate delivery, recipient, issuer, admin, and audit permissions by role and purpose scope. | Partial |
| Differential Privacy | Use address feedback and quality analytics without leaking individual address data. | Planned |
| Property-based Testing | Stress AGID generation, normalization, reverse geocoding, boundary cases, and CRDT merge laws. | Planned |
| Formal Verification | Use Lean/TLA+/Alloy-style models for impossibility, lineage, state, and policy-gate claims. | Partial |

Capability output includes a compact `informationArchitecture` summary with
implemented, partial, planned, privacy-critical, and next-step counts.

## Privacy Boundary

ARS must not send the following to federation, Address DNS, or registry surfaces:

- raw address text
- raw AGID in public/high-risk modes
- raw AOID
- precise coordinates
- recipient identity
- room, unit, phone, email, or delivery instructions

Those values remain local, encrypted, or are replaced by domain-separated commitments.

## Entity Resolution Engine

ARS includes a local Entity Resolution Engine for candidate generation, clustering, and unresolved/review decisions. It is intended for cases where postal APIs, carrier history, AGID reverse geocoding, user corrections, or registry snapshots produce multiple possible address references.

The engine returns:

- `same-entity`: candidates can be merged.
- `ambiguous`: candidates are close enough to require operator review.
- `distinct`: candidates conflict and should not be merged.
- `insufficient-evidence`: only one usable candidate or too little comparable evidence exists.

The engine deliberately avoids naive transitive over-merge. A partial candidate cannot bridge two conflicting unit-level candidates unless every member is compatible with the cluster anchor and existing members. With `strictEntityUnitSeparation` enabled, different building/unit evidence becomes a review or split signal.

Private identifiers are not echoed. Raw AGID/AOID/address text is converted to fingerprints or domain-separated commitments, and the output exposes only candidate IDs, sources, present fields, postcode prefixes, commitment references, confidence, cluster IDs, edge scores, reasons, and conflicts.

## Spatial Index + Address Index

ARS now has a local `SpatialAddressIndex` core for candidate generation before entity resolution. It combines:

- bbox/grid buckets for nearby AGID cells, islands, roads, bridges, parks, water bodies, mountains, deserts, wetlands, glaciers, and other named geographic features
- AGID decoding so records with only an AGID can still participate in spatial search
- multilingual inverted address terms for local names, English/international shipping names, aliases, postal text, and natural-feature names
- exact filters for country code, postal code, and AGID prefix/full code

The default implementation is dependency-light and local-first. It is intended for Mode 0 POS/offline use, disaster-field devices, address registration autocomplete, reverse-geocoding candidate lookup, and prefiltering before the Entity Resolution Engine.

Implementation file:

- `src/lib/spatialAddressIndex.ts`

The same logical index can be mapped to production stores:

- SQLite: `address_index_record`, `address_index_term`, `address_index_spatial_bucket`
- Postgres: PostGIS/R-tree or generated bucket columns plus GIN text index
- MongoDB: `2dsphere` geometry index plus text/keyword indexes
- Redis: geospatial keys for nearby lookup plus set indexes for postcode, country, and AGID prefixes

Public/server indexes should prefer domain-separated commitments and public metadata. Raw AOID, recipient name, phone number, unit-level delivery instructions, and high-risk precise locations must not be placed in public Address DNS or registry indexes.

## CRDT / Offline Sync

ARS also includes a reusable offline synchronization CRDT for POS terminals, disaster-field devices, warehouse scanners, and address-registration clients that may operate without a reliable network.

The core model combines:

- vector clocks for causal ordering across terminals and devices
- LWW registers for scalar fields such as POS state, freshness status, carrier acceptance state, and local review status
- OR-Set members for append/remove workflows such as used nullifiers, pending receipts, local evidence hashes, and deferred sync events
- deterministic merge with explicit `audit-required` conflicts when two concurrent updates disagree
- privacy gates that require commitments for sensitive fields such as raw address, AGID, AOID, coordinates, recipient data, phone, proof code, waybill ID, and delivery instructions

Implementation file:

- `src/lib/addressOfflineSyncCrdt.ts`

The CRDT is not meant to replace the POS offline usage ledger. Instead, it gives that ledger and future address-registration/waybill workflows a common merge rule. A terminal can keep working in Mode 0, export a commitment-only sync envelope, and later merge with a server, another terminal, or a self-hosted registry. Conflicts are preserved as audit artifacts rather than silently overwritten.

Recommended uses:

- local POS handoff progress: `Address OK -> Carrier Scan OK -> Recipient Pending -> Handoff Complete`
- offline used-nullifier sets for copied QR / duplicate aid-claim detection
- delayed address correction patches and translation feedback
- offline revocation/freshness observations
- warehouse or field-worker device queues with later reconciliation

Public/shared sync envelopes must use public values or domain-separated commitments only. Full address lines, decrypted AGID-S payloads, AOID private descriptors, recipient names, phone numbers, proof codes, exact coordinates, and high-risk delivery instructions must remain local or encrypted.

## Adapter Boundary

The resolver writes a privacy-preserving Address Resolution Ledger after each `/resolve` call. The ledger stores only resolution metadata, domain-separated commitments, evidence hashes, step receipts, audit fingerprints, optional nullifiers, event records, and temporal snapshots. It must not store raw address text, raw AGID, raw AOID, precise coordinates, recipient identity, canonical address parts, room/unit data, phone numbers, or delivery instructions.

## Event Sourcing + Temporal Ledger

Each resolution write also appends a `resolution-recorded` event to a stream derived from the primary address-reference commitment. Events are append-only and contain:

- `streamId`
- `aggregateKind`
- `aggregateId`
- `eventType`
- `sequence`
- `previousEventHash`
- `eventHash`
- `payloadHash`
- a privacy-checked `payloadJson`

The event stream supports later `address-corrected`, `credential-revoked`, `pid-merged`, `pid-split`, `delivery-accepted`, and `handoff-completed` events without changing the resolver output contract.

Temporal snapshots materialize the latest state for fast reads:

- latest state: `GET /api/address-resolution/ledger/streams/:streamId/snapshot`
- point-in-time state: `GET /api/address-resolution/ledger/streams/:streamId/snapshot?at=<ISO time>`
- replay/audit: `GET /api/address-resolution/ledger/streams/:streamId/events`

This gives the application a Git-like address history: every state is derived from privacy-preserving events, while current POS decisions can read the latest snapshot quickly.

The default store is in-memory. Multi-server/high-load deployments can replace only the ledger store layer with SQLite, Postgres, Redis, or MongoDB adapters while keeping the same ARS output contract.

For operator UI and SDKs, the supported backend matrix is available at `GET /api/cloud-db/compatibility`. It distinguishes:

- runtime ledger adapters: memory, SQLite, PostgreSQL, Redis, MongoDB
- Postgres-compatible runtime deployments: Neon Postgres, Supabase Postgres
- planned runtime adapters: MySQL/MariaDB, Cloudflare D1, Firestore, Firebase, DynamoDB
- cache/export/webhook adapters that should not be treated as the primary ledger

Environment variables:

- `AGID_ADDRESS_LEDGER_STORE=memory|sqlite|postgres|redis|mongodb`
- `AGID_ADDRESS_LEDGER_SQLITE_PATH=.agid-runtime/address-resolution-ledger.sqlite`
- `AGID_ADDRESS_LEDGER_POSTGRES_URL=postgres://...`
- `AGID_ADDRESS_LEDGER_REDIS_URL=redis://...`
- `AGID_ADDRESS_LEDGER_REDIS_KEY_PREFIX=agid:address-ledger`
- `AGID_ADDRESS_LEDGER_MONGODB_URL=mongodb://...`
- `AGID_ADDRESS_LEDGER_MONGODB_DB=agid`
- `AGID_ADDRESS_LEDGER_MONGODB_COLLECTION_PREFIX=address_resolution_ledger`

Schema and setup files:

- `db/address-resolution-ledger.sqlite.sql`
- `db/address-resolution-ledger.postgres.sql`
- `db/address-resolution-ledger.mongodb.md`
- `db/spatial-address-index.sqlite.sql`
- `db/spatial-address-index.postgres.sql`
- `db/address-offline-sync-crdt.sqlite.sql`
- `db/address-offline-sync-crdt.postgres.sql`

Recommended adapter tables/keys:

- `address_resolution`
- `address_commitment`
- `resolution_evidence`
- `resolution_step`
- `address_nullifier`
- `address_resolution_event`
- `address_temporal_snapshot`

MongoDB uses equivalent plural collection names under the configured prefix:

- `<prefix>_resolutions`
- `<prefix>_commitments`
- `<prefix>_evidence`
- `<prefix>_steps`
- `<prefix>_nullifiers`
- `<prefix>_events`
- `<prefix>_snapshots`

The resolver API should stay stable when the store changes.
