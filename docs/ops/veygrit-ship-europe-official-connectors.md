# Veygrit Ship — Europe official carrier connectors

These integrations connect directly to carrier-owned APIs. No multi-carrier
shipping aggregator is used.

## Implemented carriers

| Carrier | Initial market | Official API | Implemented operations |
| --- | --- | --- | --- |
| Royal Mail | United Kingdom | Shipping V2 REST and Tracking V2 | Shipment creation, cancellation, label, manifest, tracking |
| InPost | Poland and supported European InPost markets | Shipping V2, Location V1, Returns V1 and OAuth 2.1 | Shipment creation, label, tracking, locker/PUDO search, contract-enabled returns |
| GLS | Contracted GLS European country company | Country API/WebAPI and webhook products | Shipment, label, tracking, proof-of-delivery webhook |
| DPD | Contracted DPD European country company | Country API or DPD Cloud Service | Shipment, label, pickup, tracking, return, pickup-point search |
| Hermes Germany | Germany | HSI shipment/order APIs | Shipment, label, tracking, return, ParcelShop search |
| Paack | Western Europe | Public API V3 | Order registration, label, tracking and delivery state |
| Mondial Relay | France, Benelux and Southern Europe | Web Service/EDI V5 | PUDO search, shipment, label and tracking |
| Packeta / Zásilkovna | Central and Eastern Europe | Packeta SOAP API | Shipment, PDF label, branch/Z-BOX search, tracking, return routing |
| DSV | European origin and international freight | DSV Generic APIs V2 | Quote, booking, label, tracking, webhook and documents |
| GEODIS | Europe and international logistics | GEODIS Transport and WMS APIs | Shipment/confirmation, label, tracking and warehouse order integration |

Royal Mail's official Shipping V2 reference documents `POST /shipments`,
`DELETE /{shipmentNumber}`, label and manifest operations. Tracking is kept on
the separate official Tracking V2 surface:
https://developer.royalmail.net/product/175625/api/76888

InPost's official documentation defines OAuth 2.1 client credentials, separate
stage and production hosts, and organization-scoped Shipping V2 routes:
https://developers.inpost-group.com/authentication
https://developers.inpost-group.com/shipping

## Public specification mapping

- InPost locker/PUDO search uses the unified Location V1 points resource.
  Returns remain a separate scoped product; its approved create route is copied
  from the merchant contract instead of being guessed:
  https://developers.inpost-group.com/versioning
  https://developers.inpost-group.com/returns
- GLS products vary by country company. The connector accepts only the
  carrier-issued HTTPS hosts and routes. Official examples include GLS Denmark
  shipment/label WebAPI and the GLS Netherlands POD webhook:
  https://api.gls.dk/ws/Help
  https://api-portal.gls.nl/content/webhooks.pdf
- DPD country APIs expose shipment, print, pickup, tracking and PUDO resources,
  but hosts and authentication differ by market. Both are merchant contract
  settings:
  https://www.dpd.com/hr/en/developers/
  https://api.dpd.ro/api/docs/
- Hermes Germany documents shipment/order, label, status and return-order
  applications on its own API portal. ParcelShop routes are contract settings:
  https://de-api.hermesworld.com/docs/applications/shipmentinfo
  https://de-api-int.hermesworld.com/docs/applications/order
- Paack Public API V3 provides order create/read operations and OAuth client
  credentials. Sandbox hosts are mandatory settings; the production order
  defaults use the published `/public/v3/orders` resource:
  https://paack.readme.io/reference/orders
  https://paack.readme.io/reference/orders-get
- Mondial Relay uses its carrier-owned ASMX Web Service. The adapter implements
  uppercase MD5 `Security` calculation using the exact field order declared by
  each contracted WSI method:
  https://api.mondialrelay.com/web_services.asmx
  https://storage.mondialrelay.fr/web-service-solution-v514-EN.pdf
- Packeta uses the official SOAP service and keeps product/service identifiers
  as carrier codes. The adapter creates SOAP envelopes server-side for packet,
  PDF label, tracking, cancellation and `createPacketClaimWithPassword`
  returns. Pickup points and Z-BOXes use the API-key-authenticated V5 JSON
  feeds rather than an invented SOAP method:
  https://docs.packeta.com/cs/docs/api-reference/api-methods
  https://docs.packeta.com/docs/packet-tracking/tracking
  https://docs.packeta.com/docs/pudo-delivery/packeta-pudos
- DSV exposes booking, printing, tracking, document and webhook products. The
  demo/QA/production product URLs are configured separately because individual
  APIs can use different hosts:
  https://developer.dsv.com/products
  https://dev.developer.dsv.com/endpoint-update
- GEODIS publishes transport and warehouse APIs. WMS uses the documented QA
  and production gateway plus OAuth; Transport routes remain the merchant's
  subscribed product paths:
  https://developer.geodis.com/
  https://docs.api.geodis.com/

## Security boundary

- Carrier credentials are resolved from a server-side Secret Manager reference.
- Browser payloads cannot provide credentials, tokens or account identifiers.
- The Royal Mail onboarding endpoint and InPost stage endpoint are the defaults.
- GLS, DPD, Hermes, DSV and GEODIS country/product routes are explicit
  contract configuration; a connector cannot silently fall back to a guessed
  route.
- Mondial Relay MD5 keys and Packeta API passwords are held only in the
  server-side secret provider. SOAP bodies and signed form bodies are excluded
  from logs.
- Shipment writes are not automatically replayed after a timeout or network
  failure. Their result is marked unknown for a later carrier reconciliation.
- PDF/ZPL label content must be handed directly to restricted object storage and
  excluded from logs and analytics.

## Production prerequisites

Every carrier requires its own direct merchant agreement, enabled API product,
sandbox or QA credentials, service/product codes and approved production
routes. Royal Mail requires a business account and portal subscription. InPost
requires an organization and OAuth scopes. GLS/DPD country companies, Hermes,
Mondial Relay, Packeta, DSV and GEODIS may require technical certification.
Production is enabled only after those carrier-owned approvals and a
merchant-approved connection are present.

No live shipment, label or production carrier traffic is created by this
implementation.
