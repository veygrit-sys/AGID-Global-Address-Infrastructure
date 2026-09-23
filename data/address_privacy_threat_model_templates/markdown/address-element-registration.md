# Address Element / Registration Threat Model

Version: address-privacy-threat-model-templates-v0.1
Surface: Embedded address entry, postal assist, AGID assist, correction feedback
Mode: local-only
Owner: Frontend and privacy engineer
Review cadence: Every public widget release and every new host integration

## Privacy Goal

Let users enter or correct an address locally while public host events expose only quality state, country, language, and commitments.

## Non-Goals

- Prove legal residence
- Store a public address book
- Train on private corrections without explicit opt-in

## Protected Assets

- address draft
- correction feedback
- language preference
- postal assist candidates
- addressCommitment

## Trust Boundaries

- browser component to host page
- local state to telemetry
- manual edit to feedback queue
- postal assist adapter to UI

## Attacker-Controlled Inputs

- host page props
- paste/upload text
- postal code field
- AGID field
- feedback text
- language switch

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
| address-element-registration-tm-01 | critical | Host page exfiltrates raw draft through events | information-disclosure, unawareness | emit redacted events only; host contract forbids raw draft callbacks; local-only default state |
| address-element-registration-tm-02 | high | Feedback becomes a private address training feed | non-compliance, unawareness | explicit opt-in; feedback categories before free text; redaction and retention policy |

## Required Invariants

- No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.
- AOID must not become a global public tracking identifier.
- Purpose, audience, and retention must be explicit before any disclosure leaves local state.
- High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.

## Data Minimization Rules

- Keep draft text in component state until explicit submit.
- Host events carry commitment, status, country, language, and issue category only.

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

- Disable external telemetry.
- Do not persist history.
- Prefer coarse AGID or AGID-S handoff.

## Open Questions

- Which host event names are stable public API?
- Which feedback categories can be learned without private text?

## Verification Commands

- `npm run verify:address-element`
- `npm run verify:address-registration`
- `npm run verify:no-raw-address`
