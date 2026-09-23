# Veygrit Ship: Asia direct official carrier connectors

This release provides eight server-side adapters that call each carrier's official
API directly. No multi-carrier shipping aggregator is placed between Veygrit
Ship and the carrier.

## Supported adapters

### Ninja Van Order API v4.2

- Region: Southeast Asia
- Authentication: OAuth 2.0 client credentials
- Sandbox: `https://api-sandbox.ninjavan.co/sg`
- Production: `https://api.ninjavan.co/{countryCode}`
- Operations implemented:
  - OAuth access-token acquisition and expiry cache
  - order creation
  - order cancellation
  - contract-enabled rating
  - contract-enabled Waybill retrieval
  - contract-enabled PUDO/Ninja Point lookup
  - contract-enabled webhook configuration
  - logout
- Safe behavior:
  - the access token refreshes five minutes before expiry
  - order writes are never retried automatically
  - a network failure during a write is returned as an unknown outcome

Ninja Van requires a sandbox account for test credentials. Production access
and a production client require carrier review/audit. Sandbox always uses the
`sg` URL segment even when localized test addresses are used.

Official reference: <https://api-docs.ninjavan.co/>

### Delhivery B2C API

- Region: India
- Authentication: server-side `Authorization: Token …`
- Staging: `https://staging-express.delhivery.com`
- Production: `https://track.delhivery.com`
- Operations implemented:
  - pincode serviceability
  - contract-issued Waybill allocation
  - shipment manifestation
  - rate calculation
  - order tracking
  - PDF label/packing-slip retrieval
  - contract-enabled pickup, return, NDR, and webhook operations
- Safe behavior:
  - only rate, tracking, and label reads retry on 429, timeout, or 5xx
  - shipment creation is never retried automatically
  - PDF bytes remain a binary server-side document

The Delhivery staging token is issued through the business onboarding contact;
the production token is obtained from Delhivery One. The implementation does
not assume that a zero charge returned by staging is a production quotation.

Official references:

- <https://one.delhivery.com/developer-portal/documents>
- <https://one.delhivery.com/developer-portal/documents/b2c/>
- <https://one.delhivery.com/developer-portal/document/b2c/detail/order-tracking>

### Lalamove API v3

- Region: Asia-Pacific city delivery markets
- Authentication: official lowercase HMAC-SHA256 signature per request
- Sandbox: `https://rest.sandbox.lalamove.com`
- Production: `https://rest.lalamove.com`
- Operations: quotation, immediate/scheduled order, order status/tracking,
  proof-of-delivery state, and webhook configuration
- Safety: reads may retry; order and webhook writes never retry automatically

Official reference: <https://developers.lalamove.com/>

### Aramex AU / NZ MyFastway API

- Region: Australia and New Zealand
- Authentication: OAuth 2.0
- Operations: quote, consignment creation, and PDF label
- Activation boundary: MyFastway supplies environment URLs, OAuth endpoints,
  and enabled routes after contract approval; Veygrit does not guess them

Official reference: <https://www.aramex.co.nz/tools/integrations/business-api/>

### New Zealand Couriers Integration API

- Authentication: OAuth 2.0 client credentials with expiry cache
- Operations: rates, consignment, label retrieval, cancellation request,
  pickup request, service-location/locker lookup, and contract notifications
- Public route templates use `carrierName` and `customerId`; credentials and
  customer identifiers remain server-side

Official references:

- <https://nzcouriers.co.nz/services/api/>
- <https://desk.ci.nzcouriers.co.nz/portal/en/kb/articles/integration-api-technical-documentation-6-6-2025>

### J&T Express Open Platform

- Region: Southeast Asia and Greater China, activated per country company
- Operations: order/shipment and logistics tracking
- Activation boundary: the approved country Open Platform supplies the base
  URL, signing/authentication details, and enabled route contract

Official reference: <https://open.jtexpress.com/>

### SF Express Open Platform

- Region: China and China-origin cross-border delivery
- Authentication: official partner ID + MD5 message digest form contract
- Operations: order creation/cancellation, freight inquiry, order lookup, and
  route tracking

Official reference: <https://open.sf-express.com/Api>

### Yamato Transport B2 Cloud API

- Region: Japan
- Operations: shipment/waybill number issuance, label workflow, and approved
  pickup-point extensions
- Activation boundary: corporate review is required and Yamato supplies the
  environment/route specification. Production is not inferred from the public
  overview and remains disabled until approval.

Official references:

- <https://business.kuronekoyamato.co.jp/service/lineup/b2api/index.html>
- <https://business.kuronekoyamato.co.jp/service/lineup/business_members/api/pickup/index.html>

## Credential and production boundary

- Browser requests contain only a carrier connection reference.
- PostgreSQL stores only a Secrets Manager reference, not the token or client
  secret.
- Carrier credentials are resolved inside the server connector.
- Logs, metrics, and audit details must not include credentials, addresses,
  labels, waybills, or raw carrier payloads.
- Production traffic remains disabled until a merchant connection is approved,
  its secret reference resolves, and carrier production access is confirmed.

## Persistence identifiers

| Carrier | Carrier ID | Adapter ID |
| --- | --- | --- |
| Ninja Van | `ninja_van` | `ninja-van-order-v4.2` |
| Delhivery | `delhivery` | `delhivery-b2c-v1` |
| Lalamove | `lalamove` | `lalamove-v3` |
| Aramex AU / NZ | `aramex_anz` | `aramex-anz-myfastway-v1` |
| New Zealand Couriers | `nz_couriers` | `nz-couriers-integration-v1` |
| J&T Express | `jt_express` | `jt-open-platform-v1` |
| SF Express | `sf_express` | `sf-express-openapi-v2` |
| Yamato Transport | `yamato` | `yamato-b2-cloud-v1` |

Apply `db/veygrit-ship-asia-official-connectors.postgres.sql` after the core,
Americas, and Europe migrations, then apply
`db/veygrit-ship-asia-pacific-expansion-official-connectors.postgres.sql`.
