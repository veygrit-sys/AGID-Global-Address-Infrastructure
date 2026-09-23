import { existsSync, readFileSync } from 'node:fs';

import {
  VEY_ID_ADDRESS_WALLET_BLOCKED_MATERIAL,
  VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION,
  VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS,
  buildVeyIdAddressWalletFoundation,
  buildVeyIdAddressWalletPassExportAudit,
} from '../src/lib/veyIdAddressWalletFoundation';

const GATE = 'verify-vey-id-address-wallet-pass-export-fixture-schema';
const DEFAULT_FIXTURE_PATH = 'docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json';
const DEFAULT_SCHEMA_PATH = 'docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json';
const EXPECTED_SCHEMA_REF = '../schemas/vey-id-address-wallet-pass-export-v0.1.schema.json';
const EXPECTED_FIXTURE_ID = 'vey-id-address-wallet-pass-export-v0.1';
const EXPECTED_STATUS = 'synthetic-local-fixture';
const EXPECTED_BUILDER = 'buildVeyIdAddressWalletPassExportAudit';
const EXPECTED_VERIFIER = 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema';
const EXPECTED_BOUNDARY_GATE = 'wallet-pass-short-lived-ref';
const EXPECTED_ARTIFACT_IDS = ['apple-wallet-pass', 'google-wallet-pass', 'qr-token'];
const UNSAFE_SAFE_REF_PATTERN =
  /rawAddress|recipientName|recipientPhone|privateDeliveryNotes|selectedAddressBody|proofWitness|proofSecret|privateKey|devicePrivateKey|carrierApiKey|carrierCredential|rawQrPayload|unscopedPassPayload/i;

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

