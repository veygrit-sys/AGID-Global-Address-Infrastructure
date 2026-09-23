import { existsSync, readFileSync } from 'node:fs';

import {
  VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_BUILDER,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_SCHEMA_REF,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_STATUS,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VERIFIER,
  VEY_TRADE_GATEWAY_IDEMPOTENCY_FORBIDDEN_VALUE_MARKERS,
  buildVeyTradeGatewayIdempotencyFixture,
} from '../src/lib/veyTrading';

const GATE = 'verify-vey-trade-gateway-idempotency-fixture-schema';
const DEFAULT_FIXTURE_PATH = 'docs/specs/fixtures/vey-trade-gateway-idempotency-v0.1.json';
const DEFAULT_SCHEMA_PATH = 'docs/specs/schemas/vey-trade-gateway-idempotency-v0.1.schema.json';
const DEFAULT_README_PATH = 'docs/specs/README.md';
const EXPECTED_README_HANDOFFS = [
  {
    label: 'fixture-path',
    text: DEFAULT_FIXTURE_PATH,
  },
  {
    label: 'schema-path',
    text: DEFAULT_SCHEMA_PATH,
  },
  {
    label: 'verifier-command',
    text: VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VERIFIER,
  },
  {
    label: 'vector-summary',
    text: 'created, replayed, conflict, and private-material rejection',
  },
  {
    label: 'boundary-gate',
    text: VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE,
  },
] as const;
const UNSAFE_SAFE_REF_PATTERN =
  /rawAddress|rawAgid|rawAoid|recipientName|counterpartyName|phone|email|privateKey|seedPhrase|walletPrivateKey|bankAccount|cardPan|contractBody|customsDocumentBody|proofSecret|carrierApiKey|credential/i;

