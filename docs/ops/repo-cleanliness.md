# AGID Repository Cleanliness Policy

AGID has grown into a mixed application, protocol, SDK, dataset, and research
workspace. Cleanup must make the repository easier to review without losing
work or hiding risk.

## Goals

- Keep the app bundle light.
- Keep generated outputs, logs, caches, and heavy data out of commits.
- Keep new implementation files in domain directories instead of adding more
  root-level `src/lib` files.
- Keep documentation grouped by purpose: `specs`, `research`, `product`, `ops`,
  and `archive`.
- Keep privacy and security gates visible during cleanup.

## Cleanup Order

1. Run `npm run report:repo-cleanliness`.
2. Review `reports/agid-worktree-cleanliness.md`.
3. Move only one topic group at a time.
4. Run the smallest matching verification script.
5. Avoid deleting or reverting user work unless explicitly requested.

## Document Buckets

- `docs/specs/`: protocol, API, schema, conformance, resolver specifications.
- `docs/research/`: papers, math, theory, ZK, postal models, verification notes.
- `docs/product/`: UX, app surfaces, field workflows, screen-level design.
- `docs/ops/`: release, security, privacy, deployment, audit, governance.
- `docs/archive/`: old drafts, resumes, superseded notes, temporary audits.

## Source Layout Rule

New code should not be added directly under `src/lib` unless it is modifying an
existing module. New feature areas should go under:

```text
src/address/
src/agid/
src/grid/
src/postal/
src/zk/
src/web3/
src/pos/
src/integrations/
src/server/
src/developer/
```

## Heavy Data Rule

Postal ZIPs, building polygons, OSM or Overture extracts, search indexes, tiles,
and generated caches should not live in the main app bundle. Use country packs,
external storage, or compact manifests.

## Privacy Rule

Cleanup must not introduce raw personal addresses, recipients, private keys,
proof witnesses, or connector secrets into tracked files.
