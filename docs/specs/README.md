# AGID Specs

Specifications live here: protocol definitions, API contracts, data schemas,
resolver behavior, SDK conformance, and machine-readable compatibility rules.

Use this directory for normative material. Research drafts belong in
`docs/research/`; product UX plans belong in `docs/product/`; operational
release policy belongs in `docs/ops/`.

## Current Specs

- [Hosted Registry API v0.1](hosted-registry-api-v0.1.md)
- [Hosted Registry API OpenAPI](hosted-registry-api.openapi.yaml)
- [Veygrit ID Hosted Address Login API v0.1](veygrit-address-login-hosted-v0.1.md)
- [Veygrit ID Hosted Address Login OpenAPI](veygrit-address-login-hosted.openapi.yaml)
- [Veygrit ID Hosted Address Login synthetic fixtures](fixtures/veygrit-address-login-hosted-v0.1.json)
- [Veygrit ID Hosted Address Login fixture schema](schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json)
- [Veygrit ID Hosted Address Login OpenAPI evidence extension profile](schemas/veygrit-address-login-hosted-openapi-evidence-extension-v0.1.schema.json)
- [Vey ID Core API v0.1](veygrit-id-core-v0.1.md)
- [Vey ID Core API OpenAPI](veygrit-id-core.openapi.yaml)
- [Vey ID Core synthetic fixture](fixtures/veygrit-id-core-v0.1.json)
- [Vey ID Core fixture schema](schemas/veygrit-id-core-fixture-v0.1.schema.json)
- [Vey ID Address Wallet pass export fixture](fixtures/vey-id-address-wallet-pass-export-v0.1.json)
- [Vey ID Address Wallet pass export schema](schemas/vey-id-address-wallet-pass-export-v0.1.schema.json)
- [Trade Gateway idempotency fixture](fixtures/vey-trade-gateway-idempotency-v0.1.json)
- [Trade Gateway idempotency fixture schema](schemas/vey-trade-gateway-idempotency-v0.1.schema.json)
- [Trade Gateway OpenAPI](trade-gateway-api.openapi.yaml)
- [Trade Gateway OpenAPI evidence extension profile](schemas/trade-gateway-openapi-evidence-extension-v0.1.schema.json)
- [Playlist Commerce webhook OpenAPI](playlist-commerce-webhooks.openapi.yaml)
- [Playlist Commerce webhook preflight fixture](fixtures/playlist-commerce-webhook-preflight-v0.1.json)
- [Playlist Commerce webhook preflight history](fixtures/playlist-commerce-webhook-preflight-history-v0.1.json)
- [Playlist Commerce webhook evidence fixture](fixtures/playlist-commerce-webhook-evidence-v0.1.json)
- [Delivery Gateway sandbox carrier smoke fixture](fixtures/delivery-gateway-sandbox-carrier-smoke-v0.1.json)
- [Delivery Gateway sandbox carrier smoke fixture schema](schemas/delivery-gateway-sandbox-carrier-smoke-v0.1.schema.json)
- [Delivery Gateway Carrier API OpenAPI](delivery-gateway-carrier-api.openapi.yaml)
- [Delivery Gateway OpenAPI evidence extension profile](schemas/delivery-gateway-openapi-evidence-extension-v0.1.schema.json)
- [Merchant Console onboarding fixture](fixtures/merchant-console-onboarding-v0.1.json)
- [Merchant Console onboarding fixture schema](schemas/merchant-console-onboarding-v0.1.schema.json)
- [Merchant Console OpenAPI evidence extension profile](schemas/merchant-console-openapi-evidence-extension-v0.1.schema.json)
- [Address Stripe ShipmentIntent schema](schemas/shipment-intent-v0.1.schema.json)
- [Address Stripe ShipmentIntent synthetic fixture](fixtures/shipment-intent-v0.1.json)
- [Address Stripe RateQuote schema](schemas/rate-quote-v0.1.schema.json)
- [Address Stripe RateQuote synthetic fixture](fixtures/rate-quote-v0.1.json)
- [Address Stripe CarrierAllocation schema](schemas/carrier-allocation-v0.1.schema.json)
- [Address Stripe CarrierAllocation synthetic fixture](fixtures/carrier-allocation-v0.1.json)
- [Playlist Commerce webhook evidence schema](schemas/playlist-commerce-webhook-evidence-v0.1.schema.json)
- [AGID OpenAPI evidence extension schema](schemas/agid-openapi-evidence-extension-v0.1.schema.json)
- [AGID OpenAPI linked verifier allowlist](fixtures/agid-openapi-linked-verifiers-v0.1.json)
- [AGID OpenAPI linked verifier allowlist schema](schemas/agid-openapi-linked-verifiers-v0.1.schema.json)
- [AGID non-claims profile registry](fixtures/agid-non-claims-profiles-v0.1.json)
- [AGID non-claims profile registry schema](schemas/agid-non-claims-profiles-v0.1.schema.json)
- [Playlist Commerce OpenAPI evidence extension profile](schemas/playlist-commerce-openapi-evidence-extension-v0.1.schema.json)

