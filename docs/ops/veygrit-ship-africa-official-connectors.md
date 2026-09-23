# Veygrit Ship: Africa direct official carrier connectors

This release adds five server-side carrier connections that call African private carriers
directly. No multi-carrier shipping aggregator is used.

## Pargo Simba API

- Region: Southern Africa
- Sandbox: `https://api.staging.pargo.co.za`
- Authentication: Pargo OAuth 2.0 username/password exchange with access-token
  and refresh-token caching
- Operations implemented:
  - quotation
  - order creation
  - return-order creation
  - cancellation through the order update contract
  - order-label retrieval
  - pickup-point search
  - Route Guide address autocomplete when the approved contract path is configured
  - inbound webhook validation and normalization
- Safe behavior:
  - tokens refresh five minutes before expiry
  - quotation and label reads may retry on 429, timeout, or 5xx
  - order creation, return, and cancellation are never replayed automatically
  - Pargo's production hostname must be supplied from commercial onboarding;
    the adapter does not guess it

Official references:

- <https://docs.pargo.co.za/>
- <https://helpdesk.pargo.co.za/portal/en/kb/articles/connecting-my-store-using-the-pargo-api>

## The Courier Guy V2

- Region: South Africa
- Production API: `https://api.portal.thecourierguy.co.za/v2`
- Authentication: server-side Bearer API key
- Operations implemented:
  - rate retrieval
  - shipment creation
  - return shipment creation
  - tracking by tracking reference
  - label retrieval
  - Locker/PUDO D2D, D2L, L2D, and L2L service modes
  - locker lookup, Locker/PUDO cancellation, tracking, label, and proof of delivery
- Safe behavior:
  - rate, tracking, and label reads may retry on 429, timeout, or 5xx
  - shipment and return writes are never replayed automatically
  - sandbox mode requires the API hostname issued for the sandbox account;
    it cannot silently fall back to the production API

The endpoint and Bearer contract are aligned with The Courier Guy's official
WooCommerce plugin version 5.5.2. Sandbox accounts and API keys are separately
issued by The Courier Guy.

Official references:

- <https://thecourierguy.co.za/business-courier-services/>
- <https://wordpress.org/plugins/the-courier-guy/>
- <https://api-tcg.co.za/>
- <https://api-sandbox.pudo.co.za/>

## Collivery V3

- Production API: `https://api.collivery.co.za/v3`
- Authentication: server-only `api_token` query authentication plus the required
  `X-App-*` integration headers
- Operations: quote, waybill create/update, cancel (`status_id=5`), PDF/ZPL
  label, tracking, and proof of delivery
- Sandbox requires an explicit Collivery-issued HTTPS host. Writes are never
  replayed after an unknown network result.

Official reference: <https://collivery.net/integration/api/v3/>

## RAM Hand-to-Hand Couriers

- Supports RAM's contract-issued REST and SOAP surfaces in one adapter.
- Operations can include quote, consignment registration/cancellation, label,
  and shipment history.
- Routes and authentication remain explicit because RAM issues the applicable
  endpoints and account fields during commercial onboarding.
- SOAP action headers and XML encoding are supported; unknown writes are not retried.

Official references:

- <https://portal.ram.co.za/DataServices/RAMCPShipperService.asmx?op=ProcessConsignment>
- <https://api-parcelninja.ram.co.za/>

## Lilwa Delivery V2

- Production API: `https://api.lilwadelivery.com/v2`
- Operations: delivery creation, real-time tracking, and ETA calculation
- Production construction is blocked until both the operator identity and
  carrier contract are explicitly verified.
- Sandbox requires a contract-issued HTTPS host and never falls back to production.

Official reference: <https://lilwadelivery.com/api-gateway/>

## Credential and production boundary

- Browser requests carry only a carrier connection reference.
- PostgreSQL stores only a Secrets Manager reference.
- Pargo credentials, refresh tokens, and The Courier Guy API keys stay inside
  the server connector.
- Logs, metrics, and audit details must not contain credentials, addresses,
  labels, tracking references, or raw carrier payloads.
- Production remains disabled until carrier onboarding, secret resolution, and
  the merchant release gate are complete.

## Persistence identifiers

| Carrier | Carrier ID | Adapter ID |
| --- | --- | --- |
| Pargo | `pargo` | `pargo-simba-v1` |
| The Courier Guy + Locker/PUDO | `courier_guy` | `courier-guy-v2` |
| Collivery | `collivery` | `collivery-v3` |
| RAM Couriers | `ram_couriers` | `ram-official-v1` |
| Lilwa Delivery | `lilwa_delivery` | `lilwa-delivery-v2` |

Apply `db/veygrit-ship-africa-expansion-official-connectors.postgres.sql` after
the Asia-Pacific expansion migration.
