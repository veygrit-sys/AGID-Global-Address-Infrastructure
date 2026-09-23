# @veygrit/ship

Production TypeScript/JavaScript client for Veygrit -ship. Keep secret API keys on a server; never embed them in browser code.

## Credential Boundary

This package is a server-side SDK. Do not send carrier credentials through this SDK. Public and Guest flows have no credential input, no credential-storage route, and no public carrier-connection route.

Before using sandbox routes, review the repository credential matrix: `docs/ops/veygrit-ship-credential-surface-matrix.md`.
Before release packaging, review the local no-publish checklist: `docs/ops/veygrit-ship-sdk-release-checklist.md`.

- Guest sessions do not create, store, return, or promote carrier credential references.
- Guest route success is not proof of Merchant account ownership, carrier account approval, live labels, or production carrier traffic.

Verification order:

```powershell
npm run verify:veygrit-ship-credential-surfaces
npm run verify:veygrit-ship-sdk-readmes
npm run verify:veygrit-ship-sdk-release-checklist
npm --prefix sdk/veygrit-ship-js test
```

```ts
import VeygritShip from '@veygrit/ship';
const ship = new VeygritShip({ apiKey: process.env.VEYGRIT_SHIP_API_KEY! });
const rates = await ship.rates.create({ originRef: 'org_...', destination: {}, packages: [] });
const shipment = await ship.shipments.create({ rateQuoteRef: rates.rates[0].rateQuoteRef }, { idempotencyKey: `order-${order.id}` });
```

Mutating calls receive an Idempotency Key. Retryable 408, 429, and 5xx responses use bounded retries. Failures throw `VeygritShipError` with `status`, `code`, and `requestId`.
