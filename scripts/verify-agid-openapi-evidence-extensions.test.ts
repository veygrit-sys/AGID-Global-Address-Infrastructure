import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import test from 'node:test';

import { verifyAgidOpenApiEvidenceExtensions } from './verify-agid-openapi-evidence-extensions';
import { verifyAgidOpenApiEvidenceWorkflow } from './verify-agid-openapi-evidence-workflow';

function copyNonClaimsProfileFiles(fixturesDir: string, schemasDir: string) {
  writeFileSync(
    join(fixturesDir, 'agid-non-claims-profiles-v0.1.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'agid-non-claims-profiles-v0.1.json'), 'utf8'),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'agid-non-claims-profiles-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'agid-non-claims-profiles-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
}

function copyOpenApiEvidenceExtensionSchema(
  schemasDir: string,
  transform: (schema: string) => string = schema => schema,
) {
  writeFileSync(
    join(schemasDir, 'agid-openapi-evidence-extension-v0.1.schema.json'),
    transform(readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'agid-openapi-evidence-extension-v0.1.schema.json'), 'utf8')),
    'utf8',
  );
}

function copyOpenApiLinkedVerifierSchema(schemasDir: string) {
  writeFileSync(
    join(schemasDir, 'agid-openapi-linked-verifiers-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'agid-openapi-linked-verifiers-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
}

function writePackageJsonScripts(root: string, scripts: Record<string, string>) {
  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify({ scripts }, null, 2)}\n`,
    'utf8',
  );
}

function writeEmptyExamplePreflightHistoryFixtures(fixturesDir: string) {
  writeFileSync(join(fixturesDir, 'example-preflight.json'), '{}\n', 'utf8');
  writeFileSync(join(fixturesDir, 'example-history.json'), '{}\n', 'utf8');
}

function writeEmptyExampleEvidenceFixtureSet(fixturesDir: string, schemasDir: string) {
  writeEmptyExamplePreflightHistoryFixtures(fixturesDir);
  writeFileSync(join(fixturesDir, 'example-evidence.json'), '{}\n', 'utf8');
  writeFileSync(join(schemasDir, 'example-evidence.schema.json'), '{}\n', 'utf8');
}

function writeOpenApiLinkedVerifierAllowlistFixture(
  fixturesDir: string,
  {
    description,
    verifier,
    nonClaims = [
      'not-production-traffic',
      'not-raw-address-intake',
      'not-proof-witness-intake',
    ],
  }: {
    description: string;
    verifier: {
      command: string;
      script: string;
      runner: string[];
      managedServiceBoundary: string;
      timeoutMs?: number;
    };
    nonClaims?: string[];
  },
) {
  writeFileSync(
    join(fixturesDir, 'agid-openapi-linked-verifiers-v0.1.json'),
    `${JSON.stringify({
      artifact: 'agid-openapi-linked-verifier-allowlist',
      version: 'v0.1',
      localOnly: true,
      description,
      nonClaims,
      verifiers: [
        {
          command: verifier.command,
          script: verifier.script,
          runner: verifier.runner,
          timeoutMs: verifier.timeoutMs ?? 120000,
          managedServiceBoundary: verifier.managedServiceBoundary,
        },
      ],
    }, null, 2)}\n`,
    'utf8',
  );
}

function writeExampleOpenApiEvidenceExtension(
  root: string,
  method: 'get' | 'post',
  evidenceExtensionLines: string[],
) {
  writeFileSync(
    join(root, 'docs', 'specs', 'example.openapi.yaml'),
    [
      'openapi: 3.1.0',
      'info:',
      '  title: Example',
      '  version: 0.1.0',
      'paths:',
      '  /example:',
      `    ${method}:`,
      '      x-agid-evidence-fixtures:',
      ...evidenceExtensionLines.map(line => `        ${line}`),
      '',
    ].join('\n'),
    'utf8',
  );
}

function genericEvidenceExtensionLines({
  localOnly = true,
  nonClaims = ['not-raw-address-intake', 'not-proof-witness-intake'],
}: {
  localOnly?: boolean;
  nonClaims?: string[];
} = {}) {
  return [
    'preflightFixture: docs/specs/fixtures/example-preflight.json',
    'historyFixture: docs/specs/fixtures/example-history.json',
    'evidenceFixture: docs/specs/fixtures/example-evidence.json',
    'evidenceSchema: docs/specs/schemas/example-evidence.schema.json',
    'verifierCommand: npm run verify:example',
    'aggregateVerifierCommand: npm run verify:example-all',
    'managedServiceBoundary: fixture-only-not-hosted-example',
    `localOnly: ${localOnly ? 'true' : 'false'}`,
    'forbiddenMaterial:',
    '  - raw_address',
    '  - proof_witness',
    '  - private_key',
    '  - production_webhook_secret',
    'nonClaims:',
    ...nonClaims.map(nonClaim => `  - ${nonClaim}`),
    'nonClaimsProfile: agid-generic-evidence-v0.1',
  ];
}

function playlistCommerceEvidenceExtensionLines({
  nonClaims = [
    'not-payment-settlement',
    'not-raw-address-intake',
    'not-proof-witness-intake',
    'not-production-delivery-attempt',
  ],
}: {
  nonClaims?: string[];
} = {}) {
  return [
    'preflightFixture: docs/specs/fixtures/example-preflight.json',
    'historyFixture: docs/specs/fixtures/example-history.json',
    'evidenceFixture: docs/specs/fixtures/example-evidence.json',
    'evidenceSchema: docs/specs/schemas/example-evidence.schema.json',
    'verifierCommand: npm run verify:example',
    'aggregateVerifierCommand: npm run verify:example-all',
    'managedServiceBoundary: fixture-only-not-hosted-example',
    'localOnly: true',
    'forbiddenMaterial:',
    '  - raw_address',
    '  - proof_witness',
    '  - private_key',
    '  - production_webhook_secret',
    'nonClaims:',
    ...nonClaims.map(nonClaim => `  - ${nonClaim}`),
    'nonClaimsProfile: playlist-commerce-webhook-v0.1',
  ];
}

function merchantConsoleEvidenceExtensionLines(
  verifierCommand = 'npm run verify:merchant-console-ec-plugin',
) {
  return [
    'preflightFixture: docs/specs/fixtures/merchant-console-onboarding-v0.1.json',
    'historyFixture: docs/specs/fixtures/merchant-console-onboarding-v0.1.json',
    'evidenceFixture: docs/specs/fixtures/merchant-console-onboarding-v0.1.json',
    'evidenceSchema: docs/specs/schemas/merchant-console-onboarding-v0.1.schema.json',
    `verifierCommand: ${verifierCommand}`,
    'aggregateVerifierCommand: npm run verify:address-login-spec',
    'managedServiceBoundary: delivery-gateway-carrier-api',
    'localOnly: true',
    'forbiddenMaterial:',
    '  - raw_address',
    '  - address_line_1',
    '  - address_line_2',
    '  - recipient_name',
    '  - recipient_phone',
    '  - carrier_api_key',
    '  - carrier_credential',
    '  - raw_carrier_payload',
    '  - raw_label_payload',
    '  - webhook_secret',
    '  - production_webhook_secret',
    '  - proof_witness',
    '  - proof_secret',
    '  - private_key',
    '  - provider_id_token',
    '  - provider_access_token',
    '  - provider_refresh_token',
    '  - raw_provider_profile',
    'nonClaims:',
    '  - not-raw-address-intake',
    '  - not-proof-witness-intake',
    '  - not-provider-token-intake',
    '  - not-raw-carrier-payload-intake',
    '  - not-live-carrier-credential',
    '  - not-raw-address-disclosure',
    '  - not-production-dhl-ups-traffic',
    '  - not-carrier-specific-address-form',
    '  - not-raw-address-callback',
    'nonClaimsProfile: merchant-console-onboarding-v0.1',
  ];
}

function hostedAddressLoginEvidenceExtensionLines(
  verifierCommand = 'npm run verify:veygrit-address-login-hosted',
) {
  return [
    'preflightFixture: docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json',
    'historyFixture: docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json',
    'evidenceFixture: docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json',
    'evidenceSchema: docs/specs/schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json',
    `verifierCommand: ${verifierCommand}`,
    'aggregateVerifierCommand: npm run verify:address-login-spec',
    'managedServiceBoundary: fixture-only-not-hosted-address-login',
    'localOnly: true',
    'forbiddenMaterial:',
    '  - raw_address',
    '  - recipient_phone',
    '  - proof_witness',
    '  - private_key',
    '  - biometric_template',
    '  - production_webhook_secret',
    'nonClaims:',
    '  - not-raw-address-intake',
    '  - not-proof-witness-intake',
    '  - not-production-credential-intake',
    'nonClaimsProfile: veygrit-address-login-hosted-v0.1',
  ];
}

test('AGID OpenAPI evidence extension scanner accepts checked-in specs', () => {
  const result = verifyAgidOpenApiEvidenceExtensions();

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.nonClaimsProfilesPath, 'docs/specs/fixtures/agid-non-claims-profiles-v0.1.json');
  assert.ok(result.openApiFiles.includes('docs/specs/playlist-commerce-webhooks.openapi.yaml'));
  assert.ok(result.openApiFiles.includes('docs/specs/veygrit-address-login-hosted.openapi.yaml'));
  assert.ok(result.openApiFiles.includes('docs/specs/delivery-gateway-carrier-api.openapi.yaml'));
  assert.ok(result.openApiFiles.includes('docs/specs/trade-gateway-api.openapi.yaml'));
  assert.ok(result.checkedExtensions.length >= 3);
  assert.ok(result.checkedExtensions.some(extension => (
    extension.openApiPath === 'docs/specs/playlist-commerce-webhooks.openapi.yaml' &&
    extension.verifierCommand === 'npm run verify:playlist-commerce-evidence' &&
    extension.managedServiceBoundary === 'fixture-only-not-hosted-evidence-vault' &&
    extension.nonClaimsProfile === 'playlist-commerce-webhook-v0.1'
  )));
  assert.ok(result.checkedExtensions.some(extension => (
    extension.openApiPath === 'docs/specs/veygrit-address-login-hosted.openapi.yaml' &&
    extension.verifierCommand === 'npm run verify:veygrit-address-login-hosted' &&
    extension.managedServiceBoundary === 'fixture-only-not-hosted-address-login' &&
    extension.nonClaimsProfile === 'veygrit-address-login-hosted-v0.1'
  )));
  assert.ok(result.checkedExtensions.some(extension => (
    extension.openApiPath === 'docs/specs/delivery-gateway-carrier-api.openapi.yaml' &&
    extension.verifierCommand === 'npm run verify:merchant-console-ec-plugin' &&
    extension.managedServiceBoundary === 'delivery-gateway-carrier-api' &&
    extension.nonClaimsProfile === 'merchant-console-onboarding-v0.1'
  )));
  assert.ok(result.checkedExtensions.some(extension => (
    extension.openApiPath === 'docs/specs/delivery-gateway-carrier-api.openapi.yaml' &&
    extension.verifierCommand === 'npm run verify:delivery-gateway-carrier-api' &&
    extension.managedServiceBoundary === 'fixture-only-not-production-carrier' &&
    extension.nonClaimsProfile === 'delivery-gateway-sandbox-carrier-v0.1'
  )));
  assert.ok(result.checkedExtensions.some(extension => (
    extension.openApiPath === 'docs/specs/trade-gateway-api.openapi.yaml' &&
    extension.verifierCommand === 'npm run verify:vey-trade-gateway-idempotency-fixture-schema' &&
    extension.managedServiceBoundary === 'trade-gateway-local-idempotent-intent' &&
    extension.nonClaimsProfile === 'trade-gateway-idempotency-v0.1'
  )));
});

test('AGID OpenAPI evidence README profile matrix lists checked extension anchors', () => {
  const readme = readFileSync(join(process.cwd(), 'docs', 'specs', 'README.md'), 'utf8');
  const registry = JSON.parse(readFileSync(
    join(process.cwd(), 'docs', 'specs', 'fixtures', 'agid-non-claims-profiles-v0.1.json'),
    'utf8',
  )) as { profiles: Array<{ id: string }> };
  const scanResult = verifyAgidOpenApiEvidenceExtensions();

  const sectionStart = readme.indexOf('### OpenAPI Evidence Profile Compatibility Matrix');
  assert.notEqual(sectionStart, -1);
  const sectionEnd = readme.indexOf('Verification:', sectionStart);
  assert.notEqual(sectionEnd, -1);
  const matrixSection = readme.slice(sectionStart, sectionEnd);

  for (const { id } of registry.profiles) {
    assert.ok(
      matrixSection.includes(`\`${id}\``),
      `README profile matrix section is missing registered nonClaimsProfile ${id}`,
    );
  }

  for (const extension of scanResult.checkedExtensions) {
    assert.ok(
      matrixSection.includes(`\`${extension.nonClaimsProfile}\``),
      `README profile matrix section is missing checked extension profile ${extension.nonClaimsProfile}`,
    );
    assert.ok(
      matrixSection.includes(`\`${basename(extension.openApiPath)}\``),
      `README profile matrix section is missing checked extension OpenAPI file ${extension.openApiPath}`,
    );
    assert.ok(
      matrixSection.includes(`\`${extension.verifierCommand}\``),
      `README profile matrix section is missing checked extension verifier ${extension.verifierCommand}`,
    );
    assert.ok(
      matrixSection.includes(`\`${extension.managedServiceBoundary}\``),
      `README profile matrix section is missing checked extension boundary ${extension.managedServiceBoundary}`,
    );
  }
});

