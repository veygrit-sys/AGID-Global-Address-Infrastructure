# Veygrit ID Hosted Address Login API v0.1

This specification defines the hosted commercial API surface for Veygrit ID / Address Login.

It complements the OSS Address Login contract and SDKs. The hosted service operates authorization sessions, redacted token exchange, proof-reference verification, consent revocation, carrier-only handoff, and synthetic test vectors.

OpenAPI:

- [veygrit-address-login-hosted.openapi.yaml](veygrit-address-login-hosted.openapi.yaml)

Synthetic contract fixtures:

- [fixtures/veygrit-address-login-hosted-v0.1.json](fixtures/veygrit-address-login-hosted-v0.1.json)

Local contract gate:

```bash
npm run verify:veygrit-address-login-hosted
```

The gate runs both checks:

- fixture contract smoke for redaction, proof references, consent, and carrier handoff
- local in-process mock smoke for `/authorize -> /token -> /proof/verify -> /carrier/decrypt-request`

The same fixture set also backs a local in-process mock handler for
`/authorize`, `/token`, `/proof/verify`, `/carrier/decrypt-request`, and
`/test-vectors`. This mock is for contract validation only; it is not a hosted
server, credential issuer, carrier adapter, or proof generator.

The mock rejects raw/private request material before route handling. Forbidden
inputs include raw address fields, recipient contact fields, precise
coordinates, proof witnesses, proof secrets, private keys, and production
credential bodies.

## Scope

The hosted API includes:

- `GET /capabilities`
- `GET /authorize`
- `POST /token`
- `POST /proof/verify`
- `POST /consent/revoke`
- `POST /carrier/decrypt-request`
- `GET /test-vectors`

## Privacy Boundary

The hosted API accepts references, commitments, claims, challenge hashes, policy hashes, consent envelope references, and carrier handoff references.

It must reject:

- raw address lines
- recipient data
- precise coordinates
- proof witnesses
- proof secrets
- private keys
- production credentials in public fixtures

## Merchant-Visible Redaction Contract

The hosted fixture set mirrors the Vey ID Core
`merchantVisibleRedactionDisplayContract` for SDK and merchant-console
integration tests. The mirrored contract pins the
`createMerchantVisibleRedactionDisplayModel` helper, the package-visible React
example path, the `merchant-visible-redaction` boundary gate, and the ordered
display field list.

The fixture binds the display refs to the synthetic hosted shipping flow:
pairwise subject alias, consent envelope ref, address credential ref, and
carrier handoff ref. The guest checkout alias is supplied by
`merchantVisibleRedactionHostedRefSource`, a dedicated synthetic source object,
so generators do not have to read the alias back from the generated display
contract. Renderers must show refs and counts only; they must not copy blocked
material names or non-claim prose into merchant-visible UI.

## Commercial Boundary

Commercial:

- hosted login operation
- Identity Wallet accounts
- credential registry
- issuer trust and revocation
- carrier handoff service
- merchant console
- managed audit and enterprise support

OSS:

- protocol documentation
- SDK request/result types
- synthetic test vectors
- local callback validator
- proof input and verifier hook contracts

## Required MVP Security

- redirect URI allowlist
- state and nonce
- PKCE for public clients
- pairwise subject alias
- no-raw-address token response
- carrier-only handoff expiry
- webhook HMAC for merchant events
- redacted audit events

## Webhook Key Rotation Runbook

Hosted merchant webhooks use `x-veygrit-signature` with `kid=<key_id>,v1=<hmac>`.
The public fixture set models key rotation without exposing production signing
secrets.

Rotation phases:

1. Publish key lifecycle metadata through capabilities and test vectors.
2. Notify merchants before the active-key overlap begins.
3. Accept both current and next active keys during the overlap window.
4. Reject retired keys even when the HMAC value matches the payload.
5. Audit rollout using redacted event ids and payload fingerprints only.

The executable runbook gate is backed by:

- `keyLifecycle` in the hosted fixture contract
- `webhook_rotated_key_valid` as the positive next-key vector
- `webhook_retired_key_negative` as the retired-key rejection vector
- `buildHostedAddressLoginWebhookKeyRotationRunbook()` in the local contract model

The active overlap must be at least as long as the webhook replay window. This
prevents merchants from being forced to switch keys inside the same replay
tolerance interval.

## Callback Contract

Hosted callbacks use the shared `veygrit-address-login-callback-v0.1`
contract. Canonical query parameters are:

- `code`
- `state`
- `iss`
- `session_ref`
- `credential_ref`
- `proof_bundle_ref`
- `carrier_handoff_ref`
- `error`
- `error_description`

Compatibility aliases:

- `issuer` may be accepted as an alias for `iss`
- `proof_ref` may be accepted as an alias for `proof_bundle_ref`
- `handoff_ref` may be accepted as an alias for `carrier_handoff_ref`

Callbacks are not address resolution evidence. They must not contain raw
address, recipient, witness, private-key, or proof-secret material. Carrier
handoff refs do not authorize merchant decryption or address storage.

`GET /capabilities` and `GET /test-vectors` expose the same callback contract
so SDKs, local validators, merchant setup screens, and synthetic fixtures can
detect drift before a hosted integration is enabled.

The hosted fixture set includes offline callback validation vectors for alias
normalization, expected `state` binding, required redacted refs, and forbidden
parameter rejection.  These vectors use parameter names, synthetic refs, and
blocked placeholder values only; they are not raw address payloads.

## Non-Claims

This API does not claim:

- social login verifies an address
- proof-only deliverability proves residence
- carrier-only decrypt guarantees delivery SLA
- v0.1 includes audited ZK circuits
- synthetic test vectors are production data
