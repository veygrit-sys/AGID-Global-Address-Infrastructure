# Veygrit Ship — Americas official carrier connectors

## Scope

These are direct, first-party carrier integrations. They do not use a
third-party shipping aggregator.

| Carrier | Region | Official API | Implemented operations |
| --- | --- | --- | --- |
| Amazon Shipping | North America | Shipping API V2 | Rates, shipment purchase, cancellation, tracking |
| Loggi | Brazil | Loggi API | Quotes, shipment creation, cancellation, tracking, labels |

The next direct-carrier wave (Chilexpress, Coordinadora, OCA, 99minutos,
Redpack, Estafeta, Jadlog, Total Express and Roadie) is documented in
[Americas expansion official connectors](./veygrit-ship-americas-expansion-official-connectors.md).

UPS, DHL and FedEx remain separate carrier adapters. `carrierAdapterCore` gives
all official connectors the same server-only connection boundary.

## Server boundary

- A `CarrierConnection` stores a secret-provider reference, not credentials.
- The browser cannot submit carrier secrets, access tokens, account numbers or
  carrier request payloads.
- Label retrieval is a server-side operation; it belongs in protected object
  storage rather than application logs or analytics.
- Write operations require a Veygrit idempotency key. A network failure during
  purchase, creation, or cancellation is marked as an unknown outcome and is
  never automatically replayed.

## Amazon Shipping V2

The connector uses the official Amazon Selling Partner authorization flow:

1. Resolve LWA refresh material and AWS signing material in the server secret
   provider.
2. Exchange the refresh material for an access token server-to-server.
3. Sign Shipping API V2 calls using AWS Signature Version 4.
4. Use the sandbox endpoint until an approved production carrier connection is
   explicitly enabled.

The routes implemented are `shipments/rates`, `shipments`,
`shipments/{shipmentId}/cancel`, and `tracking`. See Amazon's official
[Shipping API V2 reference](https://developer-docs.shipping.amazon.com/apis/reference/getrates).

## Loggi (Brazil)

The connector uses Loggi's official OAuth endpoint and API routes for company
quotes, packages, labels, cancellation, and tracking. It defaults to Loggi's
staging base URL. Production must use the endpoint and carrier contract issued
to the merchant. See the official [Loggi API documentation](https://docs.api.loggi.com/reference/nossa-documenta%C3%A7%C3%A3o).

## Production enablement checklist

1. Complete the merchant's direct carrier agreement and obtain the carrier's
   production authorization.
2. Store the issued credential set in AWS Secrets Manager, GCP Secret Manager,
   Azure Key Vault, or an equivalent server-side secret provider.
3. Create a `CarrierConnection` that contains only a secret reference and the
   selected environment.
4. Validate rates and tracking in the carrier sandbox.
5. Enable a production connection only after an owner approves it, then run a
   controlled test shipment under the merchant's carrier agreement.

No production credentials, labels, tracking identifiers, addresses, or live
carrier traffic are created by this connector implementation.