type JsonObject = Record<string, unknown>;

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function isObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readJson(path: string, label: string, errors: string[]) {
  if (!existsSync(path)) {
    errors.push(`${label}-not-found:${path}`);
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    errors.push(`${label}-invalid-json:${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function readText(path: string, label: string, errors: string[]) {
  if (!existsSync(path)) {
    errors.push(`${label}-not-found:${path}`);
    return undefined;
  }
  return readFileSync(path, 'utf8');
}

function normalizeDocText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function validateReadmeHandoff(readme: string, errors: string[]) {
  const normalizedReadme = normalizeDocText(readme);
  for (const expected of EXPECTED_README_HANDOFFS) {
    if (!normalizedReadme.includes(normalizeDocText(expected.text))) errors.push(`readme:${expected.label}:missing`);
  }
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function nested(value: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!isObject(current)) return undefined;
    return current[key];
  }, value);
}

function propertiesOf(value: unknown) {
  return isObject(value) && isObject(value.properties) ? value.properties : {};
}

function propertyOf(value: unknown, key: string) {
  return propertiesOf(value)[key];
}

function itemsOf(value: unknown) {
  return isObject(value) ? value.items : undefined;
}

function constOf(schema: unknown, path: string[]) {
  let current = schema;
  for (const key of path) current = propertyOf(current, key);
  return isObject(current) ? current.const : undefined;
}

function assertEquals(value: unknown, expected: unknown, path: string, errors: string[]) {
  if (value !== expected) errors.push(`${path}:mismatch`);
}

function assertRequiredFields(value: JsonObject, fields: string[], path: string, errors: string[]) {
  for (const field of fields) {
    if (!(field in value)) errors.push(`${path}.${field}:required`);
  }
}

function assertArrayExact(actual: unknown, expected: readonly string[], path: string, errors: string[]) {
  const actualValues = asStringArray(actual);
  if (
    actualValues.length !== expected.length
    || expected.some((value, index) => actualValues[index] !== value)
  ) {
    errors.push(`${path}:array-mismatch`);
  }
}

function assertAllPresent(actual: string[], expected: readonly string[], path: string, errors: string[]) {
  for (const value of expected) {
    if (!actual.includes(value)) errors.push(`${path}:missing-expected-entry`);
  }
}

function containsUnsafeSafeRef(value: unknown): boolean {
  if (typeof value === 'string') return UNSAFE_SAFE_REF_PATTERN.test(value);
  if (!isObject(value)) return false;
  return Object.entries(value).some(([key, child]) => UNSAFE_SAFE_REF_PATTERN.test(key) || containsUnsafeSafeRef(child));
}

function validateTradeGatewayIdempotencyFixtureAgainstSchema(fixture: unknown, schema: unknown) {
  const errors: string[] = [];
  const expectedFixture = buildVeyTradeGatewayIdempotencyFixture();
  const expectedVectorIds = [...VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS];

  if (!isObject(fixture)) {
    errors.push('schema:$:object-required');
    return errors;
  }
  if (!isObject(schema)) {
    errors.push('schema:$.schema:object-required');
    return errors;
  }

  const requiredRoot = [
    '$schema',
    'fixtureId',
    'status',
    'source',
    'boundaryGateId',
    'privacy',
    'vectors',
    'forbiddenValueMarkers',
    'localOnly',
    'productionTraffic',
    'privateMaterialExposed',
    'nonClaims',
    'validationErrors',
  ];
  assertRequiredFields(fixture, requiredRoot, 'schema:$', errors);
  assertEquals(fixture.$schema, VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_SCHEMA_REF, 'schema:$.$schema', errors);
  assertEquals(fixture.fixtureId, VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID, 'schema:$.fixtureId', errors);
  assertEquals(fixture.status, VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_STATUS, 'schema:$.status', errors);
  assertEquals(nested(fixture, ['source', 'builder']), VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_BUILDER, 'schema:$.source.builder', errors);
  assertEquals(nested(fixture, ['source', 'verifier']), VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VERIFIER, 'schema:$.source.verifier', errors);
  assertEquals(fixture.boundaryGateId, VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE, 'schema:$.boundaryGateId', errors);
  assertEquals(nested(fixture, ['privacy', 'localOnly']), true, 'schema:$.privacy.localOnly', errors);
  assertEquals(nested(fixture, ['privacy', 'productionTraffic']), false, 'schema:$.privacy.productionTraffic', errors);
  assertEquals(nested(fixture, ['privacy', 'containsRawAddress']), false, 'schema:$.privacy.containsRawAddress', errors);
  assertEquals(nested(fixture, ['privacy', 'privateMaterialExposed']), false, 'schema:$.privacy.privateMaterialExposed', errors);
  assertArrayExact(fixture.forbiddenValueMarkers, VEY_TRADE_GATEWAY_IDEMPOTENCY_FORBIDDEN_VALUE_MARKERS, 'schema:$.forbiddenValueMarkers', errors);
  if (asArray(fixture.validationErrors).length !== 0) errors.push('schema:$.validationErrors:must-be-empty');

  assertEquals(schema.type, 'object', 'schema:$.schema.type', errors);
  assertEquals(schema.additionalProperties, false, 'schema:$.schema.additionalProperties', errors);
  assertAllPresent(asStringArray(schema.required), requiredRoot, 'schema:$.schema.required', errors);
  assertEquals(constOf(schema, ['$schema']), VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_SCHEMA_REF, 'schema:$.schema.$schema.const', errors);
  assertEquals(constOf(schema, ['fixtureId']), VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID, 'schema:$.schema.fixtureId.const', errors);
  assertEquals(constOf(schema, ['status']), VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_STATUS, 'schema:$.schema.status.const', errors);
  assertEquals(constOf(schema, ['source', 'builder']), VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_BUILDER, 'schema:$.schema.source.builder.const', errors);
  assertEquals(constOf(schema, ['source', 'verifier']), VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VERIFIER, 'schema:$.schema.source.verifier.const', errors);
  assertEquals(constOf(schema, ['boundaryGateId']), VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE, 'schema:$.schema.boundaryGateId.const', errors);
  assertEquals(constOf(schema, ['privacy', 'localOnly']), true, 'schema:$.schema.privacy.localOnly.const', errors);
  assertEquals(constOf(schema, ['privacy', 'productionTraffic']), false, 'schema:$.schema.privacy.productionTraffic.const', errors);
  assertEquals(constOf(schema, ['privacy', 'containsRawAddress']), false, 'schema:$.schema.privacy.containsRawAddress.const', errors);
  assertEquals(constOf(schema, ['privacy', 'privateMaterialExposed']), false, 'schema:$.schema.privacy.privateMaterialExposed.const', errors);
  assertEquals(constOf(schema, ['localOnly']), true, 'schema:$.schema.localOnly.const', errors);
  assertEquals(constOf(schema, ['productionTraffic']), false, 'schema:$.schema.productionTraffic.const', errors);
  assertEquals(constOf(schema, ['privateMaterialExposed']), false, 'schema:$.schema.privateMaterialExposed.const', errors);

  const vectorsSchema = propertyOf(schema, 'vectors');
  const vectorItemSchema = itemsOf(vectorsSchema);
  const vectorIdEnum = asStringArray(nested(propertyOf(vectorItemSchema, 'vectorId'), ['enum']));
  const forbiddenMarkerEnum = asStringArray(nested(propertyOf(schema, 'forbiddenValueMarkers'), ['items', 'enum']));
  assertEquals(nested(vectorsSchema, ['minItems']), expectedVectorIds.length, 'schema:$.schema.vectors.minItems', errors);
  assertEquals(nested(vectorsSchema, ['maxItems']), expectedVectorIds.length, 'schema:$.schema.vectors.maxItems', errors);
  assertAllPresent(vectorIdEnum, expectedVectorIds, 'schema:$.schema.vectors.items.vectorId.enum', errors);
  assertAllPresent(forbiddenMarkerEnum, VEY_TRADE_GATEWAY_IDEMPOTENCY_FORBIDDEN_VALUE_MARKERS, 'schema:$.schema.forbiddenValueMarkers.items.enum', errors);

  if (JSON.stringify(fixture) !== JSON.stringify(expectedFixture)) {
    errors.push('schema:$.fixture:builder-output-mismatch');
  }

  const vectors = asArray(fixture.vectors);
  if (vectors.length !== expectedVectorIds.length) errors.push('schema:$.vectors:length-mismatch');
  assertArrayExact(vectors.map(vector => isObject(vector) ? vector.vectorId : undefined), expectedVectorIds, 'schema:$.vectors.vectorId', errors);

  const createdRef = nested(vectors[0], ['tradeGatewayIntentRef']);
  const replayedRef = nested(vectors[1], ['tradeGatewayIntentRef']);
  const conflictRefTarget = nested(vectors[2], ['tradeGatewayIntentRef']);

  vectors.forEach((vector, index) => {
    const path = `schema:$.vectors[${index}]`;
    if (!isObject(vector)) {
      errors.push(`${path}:object-required`);
      return;
    }
    assertEquals(vector.localOnly, true, `${path}.localOnly`, errors);
    assertEquals(vector.productionTraffic, false, `${path}.productionTraffic`, errors);
    assertEquals(vector.privateMaterialExposed, false, `${path}.privateMaterialExposed`, errors);
    if (asArray(vector.forbiddenValueMarkersFound).length !== 0) errors.push(`${path}.forbiddenValueMarkersFound:must-be-empty`);
    if (vector.safeRefs !== undefined && containsUnsafeSafeRef(vector.safeRefs)) errors.push(`${path}.safeRefs:unsafe-ref`);
  });

  if (createdRef !== replayedRef || createdRef !== conflictRefTarget) {
    errors.push('schema:$.vectors:created-replayed-conflict-ref-mismatch');
  }
  if (nested(vectors[0], ['decision']) !== 'created') errors.push('schema:$.vectors[0].decision:mismatch');
  if (nested(vectors[1], ['decision']) !== 'replayed') errors.push('schema:$.vectors[1].decision:mismatch');
  if (nested(vectors[1], ['replayed']) !== true) errors.push('schema:$.vectors[1].replayed:mismatch');
  if (nested(vectors[2], ['decision']) !== 'conflict') errors.push('schema:$.vectors[2].decision:mismatch');
  if (typeof nested(vectors[2], ['conflictRef']) !== 'string') errors.push('schema:$.vectors[2].conflictRef:required');
  if (nested(vectors[3], ['decision']) !== 'rejected') errors.push('schema:$.vectors[3].decision:mismatch');
  if (nested(vectors[3], ['tradeGatewayIntentRef']) !== undefined) errors.push('schema:$.vectors[3].tradeGatewayIntentRef:must-be-omitted');

  return errors;
}

const fixturePath = valueAfter('--fixture') ?? DEFAULT_FIXTURE_PATH;
const schemaPath = valueAfter('--schema') ?? DEFAULT_SCHEMA_PATH;
const readmePath = valueAfter('--readme') ?? DEFAULT_README_PATH;
const jsonMode = process.argv.includes('--json');
const errors: string[] = [];
const fixture = readJson(fixturePath, 'fixture', errors);
const schema = readJson(schemaPath, 'schema', errors);
const readme = readText(readmePath, 'readme', errors);

if (fixture !== undefined && schema !== undefined) {
  errors.push(...validateTradeGatewayIdempotencyFixtureAgainstSchema(fixture, schema));
}
if (readme !== undefined) {
  validateReadmeHandoff(readme, errors);
}

const vectorCount = isObject(fixture) ? asArray(fixture.vectors).length : undefined;
const status = errors.length === 0 ? 'pass' : 'fail';
const payload = {
  gate: GATE,
  status,
  fixturePath,
  schemaPath,
  readmePath,
  checked: [fixturePath, schemaPath, readmePath],
  localOnly: true,
  productionTraffic: false,
  vectorCount,
  errors,
};

if (jsonMode) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`[${GATE}] status=${status}`);
  console.log(`fixture=${fixturePath}`);
  console.log(`schema=${schemaPath}`);
  console.log('localOnly=true');
  console.log('productionTraffic=false');
  if (typeof vectorCount === 'number') console.log(`vectorCount=${vectorCount}`);
  if (errors.length > 0) console.error(`errors=${errors.join('|')}`);
}

if (status !== 'pass') process.exitCode = 1;