## Playlist Commerce Webhook Evidence

The Playlist Commerce webhook evidence files are local-only OSS fixtures for
checking the safety boundary around a synthetic signed webhook ping. They are
not hosted Evidence Vault records and they do not claim payment settlement,
raw address intake, proof witness intake, provider token intake, raw carrier
payload intake, or production delivery attempts.

Use the fixtures together:

- `fixtures/playlist-commerce-webhook-preflight-v0.1.json` records one redacted
  synthetic preflight result.
- `fixtures/playlist-commerce-webhook-preflight-history-v0.1.json` records a
  short local run history and evidence refs.
- `fixtures/playlist-commerce-webhook-evidence-v0.1.json` maps those evidence
  refs to redacted vault-style record refs and commitment refs.
- `schemas/playlist-commerce-webhook-evidence-v0.1.schema.json` defines the
  fixture contract for redaction flags, commitment ref patterns, non-claims,
  retention, and managed-service boundary.
- `schemas/agid-openapi-evidence-extension-v0.1.schema.json` defines the
  generic `x-agid-evidence-fixtures` OpenAPI extension used to link operations
  back to local evidence fixtures, schemas, and verifier commands.
- `fixtures/agid-openapi-linked-verifiers-v0.1.json` is the local-only
  allowlist for verifier commands that the linked gate may execute.
- `schemas/agid-openapi-linked-verifiers-v0.1.schema.json` keeps that
  allowlist data-driven and checks the runner scripts, timeouts, boundaries,
  and non-claims before anything is executed.
- `fixtures/agid-non-claims-profiles-v0.1.json` is the local-only registry for
  `nonClaimsProfile` values. It names the expected non-claim bundle for each
  OpenAPI evidence extension and, for product profiles, the product-specific
  OpenAPI evidence schema path so claim boundaries stay data-driven.
- `schemas/agid-non-claims-profiles-v0.1.schema.json` checks that the profile
  registry contains the shared raw-address/proof-witness non-claims and the
  known product profiles `agid-generic-evidence-v0.1`,
  `playlist-commerce-webhook-v0.1`, and
  `veygrit-address-login-hosted-v0.1`,
  `delivery-gateway-sandbox-carrier-v0.1`, and
  `merchant-console-onboarding-v0.1`, and
  `trade-gateway-idempotency-v0.1`.
- The OpenAPI evidence scanner also checks that the generic extension schema's
  `nonClaimsProfile` enum and the profile registry contain the same profile
  ids, so schema-only or fixture-only profile drift fails before verifiers run.
- Product-specific OpenAPI evidence profile schemas further pin exact fixture
  paths, verifier commands, managed-service boundaries, forbidden materials,
  non-claims, and their own `nonClaimsProfile.const`; the scanner rejects a
  product schema whose fixed profile id does not match the registry profile id.
- `schemas/playlist-commerce-openapi-evidence-extension-v0.1.schema.json`
  specializes the generic extension for Playlist Commerce webhook preflight
  evidence by fixing the exact fixture paths, verifier commands, and non-claims.
- `schemas/veygrit-address-login-hosted-openapi-evidence-extension-v0.1.schema.json`
  specializes the generic extension for Hosted Address Login test vectors by
  fixing the single synthetic fixture set, verifier commands, boundary, and
  hosted Address Login non-claims.
- `schemas/merchant-console-openapi-evidence-extension-v0.1.schema.json`
  specializes the generic extension for Merchant Console onboarding by fixing
  the onboarding fixture paths, verifier commands, Delivery Gateway boundary,
  forbidden-material names, and onboarding non-claims.
