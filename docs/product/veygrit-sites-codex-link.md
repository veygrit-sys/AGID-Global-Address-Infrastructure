# Veygrit Sites Codex Link

This document links the current AGID workspace to the existing Veygrit Address Wallet Sites project and Codex task.

## Connected Targets

Codex task:

- `019f6ff7-fa0f-7610-b709-8f1b6bb42f0b`
- `codex://threads/019f6ff7-fa0f-7610-b709-8f1b6bb42f0b`

Local Sites workspace:

- `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit`
- app root: `C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app`

Sites project:

- project id: `appgprj_6a5a1e0e8f188191917daebf20db70f0`
- title: `Veygrit Address Wallet`
- slug: `veygrit-address-wallet`
- live URL: `https://veygrit-address-wallet.cool-globe-6298.chatgpt.site`
- access mode observed locally: `custom`

GitHub connector:

- authenticated login: `rei-k`
- installed account: `rei-k`
- site repository candidate: `rei-k/Veygrit-US`
- handoff document: `Veygrit GitHub Handoff`
  (`docs/product/veygrit-github-handoff.md`)

## Ownership

AGID is the source of truth for Veygrit contracts, privacy boundaries, no-raw-address checks, OpenAPI fixtures, SDK plans, and the difference between Playlist Commerce and EC Social Login.

The Sites app is the visual implementation target for Veygrit Address Wallet: Home, Friends, Store, My Page, Settings, and future Demo EC checkout screens.

## Safe Sync Direction

1. Generate ref-only constants from AGID into the Sites app.
2. Keep `src/lib/veyIdAddressWalletFoundation.ts` aligned with the app navigation.
3. Render `src/lib/veyIdDemoEcFlow.ts` as a Demo EC checkout panel.
4. Use `docs/product/vey-id-demo-ec-flow.md` as the product wording for Playlist Commerce vs EC Social Login.
5. Use `docs/product/veygrit-github-handoff.md` before any future GitHub update
   request for `rei-k/Veygrit-US`.
6. Do not persist Sites bypass tokens, source repository credentials, provider tokens, carrier credentials, or raw address material in either bridge artifact.

## Important Boundary

The local Sites app must keep address/contact placeholders as generated refs only. Before saving a new Sites version, deploying, or using the Sites app as a product source of truth, regenerate the ref fixture module and run the redaction gate.

## Verification

Run from AGID:

```bash
npm run sync:veygrit-sites-ref-fixtures
npm run check:veygrit-sites-ref-fixtures
npm run sync:veygrit-sites-transition-buttons
npm run check:veygrit-sites-transition-buttons
npm run sync:veygrit-sites-store-catalog
npm run check:veygrit-sites-store-catalog
npm run verify:veygrit-sites-bridge
npm run verify:veygrit-sites-app-shell
npm run verify:veygrit-sites-ref-fixtures
npm run verify:veygrit-sites-store-catalog
npm run verify:veygrit-sites-transition-buttons
npm run verify:veygrit-sites-link
npm run verify:veygrit-sites-ui-smoke
npm run verify:veygrit-sites-store-state
npm run verify:veygrit-sites-presave
npm run verify:veygrit-sites-ci-boundary
npm run verify:veygrit-github-handoff
npm run verify:veygrit-handoff-bundle-manifest
npm run verify:veygrit-boundary-gate-index
npm run verify:veygrit-app-release-readiness
npm run sync:veygrit-github-handoff
npm run check:veygrit-github-handoff
npm run test:agid-handoff
npm run verify:vey-id-demo-ec-flow
npm run verify:veygrit-id
npm run verify:address-login-spec
```

Before saving a Sites version or deploying:

```bash
npm run verify:veygrit-sites-store-state
npm run verify:veygrit-sites-presave
npm run verify:veygrit-sites-predeploy-redaction
```

Run from the Sites app:

```bash
cd C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app
npm run build
```

## CI / GitHub Actions Note

`npm run verify:veygrit-sites-presave` is the required local pre-save check for
Veygrit Sites review. Do not add it to a GitHub Actions workflow unless the
runner also has the linked Sites app source at the bridge `codexThread.localRoot`
path, because the gate intentionally verifies files outside the AGID repository
before any Sites save or deploy.

Until the Sites app source is committed, vendored, or checked out as a separate
workspace input, CI should keep running the AGID-side bridge/link/generated-module
checks and require a local `verify:veygrit-sites-presave` transcript for save or
deploy review. The workflow must not push, open pull requests, save Sites
versions, deploy production, or synthesize missing Sites app files.

A future workflow may call `npm run verify:veygrit-sites-presave` only when it
is explicitly marked as a multi-source, no-remote-mutation check:

- comment marker: `# veygrit-sites-presave: multi-source`
- environment gate: `VEYGRIT_SITES_PRESAVE_MULTI_SOURCE: "true"`
- source root: `VEYGRIT_SITES_SOURCE_ROOT: <checked-out Sites app source>`
- every checkout uses `persist-credentials: false`
- the workflow does not push, open pull requests, save Sites versions, deploy
  production, or synthesize missing Sites app files
- fixture examples live under
  `docs/specs/fixtures/veygrit-sites-ci-boundary`

