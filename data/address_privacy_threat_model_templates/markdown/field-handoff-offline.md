# Field Handoff / Offline Sync Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Mobile field handoff, reachability, offline queue, CRDT sync
Mode: local-only
Owner: Field operations and sync engineer
Review cadence: Every offline queue, conflict resolution, or reachability change

## Privacy Goal

Keep field operation usable during network loss while preventing offline queues from becoming raw address dumps.

## Non-Goals

- Publish exact delivery destinations
- Guarantee legal identity without issuer credential

## Protected Assets

- offline receipt
- nullifier used state
- reachability category
- device signature
- sync vector

## Trust Boundaries

- field device to local queue
- local queue to server sync
- reachability report to public map
- recipient proof to receipt

## Attacker-Controlled Inputs

- offline batch
- device clock
- carrier note
- reachability report
- conflict resolution choice

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| field-handoff-offline-tm-01 | critical | Offline queue is stolen from device storage | information-disclosure, linkability | encrypted local queue; redacted receipt only; device wipe and key rotation |
| field-handoff-offline-tm-02 | high | Reachability reports expose vulnerable locations | detectability, information-disclosure | coarse public projection; private operator receipt; high-risk mode |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Conflict records carry aliases, nullifiers, vector clocks, and redacted reasons.
- Public reachability reports use category and coarse region.

## Safe Public Outputs

- addressCommitment
- aoidCommitment
- shortAlias
- waybillAlias
- issuerRef
- revocationRoot
- freshnessRoot
- nullifierHash
- redactedEvidenceRef
- coarseRegionCode
- publicProofSignals

## Forbidden Outputs

- plain address body
- raw AOID body
- AGID-S plaintext or production ciphertext
- recipient name
- phone number
- unit or room detail
- proof code
- proof witness
- private key or device secret
- precise private coordinate

## High-Risk Mode Requirements

- Disable precise telemetry.
- Keep reports local until reviewed.
- Prefer AGID-S or coarse area proof.

## Open Questions

- How long can local queues survive before requiring review?
- Which conflict states require human review?

## Verification Commands

- `npm run verify:offline-field-kit`
- `npm run verify:field-handoff`
- `npm run verify:no-raw-address`
