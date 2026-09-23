# Veygrit Ship — Sub-Saharan Africa strengthening

## Scope

This wave adds direct carrier-owned connections only. Multi-carrier shipping
aggregators are deliberately excluded.

| Carrier | Primary market | Adapter status | Enabled operations |
| --- | --- | --- | --- |
| Fez Delivery | Nigeria | Published sandbox/order routes | Shipment, tracking |
| Haulstow | Ghana / Accra | Published production routes | Rate, shipment, void, tracking |
| Kwik Delivery | Nigeria | Carrier-contract routes | Rate, shipment, void, tracking |
| GIG Logistics | Nigeria | Carrier-contract routes | Rate, shipment, tracking |
| Dodo | Tanzania | Carrier-contract routes | Shipment, tracking |

Existing Southern and Eastern Africa connectors remain available for
Collivery, RAM Couriers, The Courier Guy, Pargo, and Lilwa Delivery.

## Route evidence

- Fez Business API publishes its sandbox base URL, `POST /order`, authentication
  headers, and `GET /order/track/{orderNumber}`:
  <https://fez-delivery-co.gitbook.io/fezcorporate-api-docs>
- Haulstow publishes its partner base URL, API-key header, quote, create-order,
  status, cancel, address lookup, and webhook contract:
  <https://www.haulstow.co/docs/api>
- Kwik advertises a carrier-owned API for business integration. The concrete
  host/path values must be taken from the merchant's current contract:
  <https://kwik.delivery/home/developer/>
- GIG Logistics advertises direct shipping and tracking APIs, with onboarding
  handled by its enterprise team:
  <https://giglogistics.com/developer/>
- Dodo advertises a direct merchant REST API for delivery creation, tracking,
  and callbacks. Its team supplies the integration contract:
  <https://dodo.co.tz/>

## Security boundary

- Carrier credentials are resolved only from the merchant's secret reference.
- Credential values, addresses, labels, and tokens must never enter browser
  payloads, analytics, or logs.
- Contract adapters validate both sandbox and production roots as HTTPS.
- Unknown shipment or cancellation outcomes are not retried automatically.
- Labels and address-bearing documents stay in protected object storage.

## Go-live prerequisites

1. Complete the carrier's business/KYC onboarding.
2. Store credentials in the configured secret manager and persist only the
   secret reference in PostgreSQL.
3. Enter carrier-issued sandbox and production roots for contract adapters.
4. Run sandbox contract tests and webhook signature tests.
5. Obtain explicit approval before sending any production carrier request.

The included PostgreSQL migration is prepared but is not automatically applied
to any database.
