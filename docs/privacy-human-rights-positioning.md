# Privacy and Human-Rights Positioning

AGID/AOID should be understood first as privacy-preserving address infrastructure.
Ethereum, ZK, hosted registries, and payment rails are optional layers. They are
not prerequisites for basic address use.

## Front-Door Statement

AGID/AOID is local-first, Ethereum-optional, and no-raw-address-by-default. It
lets people resolve, prove, and hand off address-derived facts without turning
raw addresses into a public or centralized tracking layer.

## Non-Negotiable Defaults

### Ethereum Optional

The following must work without wallets, gas, public ledgers, or crypto payments:

- AGID generation and decode
- address display and language tabs
- postal-code assistance and basic address validation
- AGID-S local decryption
- QR/NFC intake
- basic POS handoff
- user export, deletion, consent review, and revocation
- high-risk safety mode

Ethereum L2, when used, is a verification or settlement layer. It may store
issuer metadata, commitments, revocation/freshness roots, nullifiers, verifier
status, and payment state. It must not store raw addresses, raw AGID-S payloads,
AOID plaintext, precise coordinates, recipient identity, or delivery history.

### Local-First

The safe baseline is offline-capable local resolution and user-controlled
disclosure. Network services may improve evidence, sync, registry checks, or
settlement, but they must not become a mandatory tracking layer.

Local-first applies especially to:

- disaster and humanitarian field operations
- domestic-violence and shelter workflows
- refugee and displacement workflows
- censorship-risk environments
- stores, warehouses, lockers, and POS terminals with unreliable connectivity

### No Raw Address by Default

Public and operational surfaces should use:

- commitments
- short-term aliases
- domain-separated nullifiers
- issuer and revocation roots
- redacted receipt evidence
- signature tails
- status and reason codes

They should not use raw address text, AOID plaintext, recipient names, phone
numbers, room/unit details, proof codes, exact coordinates, real AGID-S payloads,
or proof witnesses unless the user explicitly grants a scoped disclosure and the
surface is private or encrypted.

## Human-Rights Safety Boundary

High-risk workflows should default to:

- AGID-S instead of public precise AGID
- coarse disclosure instead of exact location
- short expiry windows
- immediate used-state/nullifier marking
- no address-history retention
- redacted audit reports
- explicit consent and plain-language warnings
- local-only or self-hosted operation where feasible

High-risk controls, deletion, export, revocation, local decryption, and security
fixes must not be paid-only features.

## Implementation Contract

The implementation-facing policy lives in
`src/lib/privacyHumanRightsPrinciples.ts`.

Before public release or external audit, run:

```bash
npm run verify:no-raw-address
npm run verify:mandatory-security
npm run verify:external-audit
npm run verify:preaudit-secrets
npm run lint
```

For code paths that need a smaller targeted check, run:

```bash
npx tsx --test src/lib/privacyHumanRightsPrinciples.test.ts
```
