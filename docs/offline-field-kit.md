# Offline Field Kit

Offline Field Kit is the local-first AGID/AOID package for field operations where
network access, server trust, gas fees, or public-chain latency cannot be assumed.

It combines existing AGID modules into one portable workflow:

- Field Handoff receipts for signed scan, decision, handoff, cannot-reach, and sync events.
- POS offline used-state ledger for local nullifier capture and later reconciliation.
- CRDT sync envelopes for conflict-safe offline updates.
- Delivery reachability reports for safe access-blocked or cannot-reach signals.
- No Raw Address release rules for fixtures, logs, reports, and docs.

## Main Surfaces

- Field Handoff: Scan -> Decision -> Handoff -> Report.
- POS Terminal: QR/NFC scan, local decision, receipt, offline queue.
- NGO Aid Station: local eligibility and used-state capture.
- Warehouse / Locker: QR, NFC, PIN, passkey, and device event receipts.
- Drone Reachability: feasibility and cannot-reach API, not a full drone OS.
- Hotel Check-in: QR address transfer with consent and no persistent scan payload.
- Registry Sync: deferred CRDT and nullifier reconciliation.

## Modes

- Local Only: no ZK, no Ethereum, no server. Fastest and usable offline.
- Deferred Sync: local signed receipts first, registry reconciliation later.
- Server Registry When Online: issuer, revocation, freshness, and used-state checks.
- ZK-ready Local Verification: private address predicates can be verified without a chain.

## Privacy Boundary

The kit stores operational records, not public address records. Public or shared
artifacts should use:

- short aliases
- commitments
- nullifier hashes
- receipt fingerprints
- coarse cells
- safe reason categories
- redacted evidence references

They must not store raw address text, AOID body, recipient identity, proof secret,
proof witness, QR/NFC payload, private keys, or precise high-risk location data.

## Generated Pack

Run:

```bash
npm run export:offline-field-kit
```

The generated files are written to `data/offline_field_kit/`:

- `manifest.json`
- `offline-field-kit.json`
- `runbooks.json`
- `fixtures.json`
- `checklists.json`
- `README.md`

Verify:

```bash
npm run verify:offline-field-kit
```

This kit does not prove that an address is legally true or deliverable. It gives
the application a disciplined offline envelope for private scan-to-decision,
signed receipts, conflict-safe sync, and redacted reports.
