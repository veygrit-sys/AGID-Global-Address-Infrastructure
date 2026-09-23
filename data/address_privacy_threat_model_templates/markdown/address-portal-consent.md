# Address Portal Consent Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: User consent, scope, revoke, delete, export, and Address Item management
Mode: local-plus-server
Owner: Product privacy and identity engineer
Review cadence: Every new scope, issuer, export type, or deletion workflow

## Privacy Goal

Let a user see, revoke, delete, and export who may use address-derived facts without exposing the address itself.

## Non-Goals

- Make revocation paid-only
- Let a third party silently expand scopes
- Use AOID as a public profile id

## Protected Assets

- address item
- scope grant
- issuer link
- revocation state
- export package

## Trust Boundaries

- portal local storage to registry
- user consent screen to relying party
- export package to user device

## Attacker-Controlled Inputs

- relying party scope request
- redirect URL
- issuer metadata
- export filter
- revocation callback

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| address-portal-consent-tm-01 | high | Scope confusion grants more than the user understood | unawareness, privilege-abuse | scope labels are human-readable; purpose binding; deny by default for unknown scopes |
| address-portal-consent-tm-02 | critical | Export leaks private address material | information-disclosure, non-compliance | redacted export manifest; field allowlist; no-raw-address scan |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Portal lists relying parties and scopes, not raw address text.
- Export defaults to commitments and references unless user explicitly requests local private backup.

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

- One-click revoke.
- No history retention after high-risk handoff.
- Short alias display only.

## Open Questions

- Which scopes are mandatory for each integration?
- What export format is safe for nontechnical users?

## Verification Commands

- `npm run verify:portal`
- `npm run verify:no-raw-address`
