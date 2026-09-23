# Veygrit Trade Gateway Test Vectors

Local-only TypeScript helper for reading the synthetic Trade Gateway
idempotency test-vector route.

```ts
import { createTradeGatewayTestVectorClient } from "@veygrit/trade-gateway-test-vectors";

const tradeGateway = createTradeGatewayTestVectorClient({
  baseUrl: "http://127.0.0.1:4180",
  publishableKey: "pk_test_trade_gateway_sdk",
});

const fixture = await tradeGateway.getIdempotencyTestVectors();
console.log(fixture.vectors.map(vector => vector.vectorId));
```

The helper only calls
`/api/trade-gateway/v1/trade/test-vectors/idempotency`, requires a `pk_test_`
publishable key before fetch, validates the returned fixture shape, and rejects
blocked public payload keys.

It handles synthetic refs and marker names only. It does not accept raw address,
recipient, witness, proof-secret, private-key, production credential, payment,
customs, contract body, or production trading material. It is not a trading
venue, settlement system, customs clearance tool, sanctions outcome verifier,
identity truth verifier, or legal or financial adviser.

## Export Verification Matrix

| Export | Fixture or source anchor | Verification |
| --- | --- | --- |
| `TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE` | `docs/specs/trade-gateway-api.openapi.yaml` and `/api/trade-gateway/v1/trade/test-vectors/idempotency` | `npm run verify:vey-trade-gateway-routes`, `npm run verify:vey-trade-gateway-sdk-drift` |
| `TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID`, `TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE`, `TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS` | `docs/specs/fixtures/vey-trade-gateway-idempotency-v0.1.json` and `docs/specs/schemas/vey-trade-gateway-idempotency-v0.1.schema.json` | `npm run verify:vey-trade-gateway-idempotency-fixture-schema`, `npm run verify:vey-trade-gateway-sdk-drift` |
| `TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS` | `src/lib/veyTradeGatewayTestVectorClient.ts` and `sdk/vey-trade-gateway-test-vectors/src/index.ts` | `npm run verify:vey-trade-gateway-client`, `npm run verify:vey-trade-gateway-test-vector-sdk`, `npm run verify:vey-trade-gateway-sdk-drift` |
| `buildTradeGatewayIdempotencyTestVectorUrl`, `createTradeGatewayTestVectorClient`, `fetchTradeGatewayIdempotencyTestVectors` | Local-only route, test bearer guard, and fake-fetch SDK tests | `npm run verify:vey-trade-gateway-test-vector-sdk`, `npm run verify:vey-trading` |
| `validateTradeGatewayIdempotencyFixture` and exported fixture/client types | Synthetic fixture shape and blocked-key rejection behavior | `npm run verify:vey-trade-gateway-test-vector-sdk`, `npm run verify:vey-trade-gateway-sdk-drift` |
| `package.json` `exports`, `files`, and `dist/*` artifacts | Package metadata, built ESM/types entrypoint, README, and npm pack dry-run contents | `npm run verify:vey-trade-gateway-test-vector-sdk-package`, `npm run verify:vey-trading` |

The matrix is a local OSS audit aid. It does not claim live Trade Gateway
hosting, production authentication, production trading execution, settlement,
customs clearance, identity truth, sanctions outcomes, or legal/financial
advice.

Run:

```bash
npm run verify:vey-trade-gateway-test-vector-sdk
npm run verify:vey-trade-gateway-sdk-drift
npm run verify:vey-trade-gateway-test-vector-sdk-package
npm run verify:vey-trading
```
