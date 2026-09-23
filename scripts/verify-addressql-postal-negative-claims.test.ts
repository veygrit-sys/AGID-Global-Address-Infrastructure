import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const FIXTURE_PATH = 'docs/specs/fixtures/addressql-postal-validation-negative-claims-v0.1.json';
const SCHEMA_PATH = 'docs/specs/schemas/addressql-postal-validation-negative-claims-v0.1.schema.json';
const BLOCKED_MATERIAL_PATTERN = /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|productionCredential/i;

type VerifyPayload = {
  status: 'pass' | 'fail';
  localOnly: boolean;
  productionTraffic: boolean;
  boundaryCount: number;
  caseCount: number;
  errors: string[];
};

function runVerifier(args: string[]) {
  return spawnSync(process.execPath, [
    'node_modules/tsx/dist/cli.mjs',
    'scripts/verify-addressql-postal-negative-claims.ts',
    ...args,
    '--json',
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function parsePayload(stdout: string): VerifyPayload {
  return JSON.parse(stdout) as VerifyPayload;
}

test('AddressQL postal negative-claims verifier accepts checked-in synthetic fixture and schema', () => {
  const result = runVerifier([]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'pass');
  assert.equal(payload.localOnly, true);
  assert.equal(payload.productionTraffic, false);
  assert.equal(payload.boundaryCount, 4);
  assert.equal(payload.caseCount, 4);
  assert.deepEqual(payload.errors, []);
});

test('AddressQL postal negative-claims verifier rejects stale fixture boundaries safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'addressql-postal-negative-claims-'));
  const fixturePath = join(root, 'addressql-postal-validation-negative-claims-v0.1.json');
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    privacy: { production_traffic: boolean };
    cases: Array<{ required_boundary: string; safe_replacement: string }>;
  };

  fixture.privacy.production_traffic = true;
  fixture.cases[0].required_boundary = 'format_pass_claims_existence';
  fixture.cases[0].safe_replacement = 'A passing format check proves existence.';
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

  const result = runVerifier([
    '--fixture',
    fixturePath,
    '--schema',
    SCHEMA_PATH,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('fixture:privacy-production-traffic-must-be-false'));
  assert.ok(payload.errors.includes('fixture:case-0:unknown-required-boundary:format_pass_claims_existence'));
  assert.ok(payload.errors.includes('fixture:case-0:safe-replacement-missing-non-claim'));
  assert.ok(payload.errors.includes('fixture:missing-boundary-case:format_pass_does_not_imply_existence'));
  assert.doesNotMatch(result.stdout + result.stderr, BLOCKED_MATERIAL_PATTERN);
});

test('AddressQL postal negative-claims verifier rejects stale schema boundaries safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'addressql-postal-negative-schema-'));
  const schemaPath = join(root, 'addressql-postal-validation-negative-claims-v0.1.schema.json');
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as {
    properties: {
      privacy: { properties: { production_traffic: { const: boolean } } };
      cases: { items: { properties: { required_boundary: { enum: string[] } } } };
    };
  };

  schema.properties.privacy.properties.production_traffic.const = true;
  schema.properties.cases.items.properties.required_boundary.enum =
    schema.properties.cases.items.properties.required_boundary.enum.slice(1);
  writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`, 'utf8');

  const result = runVerifier([
    '--fixture',
    FIXTURE_PATH,
    '--schema',
    schemaPath,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('schema:schema-production-traffic-const-mismatch'));
  assert.ok(payload.errors.includes('schema:schema-required-boundary-enum-mismatch'));
  assert.doesNotMatch(result.stdout + result.stderr, BLOCKED_MATERIAL_PATTERN);
});
