import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
  TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE,
  TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID,
  TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS,
  TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
  TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS,
  TradeGatewayTestVectorClientError,
  buildTradeGatewayIdempotencyTestVectorUrl,
  createTradeGatewayTestVectorClient,
  fetchTradeGatewayIdempotencyTestVectors,
  validateTradeGatewayIdempotencyFixture,
} from '../src/index.js';

function checkedInFixture() {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'vey-trade-gateway-idempotency-v0.1.json'), 'utf8'),
  );
}

function packageFile(path: string) {
  return readFileSync(join(process.cwd(), 'sdk', 'vey-trade-gateway-test-vectors', path), 'utf8');
}

test('@veygrit/trade-gateway-test-vectors exposes an OSS-ready package entrypoint', () => {
  const packageJson = JSON.parse(packageFile('package.json')) as {
    name: string;
    main: string;
    types: string;
    exports: {
      '.': {
        types: string;
        import: string;
      };
    };
    files: string[];
    scripts: Record<string, string>;
  };
  const readme = packageFile('README.md');

  assert.equal(packageJson.name, '@veygrit/trade-gateway-test-vectors');
  assert.equal(packageJson.main, './dist/index.js');
  assert.equal(packageJson.types, './dist/index.d.ts');
  assert.deepEqual(packageJson.exports, {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
    },
  });
  assert.ok(packageJson.files.includes('dist'));
  assert.equal(packageJson.scripts.test, 'tsx --test test/sdk.test.ts');
  assert.match(readme, /createTradeGatewayTestVectorClient/);
  assert.match(readme, /pk_test_trade_gateway_sdk/);
  assert.match(readme, /does not accept raw address/);
  assert.match(readme, /npm run verify:vey-trade-gateway-test-vector-sdk/);
});

test('@veygrit/trade-gateway-test-vectors imports from the built ESM export target', async () => {
  const packageJson = JSON.parse(packageFile('package.json')) as {
    exports: {
      '.': {
        import: string;
      };
    };
  };
  const packageRoot = join(process.cwd(), 'sdk', 'vey-trade-gateway-test-vectors');
  const builtEntrypointUrl = pathToFileURL(join(packageRoot, packageJson.exports['.'].import)).href;
  const builtEntrypoint = await import(builtEntrypointUrl);

  assert.equal(
    builtEntrypoint.TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
    TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE,
  );
  assert.equal(
    builtEntrypoint.TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID,
    TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID,
  );
  assert.equal(typeof builtEntrypoint.createTradeGatewayTestVectorClient, 'function');
  assert.equal(typeof builtEntrypoint.fetchTradeGatewayIdempotencyTestVectors, 'function');
  assert.equal(typeof builtEntrypoint.validateTradeGatewayIdempotencyFixture, 'function');
});

test('@veygrit/trade-gateway-test-vectors documents its export verification matrix', () => {
  const readme = packageFile('README.md');
  const requiredReadmeAnchors = [
    'Export Verification Matrix',
    'docs/specs/trade-gateway-api.openapi.yaml',
    'docs/specs/fixtures/vey-trade-gateway-idempotency-v0.1.json',
    'docs/specs/schemas/vey-trade-gateway-idempotency-v0.1.schema.json',
    'src/lib/veyTradeGatewayTestVectorClient.ts',
    'sdk/vey-trade-gateway-test-vectors/src/index.ts',
    'npm run verify:vey-trade-gateway-client',
    'npm run verify:vey-trade-gateway-routes',
    'npm run verify:vey-trade-gateway-idempotency-fixture-schema',
    'npm run verify:vey-trade-gateway-test-vector-sdk',
    'npm run verify:vey-trade-gateway-sdk-drift',
    'npm run verify:vey-trade-gateway-test-vector-sdk-package',
    'npm run verify:vey-trading',
    'production trading execution',
  ];
  const documentedExports = [
    'TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE',
    'TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID',
    'TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE',
    'TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS',
    'TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS',
    'buildTradeGatewayIdempotencyTestVectorUrl',
    'createTradeGatewayTestVectorClient',
    'fetchTradeGatewayIdempotencyTestVectors',
    'validateTradeGatewayIdempotencyFixture',
  ];

  assert.equal(TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID, 'vey-trade-gateway-idempotency-v0.1');
  assert.equal(TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE, 'trade-gateway-local-idempotent-intent');
  assert.equal(TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS.length, 4);
  assert.ok(TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS.includes('privateKey'));

  for (const anchor of requiredReadmeAnchors) {
    assert.ok(readme.includes(anchor), `README missing ${anchor}`);
  }
  for (const exportName of documentedExports) {
    assert.ok(readme.includes(`\`${exportName}\``), `README matrix missing ${exportName}`);
  }
});