- `schemas/trade-gateway-openapi-evidence-extension-v0.1.schema.json`
  specializes the generic extension for Trade Gateway idempotency vectors by
  fixing the idempotency fixture path, verifier commands, local-only boundary,
  forbidden-material names, and trading non-claims.

### OpenAPI Evidence Profile Compatibility Matrix

The profile registry, product-specific schemas, OpenAPI extension blocks, and
linked-verifier allowlist should stay aligned with this fixture-only matrix.
Changing a row requires updating the registry/schema/OpenAPI references
together, and adding a linked verifier entry when the command should execute in
the `:linked` gate. These rows are local evidence contracts, not production
traffic, raw address intake, payment settlement, residence proof, or delivery
guarantees.

| `nonClaimsProfile` | OpenAPI surface | verifier / aggregate verifier | Managed boundary | Required non-claim summary |
| --- | --- | --- | --- | --- |
| `playlist-commerce-webhook-v0.1` | `playlist-commerce-webhooks.openapi.yaml` `/webhooks/playlist-commerce` | `npm run verify:playlist-commerce-evidence` / `npm run verify:playlist-commerce` | `fixture-only-not-hosted-evidence-vault` | No payment settlement, raw address intake, proof witness intake, provider token intake, raw carrier payload intake, or production delivery attempt. |
| `veygrit-address-login-hosted-v0.1` | `veygrit-address-login-hosted.openapi.yaml` `/test-vectors` | `npm run verify:veygrit-address-login-hosted` / `npm run verify:address-login-spec` | `fixture-only-not-hosted-address-login` | No raw address intake, proof witness intake, or production credential intake. |
| `delivery-gateway-sandbox-carrier-v0.1` | `delivery-gateway-carrier-api.openapi.yaml` `/v1/delivery/test-vectors/sandbox-carrier-smoke` | `npm run verify:delivery-gateway-carrier-api` / `npm run verify:address-login-spec` | `fixture-only-not-production-carrier` | No raw address intake, proof witness intake, production carrier traffic, real label purchase, or delivery guarantee. |
| `merchant-console-onboarding-v0.1` | `delivery-gateway-carrier-api.openapi.yaml` `/v1/merchant-console/onboarding` | `npm run verify:merchant-console-ec-plugin` / `npm run verify:address-login-spec` | `delivery-gateway-carrier-api` | No raw address intake, proof witness intake, provider token intake, raw carrier payload intake, live carrier credential intake, raw address disclosure, production DHL/UPS traffic, carrier-specific address form, or raw address callback. |
| `trade-gateway-idempotency-v0.1` | `trade-gateway-api.openapi.yaml` `/v1/trade/test-vectors/idempotency` | `npm run verify:vey-trade-gateway-idempotency-fixture-schema` / `npm run verify:vey-trading` | `trade-gateway-local-idempotent-intent` | No raw address intake, proof witness intake, production traffic, production trading venue, payment settlement, customs clearance, legal or financial advice, or identity truth/sanctions outcome claim. |

The generic `agid-generic-evidence-v0.1` profile remains for local synthetic
scanner tests and should retain the base `not-raw-address-intake` and
`not-proof-witness-intake` non-claims.

Verification:

```text
npm run verify:agid-openapi-evidence-extensions
npm run verify:agid-openapi-evidence-workflow
npm run verify:agid-openapi-evidence-extensions:linked
npm run verify:playlist-commerce-evidence
npm run verify:playlist-commerce
npm run verify:veygrit-address-login-hosted
npm run verify:delivery-gateway-carrier-api
npm run verify:merchant-console-ec-plugin
npm run verify:vey-trade-gateway-idempotency-fixture-schema
```

The `verify:agid-openapi-evidence-extensions` gate scans every
`*.openapi.yaml` file under `docs/specs/` and validates each
`x-agid-evidence-fixtures` block against the generic schema, referenced local
fixtures, evidence schemas, and npm verifier commands. The `:linked` variant
also reads the local linked-verifier allowlist fixture and runs only the
allowlisted per-product verifier commands referenced by the extensions,
currently Playlist Commerce evidence, Veygrit Hosted Address Login, Delivery
Gateway sandbox carrier smoke, Merchant Console onboarding, and Trade Gateway
idempotency. These gates
must stay local-only and must not store raw address,
recipient contact, private key, production webhook secret, proof witness,
biometric template, raw webhook payload, or raw signature material.
The linked verifier gate also checks that each allowlisted verifier's
`managedServiceBoundary` matches the boundary declared by the OpenAPI
extension that references it. It also checks that the allowlist and each
referencing OpenAPI extension retain the required non-claims
`not-raw-address-intake` and `not-proof-witness-intake`.

