import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildAddressQlRepositoryExportCheckSnapshot } from '../../scripts/export-addressql-oss-repository.ts';
import {
  ADDRESSQL_OSS_READINESS_VERSION,
  buildAddressQlOssReadinessReport,
  loadAddressQlRepositoryManifest,
  validateAddressQlOssReadiness,
} from './addressQlOssReadiness';
import {
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE,
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA,
} from './addressQlPostalValidationParity';

test('AddressQL OSS readiness manifest targets dawnportinfo-design/addressql', () => {
  const manifest = loadAddressQlRepositoryManifest();

  assert.equal(manifest.schema_version, 'addressql-repository-manifest-v0.1');
  assert.equal(manifest.owner, 'dawnportinfo-design');
  assert.equal(manifest.repository, 'addressql');
  assert.equal(manifest.visibility, 'public');
  assert.equal(manifest.license_policy.code, 'Apache-2.0');
  assert.equal(manifest.license_policy.papers_and_specs, 'CC-BY-4.0');
  assert.ok(manifest.topics.includes('postgresql'));
  assert.ok(manifest.topics.includes('zero-knowledge'));
  assert.ok(manifest.public_packages.some(pkg => pkg.name === 'addressql-postgres'));
  assert.ok(manifest.public_packages.some(pkg => pkg.name === 'addressql-proof-hooks'));
  assert.ok(manifest.public_packages.some(pkg =>
    pkg.name === 'addressql-signed-delivery-point'));
  assert.ok(manifest.public_packages.some(pkg =>
    pkg.name === 'addressql-postal-operations'));
  assert.ok(manifest.public_packages.some(pkg =>
    pkg.name === 'addressql-official-place-names'));
  assert.ok(manifest.public_packages.some(pkg =>
    pkg.name === 'addressql-address-morphism-compatibility'));
  assert.ok(manifest.required_documents.includes('docs/addressql/repository-files/LICENSE'));
  assert.ok(manifest.required_documents.includes('docs/addressql/repository-files/SECURITY.md'));
  assert.ok(manifest.required_documents.includes(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE));
  assert.ok(manifest.required_documents.includes(POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA));
});

test('AddressQL OSS readiness report passes all public release gates', () => {
  const report = buildAddressQlOssReadinessReport();

  assert.equal(report.version, ADDRESSQL_OSS_READINESS_VERSION);
  assert.equal(report.target, 'dawnportinfo-design/addressql');
  assert.equal(report.ready, true, report.errors.join('\n'));
  assert.deepEqual(validateAddressQlOssReadiness(), []);
  assert.ok(report.score >= 95);
  assert.ok(report.verifiedPaths.includes('docs/addressql/README.md'));
  assert.ok(report.verifiedPaths.includes('extensions/addressql-postgres/sql/addressql--0.1.0.sql'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlGlobalCountryCoverage.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlGlobalCountryCoverage.test.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlMultilingualQuality.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlMultilingualQuality.test.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlOfficialPlaceNames.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlOfficialPlaceNames.test.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlAddressMorphismCompatibility.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlAddressMorphismCompatibility.test.ts'));
  assert.ok(report.verifiedPaths.includes(
    'docs/specs/fixtures/addressql-official-place-name-conformance-v1.json'
  ));
  assert.ok(report.verifiedPaths.includes(
    'docs/specs/schemas/addressql-official-place-name-conformance-v1.schema.json'
  ));
  assert.ok(report.verifiedPaths.includes(
    'docs/specs/schemas/addressql-place-name-holdout-report-v1.schema.json'
  ));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlPracticalApi.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlPracticalApi.test.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlDeliveryPointDecision.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlDeliveryPointDecision.test.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlPostalOperations.ts'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlPostalOperations.test.ts'));
  assert.ok(report.verifiedPaths.includes('scripts/run-addressql-api.ts'));
  assert.ok(report.verifiedPaths.includes('docs/specs/openapi/addressql-practical-api-v1.openapi.json'));
  assert.ok(report.verifiedPaths.includes('src/data/address_formats'));
  assert.ok(report.verifiedPaths.includes('data/postal_country_packs'));
  assert.ok(report.verifiedPaths.includes('docs/addressql/repository-files/package.json'));
  assert.ok(report.verifiedPaths.includes('src/lib/addressQlZkProofHooks.ts'));
  assert.ok(report.verifiedPaths.includes('docs/addressql/repository-files/LICENSE'));
  assert.ok(report.verifiedPaths.includes('docs/addressql/repository-files/CONTRIBUTING.md'));
  assert.ok(report.verifiedPaths.includes('docs/addressql/repository-files/SECURITY.md'));
  assert.ok(report.verifiedPaths.includes('extensions/addressql-duckdb'));
  assert.ok(report.verifiedPaths.includes('native/addressql-core'));
  assert.ok(report.verifiedPaths.includes('sdk/addressql-js-ts'));
  assert.ok(report.verifiedPaths.includes('integrations/addressql-calcite'));
  assert.ok(report.verifiedPaths.includes(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE));
  assert.ok(report.verifiedPaths.includes(POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA));
});

