# US Domestic Carrier Strengthening

US Domestic Carrier Strengthening makes the United States domestic path first-class inside Vey / Hexaship.

The strategy is:

- UPS default for US domestic shipping.
- DHL runtime candidate for express comparison only after DHL service availability passes.
- Address Wallet must produce US country-form refs before any carrier operation.
- UPS address validation is required before US domestic rating.
- `productionTraffic`: `false`

## Lanes

| Lane | Primary carrier | Runtime candidates | Purpose |
| --- | --- | --- | --- |
| `us-domestic-ground` | UPS | UPS | standard and cheapest domestic path |
| `us-domestic-express` | UPS | UPS, DHL | fastest comparison with DHL runtime candidate |
| `us-domestic-return` | UPS | UPS | returns-first flow |
| `us-domestic-validation` | UPS | UPS | street-level validation-first flow |

## Required Wallet Fields

US domestic Address Wallet capture requires:

- `recipient`
- `countryCode`
- `postcode`
- `state`
- `city`
- `street`

Merchant-facing APIs should carry refs:

- `recipientId`
- `walletConsentRef`
- `parcelProfileRef`
- `carrierCapabilityRef`
- `addressValidationRef`

## Selection Policy

| Objective | First choice | DHL treatment |
| --- | --- | --- |
| `cheapest` | UPS | runtime candidate only |
| `fastest` | UPS | compare only after DHL service availability passes |
| `balanced` | UPS | use DHL only if runtime capability improves ETA/risk |
| `returns_first` | UPS | runtime candidate only |
| `validation_first` | UPS | runtime candidate only |

## Blocked Material

The US domestic layer rejects:

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
- `rawLabelPayload`
- `rawTrackingPayload`
- `rawCarrierPayload`

## Non-Claims

- US domestic strengthening is not a live UPS or DHL service guarantee.
- DHL is treated as a runtime candidate, not the default US domestic carrier.
- Rates, labels, tracking, returns, and pickup outcomes must be checked server-side at runtime.

## Next Build Step

Connect this US domestic plan into Merchant Console so merchants see the UPS default path, the DHL runtime-candidate note, and the required `addressValidationRef` before requesting domestic rates.