test('AGID OpenAPI evidence extension scanner helper keeps linked verifier defaults safety-first', () => {
  const fixturesDir = join(tmpdir(), `agid-openapi-linked-verifier-helper-${Date.now()}`);
  mkdirSync(fixturesDir, { recursive: true });

  writeOpenApiLinkedVerifierAllowlistFixture(fixturesDir, {
    description: 'Synthetic allowlist helper smoke fixture.',
    verifier: {
      command: 'npm run verify:example',
      script: 'verify:example',
      runner: ['scripts/example.ts'],
      managedServiceBoundary: 'fixture-only-not-hosted-example',
    },
  });

  const allowlist = JSON.parse(readFileSync(
    join(fixturesDir, 'agid-openapi-linked-verifiers-v0.1.json'),
    'utf8',
  ));

  assert.equal(allowlist.artifact, 'agid-openapi-linked-verifier-allowlist');
  assert.equal(allowlist.localOnly, true);
  assert.deepEqual(allowlist.nonClaims, [
    'not-production-traffic',
    'not-raw-address-intake',
    'not-proof-witness-intake',
  ]);
  assert.equal(allowlist.verifiers[0].timeoutMs, 120000);
  assert.equal(allowlist.verifiers[0].managedServiceBoundary, 'fixture-only-not-hosted-example');
});

