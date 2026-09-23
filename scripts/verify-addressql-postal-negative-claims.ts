import { existsSync, readFileSync } from 'node:fs';

import {
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE,
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA,
  POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS,
  validatePostalValidationNegativeClaimsFixture,
} from '../src/lib/addressQlPostalValidationParity';

type VerifyReport = {
  gate: 'verify-addressql-postal-negative-claims';
  status: 'pass' | 'fail';
  fixturePath: string;
  schemaPath: string;
  checked: string[];
  localOnly: true;
  productionTraffic: false;
  boundaryCount: number;
  caseCount: number;
  errors: string[];
};

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function validateNegativeClaimsSchema(schema: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(schema)) return ['schema-must-be-object'];

  if (typeof schema.$id !== 'string' || !schema.$id.endsWith('addressql-postal-validation-negative-claims-v0.1.schema.json')) {
    errors.push('schema-id-mismatch');
  }
  if (!stringArray(schema.required).includes('cases')) errors.push('schema-required-cases-missing');

  const properties = isRecord(schema.properties) ? schema.properties : {};
  const fixtureId = isRecord(properties.fixture_id) ? properties.fixture_id.const : undefined;
  if (fixtureId !== 'addressql-postal-validation-negative-claims-v0.1') errors.push('schema-fixture-id-const-mismatch');

  const privacy = isRecord(properties.privacy) ? properties.privacy : {};
  const privacyProperties = isRecord(privacy.properties) ? privacy.properties : {};
  const productionTraffic = isRecord(privacyProperties.production_traffic)
    ? privacyProperties.production_traffic.const
    : undefined;
  if (productionTraffic !== false) errors.push('schema-production-traffic-const-mismatch');

  const cases = isRecord(properties.cases) ? properties.cases : {};
  const items = isRecord(cases.items) ? cases.items : {};
  const caseProperties = isRecord(items.properties) ? items.properties : {};
  const requiredBoundary = isRecord(caseProperties.required_boundary) ? caseProperties.required_boundary : {};
  const enumValues = stringArray(requiredBoundary.enum);
  if (enumValues.join('|') !== POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS.join('|')) {
    errors.push('schema-required-boundary-enum-mismatch');
  }

  const expectedStatus = isRecord(caseProperties.expected_status) ? caseProperties.expected_status.const : undefined;
  if (expectedStatus !== 'blocked') errors.push('schema-expected-status-const-mismatch');

  return errors;
}

const fixturePath = valueAfter('--fixture') ?? POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE;
const schemaPath = valueAfter('--schema') ?? POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA;
const jsonMode = process.argv.includes('--json');
const errors: string[] = [];

const fixture = readJson(fixturePath, 'fixture', errors);
const schema = readJson(schemaPath, 'schema', errors);

if (fixture !== undefined) {
  errors.push(...validatePostalValidationNegativeClaimsFixture(fixture).map(error => `fixture:${error}`));
}
if (schema !== undefined) {
  errors.push(...validateNegativeClaimsSchema(schema).map(error => `schema:${error}`));
}

const status = errors.length === 0 ? 'pass' : 'fail';
const report: VerifyReport = {
  gate: 'verify-addressql-postal-negative-claims',
  status,
  fixturePath,
  schemaPath,
  checked: [fixturePath, schemaPath],
  localOnly: true,
  productionTraffic: false,
  boundaryCount: POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS.length,
  caseCount: isRecord(fixture) && Array.isArray(fixture.cases) ? fixture.cases.length : 0,
  errors,
};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`[verify-addressql-postal-negative-claims] status=${status}`);
  console.log(`fixture=${fixturePath}`);
  console.log(`schema=${schemaPath}`);
  console.log('localOnly=true');
  console.log('productionTraffic=false');
  console.log(`boundaryCount=${report.boundaryCount}`);
  console.log(`caseCount=${report.caseCount}`);
  if (errors.length > 0) console.error(`errors=${errors.join('|')}`);
}

if (status !== 'pass') process.exitCode = 1;
