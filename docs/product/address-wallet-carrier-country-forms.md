# Address Wallet Carrier Country Forms

Address Wallet Carrier Country Forms is the country-form intake layer for the DHL/UPS MVP.

The goal is to let Address Wallet render the right address form before Hexaship asks DHL or UPS for capability, rates, labels, or pickup.

## MVP Country Set

First captured country forms plus English-speaking and multilingual expansion:

`102 countries`

Base MVP:

`JP, US, DE, FR, GB, CA, AU, MX`

English-speaking form coverage:

`AG, AU, BB, BS, BW, BZ, CA, CY, DM, GB, GD, GH, GM, GY, HK, IE, IN, JM, KE, KN, LC, LR, MT, MW, MY, NA, NG, NZ, PH, RW, SG, SL, TT, TZ, UG, US, VC, ZA, ZM, ZW`

Spanish-speaking form coverage:

`AR, BO, CL, CO, CR, CU, DO, EC, ES, GT, HN, MX, NI, PA, PE, PR, PY, SV, UY, VE`

French-speaking form coverage:

`BE, BF, BJ, CA, CD, CG, CH, CI, CM, FR, GA, GN, LU, MC, ML, NE, SN, TG`

German-speaking form coverage:

`AT, CH, DE, LI, LU`

Portuguese-speaking form coverage:

`AO, BR, CV, GW, MZ, PT, ST, TL`

Major Europe expansion:

`AT, BE, CH, CZ, DK, ES, FI, GR, HU, IT, NL, NO, PL, PT, RO, SE, TR, UA`

These countries are selected for the first Vey / Hexaship MVP because they cover:

- Japan launch needs
- North America UPS/DHL integration pressure
- DHL home-region and EU shipping patterns
- English, Japanese, German, French, and Spanish form paths
- postal-code-heavy and multilingual address formats
- English-speaking checkout expansion across Africa, Americas, Asia, Europe, and Oceania
- Spanish, French, German, and Portuguese checkout expansion
- major European ecommerce country-form coverage

## Carrier Boundary

Form capture is not the same as carrier service availability.

Address Wallet may render a country form from local metadata, but Hexaship must still run a runtime capability check before carrier allocation or label creation.

```text
Address Wallet country form
  -> recipient_id
  -> ShipmentIntent
  -> runtime capability check
  -> carrier allocation
  -> DHL/UPS server-side adapter
```

## User Form To Carrier Label Transform

Users should enter addresses in the familiar country form for their country, not
in a DHL-specific or UPS-specific shape.

The Address Wallet country form remains the source form:

- source mode: user familiar country form
- local country ordering
- native or English labels where available
- local postal code naming
- local state, province, prefecture, or region naming
- street, building, unit, and P.O. Box alternatives

The user never has to choose a DHL or UPS address shape. Address Wallet renders
the familiar country form first, then the Hexaship server adapter generates the
carrier-specific shape during label creation.

When Hexaship creates a label, the server-side carrier adapter converts safe
Address Wallet descriptors into normalized carrier label fields.

Example descriptor mapping:

| Wallet field | DHL label descriptor | UPS label descriptor |
| --- | --- | --- |
| `recipient` | `receiver.contactInformation.contactName` | `Shipment.ShipTo.Name` |
| `countryCode` | `receiver.postalAddress.countryCode` | `Shipment.ShipTo.Address.CountryCode` |
| `postcode` | `receiver.postalAddress.postalCode` | `Shipment.ShipTo.Address.PostalCode` |
| `state` | `receiver.postalAddress.provinceCode` | `Shipment.ShipTo.Address.StateProvinceCode` |
| `city` | `receiver.postalAddress.cityName` | `Shipment.ShipTo.Address.City` |
| `street` | `receiver.postalAddress.addressLine1` | `Shipment.ShipTo.Address.AddressLine.0` |
| `poBox` | `receiver.postalAddress.addressLine1` | `Shipment.ShipTo.Address.AddressLine.0` |

P.O. Box support is form-level support, not a label guarantee. `poBox` can
satisfy the user's street alternative in Address Wallet, and the intake policy
accepts common spellings: `P.O. Box`, `PO Box`, and `P/O Box`. DHL/UPS label
eligibility must still be checked through runtime rating, service availability,
address validation, or shipping APIs before label purchase.

The transform is server-side only. Merchants receive refs such as `recipientId`,
`walletConsentRef`, `carrierCapabilityRef`, and `labelRef`; they do not receive
raw address values, carrier credentials, or raw carrier label payloads by
default.

## Coverage Matrix

The executable coverage matrix summarizes the first DHL/UPS MVP country set without making a live-service claim.

