# Hosted Registry API / Webhooks Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Issuer, revocation, freshness, nullifier, used-state, webhooks
Mode: local-plus-server
Owner: Registry backend and platform security engineer
Review cadence: Every registry schema, webhook event, endpoint discovery, or adapter release

## Privacy Goal

Provide public verification state without turning the registry into a plaintext address or AOID database.

## Non-Goals

- Store address bodies
- Store AOID plaintext
- Publish full AGID-S payloads

## Protected Assets

- issuer metadata
- credential commitment
- revocation root
- freshness root
- nullifier hash
- webhook signature

## Trust Boundaries

- client to registry API
- registry to webhook receiver
- admin dashboard to registry
- registry to cache

## Attacker-Controlled Inputs

- webhook URL
- issuer metadata
- credential status update
- nullifier submission
- API key label

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| hosted-registry-webhooks-tm-01 | critical | Webhook payload carries private address data | information-disclosure, non-compliance | webhook allowlist schema; payload scanner; signature over redacted body |
| hosted-registry-webhooks-tm-02 | high | Nullifier reused across contexts links users | linkability, detectability | domain-separated nullifiers; purpose-specific registry buckets; privacy review before new domain |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Registry stores roots, commitments, nullifiers, statuses, and policy hashes only.
- Webhook logs mask bodies by default.

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

- Delayed or batched public anchoring.
- No raw event payload retention.
- Strict domain separation.

## Open Questions

- Which event types need public transparency?
- What retention period is needed for used-state records?

## Verification Commands

- `npm run verify:dashboard`
- `npm run verify:no-raw-address`
- `npm run verify:mandatory-security`
