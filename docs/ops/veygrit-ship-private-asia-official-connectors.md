# Veygrit Ship: additional private Asian direct connectors

These adapters connect only to carrier-owned APIs. They do not call a
multi-carrier shipping API.

## Included carriers

| Carrier | Main market | Implemented boundary | Carrier ID | Adapter ID |
| --- | --- | --- | --- | --- |
| Blue Dart | India, Bangladesh, Bhutan, Nepal | rate, shipment, label, tracking, pickup, document; contract ShopTrack/PackTrack/ShipDart routes | `blue_dart` | `blue-dart-business-integration-v1` |
| DTDC | India and international | validation, rate, shipment, label, return, tracking, pickup; contract enterprise routes | `dtdc` | `dtdc-enterprise-v1` |
| GDEX | Malaysia | rate, consignment, label, cancellation, tracking, pickup; myGDEX testing/live subscriptions | `gdex` | `mygdex-openapi-v1` |
| JNE | Indonesia | rate, shipment, label, cancellation, tracking, pickup; contract API Dashboard routes | `jne` | `jne-contract-api-v1` |

## Safety boundary

- Carrier secrets are resolved from a server-side secret reference.
- The browser can send shipment data but cannot send API keys, tokens,
  passwords, account numbers, or contract authentication headers.
- Every base URL must use HTTPS.
- Safe reads may retry 429, timeout, and 5xx responses.
- Shipment, return, cancellation, and pickup writes are never replayed when
  the carrier outcome is unknown.
- Sandbox mode never falls back to a production host.
- Addresses, labels, credentials, and raw carrier payloads must not be logged.

## Contract-gated activation

All four carriers expose official integration programs, but the detailed
production paths and authentication values are available after registration
or a business contract. The factories therefore require explicit sandbox and
production base URLs, authentication, and routes. This prevents Veygrit from
silently calling an obsolete or customer-specific endpoint.

The adapters are complete at the Veygrit boundary, but remain `planned` in the
default registry until a server-side connection is constructed with approved
carrier credentials. No live carrier transaction is performed by the tests.

## Official references

- <https://api.bluedart.com/business-integrations>
- <https://www.dtdc.com/b2b-enterprise/>
- <https://myopenplatform.gdexpress.com/>
- <https://myopenplatform.gdexpress.com/overview>
- <https://apidash.jne.co.id/>

Apply
`db/veygrit-ship-private-asia-expansion-official-connectors.postgres.sql`
after the MENA expansion migration.