- `countryCount`: `102`
- `countryCodes`: `AG, AO, AR, AT, AU, BB, BE, BF, BJ, BO, BR, BS, BW, BZ, CA, CD, CG, CH, CI, CL, CM, CO, CR, CU, CV, CY, CZ, DE, DK, DM, DO, EC, ES, FI, FR, GA, GB, GD, GH, GM, GN, GR, GT, GW, GY, HK, HN, HU, IE, IN, IT, JM, JP, KE, KN, LC, LI, LR, LU, MC, ML, MT, MW, MX, MY, MZ, NA, NE, NG, NI, NL, NO, NZ, PA, PE, PH, PL, PR, PT, PY, RO, RW, SE, SG, SL, SN, ST, SV, TG, TL, TR, TT, TZ, UA, UG, US, UY, VC, VE, ZA, ZM, ZW`
- `continentCoverage`: Africa, Americas, Asia, Europe, Oceania
- `dhl.capabilityModes`: `global_express_api_available`
- `ups.capabilityModes`: `runtime_capability_check_required`, `street_level_validation_available`
- `ups.streetLevelValidationCountryCodes`: `US`
- `serverSideRuntimeChecksRequired`: `true`
- `localFormOnlyBoundary`: `true`
- `productionTraffic`: `false`

The matrix is a planning and UI-readiness artifact. It does not certify that DHL or UPS can ship every service to every postal code in these countries.

## Country Feature Matrix

For the first MVP country set, Address Wallet and Hexaship expose a common feature vocabulary for DHL and UPS:

| Feature | Merchant-visible | Boundary |
| --- | --- | --- |
| `countryForm` | yes | local Address Wallet form metadata |
| `recipientIdResolution` | no | server-side Address Wallet ref handling |
| `walletConsentHandoff` | no | required before address materialization |
| `getRates` | yes | server-side carrier capability/rating check |
| `createShipment` | yes | server-side connector after consent and allocation |
| `createLabel` | yes | normalized `labelRef`, not raw carrier label payload |
| `trackShipment` | yes | normalized Hexaship shipment status |
| `createReturn` | yes | normalized `returnRef` |
| `pickupRequest` | future | after label/account stability |
| `addressValidation` | no | UPS street-level path starts with US; other countries require runtime carrier checks |

Per-country rows are generated as `102 countries x 2 carriers = 204 rows`.

Initial rows:

- `JP/DHL`, `JP/UPS`
- `US/DHL`, `US/UPS`
- `DE/DHL`, `DE/UPS`
- `FR/DHL`, `FR/UPS`
- `GB/DHL`, `GB/UPS`
- `CA/DHL`, `CA/UPS`
- `AU/DHL`, `AU/UPS`
- `MX/DHL`, `MX/UPS`
- all English-speaking expansion countries listed above, with DHL/UPS runtime checks
- all Spanish/French/German/Portuguese expansion countries listed above, with DHL/UPS runtime checks
- major European expansion countries listed above, with DHL/UPS runtime checks

DHL rows begin from `global_express_api_available` but still require sandbox contract tests and runtime rating/service checks. UPS rows begin from `runtime_capability_check_required`, except `US/UPS`, where `street_level_validation_available` can be used as the first stronger validation path.

Every row keeps:

- `productionTraffic`: `false`
- `countryForm` as the only non-server-side feature
- `rawAddress`, `carrierApiKey`, `proofSecret`, and `privateKey` blocked
- non-claim: row presence is not a live DHL/UPS service guarantee

## Hexaship Preflight Gate

Before `Hexaship.createShipment` can run, Address Wallet should produce a redacted readiness result:

- `recipientId`
- `walletConsentRef`
- `parcelProfileRef`
- `carrierCapabilityRef`
- `addressFormVersion`

The preflight result has four actions:

- `render_wallet_country_form`
- `run_carrier_capability_check`
- `request_wallet_consent`
- `ready_for_hexaship_createShipment`

Only the final action means the EC or Merchant Console can call the Hexaship MVP `createShipment` path. It still does not mean DHL or UPS has purchased a real label; it only means the local refs needed for the server-side connector handoff are present.

## DHL/UPS Sources

The MVP boundary follows the public developer surfaces:

- DHL Express MyDHL API: rating, shipping, pickup, tracking, and service availability for DHL Express account holders.
- DHL Location Finder Unified API: worldwide DHL location discovery for pickup/drop-off and service-point flows.
- UPS Address Validation / Rating / Shipping APIs: address and shipment operations with country/service support verified at runtime.

## Safe Wallet Fields

Safe form-level fields:

- `recipient`
- `countryCode`
- `postcode`
- `state`
- `city`
- `street`
- `houseNumber`
- `building`
- `unit`
- `phone`
- `poBox`

These fields are form descriptors. They are not public payload values by default.

Safe-to-store refs:

- `countryCode`
- `recipient_id`
- `addressFormVersion`
- `carrierCapabilityRef`
- `walletConsentRef`

## Blocked Material

The catalog and browser-side Address Wallet UI must not store or expose:

- `rawAddress`
- `recipientName`
- `recipientPhone`
- `privateDeliveryNotes`
- `proofWitness`
- `proofSecret`
- `privateKey`
- `carrierApiKey`
- `carrierCredential`

Carrier credentials must stay server-side. Raw address material, when needed for a label, should only be released under wallet consent and scoped carrier handoff rules.

## Non-Claims

- This catalog is not a live DHL/UPS service guarantee.
- This catalog is not a carrier rate card.
- This catalog is not a delivery SLA.
- This catalog is not customs clearance.
- Address form completeness is not wallet consent.
- Address form completeness is not AddressQL validation.

## Next Build Step

Wire the catalog into the Address Wallet / Address Element UI so a merchant can request a DHL or UPS shipment for a supported country and receive a safe `recipient_id` plus `addressFormVersion` before any carrier API call is made.
