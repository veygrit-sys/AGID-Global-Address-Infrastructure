# No Raw Address Compliance Kit

Version: no-raw-address-compliance-kit-v0.1
Generated at: 2026-06-20T00:00:00.000Z

This kit is the AGID/AOID no-raw-address compliance package for OSS releases,
SDK examples, POS flows, registry/webhook payloads, audit logs, and external
implementation tests.

It is designed to make the privacy rule mechanically testable:

> public surfaces must use commitments, short aliases, roots, nullifiers, and
> redacted evidence references instead of raw address, AOID, AGID-S, recipient,
> phone, proof, witness, QR/NFC payload, or private key material.

## Files

- `manifest.json`: kit identity, versions, file map, and counts.
- `no-raw-address-compliance-kit.json`: complete generated kit.
- `surface-policies.json`: rules for Address Element, POS, Field Handoff,
  Portal, Dashboard, Developer Console, Evidence Vault, registry/webhooks,
  Drone/Locker Ops, and optional ZK/Ethereum modes.
- `fixtures.json`: positive and negative fixtures for conformance tests.
- `checklists.json`: developer, reviewer, operator, and auditor checklists.
- `README.md`: this document.

## Required Gates

- no raw address scanner
- terminal signature
- short-term alias
- audit log redaction

## Regenerate

```bash
npm run export:no-raw-address-kit
```

## Verify

```bash
npm run verify:no-raw-address-kit
```

## What This Kit Does Not Prove

This kit does not prove that a real-world address is true, deliverable, or legally
owned. It only enforces the release boundary: public examples, logs, fixtures,
and operational records must not expose raw address or secret-bearing material.
