# Veygrit Boundary Gate Index

Status: `local-review-index-no-remote-mutation`

This index maps Veygrit privacy and maintainability boundary surfaces to the
local verification command that proves production-facing modules do not import
`scripts/` fixtures. It is for OSS and grant review. It does not push to
GitHub, open pull requests, save Sites versions, deploy production, create
remote repositories, or send carrier traffic.

Run the index check from AGID:

```bash
npm run verify:veygrit-boundary-gate-index
```

## Gates

| Gate | Protected Surface | Test File | Verification |
|------|-------------------|-----------|--------------|
| `veygrit-repository-handoff` | GitHub handoff and release-readiness contracts | `src/lib/veygritRepositoryHandoff.test.ts` | `npm run verify:veygrit-github-handoff` |
| `veygrit-sites-contracts` | Sites bridge, app shell, ref fixtures, store catalog, and transition buttons | `src/lib/veygritSitesBridge.test.ts` | `npm run verify:veygrit-sites-bridge` |
| `veygrit-id-address-login-contracts` | Vey ID, Address Login, hosted callback, and SDK-facing contracts | `src/lib/veygritIdAddressLoginPlan.test.ts` | `npm run verify:address-login-spec` |
| `carrier-lib-delivery-contracts` | Carrier connector, waybill, UPS/DHL feature, label, QR, and accuracy contracts | `src/lib/carrierConnectorLayer.test.ts` | `npm run verify:carrier-connector-layer` |
| `veygrit-ship-delivery-contracts` | Veygrit Ship guest access, public test routes, shipping store, workers, secrets, and labels | `src/server/auth/veygritShipGuestAccess.test.ts` | `npm run verify:veygrit-ship-guest-access` |
| `server-carrier-route-adapters` | UPS/DHL internal routes, waybill route, and concrete server adapters | `src/server/routes/dhlCarrierRoutes.test.ts` | `npm run verify:dhl-live-connectors`; `npm run verify:ups-live-connector` |

Boundary kind: `no-script-fixtures`

Each listed test must call `assertModulesDoNotImportScripts()` and list the
production-facing modules it protects. The index test checks that every indexed
test file and module exists, that every indexed module appears in its test, and
that every verification command is wired in `package.json`.

## Non-Claims

- This index is not a release, deploy, GitHub update, pull request, or remote
  repository creation.
- Passing these gates does not prove live carrier readiness or authorize
  production traffic.
- The index names only file paths and local verification commands. It must not
  contain private delivery material, carrier credentials, witness values,
  private-key material, proof secrets, provider tokens, or source repository
  credentials.
