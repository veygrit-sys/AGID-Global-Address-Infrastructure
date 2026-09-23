# Veygrit Handoff Bundle Manifest

This manifest defines the local review bundle for the separate Veygrit Address
Wallet UI repository candidate, `rei-k/Veygrit-US`.

Status: `manifest-only-no-archive-no-remote-mutation`

It is a file list plus freshness-command set. It does not create an archive,
copy source files, push to GitHub, open pull requests, save Sites versions,
deploy production, create remote repositories, or send production traffic.

## Required Bundle Files

AGID-side files:

- `docs/product/veygrit-github-handoff.md`
- `docs/product/veygrit-sites-codex-link.md`
- `src/lib/veygritRepositoryHandoff.ts`
- `src/lib/veygritHandoffBundleManifest.ts`
- `docs/product/veygrit-boundary-gate-index.md`
- `src/lib/veygritBoundaryGateIndex.ts`
- `src/lib/veygritBoundaryGateIndex.test.ts`
- `scripts/verify-veygrit-app-release-readiness.ts`
- `scripts/verify-veygrit-app-release-readiness.test.ts`
- `scripts/run-veygrit-app-release-readiness.ts`
- `src/lib/veygritReleaseReadinessDiscoveryContract.ts`
- `scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts`
- `scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.test.ts`
- `docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json`
- `docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json`
- `scripts/sync-veygrit-github-handoff.ts`
- `sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts`

Veygrit app files:

- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/package.json`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/AGID_HANDOFF.md`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/README.md`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/RELEASE_UPDATE_CHECKLIST.md`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/check-agid-handoff.mjs`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/check-agid-handoff.test.mjs`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/release-readiness.mjs`
- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/release-readiness.test.mjs`

## Freshness Commands

Run from AGID:

```bash
npm run verify:veygrit-handoff-bundle-manifest
npm run verify:veygrit-boundary-gate-index
npm run verify:veygrit-app-release-readiness
npm run verify:vey-id-address-wallet-pass-export-fixture-schema
npm run report:veygrit-handoff-bundle-manifest
npm run verify:veygrit-github-handoff
npm run sync:veygrit-github-handoff
npm run check:veygrit-github-handoff
npm run verify:veygrit-sites-bridge
npm run verify:veygrit-sites-presave
npm run verify:veygrit-address-login-packages
npm run verify:preaudit-secrets
```

Run from the local Veygrit app root:

```bash
npm run check:agid-handoff
npm run test:agid-handoff
npm run check:release-readiness
npm run test:release-readiness
npm run test:store-state
npm run build
```

`npm run report:veygrit-handoff-bundle-manifest` prints the same manifest as
pretty JSON for review, plus a coverage summary with AGID-side file count,
Veygrit app file count, freshness command counts, local-only command status,
write-capable local command count, and pass-export verifier coverage. Add
`--compact` only when a compact single-line JSON payload is needed. The report
command does not create an archive, copy source files, stage files, push, open
pull requests, save Sites versions, or deploy production.

`npm run verify:veygrit-boundary-gate-index` checks the reviewer-facing map of
Veygrit no-script-fixture boundary gates. It proves every indexed test file and
protected module exists, that each protected module is listed in its owning
boundary test, and that every local verifier is wired in `package.json`.

`npm run test:agid-handoff` verifies that app-local handoff positive and
boundary-gate negative fixtures pass without editing live files.

`npm run check:release-readiness` prints an app-local JSON pass/fail summary for
`README.md`, `RELEASE_UPDATE_CHECKLIST.md`, and the local package script wiring.
`npm run test:release-readiness` verifies positive and negative readiness
fixtures without editing live files.

`npm run verify:veygrit-app-release-readiness` runs from AGID and first proves
the app package verifier blocks missing scripts and remote mutation commands
with fixtures. It then reads only the local Veygrit app `package.json` plus
handoff/readiness file presence. It does not read app UI source, package files,
touch remotes, save Sites versions, or deploy production.

`npm run verify:vey-id-address-wallet-pass-export-fixture-schema` validates the
synthetic Vey ID Address Wallet pass-export fixture and schema before handoff
review. It pins short-lived Apple Wallet, Google Wallet, and QR refs, local-only
privacy flags, empty private-material findings, and non-claims; it is not live
wallet issuance, QR rendering, pass signing, or production revocation evidence.

`sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts` is
included as AGID-side test-only hosted callback vector loader evidence because the hosted
`callbackValidationVectors` fixture drives both React and Next.js Address Login
SDK parser conformance. `npm run verify:veygrit-address-login-packages` keeps it
aligned with the package-specific preflight. It is not a published runtime
surface and does not claim hosted-service readiness.

## Optional Discovery Commands

Run from AGID when CI, Codex, or a reviewer needs the release-readiness gate
inventory without executing child verifier processes:

```bash
npm run verify:veygrit-app-release-readiness:list
```

This prints list-only JSON for the bundled gate labels and args. It does not
write local files, create an archive, touch remotes, save Sites versions, deploy
production, or replace the normal freshness commands before a future GitHub
update request.

Current discovery output contract:

- mode: `"list-steps"`
- remoteMutationAllowedThisTurn: `false`
- `Veygrit app release readiness fixture tests`: `node_modules/tsx/dist/cli.mjs --test scripts/verify-veygrit-app-release-readiness.test.ts`
- `Veygrit app release readiness live package check`: `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-app-release-readiness.ts`
- `Hosted Vey ID production OpenAPI verifier tests`: `node_modules/tsx/dist/cli.mjs --test scripts/verify-veygrit-id-production-openapi.test.ts`
- `Hosted Vey ID production OpenAPI CLI check`: `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-id-production-openapi.ts`
- `Hosted Address Login contract fixture smoke`: `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-address-login-hosted.ts`
- `Vey ID Address Wallet pass export fixture/schema verifier`: `node_modules/tsx/dist/cli.mjs scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts`
- `Veygrit handoff bundle coverage report`: `node_modules/tsx/dist/cli.mjs scripts/print-veygrit-handoff-bundle-manifest.ts --compact`
- `Veygrit Sites handoff link verifier`: `node_modules/tsx/dist/cli.mjs scripts/verify-veygrit-sites-link.ts`

## Boundary

This manifest is safe to review before a future GitHub update request because
it names only local files, commands, and non-claims. It must not include raw
address material, recipient material, witness values, private keys, proof
secrets, provider tokens, carrier credentials, or source repository
credentials.

The boundary-gate index is part of this bundle so reviewers can see the
no-script-fixture coverage before running release-readiness or GitHub handoff
checks.

Any actual GitHub push, pull request creation, Sites save, production deploy,
remote repository creation, or production traffic still requires an explicit
current-turn user request for that exact action.
