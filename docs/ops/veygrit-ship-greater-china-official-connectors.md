# Veygrit Ship: Greater China direct official carrier connectors

This release adds two server-side adapters that call private carriers in
Greater China directly. No multi-carrier shipping aggregator is used.

## SF Express OpenAPI

- Region: Greater China and SF Express international network
- Sandbox: `https://sfapi-sbox.sf-express.com/std/service`
- Production: `https://sfapi.sf-express.com/std/service`
- Authentication: SF-issued partner ID and checkword, resolved only by the
  server secret provider
- Transport: UTF-8 form POST to the unified service endpoint
- Signature: Base64 of the raw MD5 digest of the form-encoded
  `msgData + timestamp + checkword` value, as required by SF Express
- Operations implemented:
  - freight query: `EXP_RECE_QUERY_SFWAYBILL`
  - order creation: `EXP_RECE_CREATE_ORDER`
  - order cancellation/update: `EXP_RECE_UPDATE_ORDER`
  - order-result reconciliation: `EXP_RECE_SEARCH_ORDER_RESP`
  - route tracking: `EXP_RECE_SEARCH_ROUTES`
- Safe behavior:
  - freight, order-result, and route reads may retry on 429, timeout, or 5xx
  - order creation and cancellation are never replayed automatically
  - a network failure during a write is returned as `outcomeUnknown`
  - the required MD5 protocol is carried only inside TLS and is never reused as
    a Veygrit authentication mechanism

Official references:

- <https://open.sf-express.com/>
- <https://open.sf-express.com/Api>
- <https://qiao.sf-express.com/doc/download/%E4%B8%B0%E6%A1%A5%E5%B9%B3%E5%8F%B0%E6%96%B0API%E6%8E%A5%E5%8F%A3%E8%A7%84%E8%8C%83.pdf>

## 4PX OpenAPI

- Region: Greater China cross-border logistics
- Sandbox: `https://open-test.4px.com/router/api/service`
- Production: `https://open.4px.com/router/api/service`
- Authentication:
  - direct 4PX merchant apps use server-side App Key and App Secret
  - software-provider apps additionally use the server-side OAuth access token
- Signature: lowercase MD5 of alphabetically sorted common parameters,
  followed by the compact JSON body and App Secret; `access_token` and
  `language` do not participate in signing
- Operations implemented from the official catalog:
  - price calculation: `com.css.price_calculator`
  - direct-shipping order creation: `ds.xms.order.create`
  - direct-shipping order cancellation: `ds.xms.order.cancel`
  - label retrieval: `ds.xms.label.get`
  - tracking: `tr.order.tracking.get`
- Safe behavior:
  - price, tracking, and label reads may retry on 429, timeout, or 5xx
  - create and cancel writes are never replayed automatically
  - regional 4PX gateways can be supplied as HTTPS-only server configuration
  - result `1` and partial result `2` are returned; result `0` is normalized as
    a Veygrit carrier error

Official references:

- <https://open.asia.4px.com/apiInfo/merchant>
- <https://open.asia.4px.com/apiInfo/api>
- <https://open.asia.4px.com/apiInfo/sdk>

## Credential and production boundary

- Browser requests carry only a carrier connection reference.
- PostgreSQL stores only a secret-manager reference.
- Partner IDs, checkwords, App Secrets, OAuth tokens, addresses, tracking
  references, and labels must not enter logs, metrics, analytics, or audit
  details.
- Sandbox remains the default. Production traffic requires carrier approval,
  configured secrets, merchant authorization, and the Veygrit release gate.
- This change does not perform a real carrier transaction.

## Persistence identifiers

| Carrier | Carrier ID | Adapter ID |
| --- | --- | --- |
| SF Express | `sf_express` | `sf-express-openapi-v2` |
| 4PX | `four_px` | `four-px-openapi-v1` |

Apply `db/veygrit-ship-greater-china-official-connectors.postgres.sql` after
the core and other regional connector migrations.
