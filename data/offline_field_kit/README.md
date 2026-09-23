# Offline Field Kit

Version: agid-offline-field-kit-v0.1
Generated at: 2026-06-20T00:00:00.000Z

Offline Field Kit is the local-first operating package for AGID/AOID field work:
delivery handoff, aid station verification, hotel check-in transfer, locker access,
drone reachability reporting, POS used-state capture, and deferred registry sync.

The kit is built around one rule:

> Field devices can decide, sign, queue, and later reconcile without publishing raw
> address, AOID body, recipient identity, proof secret, QR/NFC payload, or precise
> high-risk location material.

## Files

- `manifest.json`: kit identity, versions, file map, and counts.
- `offline-field-kit.json`: complete generated kit.
- `runbooks.json`: field, aid, locker, drone, hotel, and registry reconciliation flows.
- `fixtures.json`: synthetic signed receipts, CRDT envelope, nullifier sync item, and reachability report.
- `checklists.json`: operator, supervisor, registry, security, and humanitarian checklists.
- `README.md`: this document.

## Main Modes

- Local Only: no server, no ZK, no Ethereum; fastest and usable offline.
- Deferred Sync: local receipts first, registry reconciliation later.
- Server Registry When Online: cheap revocation, freshness, issuer, and used-state checks.
- ZK-ready Local Verification: private predicates can be verified without public-chain use.

## Main Workflow

1. Prepare the device and operator session.
2. Scan QR, NFC, short alias, or local proof.
3. Show a decision state rather than raw address details.
4. Complete the handoff or record a safe cannot-reach category.
5. Sign a local receipt.
6. Queue CRDT and nullifier sync items.
7. Reconcile when online.
8. Export a redacted audit report.

## Regenerate

```bash
npm run export:offline-field-kit
```

## Verify

```bash
npm run verify:offline-field-kit
```

## What This Kit Does Not Prove

This kit does not prove that a real-world address is true, legally owned, or
currently deliverable. It provides the operational envelope for privacy-preserving
offline decisions, signed receipts, conflict-safe sync, and redacted reports.
