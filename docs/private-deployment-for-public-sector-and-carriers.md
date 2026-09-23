# Private Deployments for Municipalities, NGOs, and Carriers

AGID private deployments are tenant-isolated installations for organizations that need AGID/AOID resolution, revocation, nullifier checks, ZK proof orchestration, POS terminal fleets, and audit logs without sending plaintext address material to a public SaaS boundary.

The planner is exposed through:

- `GET /api/private-deployments/capabilities`
- `POST /api/private-deployments/plan`

The API accepts deployment requirements only. It rejects raw addresses, raw AGID/AOID values, witness bodies, proof secrets, API keys, recipient data, and private keys.

## Profiles

| Sector | Default Network | Default Runtime | Main Use |
| --- | --- | --- | --- |
| `municipality` | `private-vpc` | `mode-2-zk-only` | resident credentials, official issuer governance, data residency |
| `ngo` | `offline-first` | `mode-2-zk-only` | humanitarian field operations, high-risk AGID-S, short retention, offline sync |
| `carrier` | `hybrid-edge` | `mode-1-server-registry` | terminal fleets, signed handoff receipts, nullifier replay checks, webhook dispatch |

## Component Model

The planner composes these private components as needed:

- `local-resolver`
- `private-registry-api`
- `managed-zk-proof-worker`
- `issuer-trust-registry`
- `revocation-freshness-registry`
- `nullifier-ledger`
- `address-connect-directory`
- `address-terminal-fleet`
- `offline-sync-ledger`
- `signed-webhook-dispatcher`
- `audit-dashboard`
- `redacted-audit-archive`
- `public-data-pack-mirror`
- `secrets-and-key-management`
- `monitoring-and-sla`
- `incident-response`

Every component is modeled as `storesRawAddress: false`.

## Storage Guidance

The generated storage plan is conservative:

- `sqlite`: single-node and offline field-site sync
- `postgres`: durable private ledger, multi-server deployments, carrier operations
- `redis`: hot cache, rate limiting, terminal burst control, short-lived nullifier checks
- `mongodb`: redacted document evidence and dashboard metadata, not private address documents
- `object-storage`: redacted append-only audit archive

Redis is never recommended as the only source of truth. Analytics warehouses must not ingest raw private address events.

## ZK and Witness Boundary

The planner is compatible with the managed ZK proof server, but keeps the same safety rule:

- recommended witness mode: `client-side-witness`
- allowed high-assurance option: `remote-encrypted-witness` with confidential compute or organization-owned workers
- forbidden: `server-held-witness`

The server accepts public inputs, commitments, registry roots, policy hashes, circuit references, and artifact references only.

## Example: NGO Offline-First Deployment

```json
{
  "sector": "ngo",
  "tenantId": "relief-field-org",
  "countryCodes": ["JP", "PH"],
  "offlineSites": 8,
  "expectedDailyEvents": 5000,
  "requiresZk": true,
  "retentionDays": 30
}
```

Expected traits:

- `networkMode: offline-first`
- `runtimeMode: mode-2-zk-only`
- `offline-sync-ledger`
- `address-terminal-fleet`
- `redacted-audit-archive`
- high-risk launch gates

## Example: Carrier Hybrid Edge Deployment

```json
{
  "sector": "carrier",
  "tenantId": "carrier-edge-network",
  "countryCodes": ["US", "CA"],
  "expectedDailyEvents": 250000,
  "peakEventsPerSecond": 300,
  "posTerminals": 250,
  "requiresPublicDashboard": true
}
```

Expected traits:

- `primaryLedger: postgres`
- `hotCache: redis`
- `documentEvidence: mongodb`
- terminal fleet management
- signed webhook dispatch
- handoff reverification report controls

## Launch Gates

Production deployments should not launch until these gates pass:

- no plaintext address or AOID storage
- secret manager or HSM configured
- signed webhook replay protection
- revocation and freshness checks enabled
- nullifier domain separation enabled
- redacted audit log review
- terminal device signing for carrier operations
- offline conflict review for NGO and high-risk field operations
- issuer governance and data residency review for municipalities

## Privacy Boundary

Private deployments are not an excuse to store more data. They exist to let sensitive organizations run the same public protocol boundaries inside their own trust perimeter.

Do not store:

- plaintext addresses
- raw AGID/AOID values in audit or analytics logs
- witness bodies
- proof codes
- recipient names, phone numbers, unit numbers
- raw QR/NFC payloads
- API keys or private keys

Store instead:

- commitments
- nullifier hashes
- issuer roots
- revocation and freshness roots
- redacted receipt references
- terminal and webhook signatures
- policy hashes
- aggregate audit counters