test('@veygrit/trade-gateway-test-vectors builds the local conformance route URL', () => {
  assert.equal(
    buildTradeGatewayIdempotencyTestVectorUrl('http://127.0.0.1:4180/'),
    `http://127.0.0.1:4180${TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE}`,
  );
  assert.equal(buildTradeGatewayIdempotencyTestVectorUrl(), TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE);
});

test('@veygrit/trade-gateway-test-vectors validates the checked-in fixture shape', () => {
  const fixture = checkedInFixture();
  validateTradeGatewayIdempotencyFixture(fixture);

  assert.equal(fixture.fixtureId, 'vey-trade-gateway-idempotency-v0.1');
  assert.equal(fixture.boundaryGateId, 'trade-gateway-local-idempotent-intent');
  assert.equal(fixture.localOnly, true);
  assert.equal(fixture.productionTraffic, false);
  assert.equal(fixture.vectors.length, 4);
  assert.equal(
    fixture.vectors.find((vector: { vectorId: string }) => vector.vectorId === 'trade_gateway_intent_created_positive')
      ?.safeRefs?.deliveryGatewayShipmentRef,
    'delivery_gateway_shipment_ref_tyo_fixture_001',
  );
});

test('@veygrit/trade-gateway-test-vectors fetches with test bearer only', async () => {
  const calls: Array<{ url: string; init: { method: 'GET'; headers: Record<string, string> } }> = [];
  const client = createTradeGatewayTestVectorClient({
    baseUrl: 'http://127.0.0.1:4180',
    publishableKey: 'pk_test_trade_gateway_sdk',
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return {
        status: 200,
        async json() {
          return checkedInFixture();
        },
      };
    },
  });
  const fixture = await client.getIdempotencyTestVectors();

  assert.equal(client.route, TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `http://127.0.0.1:4180${TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE}`);
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.authorization, 'Bearer pk_test_trade_gateway_sdk');
  assert.equal(calls[0].init.headers.accept, 'application/json');
  assert.equal(fixture.privacy.localOnly, true);
  assert.equal(fixture.privacy.privateMaterialExposed, false);
  assert.doesNotMatch(JSON.stringify(fixture), /secret_fixture_value|private_key_fixture_value/i);
});

test('@veygrit/trade-gateway-test-vectors rejects unsafe keys before fetch', async () => {
  let calls = 0;
  await assert.rejects(
    fetchTradeGatewayIdempotencyTestVectors({
      publishableKey: 'non_test_trade_gateway_sdk',
      fetcher: async () => {
        calls += 1;
        return {
          status: 200,
          async json() {
            return checkedInFixture();
          },
        };
      },
    }),
    (error: unknown) => error instanceof TradeGatewayTestVectorClientError && error.code === 'unsafe_key',
  );
  assert.equal(calls, 0);
});

test('@veygrit/trade-gateway-test-vectors rejects blocked fixture response keys', () => {
  assert.throws(
    () => validateTradeGatewayIdempotencyFixture({
      ...checkedInFixture(),
      privateKey: 'blocked',
    }),
    (error: unknown) => (
      error instanceof TradeGatewayTestVectorClientError
      && error.code === 'private_material'
      && error.details.includes('privateKey')
    ),
  );
});
