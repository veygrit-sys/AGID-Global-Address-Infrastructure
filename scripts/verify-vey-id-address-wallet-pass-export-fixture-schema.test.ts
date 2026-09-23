import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const FIXTURE_PATH = 'docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json';
const SCHEMA_PATH = 'docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json';
const SCRIPT_PATH = 'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts';

type VerifierPayload = {
  gate: string;
  status: 'pass' | 'fail';
  localOnly: boolean;
  productionTraffic: boolean;
  artifactCount?: number;
  errors: string[];
};

function runPassExportFixtureSchemaVerifier(args: string[]) {
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

test('Vey ID pass export fixture schema CLI accepts checked-in synthetic fixture', () => {
  const result = runPassExportFixtureSchemaVerifier([]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(payload.gate, 'verify-vey-id-address-wallet-pass-export-fixture-schema');
  assert.equal(payload.status, 'pass');
  assert.equal(payload.localOnly, true);
  assert.equal(payload.productionTraffic, false);
  assert.equal(payload.artifactCount, 3);
  assert.deepEqual(payload.errors, []);
});

test('Vey ID pass export fixture schema CLI rejects stale fixture verifier ownership', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-id-pass-export-fixture-verifier-'));
  const fixturePath = join(root, 'vey-id-address-wallet-pass-export-v0.1.json');
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    source: {
      verifier: string;
    };
  };

  fixture.source.verifier = 'npm run verify:vey-id-address-wallet-foundation';
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

  const result = runPassExportFixtureSchemaVerifier([
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
});

test('Vey ID pass export fixture schema CLI rejects unsafe pass refs without echoing values', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-id-pass-export-unsafe-ref-'));
  const fixturePath = join(root, 'vey-id-address-wallet-pass-export-v0.1.json');
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    audit: {
      artifacts: Array<{
        safePayloadRefs: string[];
      }>;
    };
  };

  fixture.audit.artifacts[0].safePayloadRefs.push('rawAddressValue');
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

  const result = runPassExportFixtureSchemaVerifier([
    '--fixture',
    fixturePath,
    '--schema',
    SCHEMA_PATH,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('schema:$.audit:builder-output-mismatch'));
  assert.ok(payload.errors.includes('schema:$.audit.artifacts[0].safePayloadRefs:unsafe-ref'));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddressValue|proofSecretValue|privateKeyValue|carrierApiKeyValue/);
});

test('Vey ID pass export fixture schema CLI reports malformed fixture JSON safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-id-pass-export-fixture-json-'));
  const fixturePath = join(root, 'vey-id-address-wallet-pass-export-v0.1.json');
  writeFileSync(fixturePath, '{ "fixtureId": "vey-id-address-wallet-pass-export-v0.1",\n', 'utf8');

  const result = runPassExportFixtureSchemaVerifier([
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
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddressValue|proofSecretValue|privateKeyValue|carrierApiKeyValue/);
});

test('Vey ID pass export fixture schema CLI reports missing schema path safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'vey-id-pass-export-schema-missing-'));
  const schemaPath = join(root, 'missing-vey-id-pass-export.schema.json');

  const result = runPassExportFixtureSchemaVerifier([
    '--fixture',
    FIXTURE_PATH,
    '--schema',
    schemaPath,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes(`schema-not-found:${schemaPath}`));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddressValue|proofSecretValue|privateKeyValue|carrierApiKeyValue/);
});
