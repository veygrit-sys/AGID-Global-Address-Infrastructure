# Skipship JS

Minimal TypeScript client skeleton for the Skipship Delivery Gateway facade.

```ts
import { createSkipshipClient } from "@skipship/js";

const skipship = createSkipshipClient({
  baseUrl: "https://api.veygrit.example",
  publishableKey: "pk_test_synthetic",
  transport: async request => fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(request.body),
  }).then(async response => ({
    status: response.status,
    body: await response.json(),
  })),
});

const shipment = await skipship.createShipment({
  recipientId: "ship_recipient_synthetic_001",
  addressFormVersion: "wallet_country_form_ref_synthetic_001",
  parcelProfileRef: "parcel_profile_synthetic_small_box_001",
  walletConsentRef: "consent_synthetic_skipship_001",
  servicePreference: "cheapest",
});
```

The SDK only accepts references. `addressFormVersion` is the Address Wallet
country-form version ref used before server-side carrier label mapping. Raw
address text, recipient contact material, carrier credentials, raw labels,
private keys, and proof secrets are rejected before transport.

## Local Smoke

The package includes a synthetic fixture for the OpenAPI surface:

```text
fixtures/create-shipment-sandbox-v0.1.json
```

Run:

```bash
npm run verify:skipship-js
```

The smoke checks that `createShipment()` calls `POST /v1/shipments`, sends only
reference fields, returns safe shipment refs, and never uses production carrier
traffic.