CI runs the lightweight extension scan on pull requests. Pushes to `main` or
`master`, scheduled nightly runs, and manual dispatch also run the linked
allowlist gate so product-specific evidence verifiers execute without making
normal PR feedback slower. The workflow guard is also run in CI so this split
does not drift silently. It also checks read-only permissions, Ubuntu runners,
bounded timeouts, Node 22 with npm caching, and `npm ci` dependency installs.

## Veygrit ID Hosted Address Login Test Vectors

The Hosted Address Login OpenAPI uses the generic `x-agid-evidence-fixtures`
extension on `/test-vectors` to point to its local synthetic fixture set and
fixture schema:

- `fixtures/veygrit-address-login-hosted-v0.1.json` contains redacted
  authorization, token, proof, carrier handoff, consent, callback, and webhook
  conformance vectors. Its callback validation vectors cover alias
  normalization, state mismatch, missing authorization code, and forbidden
  callback parameter rejection without raw address material.
- `schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json` checks the
  fixture set id, local-only privacy posture, forbidden callback params, and
  webhook transport controls.
- `schemas/veygrit-address-login-hosted-openapi-evidence-extension-v0.1.schema.json`
  checks the OpenAPI `x-agid-evidence-fixtures` block for the exact fixture
  path, verifier command, aggregate command, managed boundary, and non-claims.
- `npm run verify:veygrit-address-login-hosted` verifies the hosted fixture set
  and local mock behavior.

This is a preparation profile for reusing `x-agid-evidence-fixtures` across
AGID OpenAPI specs. It is not hosted Evidence Vault storage and it does not
claim residence, address truth, production credential intake, or delivery
success.

## Vey ID Core API Contract

`veygrit-id-core.openapi.yaml` pins the EC-facing identity surface before the
Address Login claim layer. It covers:

- `GET /veygrit/oauth/authorize` for Google/Apple-only Vey ID authorization;
- `POST /veygrit/oauth/token` for PKCE exchange into token refs;
- `POST /veygrit/guest-checkout/handoff` for ref-only EC guest checkout handoff
  guarded by the `merchant-visible-redaction` privacy boundary;
- `POST /veygrit/connections/revoke` for wallet-side merchant unlinking;
- `GET /.well-known/veygrit-client.json` for merchant metadata discovery.

The synthetic fixture `fixtures/veygrit-id-core-v0.1.json` records only refs:
`pairwiseSubjectAlias`, `walletSessionRef`, `authorizationCodeRef`,
`accessTokenRef`, `idTokenRef`, `guestCheckoutAlias`, `walletConsentRef`,
`addressCredentialRef`, `carrierHandoffRef`, and revocation deletion refs. The
fixture also pins the `merchant-visible-redaction` boundary gate with safe
merchant-visible evidence refs and required blocked material. It also records
the `@veygrit/address-login-react` display helper and example path that render
only approved refs plus blocked-class and non-claim counts. It explicitly does
not store raw address text, recipient contact, Google/Apple tokens, provider
raw profile, proof secrets, private keys, carrier keys, production credentials,
refresh tokens, or production traffic.

Verification:

```text
npm run verify:veygrit-id-core-openapi
```

This gate checks the OpenAPI paths, PKCE and pairwise controls, token-ref-only
responses, ref-only guest checkout controls, `merchant-visible-redaction`
boundary anchors, SDK display contract anchors, wallet-side revocation
controls, fixture privacy flags, and fixture schema constants. Vey ID login
remains a convenience login and address reuse bootstrap; it is not a residence
proof or a production carrier/provider call.

## Vey ID Address Wallet Pass Export Fixture

`fixtures/vey-id-address-wallet-pass-export-v0.1.json` captures the local
`buildVeyIdAddressWalletPassExportAudit` output for Apple Wallet, Google
Wallet, and QR artifacts. It records only artifact ids, safe payload refs,
blocked payload class names, expiry and rotation policy, non-claims, and
`productionTraffic: false`; it is not live pass issuance, pass signing, QR
rendering, raw address disclosure, or production revocation evidence.

