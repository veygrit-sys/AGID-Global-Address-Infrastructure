# Open Locker/PUDO Simulator Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Locker/PUDO QR/NFC intake, local MQTT/HTTP/Modbus simulation, receipts
Mode: local-only
Owner: Locker/PUDO engineer and device security reviewer
Review cadence: Every simulator scenario, hardware protocol adapter, or receipt schema update

## Privacy Goal

Simulate locker and PUDO operations without storing raw address data, device secrets, or QR/NFC payloads.

## Non-Goals

- Control real locker doors without certified adapter review
- Store production carrier payloads in fixtures

## Protected Assets

- locker assignment
- QR/NFC proof status
- device state
- local protocol frame
- operator receipt

## Trust Boundaries

- scanner to simulator
- simulator to protocol frame
- operator action to receipt
- offline queue to sync

## Attacker-Controlled Inputs

- QR/NFC scan
- simulator script event
- Modbus value
- MQTT topic alias
- HTTP path alias
- device metadata

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| locker-pudo-simulator-tm-01 | high | Simulator fixture includes real shipment payload | information-disclosure | fixture scanner; commitment-only payloads; negative private-material tests |
| locker-pudo-simulator-tm-02 | medium | Offline command is mistaken for real hardware authority | tampering, repudiation | simulation-only boundary; adapter separation; signed production command schema |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Protocol frames contain metadata and commitments only.
- Receipts use aliases, statuses, and audit hashes.

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

- NFC/passkey/AOID credential proof.
- Short TTL.
- No precise locker address disclosure.

## Open Questions

- Which production adapter contracts are in scope?
- Which physical reader faults should block release?

## Verification Commands

- `npm run verify:open-locker-pudo`
- `npm run verify:no-raw-address`
