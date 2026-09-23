# Address Resolution Ledger MongoDB Collections

MongoDB support stores the same privacy-preserving Address Resolution Ledger contract used by the in-memory, SQLite, Postgres, and Redis adapters. It is a document-store adapter, not a plaintext address store.

## Environment

```text
AGID_ADDRESS_LEDGER_STORE=mongodb
AGID_ADDRESS_LEDGER_MONGODB_URL=mongodb://127.0.0.1:27017
AGID_ADDRESS_LEDGER_MONGODB_DB=agid
AGID_ADDRESS_LEDGER_MONGODB_COLLECTION_PREFIX=address_resolution_ledger
```

`MONGODB_URI` and `MONGODB_DB` are accepted as generic fallbacks.

## Collections

With the default prefix, the adapter creates these collections:

```text
address_resolution_ledger_resolutions
address_resolution_ledger_commitments
address_resolution_ledger_evidence
address_resolution_ledger_steps
address_resolution_ledger_nullifiers
address_resolution_ledger_events
address_resolution_ledger_snapshots
```

## Required Privacy Boundary

These collections must not store:

- raw address text
- raw AGID
- raw AOID
- precise coordinates
- recipient identity
- canonical address parts
- room, unit, phone, email, or delivery instructions

Use domain-separated commitments, evidence hashes, event hashes, payload hashes, nullifiers, public status fields, and temporal snapshots instead.

## Indexes

The adapter creates these indexes on first use:

```text
resolutions: { resolutionId: 1 } unique
resolutions: { createdAt: -1 }
resolutions: { decision: 1, status: 1 }

commitments: { commitmentHash: 1, scope: 1, commitmentKind: 1 } unique
commitments: { resolutionId: 1, createdAt: 1 }
commitments: { scope: 1, commitmentKind: 1 }

evidence: { evidenceId: 1 } unique
evidence: { resolutionId: 1, observedAt: 1 }
evidence: { sourceKind: 1, sourceId: 1 }

steps: { stepId: 1 } unique
steps: { resolutionId: 1, completedAt: 1 }

nullifiers: { nullifierHash: 1 } unique
nullifiers: { resolutionId: 1, usedAt: 1 }
nullifiers: { scope: 1, usage: 1 }

events: { eventId: 1 } unique
events: { streamId: 1, sequence: 1 } unique
events: { eventHash: 1 }

snapshots: { snapshotId: 1 } unique
snapshots: { streamId: 1, sequence: 1 } unique
snapshots: { streamId: 1, validFrom: 1, validTo: 1 }
```

## Notes

- Event append uses a retry loop around the `(streamId, sequence)` unique index to remain safe under concurrent writers.
- Temporal snapshots are materialized for fast reads, but the event stream remains the audit source of truth.
- If you need spatial lookup, keep it in the `SpatialAddressIndex` layer. This ledger adapter stores audit state, not public geospatial search records.
