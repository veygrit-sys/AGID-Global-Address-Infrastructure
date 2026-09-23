# POS Terminal Handoff Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Scan -> Decision -> Handoff -> Report
Mode: mixed
Owner: POS engineer and operations security reviewer
Review cadence: Every device integration, payment or carrier handoff release

## Privacy Goal

Let staff decide whether to accept, reject, or complete a handoff without storing address bodies or reusable proof secrets.

## Non-Goals

- Replace carrier compliance systems
- Store customer address history in POS logs

## Protected Assets

- QR/NFC intake
- waybill alias
- recipient proof status
- terminal signature
- handoff receipt

## Trust Boundaries

- scanner to POS runtime
- POS to registry
- POS to printer
- offline queue to sync service

## Attacker-Controlled Inputs

- QR payload
- NFC payload
- barcode
- operator override
- printer template
- offline sync batch

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| pos-terminal-handoff-tm-01 | high | Copied QR is reused after the handoff | spoofing, linkability | jti or nullifier required; short alias TTL; challenge-response for high-risk flows |
| pos-terminal-handoff-tm-02 | critical | Audit report stores the private delivery payload | information-disclosure, repudiation | redacted receipt schema; terminal signature; no raw payload persistence |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Reports store terminal signature, alias, status, roots, and commitments only.
- Printers receive formatted redacted receipt output.

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

- Require recipient live proof.
- Short alias TTL.
- No precise address on printed receipt.

## Open Questions

- Which terminals need hardware key storage?
- Which carriers accept recipient proof status without full address disclosure?

## Verification Commands

- `npm run verify:pos-ui`
- `npm run verify:mandatory-security`
- `npm run verify:no-raw-address`
