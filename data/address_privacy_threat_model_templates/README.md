# Address Privacy Threat Model Templates

Version: address-privacy-threat-model-templates-v0.1
Generated at: 2026-06-20T00:00:00.000Z

Address Privacy Threat Model Templates are reusable review templates for AGID,
AOID, AGID-S, Address Element, Portal, POS, Field Handoff, Evidence Vault,
registry/webhook, ZK predicate, locker/PUDO, and developer-console surfaces.

The templates keep one privacy boundary explicit:

> Public and shared surfaces must be local-first where possible, Ethereum-optional,
> no-raw-address-by-default, and safe for high-risk contexts.

## Files

- `manifest.json`: template pack identity, version, file map, and counts.
- `templates.json`: structured threat model templates.
- `checklists.json`: role-based review checklists.
- `markdown/*.md`: human-readable template files for design and security review.
- `README.md`: this document.

## How to Use

1. Pick the closest surface template before adding or changing a feature.
2. Fill in owner, assets, trust boundaries, attacker-controlled inputs, and misuse cases.
3. Keep outputs to commitments, aliases, roots, nullifiers, redacted references, and public proof signals.
4. Run the verification commands listed by the template.
5. Escalate high-risk mode, evidence, humanitarian, and offline-sync changes for privacy review.

## Regenerate

```bash
npm run export:privacy-threat-templates
```

## Verify

```bash
npm run verify:privacy-threat-templates
```

## What This Pack Does Not Prove

This pack does not prove that an implementation is secure, that a real address is
true, or that a ZK circuit is production-audited. It makes the expected privacy
review shape explicit and mechanically checks that the public template pack does
not include raw address material.
