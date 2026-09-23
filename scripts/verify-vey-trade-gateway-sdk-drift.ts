import {
  VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS,
  buildVeyTradeGatewayIdempotencyFixture,
} from '../src/lib/veyTrading';
import {
  TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE as SRC_ROUTE,
  TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS as SRC_BLOCKED_PUBLIC_PAYLOAD_KEYS,
  validateVeyTradeGatewayIdempotencyFixture,
} from '../src/lib/veyTradeGatewayTestVectorClient';
import {
  TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE as SDK_BOUNDARY_GATE,
  TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID as SDK_FIXTURE_ID,
  TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS as SDK_VECTOR_IDS,
  TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE as SDK_ROUTE,
  TRADE_GATEWAY_TEST_VECTOR_BLOCKED_PUBLIC_PAYLOAD_KEYS as SDK_BLOCKED_PUBLIC_PAYLOAD_KEYS,
  validateTradeGatewayIdempotencyFixture,
} from '../sdk/vey-trade-gateway-test-vectors/src/index';

const GATE = 'verify-vey-trade-gateway-sdk-drift';

function assertEqual(actual: unknown, expected: unknown, label: string, errors: string[]) {
  if (actual !== expected) errors.push(`${label}:mismatch`);
}

function assertArrayExact(actual: readonly string[], expected: readonly string[], label: string, errors: string[]) {
  if (
    actual.length !== expected.length
    || expected.some((value, index) => actual[index] !== value)
  ) {
    errors.push(`${label}:array-mismatch`);
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function expectThrows(label: string, action: () => void, errors: string[]) {
  try {
    action();
    errors.push(`${label}:accepted`);
  } catch {
    return;
  }
}

function run() {
  const errors: string[] = [];
  const fixture = buildVeyTradeGatewayIdempotencyFixture();

  assertEqual(SDK_ROUTE, SRC_ROUTE, 'route', errors);
  assertEqual(SDK_FIXTURE_ID, VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID, 'fixture-id', errors);
  assertEqual(SDK_BOUNDARY_GATE, VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE, 'boundary-gate', errors);
  assertArrayExact([...SDK_VECTOR_IDS], [...VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS], 'vector-ids', errors);
  assertArrayExact(
    [...SDK_BLOCKED_PUBLIC_PAYLOAD_KEYS],
    [...SRC_BLOCKED_PUBLIC_PAYLOAD_KEYS],
    'blocked-public-payload-keys',
    errors,
  );

  validateVeyTradeGatewayIdempotencyFixture(fixture);
  validateTradeGatewayIdempotencyFixture(fixture);

  const privateKeyFixture = {
    ...cloneJson(fixture),
    privateKey: 'blocked',
  };
  expectThrows(
    'src-validator-private-key',
    () => validateVeyTradeGatewayIdempotencyFixture(privateKeyFixture),
    errors,
  );
  expectThrows(
    'sdk-validator-private-key',
    () => validateTradeGatewayIdempotencyFixture(privateKeyFixture),
    errors,
  );

  const productionTrafficFixture = cloneJson(fixture) as unknown as {
    vectors: Array<Record<string, unknown>>;
  };
  productionTrafficFixture.vectors[0] = {
    ...productionTrafficFixture.vectors[0],
    productionTraffic: true,
  };
  expectThrows(
    'src-validator-vector-production-traffic',
    () => validateVeyTradeGatewayIdempotencyFixture(productionTrafficFixture),
    errors,
  );
  expectThrows(
    'sdk-validator-vector-production-traffic',
    () => validateTradeGatewayIdempotencyFixture(productionTrafficFixture),
    errors,
  );

  if (errors.length > 0) {
    console.error(`[${GATE}] status=fail errors=${errors.join(',')}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `[${GATE}] status=pass route=${SDK_ROUTE} fixture=${SDK_FIXTURE_ID} vectors=${SDK_VECTOR_IDS.length} blockedKeys=${SDK_BLOCKED_PUBLIC_PAYLOAD_KEYS.length}`,
  );
}

run();
