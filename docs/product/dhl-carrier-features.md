# DHL Carrier Features

DHL Carrier Features is the DHL-specific adapter surface inside Hexaship / Delivery Gateway.

The adapter keeps MyDHL API details behind the server boundary while exposing the same delivery flow to Vey, Merchant Console, and EC integrations.

## Supported MVP Functions

| Feature | DHL operation shape | Merchant output |
| --- | --- | --- |
| `serviceAvailability` | `mydhl.service.availability` | `serviceAvailabilityRef` |
| `getRates` | `mydhl.rates` | `rateRef`, `priceEstimateRef`, `etaWindowRef` |
| `createShipment` | `mydhl.shipments.create` | `shipmentRef` |
| `createLabel` | `mydhl.shipments.documents` | `labelRef`, `trackingAlias` |
| `trackShipment` | `mydhl.tracking.get` | `trackingReceiptRef`, `eventFingerprint` |
| `createReturn` | `mydhl.returns.create-or-label` | `returnRef`, `returnLabelRef`, `returnTrackingAlias` |
| `pickupRequest` | `mydhl.pickups.create` | `pickupRef` |

## Server-Side BasicAuth Boundary

DHL credentials must stay inside the server connector.

Required server env keys:

- `HEXASHIP_DHL_MYDHL_BASE_URL`
- `HEXASHIP_DHL_MYDHL_USERNAME`
- `HEXASHIP_DHL_MYDHL_PASSWORD`
- `HEXASHIP_DHL_ACCOUNT_NUMBER`

The public API, SDKs, Merchant Console, and fixtures must not accept or display MyDHL passwords, BasicAuth headers, raw DHL payloads, raw DHL documents, or raw recipient address values.

## Safe Inputs

The DHL adapter accepts refs, not private recipient material:

- `countryCode`
- `recipientId`
- `parcelProfileRef`
- `walletConsentRef`
- `carrierCapabilityRef`
- `shipmentRef`
- `rateRef`
- `trackingAlias`
- `pickupWindowRef`
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
- `myDhlPassword`
- `basicAuthHeader`
- `rawLabelPayload`
- `rawTrackingPayload`
- `rawCarrierPayload`

## Runtime Boundaries

- DHL starts from Express service availability and runtime rating checks.
- Country, postal-code, customs, pickup, and service availability must be checked at runtime.
- `productionTraffic`: `false`
- Sandbox refs do not create real DHL labels, pickups, tracking events, returns, or carriage contracts.
- Feature presence is not a live DHL contract or delivery SLA.

## Next Build Step

Connect the DHL feature adapter to the Hexaship carrier allocation path so `carrierPreference: "dhl"` can call the DHL feature module after Address Wallet consent and `carrierCapabilityRef` are present.
