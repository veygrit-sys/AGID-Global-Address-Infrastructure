# Veygrit Ship South America strengthening

This wave strengthens direct, first-party carrier connectivity in the largest
South American ecommerce markets. It does not introduce a multi-carrier
aggregator.

| Market | Carrier | Carrier ID | Adapter | Status |
| --- | --- | --- | --- | --- |
| Brazil | Loggi | `loggi` | `loggi-v1` | Exact official V1.13 routes |
| Argentina / international | Andreani GlobAllPack | `andreani` | `andreani-globallpack-v1` | Exact official QA and production routes |
| Colombia / regional | Servientrega | `servientrega` | `servientrega-standard-v1` | Contract-issued HTTPS routes |
| Chile | Blue Express | `blue_express` | `blue-express-contract-v1` | Contract-issued HTTPS routes |

Existing direct adapters remain active for Chilexpress, Coordinadora, OCA,
Jadlog and Total Express.

## Official contracts

- Loggi V1.13 uses OAuth V2, asynchronous shipment creation, package update and
  cancellation, labels, tracking, webhooks and Loggi Ponto discovery:
  <https://docs.api.loggi.com/reference/nossa-documenta%C3%A7%C3%A3o>
- Andreani GlobAllPack uses Basic login followed by a 24-hour
  `x-authorization-token`. QA and production routes are published for quote,
  pre-shipment, PDF/ZPL labels and tracking:
  <https://developers.andreanigloballpack.com/en/>
- Servientrega provides a standard API contract after merchant onboarding:
  <https://www.servientregaapi.com/docs/public>
- Blue Express provides direct API integration to contracted ecommerce
  merchants:
  <https://www.blue.cl/empresas/soluciones-ecommerce>

## Safety and release boundary

- Carrier credentials are resolved only from the server-side secret reference.
- The database stores a secret reference, never a password, token or API key.
- Contract-routed connectors reject HTTP and accept HTTPS only.
- Shipment creation, cancellation and updates are not automatically replayed
  when the result is unknown.
- Rate, tracking and pickup-point reads may retry bounded 429 and 5xx failures.
- PDF and ZPL label bytes stay server-side and are never sent to analytics.
- Production activation requires a carrier contract, sandbox acceptance,
  credential rotation procedure, webhook verification and a carrier-specific
  incident runbook.
