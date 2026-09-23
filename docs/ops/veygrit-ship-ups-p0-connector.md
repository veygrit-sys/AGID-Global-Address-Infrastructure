# Veygrit -ship UPS P0 connector

Status: implemented and covered by injected-HTTP tests. No real UPS request or label was sent during implementation.

## Scope

The server-only connector implements the current UPS REST endpoints from the official OpenAPI definitions:

- OAuth Client Credentials: `POST /security/v1/oauth/token`
- Address Validation: `POST /api/addressvalidation/v2/{requestoption}`
- Rating: `POST /api/rating/v2409/{requestoption}`
- Shipment and label creation: `POST /api/shipments/v2409/ship`
- Void: `DELETE /api/shipments/v2409/void/cancel/{shipmentIdentificationNumber}`
- Tracking: `GET /api/track/v1/details/{inquiryNumber}`

References:

- <https://github.com/UPS-API/api-documentation/blob/main/OAuthClientCredentials.yaml>
- <https://github.com/UPS-API/api-documentation/blob/main/AddressValidation.yaml>
- <https://github.com/UPS-API/api-documentation/blob/main/Rating.yaml>
- <https://github.com/UPS-API/api-documentation/blob/main/Shipping.yaml>
- <https://github.com/UPS-API/api-documentation/blob/main/Tracking.yaml>

## Safety model

| Operation | Automatic retry | Reason |
| --- | --- | --- |
| OAuth | 429, timeout/network error, 5xx | Token exchange is safe and cached until shortly before expiry. |
| Address Validation | 429, timeout/network error, 5xx | Read-only carrier operation. |
| Rating | 429, timeout/network error, 5xx | Read-only carrier operation. |
| Tracking | 429, timeout/network error, 5xx | Read-only carrier operation. |
| Shipment / Label | None for timeout, 429, or 5xx | A retry could purchase a duplicate label after an ambiguous response. |
| Void | None for timeout, 429, or 5xx | A retry could obscure the carrier's actual void state. |

A single 401 response invalidates the cached bearer token and performs one authenticated retry. UPS rejected that request before authorization, so this does not repeat a successfully authorized mutation.

For Shipment and Void, network timeouts and UPS 5xx responses return `outcomeUnknown: true`. The caller must reconcile the shipment with UPS before any manual resend. This is deliberately different from read-only retry behavior.

Retry delays use capped exponential backoff with jitter and honor `Retry-After`. The default safe-read retry count is three.

## Internal routes

All routes require `x-veygrit-internal-key` and return `Cache-Control: no-store, private`.

- `POST /api/internal/carriers/ups/address-validation`
- `POST /api/internal/carriers/ups/rates`
- `POST /api/internal/carriers/ups/shipments`
- `DELETE /api/internal/carriers/ups/shipments/:shipmentIdentificationNumber`
- `GET /api/internal/carriers/ups/tracking/:inquiryNumber`

POST bodies use this envelope so Veygrit options remain separate from the official UPS JSON body:

```json
{
  "payload": {
    "RateRequest": {}
  },
  "options": {
    "requestOption": "Shop"
  }
}
```

Successful responses use a common envelope:

```json
{
  "ok": true,
  "carrier": "ups",
  "operation": "rating",
  "requestId": "0123456789abcdef0123456789abcdef",
  "status": 200,
  "automaticRetryCount": 0,
  "data": {}
}
```

UPS errors are reduced to a common carrier form containing category, UPS code/message when available, retryability, automatic retry count, and ambiguous-outcome status. OAuth secrets and bearer tokens are never present in the response.

## Environment and release gate

Use `config/carriers.example.env` as the key list. Store populated values in the deployment secret manager, not git or the browser bundle.

The Customer Integration Environment base URL is `https://wwwcie.ups.com`. The production base URL `https://onlinetools.ups.com` fails closed unless `HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED=true`.

`HEXASHIP_UPS_ALLOW_CUSTOM_BASE_URL=true` exists only for controlled local mock servers. It must remain false in deployed environments.

## Verification

Run:

```text
npm run verify:ups-live-connector
```

The suite covers token expiry caching, concurrent token requests, official endpoint paths, bearer headers, 429/5xx retry behavior, `Retry-After`, write non-retry behavior, timeout reconciliation, 401 token refresh, production fail-closed configuration, internal authentication, and common route errors.

## Remaining activation work

1. Put the real UPS Client ID, Client Secret, and six-character UPS account number in the server secret store.
2. Run the test bodies supplied by the UPS Developer Portal against CIE. CIE Address Validation is limited to documented test coverage, including New York and California.
3. Save UPS request IDs and Veygrit idempotency records in the durable shipment database before private beta.
4. Run monitored label creation, tracking, and void reconciliation using test shipments.
5. Enable the production base URL only after the limited-production approval and kill switch are ready.

