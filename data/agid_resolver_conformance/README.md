# AGID Resolver Conformance Tests

Version: agid-resolver-conformance-tests-v0.1
Generated at: 2026-06-20T00:00:00.000Z

This pack defines public conformance cases for AGID resolver implementations:

- local AGID encode/decode behavior
- encrypted AGID-S key-gating behavior
- standard-library local-first resolver planning
- federated resolver commitment consensus
- privacy-boundary rejection for unsafe public/server modes

All cases are synthetic fixtures. The negative case uses a synthetic sentinel only and
exists to prove that private-field input is rejected before resolver sources are called.

## Files

- `manifest.json`: suite identity, counts, redistribution policy, and file map.
- `agid-resolver-conformance-suite.json`: complete generated suite.
- `test-cases.json`: conformance cases only.
- `checklists.json`: manual implementation audit checklists.
- `README.md`: this document.

## Conformance Rule

A conforming resolver must pass every case in `test-cases.json` and must preserve the
privacy flags declared in each expected result. Implementations may add stronger local
verification, but they must not turn free-form input into strong verification without
evidence, and they must not send private fields to public or federated sources.

## Privacy Boundary

The distributable fixtures must not contain real user addresses, recipient names,
phone numbers, emails, proof codes, AOID secrets, AGID-S plaintext, passkey challenges,
or third-party address datasets.

## Regenerate

```bash
npm run export:agid-resolver-conformance
```

## Verify

```bash
npm run verify:agid-resolver-conformance
```
