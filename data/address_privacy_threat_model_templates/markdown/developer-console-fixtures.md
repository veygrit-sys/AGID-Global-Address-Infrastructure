# Developer Console / Public Fixtures Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: API keys, webhooks, SDK snippets, OpenAPI, test vectors, launch checks
Mode: mixed
Owner: Developer platform and release engineer
Review cadence: Every docs, SDK, OpenAPI, webhook, or fixture release

## Privacy Goal

Make public integration examples useful without embedding real addresses, real ciphertexts, private keys, or production identifiers.

## Non-Goals

- Ship real customer data as sample fixtures
- Expose full webhook payload logs by default

## Protected Assets

- API key tail
- webhook secret
- SDK fixture
- OpenAPI example
- test vector
- launch checklist

## Trust Boundaries

- developer console to browser
- fixture generator to repository
- webhook log to dashboard
- OpenAPI docs to public release

## Attacker-Controlled Inputs

- developer-provided endpoint
- API key label
- webhook sample body
- SDK snippet
- fixture metadata

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| developer-console-fixtures-tm-01 | critical | Public test vector contains private address or proof material | information-disclosure, non-compliance | synthetic fixture rule; secret scan; no-raw-address release scan |
| developer-console-fixtures-tm-02 | high | Webhook debugging reveals private payloads | information-disclosure | body masking by default; signature and event id display; explicit secure reveal workflow |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Public docs use synthetic-public examples only.
- Console shows key tails and hashes, not secrets or full payloads.

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

- Disable public example export from high-risk sessions.
- Require reviewer approval for public docs.

## Open Questions

- Which fixture generator owns synthetic sample data?
- Which log fields are safe for developer support?

## Verification Commands

- `npm run verify:developer-console`
- `npm run verify:no-raw-address`
- `npm run verify:preaudit-secrets`
