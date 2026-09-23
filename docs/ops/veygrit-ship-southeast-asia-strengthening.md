# Veygrit Ship — Southeast Asia strengthening

This wave extends the existing direct Ninja Van, Lalamove, J&T Express, JNE
and GDEX coverage. It does not use a third-party shipping aggregator.

## Added carrier boundaries

| Carrier | Initial market | Adapter | Route source | Current boundary |
|---|---|---|---|---|
| GHN | Vietnam | `ghn-public-api-v2` | Carrier-published fixed sandbox and production routes | Rate, shipment, status, return and cancel |
| GHTK | Vietnam | `ghtk-openapi-v1.5` | Carrier-published production routes | Rate, shipment, PDF label, status and cancel |
| GrabExpress | Southeast Asian Grab markets | `grabexpress-contract-v1` | Carrier-issued merchant integration | Contract routes only |
| GoSend | Indonesia | `gosend-contract-v1` | NDA, staging/UAT, then production credentials | Contract routes only |
| Flash Express | Southeast Asian Flash markets | `flash-express-contract-v1` | Country-specific business onboarding | Contract routes only |

## Security and execution rules

- The browser never receives carrier tokens, partner codes or account data.
- PostgreSQL stores only `credential_secret_ref`, not the credential value.
- Carrier-issued endpoints must be HTTPS.
- Rate and tracking reads may retry `429`, timeout and `5xx`.
- Shipment, return and cancel calls are not automatically replayed when their
  outcome is unknown.
- Binary PDF/ZPL responses remain bytes for the private label storage path;
  they are not parsed, logged or sent to analytics.
- No production traffic is enabled by adding an adapter. A merchant account,
  active Carrier Connection, secret-provider lookup and explicit live-mode
  authorization are still required.

## Carrier onboarding prerequisites

### GHN

Resolve `Token` and `ShopId` from the server-side secret provider. GHN publishes
separate fixed development and production gateways. Label rendering is a
two-step token/download flow and remains outside the single-request connector
until the label object-storage handoff owns the complete transaction.

### GHTK

Resolve `Token` and `X-Client-Source` from the server-side secret provider.
Production defaults to the public GHTK service host. Sandbox intentionally has
no guessed default; supply the HTTPS hostname issued during onboarding.

### GrabExpress, GoSend and Flash Express

Configure only paths, authentication and environment URLs issued by the carrier.
GoSend specifically requires NDA, staging credentials, UAT and production
activation. Until onboarding is complete, these adapters remain configured but
do not send traffic.

## Official references

- [GHN API documentation](https://api.ghn.vn/home/docs)
- [GHN create order](https://api.ghn.vn/home/docs/detail?id=63)
- [GHN cancel order](https://api.ghn.vn/home/docs/detail?id=73)
- [GHN return order](https://api.ghn.vn/home/docs/detail?id=72)
- [GHN print order](https://api.ghn.vn/home/docs/detail?id=100)
- [GHTK OpenAPI](https://api.ghtk.vn/en/)
- [GHTK create order](https://api.ghtk.vn/en/docs/submit-order/submit-order-express/)
- [GHTK calculate fee](https://api.ghtk.vn/en/docs/submit-order/calculate-shipping-fee/)
- [GHTK order status](https://api.ghtk.vn/en/docs/submit-order/tracking-status/)
- [GHTK webhook](https://api.ghtk.vn/en/docs/submit-order/webhook/)
- [GrabExpress API](https://help.grab.com/merchant/en-my/20000180-GrabExpress-API)
- [GoSend API](https://www.gojek.com/en-id/gosend/api)
- [GoSend API FAQ](https://www.gojek.com/en-id/gosend/api/faq)
- [Flash Express](https://www.flashexpress.com/)
