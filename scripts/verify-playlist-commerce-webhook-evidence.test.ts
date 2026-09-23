import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { verifyPlaylistCommerceWebhookEvidence } from './verify-playlist-commerce-webhook-evidence';

test('Playlist Commerce webhook evidence verifier accepts the checked-in redacted fixture', () => {
  const result = verifyPlaylistCommerceWebhookEvidence();

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.summary.totalRecords, 3);
  assert.equal(result.summary.linkedHistoryRuns, 3);
  assert.equal(result.summary.latestEvidenceRef, 'pc_webhook_preflight_evidence_003');
  assert.equal(result.summary.managedServiceBoundary, 'fixture-only-not-hosted-evidence-vault');
  assert.match(result.schemaPath, /playlist-commerce-webhook-evidence-v0\.1\.schema\.json$/);
  assert.match(result.openApiPath, /playlist-commerce-webhooks\.openapi\.yaml$/);
  assert.match(result.openApiExtensionSchemaPath, /agid-openapi-evidence-extension-v0\.1\.schema\.json$/);
  assert.match(
    result.playlistCommerceOpenApiExtensionProfileSchemaPath,
    /playlist-commerce-openapi-evidence-extension-v0\.1\.schema\.json$/,
  );
});

test('Playlist Commerce webhook evidence docs expose fixtures, schema, verifier, and non-claims', () => {
  const readme = readFileSync(join(process.cwd(), 'docs', 'specs', 'README.md'), 'utf8');

  assert.match(readme, /Playlist Commerce webhook evidence fixture/);
  assert.match(readme, /schemas\/playlist-commerce-webhook-evidence-v0\.1\.schema\.json/);
  assert.match(readme, /schemas\/agid-openapi-evidence-extension-v0\.1\.schema\.json/);
  assert.match(readme, /schemas\/playlist-commerce-openapi-evidence-extension-v0\.1\.schema\.json/);
  assert.match(readme, /generic `x-agid-evidence-fixtures` OpenAPI extension/);
  assert.match(readme, /x-agid-evidence-fixtures/);
  assert.match(readme, /npm run verify:playlist-commerce-evidence/);
  assert.match(readme, /not hosted Evidence Vault records/);
  assert.match(readme, /raw address intake/);
  assert.match(readme, /production webhook secret/);
  assert.match(readme, /proof witness/);
});

test('Playlist Commerce webhook evidence verifier rejects schema-incomplete records', () => {
  const root = join(tmpdir(), `playlist-commerce-evidence-schema-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  const evidence = JSON.parse(readFileSync(
    join(process.cwd(), 'docs', 'specs', 'fixtures', 'playlist-commerce-webhook-evidence-v0.1.json'),
    'utf8',
  ));
  delete evidence.records[0].commitments.requestCommitmentRef;

  writeFileSync(
    join(fixturesDir, 'playlist-commerce-webhook-evidence-v0.1.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(fixturesDir, 'playlist-commerce-webhook-preflight-history-v0.1.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'playlist-commerce-webhook-preflight-history-v0.1.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'playlist-commerce-webhook-evidence-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'playlist-commerce-webhook-evidence-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'agid-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'agid-openapi-evidence-extension-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'playlist-commerce-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(
      join(process.cwd(), 'docs', 'specs', 'schemas', 'playlist-commerce-openapi-evidence-extension-v0.1.schema.json'),
      'utf8',
    ),
    'utf8',
  );
  writeFileSync(
    join(root, 'docs', 'specs', 'playlist-commerce-webhooks.openapi.yaml'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'playlist-commerce-webhooks.openapi.yaml'), 'utf8'),
    'utf8',
  );

  const result = verifyPlaylistCommerceWebhookEvidence(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => (
    error === 'schema-conformance:$.records[0].commitments.requestCommitmentRef:required-missing'
  )));
});

test('Playlist Commerce webhook evidence verifier rejects OpenAPI evidence extension drift', () => {
  const root = join(tmpdir(), `playlist-commerce-evidence-openapi-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writeFileSync(
    join(fixturesDir, 'playlist-commerce-webhook-evidence-v0.1.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'playlist-commerce-webhook-evidence-v0.1.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(fixturesDir, 'playlist-commerce-webhook-preflight-history-v0.1.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'playlist-commerce-webhook-preflight-history-v0.1.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'playlist-commerce-webhook-evidence-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'playlist-commerce-webhook-evidence-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'agid-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'agid-openapi-evidence-extension-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'playlist-commerce-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(
      join(process.cwd(), 'docs', 'specs', 'schemas', 'playlist-commerce-openapi-evidence-extension-v0.1.schema.json'),
      'utf8',
    ),
    'utf8',
  );
  writeFileSync(
    join(root, 'docs', 'specs', 'playlist-commerce-webhooks.openapi.yaml'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'playlist-commerce-webhooks.openapi.yaml'), 'utf8')
      .replace('verifierCommand: npm run verify:playlist-commerce-evidence', 'verifierCommand: npm run verify:wrong-playlist-commerce-evidence'),
    'utf8',
  );

  const result = verifyPlaylistCommerceWebhookEvidence(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('openapi-verifier-command-mismatch'));
});
