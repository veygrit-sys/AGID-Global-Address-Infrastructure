# AGID Worktree Cleanliness Report

Generated at: 2026-06-28T23:32:46.670Z

## Summary

- Total changed entries: 1141
- Modified: 244
- Deleted: 22
- Untracked: 875

## Counts By Category

| Category | Count |
| --- | ---: |
| source | 698 |
| documentation | 196 |
| sdk | 124 |
| tooling | 60 |
| data | 31 |
| root-allowed | 18 |
| specialized-runtime | 4 |
| public-assets | 4 |
| uncategorized | 3 |
| backend | 2 |
| root-needs-triage | 1 |

## Cleanup Findings

### Root-level files should be allowlisted or moved

- ID: `root-needs-triage`
- Severity: `medium`
- Count: 1
- Recommendation: Move ad-hoc root files into docs/ops, docs/research, reports, scripts, public, or data. Keep root for package/build/license entrypoints only.
- Examples:
  - `pos-measuring-instrument-check.png`

### Direct docs/*.md files need category buckets

- ID: `direct-doc-bucketing`
- Severity: `high`
- Count: 190
- Recommendation: Bucket docs into docs/specs, docs/research, docs/product, docs/ops, or docs/archive. Move in small PRs grouped by topic.
- Examples:
  - `docs/agid-math-model-resume.md -> docs/research/`
  - `docs/hybrid-architecture.md -> docs/archive/`
  - `docs/project-resume.md -> docs/archive/`
  - `docs/verified-address-translation-theory.md -> docs/research/`
  - `docs/README.md -> docs/archive/`
  - `docs/accessibility-hardening-ja.md -> docs/archive/`
  - `docs/address-access-auth.md -> docs/archive/`
  - `docs/address-communication-engineering-theory-ja.md -> docs/research/`

### New files directly under src/lib break the current organization policy

- ID: `new-src-lib-root`
- Severity: `high`
- Count: 437
- Recommendation: Place new code under src/address, src/agid, src/grid, src/postal, src/zk, src/web3, src/pos, or src/integrations before adding more src/lib root files.
- Examples:
  - `src/lib/accessibilityHardening.test.ts`
  - `src/lib/accessibilityHardening.ts`
  - `src/lib/address/`
  - `src/lib/addressAccessAuth.test.ts`
  - `src/lib/addressAccessAuth.ts`
  - `src/lib/addressConnect.test.ts`
  - `src/lib/addressConnect.ts`
  - `src/lib/addressConnectOperations.test.ts`

### Generated/runtime files should stay ignored or be removed after use

- ID: `generated-runtime-files`
- Severity: `info`
- Count: 0
- Recommendation: Keep logs, dist, outputs, tmp, test-results, and runtime artifacts out of commits. If a generated report is useful, export a compact report under reports/.

### Heavy zip datasets should be externalized

- ID: `heavy-data-externalization`
- Severity: `medium`
- Count: 21
- Recommendation: Do not keep postal ZIPs or third-party extracts in the app bundle. Prefer country packs, external storage, or generated manifests.
- Examples:
  - `data/postal_codes/AR.zip`
  - `data/postal_codes/BR.zip`
  - `data/postal_codes/CH.zip`
  - `data/postal_codes/CL.zip`
  - `data/postal_codes/CN.zip`
  - `data/postal_codes/CO.zip`
  - `data/postal_codes/DZ.zip`
  - `data/postal_codes/ES.zip`

### Postal ZIP deletions should be recorded as an intentional data slimming decision

- ID: `deleted-postal-zips`
- Severity: `low`
- Count: 21
- Recommendation: If these deletions are intended, document the replacement source or country-pack path before merging.
- Examples:
  - `data/postal_codes/AR.zip`
  - `data/postal_codes/BR.zip`
  - `data/postal_codes/CH.zip`
  - `data/postal_codes/CL.zip`
  - `data/postal_codes/CN.zip`
  - `data/postal_codes/CO.zip`
  - `data/postal_codes/DZ.zip`
  - `data/postal_codes/ES.zip`

## Policy

- Do not delete or revert unrelated user changes during cleanup.
- Do not add new files directly under `src/lib`; use domain directories.
- Keep generated outputs, postal ZIPs, and runtime logs out of the app bundle.
- Move documents in small topic PRs so review stays possible.
