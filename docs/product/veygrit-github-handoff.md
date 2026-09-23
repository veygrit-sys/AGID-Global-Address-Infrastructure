# Veygrit GitHub Handoff

This handoff prepares the separate Veygrit Address Wallet UI repository without
performing any remote GitHub, Sites, or production action.

## Target

- repository candidate: `rei-k/Veygrit-US`
- role: separate Veygrit Address Wallet UI repository
- status: `local-ready-no-remote-mutation`
- Codex task: `019f6ff7-fa0f-7610-b709-8f1b6bb42f0b`
- local Sites workspace:
  `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit`
- local app root:
  `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app`

## Source Ownership

AGID owns:

- Vey ID contracts
- Address Wallet privacy and consent boundaries
- Address Login and Playlist Commerce product separation
- OpenAPI fixtures, SDK plans, and no-secret gates

`rei-k/Veygrit-US` owns only the Veygrit Address Wallet UI source, local Vite
build, Sites-compatible static assets, and screen implementation for Home,
Friends, Store, My Page, and Settings.

## Required Local Gates

Run these before any future GitHub update request:

```bash
npm run verify:veygrit-github-handoff
npm run verify:veygrit-handoff-bundle-manifest
npm run verify:veygrit-boundary-gate-index
npm run verify:veygrit-app-release-readiness
npm run sync:veygrit-github-handoff
npm run check:veygrit-github-handoff
npm run verify:veygrit-sites-bridge
npm run verify:veygrit-sites-ci-boundary
npm run verify:veygrit-sites-presave
npm run verify:preaudit-secrets
```

`npm run sync:veygrit-github-handoff` writes `AGID_HANDOFF.md` into the local
Veygrit app root. `npm run check:veygrit-github-handoff` verifies that generated
file is current without writing. Both commands are local-only and do not push,
open pull requests, save Sites versions, or deploy production.

Run this inside the local Veygrit app root after the export:

```bash
npm run check:agid-handoff
npm run test:agid-handoff
```

Those app-local checks verify `AGID_HANDOFF.md` is present, current enough for
handoff review, linked from `README.md`, paired with
`RELEASE_UPDATE_CHECKLIST.md`, free of secret-like token patterns, and covered
by a negative fixture for the boundary-gate command.

### CWD Matrix

| CWD | Review scope | Commands |
| --- | --- | --- |
| `C:/Users/kitau/.codex/worktrees/4813/AGID` | AGID contracts, bundle manifest, boundary gates, release-readiness runner, Sites pre-save gates, and secret scan | `npm run verify:veygrit-github-handoff`<br>`npm run verify:veygrit-handoff-bundle-manifest`<br>`npm run verify:veygrit-boundary-gate-index`<br>`npm run verify:veygrit-app-release-readiness`<br>`npm run check:veygrit-github-handoff`<br>`npm run verify:veygrit-sites-presave`<br>`npm run verify:preaudit-secrets` |
| `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app` | App-local handoff, boundary negative fixture, README/checklist readiness, store-state behavior, and local UI build | `npm run check:agid-handoff`<br>`npm run test:agid-handoff`<br>`npm run check:release-readiness`<br>`npm run test:release-readiness`<br>`npm run test:store-state`<br>`npm run build` |

Commands in both rows are local-only review gates. They do not grant permission
to push, open pull requests, save Sites versions, deploy production, create
remote repositories, or send production traffic.

Use the local app `RELEASE_UPDATE_CHECKLIST.md` as a review checklist and PR
body seed only after an explicit user request for a GitHub update in the current
turn. It does not approve push, pull request creation, Sites save, production
deploy, remote repository creation, or production traffic.

When copying checklist verification into a PR body, keep the commands grouped
by local root:

Verification from the Veygrit app root:

- `npm run check:agid-handoff`
- `npm run test:agid-handoff`
- `npm run check:release-readiness`
- `npm run test:release-readiness`
- `npm run test:store-state`
- `npm run build`

Verification from AGID:

- `npm run verify:veygrit-github-handoff`
- `npm run verify:veygrit-handoff-bundle-manifest`
- `npm run verify:veygrit-app-release-readiness`
- `npm run verify:vey-id-address-wallet-pass-export-fixture-schema`
- `npm run report:veygrit-handoff-bundle-manifest`
- `npm run check:veygrit-github-handoff`
- `npm run verify:veygrit-sites-presave`
- `npm run verify:preaudit-secrets`

`docs/product/veygrit-handoff-bundle-manifest.md` is the AGID-side review bundle
manifest. It lists the AGID files, local app files, and freshness commands but
does not create an archive or move source files. Run
`npm run report:veygrit-handoff-bundle-manifest` from AGID to print that
manifest as JSON for review.

