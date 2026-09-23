import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const FIXTURE_PATH = 'docs/specs/fixtures/vey-trade-gateway-idempotency-v0.1.json';
const SCHEMA_PATH = 'docs/specs/schemas/vey-trade-gateway-idempotency-v0.1.schema.json';
const SCRIPT_PATH = 'scripts/verify-vey-trade-gateway-idempotency-fixture-schema.ts';

type VerifierPayload = {
  gate: string;
  status: 'pass' | 'fail';
  localOnly: boolean;
  productionTraffic: boolean;
  vectorCount?: number;
  errors: string[];
};

function runTradeGatewayFixtureSchemaVerifier(args: string[]) {
  return spawnSync(process.execPath, [
    'node_modules/tsx/dist/cli.mjs',
    SCRIPT_PATH,
    ...args,
    '--json',
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function parsePayload(stdout: string): VerifierPayload {
  return JSON.parse(stdout) as VerifierPayload;
}

test('Trade Gateway idempotency fixture schema CLI accepts checked-in synthetic fixture', () => {
  const result = runTradeGatewayFixtureSchemaVerifier([]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(payload.gate, 'verify-vey-trade-gateway-idempotency-fixture-schema');
  assert.equal(payload.status, 'pass');
  assert.equal(payload.localOnly, true);
  assert.equal(payload.productionTraffic, false);
  assert.equal(payload.vectorCount, 4);
  assert.deepEqual(payload.errors, []);
});

test('Trade Gateway idempotency fixture schema CLI rejects stale verifier ownership', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-trade-gateway-idempotency-verifier-'));
  const fixturePath = join(root, 'vey-trade-gateway-idempotency-v0.1.json');
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    source: {
      verifier: string;
    };
  };

  fixture.source.verifier = 'npm run verify:vey-trading';
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

  const result = runTradeGatewayFixtureSchemaVerifier([
    '--fixture',
    fixturePath,
    '--schema',
    SCHEMA_PATH,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('schema:$.source.verifier:mismatch'));
  assert.ok(payload.errors.includes('schema:$.fixture:builder-output-mismatch'));
});

test('Trade Gateway idempotency fixture schema CLI rejects unsafe safe refs without echoing values', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-trade-gateway-idempotency-unsafe-ref-'));
  const fixturePath = join(root, 'vey-trade-gateway-idempotency-v0.1.json');
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    vectors: Array<{
      safeRefs: Record<string, string>;
    }>;
  };

  fixture.vectors[0].safeRefs.rawAddressRef = 'rawAddressLeakedRef';
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

  const result = runTradeGatewayFixtureSchemaVerifier([
    '--fixture',
    fixturePath,
    '--schema',
    SCHEMA_PATH,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('schema:$.fixture:builder-output-mismatch'));
  assert.ok(payload.errors.includes('schema:$.vectors[0].safeRefs:unsafe-ref'));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddressLeakedRef|proofSecretLeakedRef|privateKeyLeakedRef/);
});

test('Trade Gateway idempotency fixture schema CLI rejects missing README handoff safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-trade-gateway-idempotency-readme-'));
  const readmePath = join(root, 'README.md');
  writeFileSync(readmePath, '# Specs\n\nNo Trade Gateway fixture handoff yet.\n', 'utf8');

  const result = runTradeGatewayFixtureSchemaVerifier([
    '--fixture',
    FIXTURE_PATH,
    '--schema',
    SCHEMA_PATH,
    '--readme',
    readmePath,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('readme:fixture-path:missing'));
  assert.ok(payload.errors.includes('readme:schema-path:missing'));
  assert.ok(payload.errors.includes('readme:verifier-command:missing'));
  assert.ok(payload.errors.includes('readme:vector-summary:missing'));
  assert.ok(payload.errors.includes('readme:boundary-gate:missing'));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddressLeakedRef|proofSecretLeakedRef|privateKeyLeakedRef/);
});

test('Trade Gateway idempotency fixture schema CLI reports malformed fixture JSON safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-trade-gateway-idempotency-json-'));
  const fixturePath = join(root, 'vey-trade-gateway-idempotency-v0.1.json');
  writeFileSync(fixturePath, '{ "fixtureId": "vey-trade-gateway-idempotency-v0.1",\n', 'utf8');

  const result = runTradeGatewayFixtureSchemaVerifier([
    '--fixture',
    fixturePath,
    '--schema',
    SCHEMA_PATH,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.some(error => error.startsWith('fixture-invalid-json:')));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddressLeakedRef|proofSecretLeakedRef|privateKeyLeakedRef/);
});
