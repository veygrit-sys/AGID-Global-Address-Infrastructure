# Address Intent

AddressIntent is the core workflow object for AGID/AOID address operations. It follows the same design idea as a payment intent: the caller declares the purpose, the runtime collects evidence, and the intent exposes a status plus the next action.

## Purposes

- `delivery`: verify address quality, then issue or accept a waybill.
- `return`: verify a return destination before label issuance.
- `aid`: prove eligibility for humanitarian or disaster-support flows.
- `identity`: verify residence, AOID ownership, or address credential control.
- `customs`: combine address quality with trade/customs evidence.

## Modes

- `local`: no ZK and no chain registry; fastest and offline-friendly.
- `server`: uses a trusted server registry for freshness, use-state, or review.
- `zk`: verifies private predicates without a public chain registry.
- `ethereum`: uses public registry evidence without private ZK predicates.
- `full`: combines private predicates and public registry evidence.

## Statuses

- `requires_input`: the caller must add missing address, QR, recipient, proof, or registry evidence.
- `verifying`: at least one evidence item is pending.
- `requires_review`: evidence is partial, failed, warning-level, or contains stripped private input.
- `verified`: required evidence groups have accepted evidence.
- `rejected`: the intent is explicitly blocked.
- `expired`: the validity window has closed.

## Evidence Contract

AddressIntent evidence is public workflow metadata only:

```json
{
  "source": "postal-api",
  "status": "passed",
  "confidence": 0.92,
  "safeFingerprint": "postal-cmt-1"
}
```

Do not place plaintext addresses, raw AGID/AOID values, recipient names, phone numbers, unit numbers, proof codes, or private keys in intent evidence. Use commitments, hashes, provider receipt IDs, or local-safe fingerprints instead.

## API Surface

- `GET /api/address-intents/capabilities`
- `POST /api/address-intents`
- `GET /api/address-intents/:intentId`
- `POST /api/address-intents/:intentId/update`
- `GET /api/address-intents/recent`

The current server store is in-memory for development. Production deployments should swap it for a SQLite, Postgres, Redis, MongoDB, or event-sourced adapter while preserving the public-only evidence contract.
