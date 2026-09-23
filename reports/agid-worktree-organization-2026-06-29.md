# AGID Worktree Organization - 2026-06-29

## Snapshot

- Branch: `codex/agid-platform-resume-update`
- Tracked modified files: 244
- Tracked deleted files: 22
- Untracked files: 871
- Largest changed areas by status:
  - `src`: 698 paths in status output, including 452 untracked `src/lib/*.ts` or test files.
  - `docs`: 193 paths in status output, plus 253 untracked docs paths.
  - `sdk`: 124 paths in status output, plus 64 untracked SDK paths.
  - `data`: 31 paths in status output, plus 588 untracked data paths.
  - `scripts`: 59 paths in status output, plus 57 untracked script paths.

## Keep As Intentional Work

These groups appear to match current AGID direction and should be preserved, but not committed as one lump:

1. OSS launch and governance
   - `.github/`, `GOVERNANCE.md`, `SECURITY.md`, `SUPPORT.md`, `ROADMAP.md`, `DATA_LICENSES.md`, `LICENSE_POLICY.md`
   - Good first commit candidate because it is mostly policy and repository hygiene.

2. Developer console, SDK, conformance, and downloads
   - `src/developer/`, `src/components/DeveloperConsoleScreen*`, `sdk/`, `scripts/generate-agid-sdks*`, `scripts/build-open-source-downloads*`, `public/downloads/`
   - Should be committed after `npm run verify:developer-console`, `npm run build:downloads`, and SDK generation checks.

3. Address registration, portal, field/POS/hotel/locker/drone app surfaces
   - `src/components/*Portal*`, `*Pos*`, `*Field*`, `*Hotel*`, `*Locker*`, `*Drone*`, `src/lib/*pos*`, `src/lib/*field*`, `src/lib/*hotel*`
   - Needs UI and app-shell verification before grouping.

4. Postal Forge, country packs, and repository-placement data
   - `src/postal/`, `src/components/PostalZoneDesignerScreen*`, `data/postal_country_packs/`, `data/global_entities/`, `scripts/generate-*-repo*`
   - Should be its own commit series because data volume is high.

5. Security, privacy, ZK, and Web3
   - `circuits/`, `contracts/`, `src/lib/*Proof*`, `src/lib/*zk*`, `src/lib/*Ethereum*`, `src/lib/*Nullifier*`, `docs/zk-*`, `docs/*zero-knowledge*`
   - Must pass no-raw/witness/private-key checks before any public push.

6. Address Morphism / research documents
   - `docs/address-morphism-*`, `formal/`, theorem and verification docs.
   - Better to keep cross-repo theory files synchronized with `dawnportinfo-design/address-morphism-theory` rather than treating AGID as the only source.

## Review Before Commit

1. New files directly under `src/lib`
   - Current count: 452 untracked `src/lib/*.ts` or matching test files.
   - This conflicts with the project direction: do not add new modules directly under `src/lib`.
   - Recommended move pattern:
     - address identity, validation, portal, feedback, registry: `src/address/`
     - AGID/AOID resolver and protocol: `src/agid/`
     - grid and map-grid logic: `src/grid/`
     - postal forge and country packs: `src/postal/`
     - ZK proofs and proof bundles: `src/zk/`
     - Ethereum/Web3 adapters: `src/web3/`
     - POS/field/hotel/locker/drone flows: `src/pos/` or `src/integrations/`

2. Tracked postal zip deletions
   - Deleted tracked files: 21 `data/postal_codes/*.zip`.
   - `.gitignore` now ignores `data/postal_codes/*.zip`, so this is probably intentional bundle-lightening.
   - Treat as a dedicated "remove heavy tracked postal zips" commit, not mixed with UI or theory work.

3. SDK generated diffs
   - SDK changes span many languages plus `package-lock.json`.
   - Verify they are generated from one source of truth before commit:
     - `npm run generate:agid-sdks`
     - `npm run verify:developer-console`

4. `server.ts`
   - Large tracked diff.
   - Should be split by route family before release if possible, matching the earlier project rule.

## Proposed Commit Slices

1. Repository governance and OSS launch surface.
2. Heavy data removal and country-pack lazy-loading policy.
3. Developer console and SDK/conformance/downloads.
4. App shell and route/lazy-loading cleanup.
5. Address registration and feedback UI.
6. POS / field / hotel / OPERA / locker / drone operations.
7. Postal Forge and repository-placement datasets.
8. ZK/Web3 proof envelopes and release gates.
9. Address Morphism research/docs sync.
10. Backend/server route-family split.

## Verification Gates For Next Pass

Run these before staging any broad batch:

```bash
npm run verify:preaudit-secrets
npm run verify:no-raw-address
npm run verify:app-shell
npm run verify:developer-console
npm run verify:postal-country-pack
npm run verify:agid-resolver-conformance
npm run lint
```

For ZK/Web3 batches, also run:

```bash
npm run verify:zk-baseline
npm run verify:web3-zk-stack
npm run verify:zk:circuit
```

## Current Recommendation

Do not create one PR from the current worktree. The fastest safe route is:

1. Keep the current branch as an integration branch.
2. Create focused branches from it or from base for each commit slice.
3. Move new direct `src/lib` modules into domain folders before public PRs.
4. Stage the heavy zip deletion separately from feature work.
5. Push governance/docs first, then SDK/developer, then app surfaces, then data-heavy Postal Forge.
