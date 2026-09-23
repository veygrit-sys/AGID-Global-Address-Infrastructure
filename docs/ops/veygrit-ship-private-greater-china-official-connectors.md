# Veygrit Ship: Greater China direct carrier adapters

## Scope

This expansion adds direct, carrier-owned adapters. It does not use a
multi-carrier or third-party shipping API.

| Carrier | Veygrit carrier ID | Adapter ID | Official entry point |
| --- | --- | --- | --- |
| ZTO Express | `zto_express` | `zto-open-platform-v1` | <https://open.zto.com/> |
| YTO Express | `yto_express` | `yto-open-platform-v1` | <https://open.yto.net.cn/> |
| STO Express | `sto_express` | `sto-open-platform-v1` | <https://open.sto.cn/> |
| Deppon | `deppon` | `deppon-open-platform-v1` | <https://dpopen.deppon.com/> |
| JD Logistics | `jd_logistics` | `jd-logistics-open-platform-v1` | <https://open.jdl.com/admin/> |
| Cainiao Express | `cainiao_express` | `cainiao-express-open-platform-v1` | <https://openapi.express.cainiao.com/docs/index.html> |

SF Express, 4PX and J&T remain separate existing direct adapters.

## Activation model

Each carrier requires merchant or ISV approval. The official portal or carrier
integration team then supplies the permitted environment hosts, endpoint paths,
credentials, signing rules and enabled products.

Store the resulting secret in the configured cloud secret manager. PostgreSQL
stores only `credentialSecretRef` and optional last-four display metadata.
Create `PrivateGreaterChinaContractConfig` only on the server after resolving
that reference.

The contract config contains:

- the carrier-issued sandbox and production HTTPS hosts;
- only the routes approved for that account;
- server-side authentication values;
- optional fixed contract fields;
- an optional server-only request signer for the carrier's current signature
  algorithm.

Do not accept any of those fields from a browser or guest session. Do not place
them in logs, audit payloads, analytics, source control or webhook bodies.

## Safety behavior

- HTTPS is mandatory.
- Browser-shaped credential fields are rejected by the shared adapter boundary.
- Rate, tracking and other explicitly safe reads can retry `429`, timeout and
  `5xx` responses.
- Shipment, void, pickup and other writes are not retried unless the configured
  official route explicitly marks the operation safe.
- A failed non-retryable write is returned as `outcomeUnknown` so the worker can
  reconcile with the carrier before a new attempt.
- PDF, ZPL and octet-stream label responses remain binary and must be moved
  directly to private object storage.
- Production traffic remains disabled until credentials, contract routes,
  webhook verification and carrier acceptance tests are complete.

## Verified official capabilities

- ZTO publishes address intelligence/standardization, tracking
  subscription/query, printing and merchant reverse-pickup capabilities.
- YTO publishes order creation/cancellation, label printing, tracking push/query
  and basic rate/time/pickup-window services.
- STO publishes carrier API integration for parcel dispatch and tracking.
- Deppon publishes direct API onboarding and shipment/order tracking services.
- JD Logistics provides its own logistics open platform; actual APIs are
  granted according to the approved business solution.
- Cainiao Express publishes B2C order, waybill, tracking, cancellation, time
  estimate, customs and related shipping interfaces, with a test environment.

Treat these as maximum adapter capabilities. At runtime, expose only operations
for which the merchant contract contains an official route.

## Release gate

Before enabling a carrier in production:

1. Complete the carrier's company/ISV verification and contract.
2. Obtain a dedicated sandbox application and non-production test account.
3. Save secrets in the cloud secret manager and persist only the reference.
4. Configure routes from the versioned official documentation supplied to the
   account; never infer undocumented URLs or signatures.
5. Run carrier acceptance cases for address, rating, shipment, label, void and
   tracking as applicable.
6. Verify idempotency and unknown-outcome reconciliation for every write.
7. Verify webhook signatures, replay protection and delivery retries.
8. Obtain explicit authorization before any live shipment or charge.
