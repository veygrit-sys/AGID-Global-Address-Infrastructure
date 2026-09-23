import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
  VeyTradeGatewayTestVectorClientError,
  buildVeyTradeGatewayIdempotencyTestVectorUrl,
  fetchVeyTradeGatewayIdempotencyTestVectors,
} from './veyTradeGatewayTestVectorClient';
import { buildVeyTradeGatewayIdempotencyFixture } from './veyTrading';

test('Trade Gateway test-vector client builds the local route URL', () => {
  assert.equal(
    buildVeyTradeGatewayIdempotencyTestVectorUrl('http://127.0.0.1:4180/'),
    `http://127.0.0.1:4180${TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE}`,
  );
  assert.equal(
    buildVeyTradeGatewayIdempotencyTestVectorUrl(),
    TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
  );
});

test('Trade Gateway test-vector client fetches and validates synthetic fixture refs', async () => {
  const calls: Array<{
    url: string;
    init: { method: 'GET'; headers: Record<string, string> };
  }> = [];
  const fixture = await fetchVeyTradeGatewayIdempotencyTestVectors({
    baseUrl: 'http://127.0.0.1:4180',
    publishableKey: 'pk_test_trade_gateway_client',
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return {
        status: 200,
        async json() {
          return buildVeyTradeGatewayIdempotencyFixture();
        },
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `http://127.0.0.1:4180${TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE}`);
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.authorization, 'Bearer pk_test_trade_gateway_client');
  assert.equal(calls[0].init.headers.accept, 'application/json');
  assert.equal(fixture.fixtureId, 'vey-trade-gateway-idempotency-v0.1');
  assert.equal(fixture.privacy.localOnly, true);
  assert.equal(fixture.privacy.productionTraffic, false);
  assert.equal(fixture.vectors.length, 4);
  assert.equal(
    fixture.vectors.find(vector => vector.vectorId === 'trade_gateway_intent_created_positive')
      ?.safeRefs?.deliveryGatewayShipmentRef,
    'delivery_gateway_shipment_ref_tyo_fixture_001',
  );
  assert.doesNotMatch(JSON.stringify(fixture), /secret_fixture_value|private_key_fixture_value/i);
});

test('Trade Gateway test-vector client rejects non-test bearer material before fetch', async () => {
  let calls = 0;
  await assert.rejects(
    fetchVeyTradeGatewayIdempotencyTestVectors({
      baseUrl: 'http://127.0.0.1:4180',
      publishableKey: 'non_test_trade_gateway_client',
      fetcher: async () => {
        calls += 1;
        return {
          status: 200,
          async json() {
            return buildVeyTradeGatewayIdempotencyFixture();
          },
        };
      },
    }),
    (error: unknown) => error instanceof VeyTradeGatewayTestVectorClientError && error.code === 'unsafe_key',
  );
  assert.equal(calls, 0);
});

test('Trade Gateway test-vector client rejects blocked response payload keys', async () => {
  await assert.rejects(
    fetchVeyTradeGatewayIdempotencyTestVectors({
      publishableKey: 'pk_test_trade_gateway_client',
      fetcher: async () => ({
        status: 200,
        async json() {
          return {
            ...buildVeyTradeGatewayIdempotencyFixture(),
            idempotencyKey: 'blocked-idempotency-key-material',
          };
        },
      }),
    }),
    (error: unknown) => (
      error instanceof VeyTradeGatewayTestVectorClientError
      && error.code === 'private_material'
      && error.details.includes('idempotencyKey')
    ),
  );
});