function nested(value: unknown, path: string[]) {
  return path.reduce<unknown>((current, key) => {
    if (!isObject(current)) return undefined;
    return current[key];
  }, value);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
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

function assertAllPresent(actual: string[], expected: readonly string[], path: string, errors: string[]) {
  for (const value of expected) {
    if (!actual.includes(value)) errors.push(`${path}:missing-expected-entry`);
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

function validatePassExportFixtureAgainstSchema(fixture: unknown, schema: unknown) {
  const errors: string[] = [];
  const expectedAudit = buildVeyIdAddressWalletPassExportAudit(buildVeyIdAddressWalletFoundation());

  if (!isObject(fixture)) {
    errors.push('schema:$:object-required');
    return errors;
  }
  if (!isObject(schema)) {
    errors.push('schema:$.schema:object-required');
    return errors;
  }

  assertRequiredFields(fixture, ['$schema', 'fixtureId', 'status', 'source', 'boundaryGateId', 'privacy', 'audit'], 'schema:$', errors);
  assertEquals(fixture.$schema, EXPECTED_SCHEMA_REF, 'schema:$.$schema', errors);
  assertEquals(fixture.fixtureId, EXPECTED_FIXTURE_ID, 'schema:$.fixtureId', errors);
  assertEquals(fixture.status, EXPECTED_STATUS, 'schema:$.status', errors);
  assertEquals(nested(fixture, ['source', 'builder']), EXPECTED_BUILDER, 'schema:$.source.builder', errors);
  assertEquals(nested(fixture, ['source', 'verifier']), EXPECTED_VERIFIER, 'schema:$.source.verifier', errors);
  assertEquals(fixture.boundaryGateId, EXPECTED_BOUNDARY_GATE, 'schema:$.boundaryGateId', errors);
  assertEquals(nested(fixture, ['privacy', 'localOnly']), true, 'schema:$.privacy.localOnly', errors);
  assertEquals(nested(fixture, ['privacy', 'productionTraffic']), false, 'schema:$.privacy.productionTraffic', errors);
  assertEquals(nested(fixture, ['privacy', 'containsRawAddress']), false, 'schema:$.privacy.containsRawAddress', errors);
  assertEquals(nested(fixture, ['privacy', 'privateMaterialExposed']), false, 'schema:$.privacy.privateMaterialExposed', errors);

  assertEquals(schema.type, 'object', 'schema:$.schema.type', errors);
  assertEquals(schema.additionalProperties, false, 'schema:$.schema.additionalProperties', errors);
  assertAllPresent(asStringArray(schema.required), ['$schema', 'fixtureId', 'status', 'source', 'boundaryGateId', 'privacy', 'audit'], 'schema:$.schema.required', errors);
  assertEquals(constOf(schema, ['$schema']), EXPECTED_SCHEMA_REF, 'schema:$.schema.$schema.const', errors);
  assertEquals(constOf(schema, ['fixtureId']), EXPECTED_FIXTURE_ID, 'schema:$.schema.fixtureId.const', errors);
  assertEquals(constOf(schema, ['status']), EXPECTED_STATUS, 'schema:$.schema.status.const', errors);
  assertEquals(constOf(schema, ['source', 'builder']), EXPECTED_BUILDER, 'schema:$.schema.source.builder.const', errors);
  assertEquals(constOf(schema, ['source', 'verifier']), EXPECTED_VERIFIER, 'schema:$.schema.source.verifier.const', errors);
  assertEquals(constOf(schema, ['boundaryGateId']), EXPECTED_BOUNDARY_GATE, 'schema:$.schema.boundaryGateId.const', errors);
  assertEquals(constOf(schema, ['privacy', 'localOnly']), true, 'schema:$.schema.privacy.localOnly.const', errors);
  assertEquals(constOf(schema, ['privacy', 'productionTraffic']), false, 'schema:$.schema.privacy.productionTraffic.const', errors);
  assertEquals(constOf(schema, ['privacy', 'containsRawAddress']), false, 'schema:$.schema.privacy.containsRawAddress.const', errors);
  assertEquals(constOf(schema, ['privacy', 'privateMaterialExposed']), false, 'schema:$.schema.privacy.privateMaterialExposed.const', errors);
  assertEquals(constOf(schema, ['audit', 'version']), VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION, 'schema:$.schema.audit.version.const', errors);
  assertEquals(constOf(schema, ['audit', 'artifactCount']), EXPECTED_ARTIFACT_IDS.length, 'schema:$.schema.audit.artifactCount.const', errors);
  assertEquals(constOf(schema, ['audit', 'localOnly']), true, 'schema:$.schema.audit.localOnly.const', errors);
  assertEquals(constOf(schema, ['audit', 'productionTraffic']), false, 'schema:$.schema.audit.productionTraffic.const', errors);
  assertEquals(constOf(schema, ['audit', 'privateMaterialExposed']), false, 'schema:$.schema.audit.privateMaterialExposed.const', errors);

  const auditSchema = propertyOf(schema, 'audit');
  const artifactsSchema = propertyOf(auditSchema, 'artifacts');
  const artifactItemSchema = itemsOf(artifactsSchema);
  const artifactIdEnum = asStringArray(nested(propertyOf(artifactItemSchema, 'artifactId'), ['enum']));
  const safeRefEnum = asStringArray(nested(propertyOf(artifactItemSchema, 'safePayloadRefs'), ['items', 'enum']));
  const blockedPayloadEnum = asStringArray(nested(propertyOf(artifactItemSchema, 'blockedPayload'), ['items', 'enum']));
  const forbiddenMarkerEnum = asStringArray(nested(propertyOf(auditSchema, 'forbiddenValueMarkers'), ['items', 'enum']));
  const expectedSafeRefs = [...new Set(expectedAudit.artifacts.flatMap(artifact => artifact.safePayloadRefs))];

  assertEquals(nested(artifactsSchema, ['minItems']), EXPECTED_ARTIFACT_IDS.length, 'schema:$.schema.audit.artifacts.minItems', errors);
  assertEquals(nested(artifactsSchema, ['maxItems']), EXPECTED_ARTIFACT_IDS.length, 'schema:$.schema.audit.artifacts.maxItems', errors);
  assertAllPresent(artifactIdEnum, EXPECTED_ARTIFACT_IDS, 'schema:$.schema.audit.artifacts.items.artifactId.enum', errors);
  assertAllPresent(safeRefEnum, expectedSafeRefs, 'schema:$.schema.audit.artifacts.items.safePayloadRefs.enum', errors);
  if (safeRefEnum.some(ref => UNSAFE_SAFE_REF_PATTERN.test(ref))) {
    errors.push('schema:$.schema.audit.artifacts.items.safePayloadRefs.enum:unsafe-ref');
  }
  assertAllPresent(blockedPayloadEnum, VEY_ID_ADDRESS_WALLET_BLOCKED_MATERIAL, 'schema:$.schema.audit.artifacts.items.blockedPayload.enum', errors);
  assertAllPresent(forbiddenMarkerEnum, VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS, 'schema:$.schema.audit.forbiddenValueMarkers.enum', errors);
  assertEquals(nested(propertyOf(artifactItemSchema, 'forbiddenValueMarkersFound'), ['maxItems']), 0, 'schema:$.schema.audit.artifacts.items.forbiddenValueMarkersFound.maxItems', errors);
  assertEquals(nested(propertyOf(auditSchema, 'validationErrors'), ['maxItems']), 0, 'schema:$.schema.audit.validationErrors.maxItems', errors);

  const audit = nested(fixture, ['audit']);
  if (!isObject(audit)) {
    errors.push('schema:$.audit:object-required');
    return errors;
  }

  if (JSON.stringify(audit) !== JSON.stringify(expectedAudit)) {
    errors.push('schema:$.audit:builder-output-mismatch');
  }
  assertEquals(audit.version, VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION, 'schema:$.audit.version', errors);
  assertEquals(audit.artifactCount, EXPECTED_ARTIFACT_IDS.length, 'schema:$.audit.artifactCount', errors);
  assertEquals(audit.localOnly, true, 'schema:$.audit.localOnly', errors);
  assertEquals(audit.productionTraffic, false, 'schema:$.audit.productionTraffic', errors);
  assertEquals(audit.privateMaterialExposed, false, 'schema:$.audit.privateMaterialExposed', errors);
  assertArrayExact(audit.forbiddenValueMarkers, VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS, 'schema:$.audit.forbiddenValueMarkers', errors);
  if (asArray(audit.validationErrors).length !== 0) errors.push('schema:$.audit.validationErrors:must-be-empty');

  const artifacts = asArray(audit.artifacts);
  if (artifacts.length !== EXPECTED_ARTIFACT_IDS.length) errors.push('schema:$.audit.artifacts:length-mismatch');
  const seenArtifactIds = new Set<string>();
  artifacts.forEach((artifact, index) => {
    const path = `schema:$.audit.artifacts[${index}]`;
    if (!isObject(artifact)) {
      errors.push(`${path}:object-required`);
      return;
    }
    const artifactId = nested(artifact, ['artifactId']);
    if (typeof artifactId === 'string') seenArtifactIds.add(artifactId);
    if (typeof artifactId !== 'string' || !EXPECTED_ARTIFACT_IDS.includes(artifactId)) {
      errors.push(`${path}.artifactId:invalid`);
    }
    assertEquals(artifact.localOnly, true, `${path}.localOnly`, errors);
    assertEquals(artifact.productionTraffic, false, `${path}.productionTraffic`, errors);
    assertEquals(artifact.privateMaterialExposed, false, `${path}.privateMaterialExposed`, errors);
    const safePayloadRefs = asStringArray(artifact.safePayloadRefs);
    if (!safePayloadRefs.includes('expiry')) errors.push(`${path}.safePayloadRefs:missing-expiry`);
    if (safePayloadRefs.some(ref => UNSAFE_SAFE_REF_PATTERN.test(ref))) errors.push(`${path}.safePayloadRefs:unsafe-ref`);
    if (!asStringArray(artifact.blockedPayload).includes('rawQrPayload')) errors.push(`${path}.blockedPayload:missing-required-block`);
    if (!asStringArray(artifact.nonClaims).some(nonClaim => /not raw address disclosure|long-lived bearer address token/i.test(nonClaim))) {
      errors.push(`${path}.nonClaims:missing-required-non-claim`);
    }
    if (asArray(artifact.forbiddenValueMarkersFound).length !== 0) {
      errors.push(`${path}.forbiddenValueMarkersFound:must-be-empty`);
    }
  });
  assertAllPresent([...seenArtifactIds], EXPECTED_ARTIFACT_IDS, 'schema:$.audit.artifacts.artifactId', errors);

  return errors;
}

const fixturePath = valueAfter('--fixture') ?? DEFAULT_FIXTURE_PATH;
const schemaPath = valueAfter('--schema') ?? DEFAULT_SCHEMA_PATH;
const jsonMode = process.argv.includes('--json');
const errors: string[] = [];
const fixture = readJson(fixturePath, 'fixture', errors);
const schema = readJson(schemaPath, 'schema', errors);

if (fixture !== undefined && schema !== undefined) {
  errors.push(...validatePassExportFixtureAgainstSchema(fixture, schema));
}

const artifactCount = isObject(fixture) && isObject(fixture.audit) ? asArray(fixture.audit.artifacts).length : undefined;
const status = errors.length === 0 ? 'pass' : 'fail';
const payload = {
  gate: GATE,
  status,
  fixturePath,
  schemaPath,
  checked: [fixturePath, schemaPath],
  localOnly: true,
  productionTraffic: false,
  artifactCount,
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
  if (typeof artifactCount === 'number') console.log(`artifactCount=${artifactCount}`);
  if (errors.length > 0) console.error(`errors=${errors.join('|')}`);
}

if (status !== 'pass') process.exitCode = 1;
