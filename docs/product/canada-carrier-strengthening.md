# Canada Carrier Strengthening

Canada Carrier Strengthening makes Canada first-class inside Vey / Hexaship.

The strategy is:

- UPS default for Canada domestic and North America operations.
- DHL Express as a runtime candidate for express and CA-US cross-border flows.
- Canada postal/province validation is required before Canada domestic rating.
- Cross-border flows require `customsIntentRef` before carrier allocation.
- `productionTraffic`: `false`

## Lanes

| Lane | Primary carrier | Runtime candidates | Purpose |
| --- | --- | --- | --- |
| `ca-domestic-standard` | UPS | UPS | standard and cheapest Canada domestic path |
| `ca-domestic-express` | UPS | UPS, DHL | fastest Canada domestic comparison |
| `ca-us-cross-border` | UPS | UPS, DHL | Canada-US and US-Canada commerce |
| `ca-return` | UPS | UPS | return-first flow |
| `ca-postal-validation` | UPS | UPS | postal/province validation-first flow |

## Required Wallet Fields

Canada Address Wallet capture requires:

- `recipient`
- `countryCode`
- `postalCode`
- `province`
- `city`
- `street`

Merchant-facing APIs should carry refs:

- `recipientId`
- `walletConsentRef`
- `parcelProfileRef`
- `carrierCapabilityRef`
- `postalValidationRef`
- `customsIntentRef` for CA-US / US-CA cross-border flows

## Selection Policy

| Objective | First choice | DHL treatment |
| --- | --- | --- |
| `cheapest` | UPS | runtime candidate only |
| `fastest` | UPS | DHL Express candidate after service availability |
| `balanced` | UPS | use DHL only if runtime capability improves ETA/risk |
| `returns_first` | UPS | runtime candidate only |
| `cross_border` | UPS | DHL Express candidate after customs + service gates |

## Blocked Material

The Canada layer rejects:

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
- `myDhlPassword`
- `basicAuthHeader`
- `customsDescription`
- `rawCustomsPayload`
- `rawLabelPayload`
- `rawTrackingPayload`
- `rawCarrierPayload`

## Non-Claims

- Canada strengthening is not a live UPS or DHL service guarantee.
- DHL is treated as an Express and cross-border runtime candidate, not the default Canada domestic carrier.
- Rates, labels, tracking, returns, customs, and pickup outcomes must be checked server-side at runtime.

## Next Build Step

Connect this Canada plan into Merchant Console so merchants see UPS as the default Canada path, DHL Express as a runtime candidate, and `postalValidationRef` / `customsIntentRef` requirements before requesting rates.