test('AGID OpenAPI evidence extension scanner rejects unsafe extension drift', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-extension-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:example': 'tsx scripts/example.ts',
    'verify:example-all': 'tsx scripts/example-all.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeEmptyExampleEvidenceFixtureSet(fixturesDir, schemasDir);
  writeExampleOpenApiEvidenceExtension(root, 'get', genericEvidenceExtensionLines({ localOnly: false }));

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('schema-conformance:$.localOnly:const-mismatch')));
});

test('AGID OpenAPI evidence extension scanner rejects fixture schema drift', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-fixture-schema-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:example': 'tsx scripts/example.ts',
    'verify:example-all': 'tsx scripts/example-all.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeEmptyExamplePreflightHistoryFixtures(fixturesDir);
  writeFileSync(
    join(fixturesDir, 'example-evidence.json'),
    `${JSON.stringify({ fixtureId: 'wrong-fixture-v0.1', localOnly: true }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'example-evidence.schema.json'),
    `${JSON.stringify({
      type: 'object',
      required: ['fixtureId', 'localOnly'],
      properties: {
        fixtureId: { const: 'example-fixture-v0.1' },
        localOnly: { const: true },
      },
    }, null, 2)}\n`,
    'utf8',
  );
  writeExampleOpenApiEvidenceExtension(root, 'get', genericEvidenceExtensionLines());

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => (
    error.includes('evidenceFixtureSchema') &&
    error.endsWith('$.fixtureId:const-mismatch')
  )));
});

test('AGID OpenAPI evidence extension scanner rejects product non-claims profile drift', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-profile-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:example': 'tsx scripts/example.ts',
    'verify:example-all': 'tsx scripts/example-all.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeEmptyExampleEvidenceFixtureSet(fixturesDir, schemasDir);
  writeExampleOpenApiEvidenceExtension(root, 'get', playlistCommerceEvidenceExtensionLines({
    nonClaims: [
      'not-payment-settlement',
      'not-raw-address-intake',
      'not-proof-witness-intake',
    ],
  }));

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => (
    error.includes('non-claims-profile-missing-non-claim') &&
    error.endsWith(':playlist-commerce-webhook-v0.1:not-production-delivery-attempt')
  )));
});

test('AGID OpenAPI evidence extension scanner rejects non-claims profile schema enum drift', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-profile-enum-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:example': 'tsx scripts/example.ts',
    'verify:example-all': 'tsx scripts/example-all.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir, schema =>
    schema.replace('"veygrit-address-login-hosted-v0.1"', '"unregistered-profile-v0.1"'),
  );
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeEmptyExampleEvidenceFixtureSet(fixturesDir, schemasDir);
  writeExampleOpenApiEvidenceExtension(root, 'get', genericEvidenceExtensionLines());

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes(
    'non-claims-profile-schema-enum-missing-registry-id:veygrit-address-login-hosted-v0.1',
  ));
  assert.ok(result.errors.includes(
    'non-claims-profile-registry-missing-schema-id:unregistered-profile-v0.1',
  ));
});

test('AGID OpenAPI evidence extension scanner rejects product evidence profile schema drift', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-product-profile-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:address-login-spec': 'tsx scripts/address-login-spec.ts',
    'verify:example': 'tsx scripts/example.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  writeFileSync(
    join(schemasDir, 'veygrit-address-login-hosted-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(
      join(process.cwd(), 'docs', 'specs', 'schemas', 'veygrit-address-login-hosted-openapi-evidence-extension-v0.1.schema.json'),
      'utf8',
    ),
    'utf8',
  );
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeFileSync(join(fixturesDir, 'veygrit-address-login-hosted-v0.1.json'), '{}\n', 'utf8');
  writeFileSync(join(schemasDir, 'veygrit-address-login-hosted-fixture-v0.1.schema.json'), '{}\n', 'utf8');
  writeExampleOpenApiEvidenceExtension(
    root,
    'get',
    hostedAddressLoginEvidenceExtensionLines('npm run verify:example'),
  );

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => (
    error.includes('product-profile-schema:veygrit-address-login-hosted-v0.1') &&
    error.endsWith('$.verifierCommand:const-mismatch')
  )));
});

test('AGID OpenAPI evidence extension scanner rejects Merchant Console evidence profile drift', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-merchant-profile-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:address-login-spec': 'tsx scripts/address-login-spec.ts',
    'verify:example': 'tsx scripts/example.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  writeFileSync(
    join(schemasDir, 'merchant-console-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(
      join(process.cwd(), 'docs', 'specs', 'schemas', 'merchant-console-openapi-evidence-extension-v0.1.schema.json'),
      'utf8',
    ),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'merchant-console-onboarding-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'merchant-console-onboarding-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeFileSync(
    join(fixturesDir, 'merchant-console-onboarding-v0.1.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'merchant-console-onboarding-v0.1.json'), 'utf8'),
    'utf8',
  );
  writeExampleOpenApiEvidenceExtension(
    root,
    'post',
    merchantConsoleEvidenceExtensionLines('npm run verify:example'),
  );

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => (
    error.includes('product-profile-schema:merchant-console-onboarding-v0.1') &&
    error.endsWith('$.verifierCommand:const-mismatch')
  )));
});

test('AGID OpenAPI evidence extension scanner rejects Merchant Console evidence schema profile id mismatch', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-merchant-profile-id-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:address-login-spec': 'tsx scripts/address-login-spec.ts',
    'verify:merchant-console-ec-plugin': 'tsx scripts/merchant-console.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  writeFileSync(
    join(schemasDir, 'merchant-console-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(
      join(process.cwd(), 'docs', 'specs', 'schemas', 'merchant-console-openapi-evidence-extension-v0.1.schema.json'),
      'utf8',
    ).replace(
      '"const": "merchant-console-onboarding-v0.1"',
      '"const": "delivery-gateway-sandbox-carrier-v0.1"',
    ),
    'utf8',
  );
  writeFileSync(
    join(schemasDir, 'merchant-console-onboarding-v0.1.schema.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'schemas', 'merchant-console-onboarding-v0.1.schema.json'), 'utf8'),
    'utf8',
  );
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeFileSync(
    join(fixturesDir, 'merchant-console-onboarding-v0.1.json'),
    readFileSync(join(process.cwd(), 'docs', 'specs', 'fixtures', 'merchant-console-onboarding-v0.1.json'), 'utf8'),
    'utf8',
  );
  writeExampleOpenApiEvidenceExtension(root, 'post', merchantConsoleEvidenceExtensionLines());

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes(
    'openapi-evidence-profile-schema-profile-mismatch:merchant-console-onboarding-v0.1:schema=delivery-gateway-sandbox-carrier-v0.1',
  ));
});

test('AGID OpenAPI evidence extension scanner rejects product evidence schema profile id mismatch', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-product-profile-id-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:address-login-spec': 'tsx scripts/address-login-spec.ts',
    'verify:veygrit-address-login-hosted': 'tsx scripts/veygrit-address-login-hosted.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  writeFileSync(
    join(schemasDir, 'veygrit-address-login-hosted-openapi-evidence-extension-v0.1.schema.json'),
    readFileSync(
      join(process.cwd(), 'docs', 'specs', 'schemas', 'veygrit-address-login-hosted-openapi-evidence-extension-v0.1.schema.json'),
      'utf8',
    ).replace(
      '"const": "veygrit-address-login-hosted-v0.1"',
      '"const": "playlist-commerce-webhook-v0.1"',
    ),
    'utf8',
  );
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  writeFileSync(join(fixturesDir, 'veygrit-address-login-hosted-v0.1.json'), '{}\n', 'utf8');
  writeFileSync(join(schemasDir, 'veygrit-address-login-hosted-fixture-v0.1.schema.json'), '{}\n', 'utf8');
  writeExampleOpenApiEvidenceExtension(root, 'get', hostedAddressLoginEvidenceExtensionLines());

  const result = verifyAgidOpenApiEvidenceExtensions(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes(
    'openapi-evidence-profile-schema-profile-mismatch:veygrit-address-login-hosted-v0.1:schema=playlist-commerce-webhook-v0.1',
  ));
});

test('AGID OpenAPI evidence extension scanner can run allowlisted linked verifiers', () => {
  const result = verifyAgidOpenApiEvidenceExtensions(process.cwd(), { runLinkedVerifiers: true });

  assert.equal(result.ok, true);
  assert.equal(result.linkedVerifierAllowlistPath, 'docs/specs/fixtures/agid-openapi-linked-verifiers-v0.1.json');
  assert.equal(result.linkedVerifierRuns.length, 5);
  assert.ok(result.linkedVerifierRuns.some(run => (
    run.command === 'npm run verify:merchant-console-ec-plugin' &&
    run.script === 'verify:merchant-console-ec-plugin' &&
    run.ok === true
  )));
  assert.ok(result.linkedVerifierRuns.some(run => (
    run.command === 'npm run verify:playlist-commerce-evidence' &&
    run.script === 'verify:playlist-commerce-evidence' &&
    run.ok === true
  )));
  assert.ok(result.linkedVerifierRuns.some(run => (
    run.command === 'npm run verify:veygrit-address-login-hosted' &&
    run.script === 'verify:veygrit-address-login-hosted' &&
    run.ok === true
  )));
  assert.ok(result.linkedVerifierRuns.some(run => (
    run.command === 'npm run verify:delivery-gateway-carrier-api' &&
    run.script === 'verify:delivery-gateway-carrier-api' &&
    run.ok === true
  )));
  assert.ok(result.linkedVerifierRuns.some(run => (
    run.command === 'npm run verify:vey-trade-gateway-idempotency-fixture-schema' &&
    run.script === 'verify:vey-trade-gateway-idempotency-fixture-schema' &&
    run.ok === true
  )));
});

test('AGID OpenAPI evidence extension scanner rejects non-allowlisted linked verifiers', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-linked-verifier-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  const scriptsDir = join(root, 'scripts');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });
  mkdirSync(scriptsDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:allowed': 'tsx scripts/allowed.ts',
    'verify:example': 'tsx scripts/example.ts',
    'verify:example-all': 'tsx scripts/example-all.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  copyOpenApiLinkedVerifierSchema(schemasDir);
  writeFileSync(join(scriptsDir, 'allowed.ts'), 'console.log("allowed verifier");\n', 'utf8');
  writeEmptyExampleEvidenceFixtureSet(fixturesDir, schemasDir);
  writeOpenApiLinkedVerifierAllowlistFixture(fixturesDir, {
    description: 'Synthetic allowlist that intentionally does not include the example verifier.',
    verifier: {
      command: 'npm run verify:allowed',
      script: 'verify:allowed',
      runner: ['scripts/allowed.ts'],
      managedServiceBoundary: 'fixture-only-not-hosted-example',
    },
  });
  writeExampleOpenApiEvidenceExtension(root, 'get', genericEvidenceExtensionLines());

  const result = verifyAgidOpenApiEvidenceExtensions(root, { runLinkedVerifiers: true });

  assert.equal(result.ok, false);
  assert.deepEqual(result.linkedVerifierRuns, []);
  assert.ok(result.errors.includes('linked-verifier:not-allowlisted:npm run verify:example'));
});

test('AGID OpenAPI evidence extension scanner rejects linked verifier boundary mismatch', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-boundary-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  const scriptsDir = join(root, 'scripts');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });
  mkdirSync(scriptsDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:example': 'tsx scripts/example.ts',
    'verify:example-all': 'tsx scripts/example-all.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  copyOpenApiLinkedVerifierSchema(schemasDir);
  writeFileSync(join(scriptsDir, 'example.ts'), 'console.log("example verifier");\n', 'utf8');
  writeEmptyExampleEvidenceFixtureSet(fixturesDir, schemasDir);
  writeOpenApiLinkedVerifierAllowlistFixture(fixturesDir, {
    description: 'Synthetic allowlist with a mismatched service boundary.',
    verifier: {
      command: 'npm run verify:example',
      script: 'verify:example',
      runner: ['scripts/example.ts'],
      managedServiceBoundary: 'fixture-only-not-hosted-other',
    },
  });
  writeExampleOpenApiEvidenceExtension(root, 'get', genericEvidenceExtensionLines());

  const result = verifyAgidOpenApiEvidenceExtensions(root, { runLinkedVerifiers: true });

  assert.equal(result.ok, false);
  assert.deepEqual(result.linkedVerifierRuns, []);
  assert.ok(result.errors.some(error => error.includes('linked-verifier-boundary-mismatch')));
  assert.ok(result.errors.includes('linked-verifiers-skipped-due-to-prior-errors'));
});

test('AGID OpenAPI evidence extension scanner rejects linked verifier non-claim drift', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-non-claim-${Date.now()}`);
  const fixturesDir = join(root, 'docs', 'specs', 'fixtures');
  const schemasDir = join(root, 'docs', 'specs', 'schemas');
  const scriptsDir = join(root, 'scripts');
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });
  mkdirSync(scriptsDir, { recursive: true });

  writePackageJsonScripts(root, {
    'verify:example': 'tsx scripts/example.ts',
    'verify:example-all': 'tsx scripts/example-all.ts',
  });
  copyOpenApiEvidenceExtensionSchema(schemasDir);
  copyNonClaimsProfileFiles(fixturesDir, schemasDir);
  copyOpenApiLinkedVerifierSchema(schemasDir);
  writeFileSync(join(scriptsDir, 'example.ts'), 'console.log("example verifier");\n', 'utf8');
  writeEmptyExampleEvidenceFixtureSet(fixturesDir, schemasDir);
  writeOpenApiLinkedVerifierAllowlistFixture(fixturesDir, {
    description: 'Synthetic allowlist with the required safety non-claims.',
    verifier: {
      command: 'npm run verify:example',
      script: 'verify:example',
      runner: ['scripts/example.ts'],
      managedServiceBoundary: 'fixture-only-not-hosted-example',
    },
  });
  writeExampleOpenApiEvidenceExtension(root, 'get', genericEvidenceExtensionLines({
    nonClaims: ['not-raw-address-intake'],
  }));

  const result = verifyAgidOpenApiEvidenceExtensions(root, { runLinkedVerifiers: true });

  assert.equal(result.ok, false);
  assert.deepEqual(result.linkedVerifierRuns, []);
  assert.ok(result.errors.some(error => error.includes('linked-verifier-non-claim-missing')));
  assert.ok(result.errors.some(error => error.endsWith(':not-proof-witness-intake')));
  assert.ok(result.errors.includes('linked-verifiers-skipped-due-to-prior-errors'));
});