test('AddressQL OSS readiness commands cover core, adapters, SDKs, ZK, and Calcite', () => {
  const report = buildAddressQlOssReadinessReport();
  const commands = report.verificationCommands.join('\n');

  for (const expected of [
    'npm run verify:addressql',
    'npm run verify:addressql-oss',
    'npm run verify:addressql-postgres',
    'npm run verify:addressql-duckdb',
    'npm run verify:addressql-duckdb:cli',
    'npm run verify:addressql-sdk',
    'npm run verify:addressql-multilingual-quality',
    'npm run verify:addressql-place-names',
    'npm run verify:addressql-api',
    'npm run verify:addressql-delivery-point',
    'npm run verify:addressql-postal-operations',
    'npm run verify:addressql-zk',
    'npm run verify:addressql-calcite',
    'npm run verify:addressql-export',
  ]) {
    assert.match(commands, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('AddressQL OSS export script is gated by readiness report', () => {
  const source = readFileSync('scripts/export-addressql-oss-repository.ts', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };

  assert.match(source, /buildAddressQlOssReadinessReport/);
  assert.match(source, /addressql-oss-readiness-failed/);
  assert.match(source, /readiness\.ready/);
  assert.match(source, /--check/);
  assert.match(source, /checkOnly/);
  assert.match(source, /mode: 'check'/);
  assert.match(source, /readiness:\s*\{/);
  assert.match(source, new RegExp(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, new RegExp(POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(packageJson.scripts['verify:addressql-export'], 'tsx scripts/export-addressql-oss-repository.ts --check');
});

test('AddressQL OSS export snapshot includes manifest-owned specs fixtures and schemas', () => {
  const manifest = loadAddressQlRepositoryManifest();
  const exportableSpecDocuments = manifest.required_documents.filter(documentPath =>
    /^docs\/specs\/(?:fixtures|schemas)\//.test(documentPath)
  );
  const snapshot = buildAddressQlRepositoryExportCheckSnapshot();

  assert.equal(snapshot.status, 'ok');
  assert.equal(snapshot.mode, 'check');
  assert.ok(exportableSpecDocuments.length >= 2);
  assert.ok(exportableSpecDocuments.includes(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE));
  assert.ok(exportableSpecDocuments.includes(POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA));

  for (const documentPath of exportableSpecDocuments) {
    assert.ok(snapshot.readiness.verifiedPaths.includes(documentPath), `${documentPath} missing from readiness snapshot`);
    assert.ok(snapshot.included.includes(documentPath), `${documentPath} missing from export included snapshot`);
  }
});

test('AddressQL OSS export snapshot includes the executable country core', () => {
  const snapshot = buildAddressQlRepositoryExportCheckSnapshot();

  for (const expectedPath of [
    'package.json',
    'src/lib/addressQlGlobalCountryPreload.ts',
    'src/lib/addressQlGlobalCountryPreload.test.ts',
    'src/lib/addressQlGlobalCountryCoverage.ts',
    'src/lib/addressQlGlobalCountryCoverage.test.ts',
    'src/lib/addressQlMultilingualQuality.ts',
    'src/lib/addressQlMultilingualQuality.test.ts',
    'src/lib/addressQlOfficialPlaceNames.ts',
    'src/lib/addressQlOfficialPlaceNames.test.ts',
    'src/lib/addressQlAddressMorphismCompatibility.ts',
    'src/lib/addressQlAddressMorphismCompatibility.test.ts',
    'src/lib/addressQlPracticalApi.ts',
    'src/lib/addressQlPracticalApi.test.ts',
    'src/lib/addressQlRuntimeAttestationWorkflow.ts',
    'src/lib/addressQlRuntimeAttestationWorkflow.test.ts',
    'src/lib/addressQlTrustPolicy.ts',
    'src/lib/addressQlRuntimeReleaseLedger.ts',
    'src/lib/addressQlRuntimeReleaseLedger.test.ts',
    'src/lib/addressQlDeliveryPointDecision.ts',
    'src/lib/addressQlDeliveryPointDecision.test.ts',
    'src/lib/addressQlPostalOperations.ts',
    'src/lib/addressQlPostalOperations.test.ts',
    'scripts/run-addressql-api.ts',
    'scripts/run-addressql-api.test.ts',
    'scripts/prepare-addressql-runtime-attestation.ts',
    'scripts/finalize-addressql-runtime-attestation.ts',
    'scripts/register-addressql-reviewer-key.ts',
    'scripts/revoke-addressql-reviewer-key.ts',
    'scripts/prepare-addressql-runtime-release.ts',
    'scripts/finalize-addressql-runtime-release.ts',
    'scripts/verify-addressql-runtime-release.ts',
    'scripts/prepare-addressql-l5-carrier-assertion.ts',
    'scripts/finalize-addressql-l5-carrier-assertion.ts',
    'scripts/verify-addressql-l5-delivery-point.ts',
    'scripts/monitor-addressql-postal-operations.ts',
    'scripts/monitor-addressql-postal-operations.test.ts',
    'docs/specs/openapi/addressql-practical-api-v1.openapi.json',
    'src/lib/officialPostalSourceCatalog.ts',
    'src/data/address_formats',
    'data/postal_country_packs',
  ]) {
    assert.ok(snapshot.included.includes(expectedPath), `${expectedPath} missing from export snapshot`);
  }
});

test('AddressQL OSS readiness note documents manifest-owned spec asset exports', () => {
  const readinessDoc = readFileSync('docs/addressql/open-source-release-readiness.md', 'utf8');

  assert.match(readinessDoc, /## Manifest-Owned Spec Assets/);
  assert.match(readinessDoc, /docs\/specs\/fixtures\//);
  assert.match(readinessDoc, /docs\/specs\/schemas\//);
  assert.match(readinessDoc, /verify:addressql-export/);
  assert.match(readinessDoc, /readiness\.verifiedPaths/);
  assert.match(readinessDoc, /included/);
  assert.match(readinessDoc, /synthetic fixtures or public schemas only/);
  assert.match(readinessDoc, /official alias/i);
  assert.match(readinessDoc, /administrative hierarchy/i);
  assert.match(readinessDoc, /country and administrative-hierarchy\s+aggregates/i);
});
