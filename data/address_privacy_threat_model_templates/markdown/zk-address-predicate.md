# ZK Address Predicate Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Private address, residence, delivery eligibility, AOID ownership, and PID audit proofs
Mode: zk-only
Owner: Cryptography engineer and privacy reviewer
Review cadence: Every proof relation, public signal schema, circuit, or verifier release

## Privacy Goal

Prove address-derived facts without revealing the address, AOID body, exact location, witness, or private credential material.

## Non-Goals

- Claim production cryptographic assurance without audit
- Use ZK to prove real-world truth without issuer/evidence model

## Protected Assets

- witness
- credential secret
- private salt
- AOID secret
- address predicate
- nullifier secret

## Trust Boundaries

- witness builder to prover
- prover to verifier
- public signal schema to registry
- proof bundle to relying party

## Attacker-Controlled Inputs

- challenge
- public statement
- issuer root
- area root
- revocation root
- proof bundle composition

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| zk-address-predicate-tm-01 | critical | Public signals leak a unique location | identifiability, information-disclosure | minimum anonymity threshold; coarse predicate policies; public signal review |
| zk-address-predicate-tm-02 | critical | Cross-proof nullifier links unrelated actions | linkability | domain separation; scope-bound challenge; proof bundle compatibility check |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Witnesses never leave local proving context.
- Public signals contain only predicate id, scope, roots, challenge, and domain-separated nullifier if needed.

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

- Avoid precise area predicates.
- Use short validity windows.
- Avoid permanent public proof anchoring unless required.

## Open Questions

- Which predicates have enough anonymity sets?
- Which proof systems are production-ready after audit?

## Verification Commands

- `npm run verify:zk-baseline`
- `npm run verify:no-raw-address`
