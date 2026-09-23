# Veygrit -ship: UPS / DHL waybill address adapter

## Scope

The first adapter release is deliberately limited to US addresses. It converts the address already registered in the Address Element / Address Wallet model into private carrier request fragments:

- UPS Shipping API: `ShipFrom` or `ShipTo`
- DHL Express MyDHL API: `shipperDetails` or `receiverDetails`

It does not create a shipment, buy a label, or send carrier traffic. Carrier credentials remain separate from address conversion, and live traffic stays disabled by default.

## Environment

Copy `config/carriers.example.env` to the ignored root `.env` for local development, or enter the same keys in the deployment secret store. The server loads `.env` at startup. Do not put real values in git. The conversion endpoint is disabled until `VEYGRIT_CARRIER_INTERNAL_API_KEY` is set.

UPS requires a UPS developer application, OAuth Client ID / Client Secret, and a shipper account number. DHL Express requires an active customer account and MyDHL BasicAuth credentials supplied through DHL onboarding.

## Internal request

`POST /api/internal/carriers/waybill-address/convert`

Header:

```text
x-veygrit-internal-key: <server-side secret>
```

Body:

```json
{
  "role": "receiver",
  "address": {
    "recipient": "Avery Johnson",
    "organization": "Veygrit Store",
    "countryCode": "US",
    "postcode": "94107-1234",
    "state": "CA",
    "city": "San Francisco",
    "street": "Brannan Street",
    "houseNumber": "548",
    "building": "Warehouse North",
    "unit": "Dock 3",
    "phone": "+1 415 555 0100",
    "email": "shipping@example.com",
    "residential": false
  }
}
```

The response contains raw carrier-ready address fragments. It is private material: do not return it through merchant callbacks, browser SDKs, webhooks, or logs. Public shipment APIs should continue to exchange only `recipientId`, `walletConsentRef`, and safe carrier references.

## Conversion rules

- Unicode is normalized with NFKC, control characters are removed, and whitespace is collapsed.
- US state and ZIP / ZIP+4 formats are validated.
- UPS receives a 5- or 9-digit ZIP without a hyphen; DHL receives canonical ZIP or ZIP+4.
- US phone numbers become the UPS 10-digit national form and the DHL `+1` E.164 form.
- Address lines are reflowed at word boundaries to UPS 35-character and DHL 45-character limits.
- No field is silently truncated. More than three resulting address lines or an overlong unsplittable token returns a validation error.
- UPS residential and PO box indicators are added when applicable.

## Verification

```powershell
npx tsx --test src/lib/carrierWaybillAddress.test.ts src/server/routes/carrierWaybillAddressRoutes.test.ts
npm run check:carrier-live-readiness
```

The readiness command is expected to remain blocked until account credentials are present. Do not enable `HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED` merely to make that command green.

## Official specifications

- UPS Shipping OpenAPI: https://raw.githubusercontent.com/UPS-API/api-documentation/main/Shipping.yaml
- UPS API credentials FAQ: https://developer.ups.com/support
- DHL Express MyDHL API: https://developer.dhl.com/api-reference/dhl-express-mydhl-api