`schemas/vey-id-address-wallet-pass-export-v0.1.schema.json` pins the fixture
id, `wallet-pass-short-lived-ref` boundary, audit builder, verifier command,
local-only privacy flags, artifact count, safe ref enum, blocked-material enum,
and empty validation/private-material findings.

Verification:

```text
npm run verify:vey-id-address-wallet-pass-export-fixture-schema
npm run verify:vey-id-address-wallet-foundation
```

## Trade Gateway Idempotency Vectors

`docs/specs/fixtures/vey-trade-gateway-idempotency-v0.1.json` captures local
Trade Gateway idempotency vectors for created, replayed, conflict, and
private-material rejection decisions. It stores deterministic refs, safe refs,
warnings, errors, forbidden marker names, privacy flags, and non-claims only.
It omits idempotency key values, full intent bodies, raw address or recipient
material, witnesses, proof secrets, private keys, production credentials, and
production traffic claims.

`docs/specs/schemas/vey-trade-gateway-idempotency-v0.1.schema.json` pins the
fixture id, builder, `trade-gateway-local-idempotent-intent` boundary, verifier
command, vector ids, local-only privacy flags, safe ref posture, and non-claims.
`docs/specs/trade-gateway-api.openapi.yaml` exposes those vectors through the
local-only `/v1/trade/test-vectors/idempotency` conformance operation and links
the operation to the fixture through `x-agid-evidence-fixtures` using the
`trade-gateway-idempotency-v0.1` non-claims profile. The profile schema fixes
the exact fixture path, verifier commands, boundary, forbidden-material names,
and non-claims so the shared scanner can reject spec drift.
The local Express route is
`/api/trade-gateway/v1/trade/test-vectors/idempotency`; it requires a
`pk_test_` bearer, rejects query material, returns no-store/local-only headers,
and never accepts production credentials.
`src/lib/veyTradeGatewayTestVectorClient.ts` provides the matching typed local
helper, validates the fixture shape, and rejects non-test bearer material before
fetching.
The OSS package entrypoint is `sdk/vey-trade-gateway-test-vectors`, with the
same local-only route, shape validation, blocked-key rejection, and non-claims.

Verification:

```text
npm run verify:vey-trade-gateway-idempotency-fixture-schema
npm run verify:vey-trade-gateway-client
npm run verify:vey-trade-gateway-routes
npm run verify:vey-trade-gateway-test-vector-sdk
npm run verify:vey-trade-gateway-sdk-drift
npm run verify:vey-trade-gateway-test-vector-sdk-package
npm run verify:vey-trading
npm run verify:agid-openapi-evidence-extensions
```

## Delivery Gateway Sandbox Carrier Smoke

`fixtures/delivery-gateway-sandbox-carrier-smoke-v0.1.json` pins the synthetic
`rate -> allocate -> label -> tracking webhook -> delivery proof` flow used by
the Merchant Console and Delivery Gateway carrier API tests. It stores only
safe refs, expected lifecycle surfaces, blocked-material names, and privacy
flags. It does not contain raw addresses, recipient contacts, carrier API keys,
raw label payloads, proof witnesses, production credentials, or production
carrier traffic.
`schemas/delivery-gateway-sandbox-carrier-smoke-v0.1.schema.json` fixes the
same local-only boundary in machine-readable form: required refs, lifecycle
surface names, `productionTraffic: false`, `rawAddressFixtures: false`, and
privacy flags that must remain false.
`delivery-gateway-carrier-api.openapi.yaml` exposes the sandbox smoke as a
test-vector endpoint and links it through `x-agid-evidence-fixtures` using the
`delivery-gateway-sandbox-carrier-v0.1` non-claims profile. The shared scanner
therefore checks the fixture path, fixture schema, verifier command, managed
boundary, forbidden materials, and non-claims alongside the Playlist Commerce
and Hosted Address Login evidence surfaces.
The same operation also carries `x-agid-internal-evidence` for the
carrier-only handoff ref contract. That extension documents the internal
`carrier-adapter-only` boundary, while `verify:delivery-gateway-carrier-api`
rejects any `carrierHandoffRef` field that drifts into public response schemas.

Verification:

```text
npm run verify:delivery-gateway-carrier-api
```
