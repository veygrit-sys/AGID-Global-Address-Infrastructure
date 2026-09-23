# AGID-S QR/NFC Sharing Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Encrypted AGID sharing over QR, NFC, link, or paper
Mode: local-only
Owner: AGID-S and mobile security engineer
Review cadence: Every payload version, scanner parser, key rotation, or revocation change

## Privacy Goal

Allow only authorized readers to decrypt an AGID while public QR/NFC surfaces reveal no location or personal data.

## Non-Goals

- Put AGID-S ciphertext on public ledgers by default
- Use permanent exact location QR for high-risk cases

## Protected Assets

- AGID plaintext
- AGID-S ciphertext
- recipient key
- jti
- expiry
- purpose

## Trust Boundaries

- issuer device to QR/NFC medium
- QR/NFC scanner to decryptor
- decryptor to POS or field app
- revocation check to registry

## Attacker-Controlled Inputs

- QR image
- NFC tag
- link alias
- key id
- expiry metadata
- revocation response

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| agid-s-qr-nfc-tm-01 | high | Copied AGID-S remains useful too long | spoofing, linkability | short expiry; jti and used-state; recipient-specific encryption |
| agid-s-qr-nfc-tm-02 | critical | Parser logs decrypted AGID | information-disclosure | decrypt only in local memory; redacted logs; no plaintext persistence by default |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Payload contains AGID, expiry, purpose, and jti only when needed.
- Public logs store ciphertext hash or alias, not plaintext or production ciphertext sample.

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

- Use coarse AGID where possible.
- Expire immediately after use.
- No address history retention.

## Open Questions

- Which key distribution model is supported for groups?
- How are lost reader keys revoked?

## Verification Commands

- `npm run verify:mandatory-security`
- `npm run verify:no-raw-address`
