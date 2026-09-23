# Veygrit Ship: major European market strengthening

## Added direct official adapters

| Market | Carrier | Carrier ID | Adapter ID | Official source |
| --- | --- | --- | --- | --- |
| Germany | DHL Parcel DE | `dhl_parcel_de` | `dhl-parcel-de-shipping-v2` | <https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2> |
| France | La Poste Colissimo | `colissimo` | `colissimo-sls-v3` | <https://developer.laposte.fr/catalog-apis/colissimo%401> |
| Italy | Poste Italiane | `poste_italiane` | `poste-delivery-business-v1` | <https://business.poste.it/professionisti-imprese/prodotti/poste-delivery-business-express.html> |
| Spain | Correos | `correos` | `correos-oauth-api-v1` | <https://www.correos.es/es/en/companies/e-commerce/reinforce-your-ecommerce-logistics/api-integration> |
| Netherlands | PostNL | `postnl` | `postnl-shipment-v4` | <https://developer.postnl.nl/integration-with-postnl/api-overview/send-and-track/shipping-webservice/> |
| Belgium | bpost | `bpost` | `bpost-shipping-manager-v3` | <https://bpost.freshdesk.com/support/solutions/articles/4000082901-how-do-i-integrate-my-e-commerce-environment-to-bpost-> |

Existing Royal Mail, Yodel, DPD, GLS, Hermes Germany, Mondial Relay, InPost,
Packeta, Paack, DSV, GEODIS, DACHSER and other European adapters remain active
in the same server-side carrier registry.

## DHL Parcel DE implementation

The DHL Parcel DE adapter follows the official REST v2 resources:

- `POST /orders` for validation and shipment/return creation;
- `GET /orders` for labels and export documents;
- `DELETE /orders` for cancellation;
- `POST /manifests` for end-of-day processing;
- `GET /manifests` for manifest documents.

Sandbox traffic uses `https://api-sandbox.dhl.com/parcel/de/shipping/v2`.
Production traffic uses `https://api-eu.dhl.com/parcel/de/shipping/v2`.

The connector accepts only a cached bearer token. API keys, client secrets,
business-customer usernames and passwords remain in the configured secret
manager and token worker. They are never accepted from a browser shipment
payload.

## Contract-routed adapters

Colissimo, Poste Italiane, Correos, PostNL and bpost issue some URLs, API
versions and enabled operations according to the merchant contract. Veygrit
therefore does not guess those values. After secret resolution, the server
creates a contract config containing:

- carrier-issued sandbox and production HTTPS hosts;
- approved routes and methods;
- server-only authentication;
- fixed account fields required by the official specification;
- safe retry classification for each operation.

Correos uses its official OAuth 2.0 onboarding. PostNL Shipment/Return v4 is the
preferred target for new integrations. Colissimo targets the current SLS v3
label service rather than the retiring v1/v2 path.

## Safety and release requirements

- Production is disabled until carrier acceptance testing is complete.
- Safe reads can retry `429`, timeout and `5xx`; shipment, void, pickup and
  manifest writes do not retry when the result may be unknown.
- PostgreSQL stores only the external secret reference.
- Labels and customs documents must go directly to private object storage.
- Webhook signature verification and replay prevention are mandatory where
  supported.
- Product/service IDs are stored as carrier codes, not translated display
  names.
- Live shipments require an authenticated merchant, active carrier connection,
  idempotency key and explicit authorization.
