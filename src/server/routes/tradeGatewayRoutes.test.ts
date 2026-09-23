import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import express from 'express';
import { parse as parseYaml } from 'yaml';

import {
  TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
  registerTradeGatewayRoutes,
} from './tradeGatewayRoutes';
import { fetchVeyTradeGatewayIdempotencyTestVectors } from '../../lib/veyTradeGatewayTestVectorClient';

let server: Server;
let baseUrl = '';

type ParsedTradeGatewayOpenApi = {
  servers?: Array<{ url?: string }>;
  paths?: Record<string, {
    get?: {
      operationId?: string;
      security?: unknown;
      responses?: Record<string, {
        content?: Record<string, { schema?: { $ref?: string } }>;
      }>;
    };
  }>;
  components?: {
    securitySchemes?: Record<string, { type?: string; scheme?: string }>;
  };
};

before(async () => {
  const app = express();
  app.use(express.json());
  registerTradeGatewayRoutes(app);
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

async function getFixture(
  path = TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
  authorization = 'Bearer pk_test_trade_gateway_route',
) {
  return fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: { authorization },
  });
}

test('Trade Gateway route returns local-only idempotency fixture refs', async () => {
  const response = await getFixture();
  const body = await response.json() as {
    fixtureId: string;
    boundaryGateId: string;
    privacy: {
      localOnly: boolean;
      productionTraffic: boolean;
      containsRawAddress: boolean;
      privateMaterialExposed: boolean;
    };
    vectors: Array<{
      vectorId: string;
      decision: string;
      tradeGatewayIntentRef?: string;
      safeRefs?: Record<string, string>;
      localOnly: boolean;
      productionTraffic: boolean;
      privateMaterialExposed: boolean;
    }>;
  };

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-agid-local-only'), 'true');
  assert.equal(response.headers.get('x-agid-boundary-gate'), 'trade-gateway-local-idempotent-intent');
  assert.equal(body.fixtureId, 'vey-trade-gateway-idempotency-v0.1');
  assert.equal(body.boundaryGateId, 'trade-gateway-local-idempotent-intent');
  assert.equal(body.privacy.localOnly, true);
  assert.equal(body.privacy.productionTraffic, false);
  assert.equal(body.privacy.containsRawAddress, false);
  assert.equal(body.privacy.privateMaterialExposed, false);
  assert.equal(body.vectors.length, 4);

  const created = body.vectors.find(vector => vector.vectorId === 'trade_gateway_intent_created_positive');
  assert.ok(created);
  assert.equal(created.decision, 'created');
  assert.match(created.tradeGatewayIntentRef ?? '', /^trade_gateway_intent_[A-F0-9]{24}$/);
  assert.equal(created.safeRefs?.deliveryGatewayShipmentRef, 'delivery_gateway_shipment_ref_tyo_fixture_001');
  assert.equal(created.safeRefs?.playlistCommerceIntentRef, 'playlist_intent_ref_tyo_fixture_001');
  assert.equal(created.localOnly, true);
  assert.equal(created.productionTraffic, false);
  assert.equal(created.privateMaterialExposed, false);
  assert.doesNotMatch(JSON.stringify(body), /trade-gateway-fixture-key|secret_fixture_value|private_key_fixture_value/i);
});

test('Trade Gateway route path and auth contract match OpenAPI', () => {
  const operationPath = '/v1/trade/test-vectors/idempotency';
  const openApi = parseYaml(
    readFileSync(join(process.cwd(), 'docs', 'specs', 'trade-gateway-api.openapi.yaml'), 'utf8'),
  ) as ParsedTradeGatewayOpenApi;
  const operation = openApi.paths?.[operationPath]?.get;

  assert.equal(`${openApi.servers?.[0]?.url}${operationPath}`, TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE);
  assert.equal(operation?.operationId, 'getTradeGatewayIdempotencyTestVectors');
  assert.deepEqual(operation?.security, [{ TradeGatewayTestBearer: [] }]);
  assert.equal(openApi.components?.securitySchemes?.TradeGatewayTestBearer?.type, 'http');
  assert.equal(openApi.components?.securitySchemes?.TradeGatewayTestBearer?.scheme, 'bearer');
  assert.equal(
    operation?.responses?.['400']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/TradeGatewayError',
  );
  assert.equal(
    operation?.responses?.['401']?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/TradeGatewayError',
  );
});

test('Trade Gateway typed client fetches the local route fixture', async () => {
  const fixture = await fetchVeyTradeGatewayIdempotencyTestVectors({
    baseUrl,
    publishableKey: 'pk_test_trade_gateway_route',
    fetcher: fetch,
  });

  assert.equal(fixture.fixtureId, 'vey-trade-gateway-idempotency-v0.1');
  assert.equal(fixture.boundaryGateId, 'trade-gateway-local-idempotent-intent');
  assert.equal(fixture.localOnly, true);
  assert.equal(fixture.productionTraffic, false);
  assert.equal(
    fixture.vectors.find(vector => vector.vectorId === 'trade_gateway_intent_created_positive')
      ?.safeRefs?.playlistCommerceIntentRef,
    'playlist_intent_ref_tyo_fixture_001',
  );
});

test('Trade Gateway route requires a test bearer and rejects query material', async () => {
  const unauthorized = await getFixture(TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE, '');
  const unauthorizedBody = await unauthorized.json() as { error: string; productionTraffic: boolean };
  const nonTestBearerResponse = await getFixture(
    TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
    'Bearer non_test_trade_gateway_route',
  );
  const nonTestBearerBody = await nonTestBearerResponse.json() as { error: string; productionTraffic: boolean };
  const queryResponse = await getFixture(`${TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE}?debug=true`);
  const queryBody = await queryResponse.json() as { error: string; productionTraffic: boolean };

  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers.get('x-agid-local-only'), 'true');
  assert.equal(unauthorizedBody.error, 'auth_required');
  assert.equal(unauthorizedBody.productionTraffic, false);
  assert.equal(nonTestBearerResponse.status, 401);
  assert.equal(nonTestBearerResponse.headers.get('x-agid-local-only'), 'true');
  assert.equal(nonTestBearerBody.error, 'auth_required');
  assert.equal(nonTestBearerBody.productionTraffic, false);
  assert.equal(queryResponse.status, 400);
  assert.equal(queryResponse.headers.get('x-agid-boundary-gate'), 'trade-gateway-local-idempotent-intent');
  assert.equal(queryBody.error, 'query_not_allowed');
  assert.equal(queryBody.productionTraffic, false);
});
