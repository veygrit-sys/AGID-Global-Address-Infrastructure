# Veygrit Ship: Middle East and North Africa direct connectors

These adapters connect only to carrier-owned APIs. They do not call a
multi-carrier shipping API.

## Included carriers

| Carrier | Region | Implemented boundary | Carrier ID | Adapter ID |
| --- | --- | --- | --- | --- |
| Aramex | MENA and international | rate, shipment, label, tracking, pickup, location validation; contract WCF/SOAP routes | `aramex_mena` | `aramex-mena-official-v1` |
| SMSA Express | Saudi Arabia and international | charges, shipment plus PDF, cancellation, PDF, tracking | `smsa_express` | `smsa-ecommerce-soap-v1` |
| NAQEL Express | Gulf and international | validation, waybill, return waybill, cancellation, tracking, pickup | `naqel_express` | `naqel-xml-shipping-v9` |
| Emirates Post EMX | UAE domestic and international | rate, booking, label, tracking, cancellation, inbound status updates | `emirates_post` | `emirates-post-emx-v1` |
| Bosta | Egypt and Saudi Arabia | delivery create/update/terminate, tracking, pickup, webhook | `bosta` | `bosta-v2` |
| Mylerz | Egypt, Tunisia, Morocco, Algeria, Jordan | contract shipment, update, AWB, tracking, pickup routes | `mylerz` | `mylerz-official-v1` |

## Safety boundary

- Carrier secrets are resolved from a server-side secret reference.
- SMSA `passKey` and NAQEL client credentials are inserted only by the connector.
- Browser payloads containing credential-shaped fields are rejected.
- Read-only operations may retry 429, timeout, and 5xx responses.
- Shipment, cancellation, return, and pickup writes are never replayed when the
  carrier result is unknown.
- Sandbox mode never falls back to a production host.
- Raw labels, addresses, credentials, and carrier payloads must not be logged.

## Contract-gated routes

Aramex, Emirates Post production, and Mylerz issue hosts, authentication
details, and enabled operations during commercial onboarding. Their factories
therefore require explicit HTTPS configuration rather than guessing endpoints.
The same rule applies when a carrier supplies a customer-specific sandbox.

## Official references

- <https://www.aramex.com/ag/en/developers-solution-center/aramex-apis>
- <https://track.smsaexpress.com/SECOM/SMSAwebService.asmx>
- <https://www.naqelexpress.com/en/sa/pdfs/naqel-api-documentation/>
- <https://developers-stg.emiratespost.ae/>
- <https://docs.bosta.co/>
- <https://wordpress.org/plugins/mylerz/>

Apply `db/veygrit-ship-mena-expansion-official-connectors.postgres.sql` after
the Africa expansion migration.
