# Veygrit Ship — Americas expansion official connectors

## Scope

This release adds nine direct carrier adapters. No third-party shipping
aggregator is used.

| Priority | Carrier | Initial market | Adapter ID | Implemented operations |
| --- | --- | --- | --- | --- |
| P1 | Chilexpress | Chile | `chilexpress-rest-v1` | Coverage/address validation, rates, shipment and label, tracking |
| P1 | Coordinadora | Colombia | `coordinadora-clientes-v1` | OAuth, guide/PDF creation, tracking |
| P1 | OCA | Argentina | `oca-epak-v1` | Rates, shipment, PDF/ZPL labels, cancellation, tracking, reverse logistics |
| P2 | 99minutos | Mexico, Colombia, Chile, Peru | `99minutos-v3` | Location validation, country/service rates, orders, labels, cancellation, tracking |
| P2 | Redpack | Mexico | `redpack-official-v1` | Insured waybill creation, labels and tracking through contract-issued routes |
| P2 | Estafeta | Mexico | `estafeta-label-rest-v1` | REST label/shipment creation and tracking through the contracted API version |
| P2 | Jadlog | Brazil | `jadlog-embarcador-v2.3` | Rates, order creation/cancellation and tracking |
| P2 | Total Express | Brazil | `total-express-official-v1` | Rates, orders, pickups, labels and tracking through contract-issued routes |
| P2 | Roadie | United States | `ups-roadie-v1` | Estimates, shipment management, barcode labels, cancellation and tracking |

Roadie is presented as a UPS group extension in product navigation. It retains
the distinct `roadie` carrier ID so credentials, rate limits, metrics and
incidents cannot be confused with the UPS small-package APIs.

## Public specification mapping

- Chilexpress uses the official subscription-key header and the documented
  sandbox/production hosts. The public rating route is configured by default.
  Product paths for georeference, shipment, label and tracking must be copied
  exactly from the merchant's subscribed products in the
  [Chilexpress developer portal](https://developers.wschilexpress.com/).
- Coordinadora uses OAuth 2.0 client credentials and the official
  `/clientes/guia` and `/clientes/tracking` integration routes documented in
  the [Coordinadora developer guide](https://developers-dev.coordinadora.com/api/161?spec=external).
- OCA uses the QA/production ePak ASMX operations from the
  [official ePak reference](https://developers.oca.com.ar/epak.html).
  `labelFormat` selects `pdf_a4`, `pdf_10x15` or `zpl`; return requests use the
  official reverse-logistics fields in the server-created shipment document.
- 99minutos uses V3 OAuth, rates, locations, orders, guide documents,
  cancellation and tracking routes from the
  [99minutos developer documentation](https://developers.99minutos.com/).
  Country and service codes remain carrier product codes, never translated
  display names.
- Jadlog uses the official Embarcador v2.3 endpoints published by
  [Jadlog Integrações](https://integracoes.jadlog.com.br/integracao-por-api/).
- Estafeta uses the OAuth flow described by the
  [official Label REST reference](https://disenoweb.estafeta.com/ELRest/EN/WSEL_REST_EN.pdf).
  The label/tracking paths are mandatory configuration because the enabled
  API version and commercial product determine the merchant's official route.
- Roadie uses the estimates, shipments and label resources in the
  [Roadie API documentation](https://docs.roadie.com/). The merchant must
  provide the sandbox and production API hosts issued during onboarding.

Redpack and Total Express do not publish a stable, unrestricted route catalog
for every merchant product. Their connector factories therefore require the
official QA/production hosts and operation paths issued in onboarding. The
application rejects non-HTTPS endpoints and never guesses a carrier URL.

## Shared execution policy

- Carrier secrets enter only through a server-side connector constructor after
  secret-provider resolution.
- PostgreSQL stores only the `credential_secret_ref` and the final four
  account characters where applicable.
- Shipment, return, cancellation and pickup calls require a Veygrit
  idempotency key at the common adapter boundary.
- Safe reads (address validation, rates, labels and tracking) retry bounded
  `429`, timeout and `5xx` failures.
- A shipment, cancellation, return or pickup request with an unknown outcome
  is not replayed automatically. It enters carrier reconciliation.
- Labels stay in protected object storage and are not written to logs,
  analytics or public Sites storage.
- Sandbox is the default. Production traffic remains disabled until the
  carrier connection, secret reference and merchant approval are all active.

## Production prerequisites

1. Sign the direct merchant/carrier agreement for the relevant country.
2. Obtain the official sandbox credentials, product/service codes and API
   routes from that carrier.
3. Store credentials in AWS Secrets Manager, GCP Secret Manager, Azure Key
   Vault or an equivalent server vault.
4. Configure a `CarrierConnection` with only the vault reference.
5. Run address/rate/tracking contract tests, then one explicitly authorized
   sandbox shipment.
6. Enable production only after webhook/tracking reconciliation, label storage,
   cancellation and carrier-error monitoring are verified.

The repository contains no live credentials, addresses, tracking numbers or
label artifacts and does not perform real carrier transactions.
