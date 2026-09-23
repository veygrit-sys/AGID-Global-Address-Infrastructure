# Veygrit Ship: additional private European official connectors

This expansion adds direct, carrier-owned adapters. It does not use a
multi-carrier shipping API.

| Carrier | Initial scope | Carrier ID | Adapter ID |
|---|---|---|---|
| Yodel | application-plan Shipping Orders, labels, returns, tracking and schedules | `yodel` | `yodel-shipping-orders-v1` |
| FAN Courier | domestic/export AWB, PDF/ZPL label, void, rating, tracking, pickup and PUDO | `fan_courier` | `fan-courier-api-v2` |
| ACS Courier | Greece/Cyprus address validation, rating, voucher, print, delete, tracking and pickup list | `acs_courier` | `acs-rest-web-services-v1` |
| DACHSER | Business Integration tracking v2 plus contracted transport, quotation, document and warehouse APIs | `dachser` | `dachser-business-integration-v2` |
| Sameday | contracted shipping, label, locker, return and tracking services | `sameday` | `sameday-client-api-v2` |

## Security boundary

- Browser requests carry only a `CarrierConnection` reference.
- API keys, tokens, passwords and carrier account fields are loaded on the
  server from a secret reference.
- Database rows store the secret reference and the masked last four
  characters, never the secret value.
- Live writes require account authentication, an active connection and an
  idempotency record.
- Shipment, void and pickup writes are not automatically retried. A network
  failure after dispatch is marked as an unknown outcome for reconciliation.
- Sandbox base URLs are explicit. Production endpoints are never reused as a
  test environment.

## Carrier-specific setup

### Yodel

Create an application in the official developer portal and subscribe to the
required API product plan. Store the issued key/secret in Secret Manager.
Because routes depend on the plan, both sandbox and production base URLs and
routes remain contract configuration.

### FAN Courier

Use the SelfAWB contract account. The `/login` token is valid for 24 hours and
must be cached server-side. The connector receives only the cached bearer token
and uses the official production paths for tariff, AWB, label, void, tracking,
courier order and pickup points.

### ACS Courier

Store `AcsApiKey` and the ACS company/user parameters in Secret Manager. The
connector wraps each server-created payload in the documented
`ACSAlias`/`ACSInputParameters` envelope. Production shipping is limited to the
services and destinations enabled by the ACS contract.

### DACHSER

Subscribe to the required Business Integration APIs. Shipment status v2 uses
`/rest/v2/shipmentstatus`; other API paths are configured only after DACHSER
enables them for the customer.

### Sameday

Use the official customer API/SDK onboarding. Routes and credentials are
contract-issued, so Veygrit requires both environment URLs and operation routes
explicitly and does not infer them from community integrations.

## Release gate

Before enabling a carrier in production:

1. Configure a secret-manager reference and least-privilege credential.
2. Confirm a dedicated sandbox/test endpoint with the carrier.
3. Pass the carrier contract suite for rate, shipment, label, tracking and void.
4. Verify unknown-outcome reconciliation and webhook signature handling.
5. Record carrier terms, data-retention limits and support escalation details.
6. Enable production traffic only for the approved merchant connection.