Run `npm run verify:veygrit-sites-ci-boundary` to check this policy from AGID.
It scans `.github/workflows` for accidental `verify:veygrit-sites-presave`
references and verifies that this document and bridge warning still require a
local transcript until the linked Sites app source is present in CI.

## Not Done By This Link

- It does not create or delete GitHub repositories.
- It does not push to GitHub.
- It does not open a pull request.
- It does not save a Sites version.
- It does not deploy production.
- It does not make Vey ID a general KYC or proof-of-residence product.

`npm run verify:veygrit-sites-link` is intentionally narrow. It checks
`.openai/hosting.json`, the local Veygrit app package metadata, and the bridge
boundaries without reading the app's address-entry source fixtures.

`npm run verify:veygrit-sites-app-shell` checks that the local Sites app shell
keeps the AGID navigation, Home sections, and Store sections visible in
`src/main.jsx` with matching stylesheet hooks.

`npm run verify:veygrit-sites-ref-fixtures` checks that the AGID ref fixture
contract and the Sites app `src/veygritRefFixtures.js` exports stay aligned
without allowing inline screen literals for address/contact fields.
Use `npm run sync:veygrit-sites-ref-fixtures` to regenerate that Sites fixture
module from AGID before running the verification gate.
Use `npm run check:veygrit-sites-ref-fixtures` in CI or pre-save checks when
the gate must confirm the generated file is current without writing it.

`npm run verify:veygrit-sites-transition-buttons` checks that the Sites app
`src/veygritTransitionButtons.js` module is generated from AGID transition
edges and `VeygritIntegrationSurface` commerce-entry metadata. Use
`npm run sync:veygrit-sites-transition-buttons` to refresh it and `npm run
check:veygrit-sites-transition-buttons` for non-writing CI/pre-save checks.

`npm run verify:veygrit-sites-store-catalog` checks that the Sites app
`src/veygritStoreCatalog.js` module is generated from AGID Store Topics, all 32
Discover genres, and My Stores display rows with address-reuse and Wallet-side
revoke boundaries, including the visible-ref and hidden-label copy used by the
revoke confirmation modal plus local revoked/reconnect state labels and the
refs-only local storage key plus unknown-ref repair policy for reload-safe UI
state. Use `npm run
sync:veygrit-sites-store-catalog` to refresh it and `npm run
check:veygrit-sites-store-catalog` for non-writing CI/pre-save checks.

`npm run verify:veygrit-sites-ui-smoke` checks only the Sites transition button
definition, Home screen connection, and related CSS classes. It is not a full
source redaction pass and does not approve a Sites save or deploy.

`npm run verify:veygrit-sites-store-state` runs the local Sites app
`npm run test:store-state` command from AGID. It checks that My Stores
revoke/reconnect state repair remains covered by dependency-free Node tests
before the app is considered ready for save or deploy review.

`npm run verify:veygrit-sites-presave` is the local-only aggregate gate for
save/deploy review. It runs the generated-module checks, link verifier,
store-state tests, UI smoke, predeploy redaction, and local Sites app build
without saving a Sites version, deploying, pushing, or opening a pull request.

`npm run verify:veygrit-sites-ci-boundary` checks that GitHub Actions has not
started calling the local-only presave gate without the linked Sites app source
and that the CI note remains explicit.

`npm run verify:veygrit-github-handoff` checks the local-only repository handoff
for `rei-k/Veygrit-US`, including ownership, required gates, non-claims, and the
no-push/no-PR/no-Sites-save/no-deploy boundary before any future GitHub update
request.
Use `npm run sync:veygrit-github-handoff` to generate the matching
`AGID_HANDOFF.md` file inside the local Veygrit app root, and
`npm run check:veygrit-github-handoff` to verify it without writing.
From the local Veygrit app root, `npm run check:agid-handoff` verifies the
generated handoff, README link, and `RELEASE_UPDATE_CHECKLIST.md` before any
future repository update request.
`npm run test:agid-handoff` proves the app-local handoff checker fails when the
boundary-gate command is removed, without editing live handoff files.
`npm run check:release-readiness` prints the app-local README and release
checklist readiness as JSON without touching remotes.
`npm run test:release-readiness` proves required readiness regressions fail
against fixtures without editing the live app README or checklist.

`npm run verify:veygrit-handoff-bundle-manifest` checks the AGID-side review
bundle manifest for the Veygrit app files and freshness commands without
creating archives, pushing, saving Sites versions, or deploying production.
`npm run report:veygrit-handoff-bundle-manifest` prints the same manifest as
JSON for review without packaging files.
`npm run verify:veygrit-boundary-gate-index` maps the no-script-fixture boundary
surfaces to their local verifier commands before any future GitHub update or
Sites save/deploy request.

`npm run verify:veygrit-app-release-readiness` checks the local Veygrit app
`package.json` and handoff/readiness file presence from AGID after running
fixtures for missing scripts and remote mutation commands. It is a narrow
GitHub-update preflight and does not inspect app UI source, push, save Sites
versions, or deploy production.

`npm run verify:veygrit-sites-predeploy-redaction` is intentionally stricter.
It blocks Sites save/deploy readiness when local UI placeholder address/contact
fields remain in the Sites app `src` source tree, and reports only rule ids and
file names rather than source values. Ref-only constants should live in the
Sites app `src/veygritRefFixtures.js` module instead of inline screen data.
