# Address Test Vector Suite

Version: address-test-vector-suite-v0.1
Generated at: 2026-06-20T00:00:00.000Z

This suite provides public conformance fixtures for AGID address-facing surfaces:

- normalization
- open-source address validation
- domestic and international rendering
- language tab selection
- no-raw-private-material privacy boundaries

All vectors are either synthetic-public or redacted-public. They are intended for SDKs,
Address Element, Local Resolver, POS, Developer Console, and external implementers.

## Files

- `manifest.json`: suite identity, counts, redistribution policy, and file map.
- `address-test-vector-suite.json`: complete generated suite.
- `vectors.json`: vector array only.
- `README.md`: this document.

## Privacy Boundary

The suite must not contain real user addresses, recipient names, phone numbers, emails,
proof codes, private AOID material, AGID-S plaintext, passkey challenges, or passport
numbers. Synthetic address strings are allowed only as deterministic fixtures.

## Regenerate

```bash
npm run export:address-test-vectors
```

## Verify

```bash
npm run verify:address-test-vectors
```
