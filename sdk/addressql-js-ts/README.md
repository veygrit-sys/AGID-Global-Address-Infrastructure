# AddressQL TypeScript SDK v0.4 + P1 API Client

Local-first SDK for AddressQL country, postal, normalization, matching,
distance, and delivery decision support.

```ts
import { postalValidate, deliveryAvailable } from "@addressql/sdk";

postalValidate("1000001", "JP");
deliveryAvailable("JP", "1000001", "synthetic_carrier");
```

This package uses synthetic fixtures only.  It does not call hosted APIs and it
does not prove residence, identity, or carrier SLA.

The local fixture functions now expose format support only. They never promote
synthetic fixture rows into postal-existence or delivery evidence.

For the P1 self-hosted API:

```ts
import { AddressQlApiClient } from "@addressql/sdk";

const addressql = new AddressQlApiClient({
  baseUrl: "http://127.0.0.1:8787",
  timeoutMs: 5000,
});

const result = await addressql.validatePostal({
  countryCode: "JP",
  postalCode: "1000001",
  purpose: "format",
});

const languageRoute = await addressql.assessMultilingual({
  countryCode: "JP",
  sourceLanguage: "ja",
  targetLanguage: "en",
  purpose: "international-shipping",
});
```

The client sends no credentials by default, applies an abort timeout, and
throws `AddressQlApiError` for non-2xx responses. The server response does not
reflect the submitted postal code. Multilingual assessment sends language
metadata only and does not send or transform address text.
