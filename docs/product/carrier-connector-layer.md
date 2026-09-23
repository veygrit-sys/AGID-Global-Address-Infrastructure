# Carrier Connector Layer

Carrier Connector Layer is the private adapter layer inside Hexaship / Delivery Gateway.

ここで各社API差分を吸収し、外側の開発者APIは `createShipment`, `getRates`, `createLabel`, `trackShipment`, `createReturn` のまま保ちます。

## MVP Connectors

### DHL Connector

Status: `active-mvp`

Absorbs DHL-specific API dialects such as:

- rating / service capability
- shipment creation
- label documents
- tracking
- returns

Normalized into:

- `rateRef`
- `shipmentRef`
- `labelRef`
- `trackingAlias`
- `returnRef`

### UPS Connector

Status: `active-mvp`

Absorbs UPS-specific API dialects such as:

- rating
- shipping
- address validation
- label image
- tracking
- returns

Normalized into the same Hexaship refs used by DHL.

## Future Connectors

Planned:

- FedEx
- ヤマト
- 日本郵便
- SF Express

These are registered as planned connector profiles so the architecture is ready, but they are not treated as live carrier integrations until account, legal, sandbox, and no-raw-address gates pass.

## Common Methods

Every connector maps to:

- `createShipment`
- `getRates`
- `createLabel`
- `trackShipment`
- `createReturn`

The public API does not change when a new carrier is added.

## Capability Preflight

Before `getRates`, the connector layer produces a server-side `carrierCapabilityRef` from safe refs:

- `countryCode`
- `recipientId`
- `parcelProfileRef`
- `walletConsentRef`

When the active DHL/UPS connector can perform the sandbox preflight, the normalized action is:

```text
ready_for_getRates
```

This does not claim live DHL/UPS service coverage. It only proves the local request has enough redacted refs to move from Address Wallet readiness into the Hexaship rating flow. Planned connectors such as FedEx, ヤマト, 日本郵便, and SF Express return `connector_not_active` until account, legal, sandbox, and safety gates pass.

## Difference Absorption

Carrier APIs differ in:

- rate operation names
- shipment creation endpoint shape
- tracking identifier names
- label artifact names
- return authorization flow
- account and credential model
- country and service availability

The connector layer converts those differences into stable Hexaship refs:

```text
DHL documents       -> labelRef
UPS labelImage      -> labelRef
FedEx encodedLabel  -> labelRef
Yamato slipNumber   -> trackingAlias
Japan Post inquiryNumber -> trackingAlias
SF Express mailNo   -> trackingAlias
```

## Security Boundary

Connector code is server-side only.

Public clients and merchant frontends must not send or receive:

- `rawAddress`
- `recipientName`
- `recipientPhone`
- `privateDeliveryNotes`
- `proofWitness`
- `proofSecret`
- `privateKey`
- `carrierApiKey`
- `carrierCredential`
- `rawLabelPayload`
- `rawTrackingPayload`
- `rawCarrierPayload`

The connector may receive scoped carrier handoff material only after wallet consent, AddressQL validation, carrier allocation, and policy gates pass.

## Carrier-Only Handoff Ref Evidence

`buildCarrierOnlyHandoffRefEvidence()` derives a deterministic `carrierHandoffRef`
from safe prerequisite refs only after wallet consent, carrier capability,
allocation, and label refs exist. The ref is marked `carrier-adapter-only`,
excluded from merchant-visible output, and covered by
`npm run verify:delivery-gateway-carrier-api`.

## Real DHL/UPS Onboarding

実導入は `sandbox -> staging -> limited production` の順に進めます。DHL/UPSの実アカウントや認証情報は、このリポジトリ、公開SDK、Merchant Console、テストfixtureには置きません。

### DHL MyDHL API

Official docs: <https://developer.dhl.com/api-reference/dhl-express-mydhl-api>

Prerequisites:

- DHL Express customer account
- MyDHL API access credentials
- server-side BasicAuth only
- DHL sandbox contract tests for rating, shipment validation, label, pickup, and tracking

Server env keys:

- `HEXASHIP_DHL_MYDHL_BASE_URL`
- `HEXASHIP_DHL_MYDHL_USERNAME`
- `HEXASHIP_DHL_MYDHL_PASSWORD`
- `HEXASHIP_DHL_ACCOUNT_NUMBER`
- optional: `HEXASHIP_DHL_PICKUP_ACCOUNT_NUMBER`
- optional: `HEXASHIP_DHL_DUTY_ACCOUNT_NUMBER`

The default base URL must be the DHL test environment until account, legal, wallet-consent, and sandbox gates pass:

```text
https://express.api.dhl.com/mydhlapi/test
```

Production URL use requires an explicit server-side live-traffic gate:

```text
HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED=true
```

### UPS APIs

Official docs: <https://developer.ups.com/tag/OAuth-Client-Credentials>

Prerequisites:

- UPS developer application
- UPS Client ID and Client Secret
- UPS account / shipper number controlled by the integration owner
- server-side OAuth Client Credentials token exchange
- UPS sandbox contract tests for rating, shipping, label, tracking, OAuth refresh failure, and returns

Server env keys:

- `HEXASHIP_UPS_BASE_URL`
- `HEXASHIP_UPS_CLIENT_ID`
- `HEXASHIP_UPS_CLIENT_SECRET`
- `HEXASHIP_UPS_ACCOUNT_NUMBER`
- optional: `HEXASHIP_UPS_BILLING_ACCOUNT_NUMBER`
- optional: `HEXASHIP_UPS_PICKUP_ACCOUNT_NUMBER`

The default base URL must be the UPS test endpoint family until account, legal, wallet-consent, and sandbox gates pass:

```text
https://wwwcie.ups.com
```

Production URL use requires the same explicit server-side live-traffic gate:

```text
HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED=true
```

### Shared Go-Live Gates

- `verify:carrier-connector-layer`
- `verify:hexaship-delivery-gateway`
- Address Wallet consent preflight passes before address materialization.
- Merchant Console shows shipment refs and status summaries without raw recipient address display.
- No production carrier traffic runs unless `HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED` is explicitly true server-side.

## Non-Claims

- A connector profile is not a live carrier contract.
- Planned connectors are placeholders until real account and sandbox gates pass.
- DHL/UPS active MVP connector tests do not send production traffic.
- Carrier availability must be checked at runtime; connector presence does not imply service coverage.

## Next Build Step

Wire `carrierCapabilityRef` into `Hexaship / Delivery Gateway` so the MVP v0.1 orchestration refuses `getRates` unless Address Wallet preflight and connector capability preflight both passed.
