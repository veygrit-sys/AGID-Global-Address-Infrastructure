# Veygrit Ship — Medium-country Europe strengthening

Veygrit Ship connects directly to carrier-owned APIs. No multi-carrier shipping
aggregator is used in this expansion.

## Added carriers

| Market | Carrier | Carrier ID | Adapter ID | Default integration boundary |
| --- | --- | --- | --- | --- |
| Nordic region | PostNord | `postnord` | `postnord-booking-contract-v1` | Carrier-issued hosts, auth and routes |
| Switzerland | Swiss Post | `swiss_post` | `swiss-post-digital-commerce-v1` | Fixed Digital Commerce label endpoint |
| Austria | Austrian Post | `austrian_post` | `austrian-post-contract-v1` | Carrier-issued hosts, auth and routes |
| Czechia | PPL CZ | `ppl_cz` | `ppl-cpl-api-v1` | Carrier-issued hosts, auth and routes |
| Baltic region | Omniva | `omniva` | `omniva-omx-v1` | Carrier-issued tenant host and auth |
| Ireland | An Post | `an_post` | `an-post-ecommhub-v2.7` | Carrier-issued hosts, bearer auth and routes |
| Portugal | CTT Expresso | `ctt_portugal` | `ctt-expresso-contract-v1` | Carrier-issued hosts, auth and routes |

## Official references

- PostNord integration APIs: <https://portal.postnord.com/se/en/prod/resources/integrations/api/>
- Swiss Post Digital Commerce API: <https://developer.post.ch/en/digital-commerce-api>
- Austrian Post API documentation: <https://customerservices.post.at/>
- PPL CZ developer portal: <https://developer.ppl.cz/en/>
- Omniva developer portal: <https://developer.omniva.ee/>
- An Post eCommerce Hub API: <https://ecommhub.anpost.com/docs/api>
- CTT Logistics API integration: <https://www.ctt.pt/ajuda/empresas/planos-de-logistica-para-pme/integracoes/integracao-com-api-ctt-logistica?com.dotmarketing.htmlpage.language=3>

## Safety boundary

- Browser requests never contain carrier credentials, access tokens or tenant URLs.
- PostgreSQL stores only a Secret Manager reference.
- Both sandbox and production contract URLs are validated as HTTPS before a connector starts.
- A label or shipment write with an unknown network outcome is not retried automatically.
- Contract-routed carriers remain unavailable until the carrier issues credentials,
  environment hosts and approved route definitions.
- Swiss Post enables only the publicly documented address-label endpoint by default.

## Release sequence

1. Sign a direct merchant/carrier contract.
2. Store credentials in the configured Secret Manager and persist only `secretRef`.
3. Configure approved sandbox and production hosts and operation routes.
4. Run contract tests using synthetic addresses and labels.
5. Enable production per carrier after certification and operational review.

The PostgreSQL migration is
`db/veygrit-ship-medium-europe-strengthening-official-connectors.postgres.sql`.
It is included in the migration runner but is not applied automatically by build or test.
