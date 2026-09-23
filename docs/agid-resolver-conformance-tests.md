# AGID Resolver Conformance Tests

AGID Resolver Conformance Tests define the minimum behavior expected from an AGID-compatible resolver implementation. The goal is not to benchmark speed. The goal is to verify that independent SDKs, apps, POS terminals, and registry adapters make the same safety decisions.

## Scope

The conformance pack covers four surfaces:

- Local Resolver: local AGID encode/decode, AGID-S key gating, and free-form text handling.
- Standard Library Resolver: local-first parser and normalizer planning.
- Federated Resolver: commitment-based consensus across resolver sources.
- Privacy Boundary: no private-field egress and correct rejection of unsafe server/public modes.

## Required Behaviors

1. Public synthetic coordinates can be encoded into an AGID without network access.
2. A public AGID can be decoded locally.
3. AGID-S must not open unless a matching local key is available.
4. Free-form locality text must not become strong verification without evidence.
5. Standard-library resolution must run local parsing and Unicode normalization first.
6. Federated resolution must accept only quorum-backed public commitments.
7. Private-field input in public or server modes must block before external sources are called.

## Privacy Rule

The conformance fixtures are synthetic. Implementations must not replace them with real user records. Resolver logs, generated reports, and exported traces should contain commitments, roots, aliases, and decision reasons rather than private fields.

## Files

Run the exporter to generate the distributable pack:

```bash
npm run export:agid-resolver-conformance
```

Generated files:

- `data/agid_resolver_conformance/manifest.json`
- `data/agid_resolver_conformance/agid-resolver-conformance-suite.json`
- `data/agid_resolver_conformance/test-cases.json`
- `data/agid_resolver_conformance/checklists.json`
- `data/agid_resolver_conformance/README.md`

## Verification

```bash
npm run verify:agid-resolver-conformance
```

Passing this script means the reference implementation satisfies the current conformance pack. External implementations should run the generated cases and compare observed status, decision, actions, privacy flags, and required resolver versions.

## Compatibility Notes

- Additional local checks are allowed when they do not weaken privacy.
- Implementations may add stronger verification sources, but default OSS behavior should remain free and local-first.
- Federated resolver adapters must never receive private fields when a commitment-only payload is expected.
- Negative sentinel cases are expected to fail resolution safely. Passing them means rejecting the unsafe input, not accepting it.
