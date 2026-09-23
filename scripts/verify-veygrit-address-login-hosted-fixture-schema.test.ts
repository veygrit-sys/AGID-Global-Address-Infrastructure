import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const FIXTURE_PATH = 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json';
const SCHEMA_PATH = 'docs/specs/schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json';

type VerifierPayload = {
  status: 'pass' | 'fail';
  localOnly: boolean;
  productionTraffic: boolean;
  errors: string[];
};

function runHostedFixtureSchemaVerifier(args: string[]) {
  return spawnSync(process.execPath, [
    'node_modules/tsx/dist/cli.mjs',
    'scripts/verify-veygrit-address-login-hosted-fixture-schema.ts',
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

test('Hosted Address Login fixture schema CLI accepts checked-in synthetic fixture', () => {
  const result = runHostedFixtureSchemaVerifier([]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'pass');
  assert.equal(payload.localOnly, true);
  assert.equal(payload.productionTraffic, false);
  assert.deepEqual(payload.errors, []);
});

test('Hosted Address Login fixture schema CLI rejects stale hosted guest alias source', () => {
  const root = mkdtempSync(join(tmpdir(), 'hosted-address-login-fixture-schema-'));
  const fixturePath = join(root, 'veygrit-address-login-hosted-v0.1.json');
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    merchantVisibleRedactionHostedRefSource: {
      guestCheckoutAlias: string;
    };
  };

  fixture.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias = 'guest_checkout_alias_synthetic_rotated_001';
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

  const result = runHostedFixtureSchemaVerifier([
    '--fixture',
    fixturePath,
    '--schema',
    SCHEMA_PATH,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes('schema:$.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias:const-mismatch'));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|productionCredential/i);
});

test('Hosted Address Login fixture schema CLI reports malformed fixture JSON safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'hosted-address-login-fixture-json-'));
  const fixturePath = join(root, 'veygrit-address-login-hosted-v0.1.json');
  writeFileSync(fixturePath, '{ "fixtureSet": "synthetic-veygrit-address-login-hosted-v0.1",\n', 'utf8');

  const result = runHostedFixtureSchemaVerifier([
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
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|productionCredential/i);
});

test('Hosted Address Login fixture schema CLI reports malformed schema JSON safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'hosted-address-login-schema-json-'));
  const schemaPath = join(root, 'veygrit-address-login-hosted-fixture-v0.1.schema.json');
  writeFileSync(schemaPath, '{ "$schema": "https://json-schema.org/draft/2020-12/schema",\n', 'utf8');

  const result = runHostedFixtureSchemaVerifier([
    '--fixture',
    FIXTURE_PATH,
    '--schema',
    schemaPath,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.some(error => error.startsWith('schema-invalid-json:')));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|productionCredential/i);
});

test('Hosted Address Login fixture schema CLI reports missing schema path safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'hosted-address-login-schema-missing-'));
  const schemaPath = join(root, 'missing-hosted-fixture.schema.json');

  const result = runHostedFixtureSchemaVerifier([
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
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|productionCredential/i);
});

test('Hosted Address Login fixture schema CLI reports missing fixture path safely', () => {
  const root = mkdtempSync(join(tmpdir(), 'hosted-address-login-fixture-missing-'));
  const fixturePath = join(root, 'missing-hosted-fixture.json');

  const result = runHostedFixtureSchemaVerifier([
    '--fixture',
    fixturePath,
    '--schema',
    SCHEMA_PATH,
  ]);
  const payload = parsePayload(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  assert.equal(payload.status, 'fail');
  assert.ok(payload.errors.includes(`fixture-not-found:${fixturePath}`));
  assert.doesNotMatch(result.stdout + result.stderr, /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|productionCredential/i);
});