`docs/product/veygrit-boundary-gate-index.md` maps the no-script-fixture
boundary surfaces to their local verifier commands. Run
`npm run verify:veygrit-boundary-gate-index` before a future GitHub update
review so repository handoff, Sites contracts, Vey ID / Address Login,
Veygrit Ship, and carrier route boundaries are visible from this entrypoint.

`npm run verify:veygrit-app-release-readiness` is the AGID-side package gate for
the local Veygrit app. It uses fixtures to prove missing scripts and remote
mutation commands fail, then checks that `package.json` exposes the app-local
handoff, release readiness, store-state, and build scripts, and that the
handoff/readiness files exist without reading UI source or touching remotes.

### Release Readiness Runner Output

Use this discovery command when CI, Codex, or a human reviewer needs the bundled
gate list without executing child processes:

```bash
npm run verify:veygrit-app-release-readiness:list
```

This npm script wraps `scripts/run-veygrit-app-release-readiness.ts
--list-steps`. The discovery payload returns `mode: "list-steps"`,
`steps[].label`, `steps[].args`, and `remoteMutationAllowedThisTurn: false`. It
intentionally omits execution-only fields such as `executed` and `durationMs`.

Current discovery gate table:

remoteMutationAllowedThisTurn: `false`

| Gate | Args |
| --- | --- |
| Veygrit app release readiness fixture tests | `node_modules/tsx/dist/cli.mjs --test scripts/verify-veygrit-app-release-readiness.test.ts` |
| Veygrit app release readiness live package check | `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-app-release-readiness.ts` |
| Hosted Vey ID production OpenAPI verifier tests | `node_modules/tsx/dist/cli.mjs --test scripts/verify-veygrit-id-production-openapi.test.ts` |
| Hosted Vey ID production OpenAPI CLI check | `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-id-production-openapi.ts` |
| Hosted Address Login contract fixture smoke | `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-address-login-hosted.ts` |
| Vey ID Address Wallet pass export fixture/schema verifier | `node_modules/tsx/dist/cli.mjs scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts` |
| Veygrit handoff bundle coverage report | `node_modules/tsx/dist/cli.mjs scripts/print-veygrit-handoff-bundle-manifest.ts --compact` |
| Veygrit Sites handoff link verifier | `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-sites-link.ts` |

The normal `npm run verify:veygrit-app-release-readiness` run emits a JSON
summary with `status`, `verifier`, `executed`, and `steps[]`. Each step includes
`label`, `args`, `status`, `exitCode`, `signal`, and `durationMs`. If a gate
blocks, the payload also includes `failedStep` and `finding`, using
`failed-to-start-tsx` for process-start failures or `step-exited-nonzero` for
nonzero child exits. The handoff bundle step prints compact JSON with manifest
coverage counts before the Sites handoff link gate. CI should key on those fields
rather than scrape child stdout. A pass only means the listed local gates passed;
it does not approve a GitHub push, pull request, Sites save, production deploy,
or production traffic.

## Remote Action Boundary

This handoff does not grant GitHub push permission and does not approve any of
these actions:

- create or delete remote GitHub repositories
- push commits
- open pull requests
- save a Sites version
- deploy production
- send production traffic
- persist provider tokens, carrier credentials, or source repository credentials
- copy private address, recipient, witness, private-key, or proof-secret material

Those actions require an explicit user request for that exact action in the
current turn plus a fresh scoped status review.

## Handoff Artifacts

- `docs/product/veygrit-sites-codex-link.md`
- `docs/product/veygrit-handoff-bundle-manifest.md`
- `docs/product/veygrit-boundary-gate-index.md`
- `src/lib/veygritSitesBridge.ts`
- `src/lib/veygritRepositoryHandoff.ts`
- `src/lib/veygritBoundaryGateIndex.ts`
- `src/lib/veygritBoundaryGateIndex.test.ts`
- `scripts/verify-veygrit-app-release-readiness.ts`
- `scripts/verify-veygrit-app-release-readiness.test.ts`
- `scripts/run-veygrit-app-release-readiness.ts`
- `src/lib/veygritReleaseReadinessDiscoveryContract.ts`
- `scripts/sync-veygrit-github-handoff.ts`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/AGID_HANDOFF.md`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/README.md`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/RELEASE_UPDATE_CHECKLIST.md`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/check-agid-handoff.mjs`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/check-agid-handoff.test.mjs`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/release-readiness.mjs`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/release-readiness.test.mjs`
- `docs/specs/fixtures/veygrit-sites-ci-boundary/allowed-multi-source-presave.yml`
- `docs/specs/fixtures/veygrit-sites-ci-boundary/blocked-unmarked-presave.yml`
- `scripts/run-veygrit-sites-ci-boundary.ts`
- `scripts/verify-veygrit-sites-ci-boundary.ts`

## Non-Claims

- This handoff does not prove the remote repository exists.
- This handoff does not grant GitHub push permission.
- This handoff does not approve Sites save or production deploy.
- Vey ID remains Google/Apple-only for account creation in the current plan.
