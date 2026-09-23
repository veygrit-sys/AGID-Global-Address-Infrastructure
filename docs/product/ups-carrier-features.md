# UPS Carrier Features

UPS Carrier Features is the UPS-specific adapter surface inside Hexaship / Delivery Gateway.

The adapter keeps UPS differences behind the server boundary while exposing the same delivery flow to Vey, Merchant Console, and EC integrations.

## Supported MVP Functions

| Feature | UPS operation shape | Merchant output |
| --- | --- | --- |
| `addressValidation` | `ups.addressvalidation.validate` | `addressValidationRef` |
| `getRates` | `ups.rating.rate` | `rateRef`, `priceEstimateRef`, `etaWindowRef` |
| `createShipment` | `ups.shipping.shipment` | `shipmentRef` |
| `createLabel` | `ups.shipping.labelImage` | `labelRef`, `trackingAlias` |
| `trackShipment` | `ups.tracking.track` | `trackingReceiptRef`, `eventFingerprint` |
| `createReturn` | `ups.returns.shipment` | `returnRef`, `returnLabelRef`, `returnTrackingAlias` |

## Server-Side OAuth Boundary

UPS credentials must stay inside the server connector.

Required server env keys:

- `HEXASHIP_UPS_BASE_URL`
- `HEXASHIP_UPS_CLIENT_ID`
- `HEXASHIP_UPS_CLIENT_SECRET`
- `HEXASHIP_UPS_ACCOUNT_NUMBER`

The public API, SDKs, Merchant Console, and fixtures must not accept or display OAuth client secrets, bearer tokens, raw UPS payloads, raw labels, or raw recipient address values.

## Safe Inputs

The UPS adapter accepts refs, not private recipient material:

- `countryCode`
- `recipientId`
- `parcelProfileRef`
- `walletConsentRef`
- `carrierCapabilityRef`
- `shipmentRef`
- `rateRef`
- `trackingAlias`
- `reasonCode`
- `servicePreference`
- `labelFormat`

## Blocked Material

The adapter rejects:

- `rawAddress`
- `addressLine1`
- `addressLine2`
- `recipientName`
- `recipientPhone`
- `phone`
- `privateDeliveryNotes`
- `proofWitness`
- `proofSecret`
- `privateKey`
- `carrierApiKey`
- `carrierCredential`
- `carrierSecret`
- `clientSecret`
- `accessToken`
- `rawLabelPayload`
- `rawTrackingPayload`
- `rawCarrierPayload`

## Runtime Boundaries

- `US` can use the stronger UPS street-level validation path in the MVP.
- Non-US countries still require runtime capability, rating, and service checks.
- `productionTraffic`: `false`
- Sandbox refs do not create real UPS labels, pickups, tracking events, or returns.
- Feature presence is not a live UPS contract or delivery SLA.

## Next Build Step

Connect the UPS feature adapter to the Hexaship carrier allocation path so `carrierPreference: "ups"` can call the UPS feature module after Address Wallet consent and `carrierCapabilityRef` are present.