test('AGID OpenAPI evidence workflow keeps lightweight and linked gates separated', () => {
  const result = verifyAgidOpenApiEvidenceWorkflow();

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.jobs, ['evidence-extension-scan', 'linked-evidence-verifiers']);
});

test('AGID OpenAPI evidence workflow verifier rejects weakened CI hardening', () => {
  const root = join(tmpdir(), `agid-openapi-evidence-workflow-${Date.now()}`);
  const workflowDir = join(root, '.github', 'workflows');
  mkdirSync(workflowDir, { recursive: true });
  writeFileSync(
    join(workflowDir, 'agid-openapi-evidence.yml'),
    readFileSync(join(process.cwd(), '.github', 'workflows', 'agid-openapi-evidence.yml'), 'utf8')
      .replace('contents: read', 'contents: write')
      .replace('timeout-minutes: 10', 'timeout-minutes: 30')
      .replace('node-version: "22"', 'node-version: "20"'),
    'utf8',
  );

  const result = verifyAgidOpenApiEvidenceWorkflow(root);

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('workflow-permissions-not-read-only'));
  assert.ok(result.errors.includes('evidence-extension-scan:timeout-mismatch'));
  assert.ok(result.errors.includes('evidence-extension-scan:missing-node-22-npm-cache'));
});
