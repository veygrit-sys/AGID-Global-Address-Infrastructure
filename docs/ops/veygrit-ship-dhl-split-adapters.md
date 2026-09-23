# Veygrit -ship DHL split adapters

Status: network-capable adapters implemented and verified with injected HTTP. No live DHL label, manifest, return, or void request was sent.

## Routing policy

Veygrit exposes one server-side Shipment route:

`POST /api/internal/carriers/dhl/shipments`

Default routing:

| Lane | Adapter | Reason |
| --- | --- | --- |
| US to US | DHL eCommerce Americas v4 | US domestic e-commerce parcel flow, manifest, return label, and domestic void support. |
| Any international lane | MyDHL Express 3.3.1 | Global time-definite Express shipment and customs flow. |

`routingMode` can explicitly select an adapter. The response always records `selectedAdapter` and `routingReason`.

## Product identifier rule

The API accepts `productIdCode` and rejects `productName` as an identifier.

- DHL eCommerce Label/Return uses the three-letter `orderedProductId`, for example `GND` or `RGN`.
- MyDHL Express uses `productCode`, commonly a short carrier code such as `P`.
- The carrier-native payload is overwritten with the selected code so a stale name or mismatched code cannot win.
- `veygrit_ship_dhl_product_selection` deliberately has no product-name column.

Production uses `VEYGRIT_SHIP_POSTGRES_URL` or `DATABASE_URL`. Production fails closed without durable storage. Local development can use the in-memory store. Apply `db/veygrit-ship-dhl-product-selection.postgres.sql` as the reviewed migration.

## MyDHL Express adapter

Authentication: pre-emptive BasicAuth using credentials issued separately by DHL Express.

Implemented:

- Shipment and transport-label documents: `POST /shipments`
- International return shipment/label: `POST /shipments` with reverse shipment payload
- Tracking: `GET /shipments/{shipmentTrackingNumber}/tracking`

The current official MyDHL REST 3.3.1 specification does not publish a Shipment Void endpoint. Veygrit returns `DHL_EXPRESS_VOID_NOT_AVAILABLE`; it never invents an upstream request. Pickup cancellation is a separate DHL Express operation and is not treated as shipment void.

Official specification: <https://developer.dhl.com/api-reference/dhl-express-mydhl-api>

## DHL eCommerce Americas v4 adapter

Authentication: OAuth client credentials at `POST /auth/v4/accesstoken`, with expiry-aware, concurrent-safe bearer-token caching. Credentials are sent only server-side. Default refresh skew is 15 minutes, consistent with DHL's recommendation to refresh periodically before the current 60-minute expiry.

Implemented:

- Product Finder: `POST /shipping/v4/products`
- Shipment/Label: `POST /shipping/v4/label`
- Manifest create: `POST /shipping/v4/manifest`
- Manifest status/download: `GET /shipping/v4/manifest/{pickup}/{requestId}`
- Return Label: `POST /returns/v4/label`
- Domestic Void: `DELETE /shipping/v4/label/{pickup}`

Official references:

- <https://developer.dhl.com/api-reference/authentication-dhl-ecommerce-americas>
- <https://developer.dhl.com/api-reference/product-finder-dhl-ecommerce-americas>
- <https://developer.dhl.com/api-reference/label-dhl-ecommerce-americas>
- <https://developer.dhl.com/api-reference/manifest-dhl-ecommerce-americas>
- <https://developer.dhl.com/api-reference/return-label-dhl-ecommerce-americas>

Manifest creation is asynchronous. Store the returned `requestId`, then poll the GET route until the root `status` is `COMPLETED`. Completion means processing ended; inspect `manifestSummary` because individual packages may still be invalid.

Void is limited to an unmanifested US domestic label within DHL's eligibility period. International eCommerce labels and MyDHL Express shipments are rejected by the unified Void method.

## Internal routes

All routes require `x-veygrit-internal-key` and return `Cache-Control: no-store, private`.

- `POST /api/internal/carriers/dhl/shipments`
- `POST /api/internal/carriers/dhl/shipments/returns`
- `DELETE /api/internal/carriers/dhl/shipments/:shipmentRef`
- `POST /api/internal/carriers/dhl/ecommerce/products`
- `POST /api/internal/carriers/dhl/ecommerce/manifests`
- `GET /api/internal/carriers/dhl/ecommerce/manifests/:requestId`

Example unified shipment envelope:

```json
{
  "merchantRef": "merchant_123",
  "shipmentRef": "shipment_123",
  "originCountryCode": "US",
  "destinationCountryCode": "US",
  "productIdCode": "GND",
  "labelFormat": "PDF",
  "payload": {
    "packageId": "ORDER-123-P1",
    "consigneeAddress": {},
    "returnAddress": {},
    "packageDetail": {}
  }
}
```

## Retry and reconciliation

- OAuth, Product Finder, Manifest GET, and Tracking may retry 429, timeout/network failure, and 5xx using capped exponential backoff.
- Label, Manifest creation, Return Label, and Void are never automatically retried after ambiguous failures.
- Ambiguous write failures return `outcomeUnknown: true`.
- For a timed-out eCommerce label request, reconcile using its unique `packageId` before deciding whether to create anything again.

## Activation gate

MyDHL Express credentials do not grant DHL eCommerce Americas access. Complete separate eCommerce onboarding and obtain:

- OAuth Client ID and Client Secret
- pickup account
- distribution center
- enabled Product IDs

Run `npm run verify:dhl-live-connectors`, then use the official sandbox request fixtures before production approval.

