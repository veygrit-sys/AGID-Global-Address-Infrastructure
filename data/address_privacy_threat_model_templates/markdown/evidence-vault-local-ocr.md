# Evidence Vault / Local OCR Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Photo/PDF OCR, redaction, encrypted evidence, proof of possession
Mode: local-only
Owner: Evidence vault and privacy engineer
Review cadence: Every OCR model, file parser, evidence export, or retention policy change

## Privacy Goal

Let users prove possession or extract address candidates without uploading documents to relying-party servers by default.

## Non-Goals

- Make uploaded documents public fixtures
- Train OCR on private evidence without explicit consent

## Protected Assets

- source document
- OCR draft
- redacted evidence reference
- document commitment
- retention policy

## Trust Boundaries

- file picker to local OCR
- OCR draft to editable form
- evidence vault to verifier
- encrypted storage to export

## Attacker-Controlled Inputs

- PDF
- image file
- OCR text
- redaction mask
- export request
- malformed metadata

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| evidence-vault-local-ocr-tm-01 | critical | OCR draft leaks to server logs | information-disclosure, non-compliance | local OCR default; debug log redaction; server upload opt-in |
| evidence-vault-local-ocr-tm-02 | high | Verifier receives the source document unnecessarily | unawareness, information-disclosure | redacted evidence reference; proof of possession; explicit disclosure confirmation |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- OCR text is editable local draft until user confirms.
- Verifier receives commitment, status, or proof instead of the document by default.

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

- No cloud OCR.
- No persistent source document unless encrypted.
- Short retention and local delete path.

## Open Questions

- Which file types are supported safely?
- Which evidence classes require legal hold controls?

## Verification Commands

- `npm run verify:evidence-vault`
- `npm run verify:no-raw-address`
