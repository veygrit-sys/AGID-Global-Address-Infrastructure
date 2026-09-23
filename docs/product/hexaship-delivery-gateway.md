# Hexaship / Delivery Gateway

Hexaship / Delivery Gateway is the shipping-Stripe layer for Vey.

配送版Stripeとしての約束は、開発者が DHL と UPS の仕様差を直接扱わず、同じAPIで配送を作れることです。

## Common API

The first common API has five methods:

```ts
hexaship.createShipment(...)
hexaship.getRates(...)
hexaship.createLabel(...)
hexaship.trackShipment(...)
hexaship.createReturn(...)
```

These are carrier-neutral. DHL and UPS differences live behind server-side adapter refs.

## MVP v0.1 Orchestration

`runHexashipMvpV01Sandbox()` is the first end-to-end local flow for the Delivery Gateway.
`@hexaship/js` exposes the same local flow through `createHexashipMvpV01SandboxClient()`.
The Express sandbox exposes the same flow at `POST /v1/hexaship/mvp-v0.1/shipments` with a `Bearer pk_test_*` key.

Flow:

1. EC sends a shipment creation request.
2. Vey resolves the destination from an Address Wallet `recipientId`.
3. Vey requires a connector-side `carrierCapabilityRef` before rating.
4. Vey asks the DHL/UPS connector layer for normalized candidates.
5. User or EC chooses `fastest` or `cheapest`。UIでは「最速」または「最安」と表示できる。
6. Vey selects the carrier.
7. Vey creates a label ref.
8. Vey stores a tracking alias.
9. Vey writes redacted Webhook ledger entries as shipment status changes.

Inputs:

- `merchantRef`
- `ecOrderRef`
- `recipientId`
- `parcelProfileRef`
- `addressFormVersion`
- `walletConsentRef`
- `carrierCapabilityRef`
- `selectionMode`: `fastest` or `cheapest`
- `selectedBy`: `user` or `ec`

Outputs:

- `recipientResolution.addressResolutionRef`
- DHL/UPS rate candidates
- carrier decision ref
- `labelRef`
- `waybillAlias`
- `trackingAlias`
- redacted Webhook ledger

Address Wallet resolution returns only a scoped reference. It does not return raw address text to the EC, browser, or Merchant Console.

Address form rule: users enter addresses through familiar country forms. `addressFormVersion` is the safe Wallet ref for that form version, such as `wallet_country_form_ref_us_en_v1`. Hexaship converts it to DHL/UPS label payload shapes server-side only. EC plugins must not collect carrier-specific address shapes, raw address text, recipient phone numbers, or carrier credentials.

## MVP v0.1 Preflight Gate

Before calling `runHexashipMvpV01Sandbox()` or the future hosted `createShipment` route, EC plugins can call `preflightHexashipMvpV01Shipment()` locally.

The preflight returns one safe next action:

- `remove_private_material`: reject public payloads containing `rawAddress`, `recipientName`, `recipientPhone`, `carrierApiKey`, `proofSecret`, `privateKey`, or raw carrier payload fields.
- `run_address_wallet_preflight`: obtain `recipientId`, `parcelProfileRef`, and `walletConsentRef` from Address Wallet / Vey ID.
- `run_carrier_capability_preflight`: obtain a connector-side `carrierCapabilityRef` for DHL/UPS capability and country-form readiness.
- `call_hexaship_createShipment`: all required refs are present and the local sandbox can create the shipment.

The preflight output contains only refs, missing key names, and booleans. It does not resolve the recipient address, does not expose carrier credentials, and does not send DHL/UPS production traffic.

SDK example:

```ts
import {
  createHexashipMvpV01FetchClient,
  createHexashipMvpV01SandboxClient,
  preflightHexashipMvpV01Shipment,
} from "@hexaship/js";

const hexaship = createHexashipMvpV01SandboxClient();

const preflight = preflightHexashipMvpV01Shipment({
  merchantRef: "merchant_ref_demo",
  ecOrderRef: "ec_order_ref_demo",
  recipientId: "aw_rec_friend_demo",
  parcelProfileRef: "parcel_profile_ref_demo",
  addressFormVersion: "wallet_country_form_ref_us_en_v1",
  walletConsentRef: "wallet_consent_ref_demo",
});

// preflight.requiredNextAction === "run_carrier_capability_preflight"

const shipment = await hexaship.createShipment({
  merchantRef: "merchant_ref_demo",
  ecOrderRef: "ec_order_ref_demo",
  recipientId: "aw_rec_friend_demo",
  parcelProfileRef: "parcel_profile_ref_demo",
  addressFormVersion: "wallet_country_form_ref_us_en_v1",
  walletConsentRef: "wallet_consent_ref_demo",
  carrierCapabilityRef: "carrier_capability_ref_demo",
  selectionMode: "fastest",
  selectedBy: "user",
});

const httpHexaship = createHexashipMvpV01FetchClient({
  baseUrl: "https://hexaship.local",
  publishableKey: "pk_test_demo",
});

await httpHexaship.createShipment({
  merchantRef: "merchant_ref_demo",
  ecOrderRef: "ec_order_ref_demo",
  recipientId: "aw_rec_friend_demo",
  parcelProfileRef: "parcel_profile_ref_demo",
  addressFormVersion: "wallet_country_form_ref_us_en_v1",
  walletConsentRef: "wallet_consent_ref_demo",
  carrierCapabilityRef: "carrier_capability_ref_demo",
  selectionMode: "cheapest",
  selectedBy: "ec",
}, { idempotencyKey: "idem_demo_001" });
```

HTTP sandbox example:

```http
POST /v1/hexaship/mvp-v0.1/shipments
Authorization: Bearer pk_test_demo
Content-Type: application/json

{
  "merchantRef": "merchant_ref_demo",
  "ecOrderRef": "ec_order_ref_demo",
  "recipientId": "aw_rec_friend_demo",
  "parcelProfileRef": "parcel_profile_ref_demo",
  "addressFormVersion": "wallet_country_form_ref_us_en_v1",
  "walletConsentRef": "wallet_consent_ref_demo",
  "carrierCapabilityRef": "carrier_capability_ref_demo",
  "selectionMode": "cheapest",
  "selectedBy": "ec"
}
```

## 1. createShipment

Purpose: create a shipment ref from wallet and parcel refs.

Safe inputs:

- `merchantRef`
- `recipientId`
- `parcelProfileRef`
- `walletConsentRef`
- `carrierPreference`
- `servicePreference`

Safe outputs:

- `shipmentRef`
- `selectedCarrier`
- `status`
- `requiredNextAction`

## 2. getRates

Purpose: get normalized DHL/UPS rate candidates.

Safe inputs:

- `shipmentRef`
- `recipientId`
- `parcelProfileRef`
- `carrierCapabilityRef`
- `carrierPreference`
- `servicePreference`

Safe outputs:

- `rateRef`
- `carrier`
- `serviceLevel`
- `priceEstimateRef`
- `etaWindowRef`

## 3. createLabel

Purpose: create a label reference after consent and rate selection.

Safe inputs:

- `shipmentRef`
- `rateRef`
- `walletConsentRef`
- `labelFormat`

Safe outputs:

- `labelRef`
- `waybillAlias`
- `trackingAlias`
- `labelQrCommitment`

## 4. trackShipment

Purpose: normalize DHL/UPS tracking into the same receipt shape.

Safe inputs:

- `shipmentRef`
- `trackingAlias`
- `carrier`

Safe outputs:

- `trackingReceiptRef`
- `status`
- `eventFingerprint`
- `nextAction`

## 5. createReturn

Purpose: create a carrier-neutral return authorization and return label ref.

Safe inputs:

- `shipmentRef`
- `reasonCode`
- `walletConsentRef`

Safe outputs:

- `returnRef`
- `returnLabelRef`
- `returnTrackingAlias`
- `status`

## DHL/UPS Adapter Boundary

```text
Merchant / App / CMS
  -> Hexaship common API
  -> Delivery Gateway policy
  -> DHL adapter or UPS adapter
  -> carrier sandbox / production server-side only
```

DHL and UPS credentials are never accepted from public client payloads. Production carrier calls must happen only in server-side adapters.

## Blocked Material

Public API payloads must reject:

- `rawAddress`
- `addressLine1`
- `addressLine2`
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
- `rawQrPayload`

## Webhook Events

Common events:

- `shipment.created`
- `rates.created`
- `label.created`
- `shipment.in_transit`
- `shipment.delivered`
- `return.created`

## Non-Claims

- Hexaship is not a claim that DHL and UPS support every service in every country or postal code.
- Sandbox adapters do not send production carrier traffic.
- A label ref is not final proof of delivery.
- A rate ref is not a carrier SLA.

## Next Build Step

Wire this facade into `@hexaship/js` so developers can call the five common methods from the SDK while the local sandbox continues to avoid production DHL/UPS traffic.
