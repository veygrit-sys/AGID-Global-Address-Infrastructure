import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE,
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA,
} from './addressQlPostalValidationParity';

export const ADDRESSQL_OSS_READINESS_VERSION = 'addressql-oss-readiness-v0.1';

export type AddressQlRepositoryManifest = {
  schema_version: string;
  owner: string;
  repository: string;
  visibility: string;
  status: string;
  description: string;
  license_policy: {
    code: string;
    papers_and_specs: string;
    data: string;
  };
  topics: string[];
  public_packages: Array<{
    name: string;
    path: string;
    readiness: string;
    verification: string;
  }>;
  required_documents: string[];
  release_gates: string[];
  verification_commands: string[];
  non_claims: string[];
};

export type AddressQlOssReadinessReport = {
  version: typeof ADDRESSQL_OSS_READINESS_VERSION;
  target: 'dawnportinfo-design/addressql';
  ready: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  verifiedPaths: string[];
  verificationCommands: string[];
};

const MANIFEST_PATH = 'docs/addressql/repository-manifest.json';

const REQUIRED_PUBLIC_DOCS = [
  'docs/addressql/README.md',
  'docs/addressql/specification-v0.1.md',
  'docs/addressql/function-registry-v0.1.md',
  'docs/addressql/technical-stack.md',
  'docs/addressql/research-plan.md',
  'docs/addressql/open-source-release-readiness.md',
  'docs/addressql/repository-manifest.json',
  'docs/addressql/global-country-preload-v0.7.md',
  'docs/addressql/global-country-coverage-v0.1.md',
  'docs/addressql/country-data-promotion-v0.1.md',
  'docs/addressql/multilingual-quality-v0.1.md',
  'docs/addressql/official-place-name-ranking-v1.md',
  'docs/addressql/practical-api-v1.md',
  'docs/addressql/runtime-release-security-v1.md',
  'docs/addressql/signed-delivery-point-contract-v1.md',
  'docs/addressql/postal-operations-v1.md',
  'docs/addressql/sources/jp-public-postal-sources-v1.json',
  'docs/addressql/zk-proof-hooks-v0.6.md',
  'docs/addressql/calcite-v0.5.md',
  'docs/addressql/repository-files/README.md',
  'docs/addressql/repository-files/package.json',
  'docs/addressql/repository-files/LICENSE',
  'docs/addressql/repository-files/LICENSES-DATA.md',
  'docs/addressql/repository-files/CONTRIBUTING.md',
  'docs/addressql/repository-files/SECURITY.md',
  'docs/addressql/repository-files/CODE_OF_CONDUCT.md',
  'docs/specs/openapi/addressql-practical-api-v1.openapi.json',
  'docs/specs/fixtures/addressql-runtime-config-conformance-v1.json',
  'docs/specs/fixtures/addressql-runtime-config-conformance-v1.postcodes.txt',
  'docs/specs/schemas/addressql-runtime-config-v1.schema.json',
  'docs/specs/schemas/addressql-trust-store-v1.schema.json',
  'docs/specs/schemas/addressql-trust-store-v2.schema.json',
  'docs/specs/schemas/addressql-runtime-release-ledger-v1.schema.json',
  'docs/specs/schemas/addressql-runtime-release-state-v1.schema.json',
  'docs/specs/schemas/addressql-carrier-trust-store-v1.schema.json',
  'docs/specs/schemas/addressql-l5-carrier-assertion-v1.schema.json',
  'docs/specs/schemas/addressql-l5-delivery-point-request-v1.schema.json',
  'docs/specs/schemas/addressql-l5-delivery-point-decision-v1.schema.json',
  'docs/specs/fixtures/addressql-postal-operations-input-v1.json',
  'docs/specs/schemas/addressql-postal-operations-input-v1.schema.json',
  'docs/specs/schemas/addressql-postal-operations-report-v1.schema.json',
  'docs/specs/fixtures/addressql-official-place-name-conformance-v1.json',
  'docs/specs/schemas/addressql-official-place-name-conformance-v1.schema.json',
  'docs/specs/schemas/addressql-place-name-holdout-report-v1.schema.json',
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE,
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA,
];

const REQUIRED_PUBLIC_ARTIFACTS = [
  'extensions/addressql-postgres/README.md',
  'extensions/addressql-postgres/sql/addressql--0.1.0.sql',
  'extensions/addressql-postgres/fixtures/synthetic_addressql_seed.sql',
  'extensions/addressql-duckdb/README.md',
  'extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql',
  'native/addressql-core/Cargo.toml',
  'native/addressql-core/src/lib.rs',
  'sdk/addressql-js-ts/package.json',
  'sdk/addressql-js-ts/src/index.ts',
  'sdk/addressql-py/pyproject.toml',
  'sdk/addressql-py/addressql/__init__.py',
  'sdk/addressql-rs/Cargo.toml',
  'sdk/addressql-rs/src/lib.rs',
  'integrations/addressql-calcite/README.md',
  'scripts/verify-addressql-postal-negative-claims.ts',
  'scripts/export-addressql-oss-repository.ts',
  'scripts/verify-addressql-runtime-config.ts',
  'scripts/sync-addressql-public-postal-data.ts',
  'scripts/sync-addressql-official-postal-data.ts',
  'scripts/register-addressql-trusted-public-key.ts',
  'scripts/register-addressql-trusted-public-key.test.ts',
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
  'src/lib/addressQlGlobalCountryPreload.ts',
  'src/lib/addressQlGlobalCountryPreload.test.ts',
  'src/lib/addressQlGlobalCountryCoverage.ts',
  'src/lib/addressQlGlobalCountryCoverage.test.ts',
  'src/lib/addressQlCountryDataPromotion.ts',
  'src/lib/addressQlCountryDataPromotion.test.ts',
  'src/lib/addressQlMultilingualQuality.ts',
  'src/lib/addressQlMultilingualQuality.test.ts',
  'src/lib/addressQlOfficialPlaceNames.ts',
  'src/lib/addressQlOfficialPlaceNames.test.ts',
  'src/lib/addressQlAddressMorphismCompatibility.ts',
  'src/lib/addressQlAddressMorphismCompatibility.test.ts',
  'src/lib/countryGeographicMetadataEvaluationCatalog.ts',
  'src/lib/countryGeographicMetadataEvaluationIndex.ts',
  'src/lib/countryValidationQualityGate.ts',
  'src/lib/sha256.ts',
  'src/lib/addressQlPracticalApi.ts',
  'src/lib/addressQlPracticalApi.test.ts',
  'src/lib/addressQlRuntimeAdapter.ts',
  'src/lib/addressQlRuntimeAdapter.test.ts',
  'src/lib/addressQlPostalSetAdapter.ts',
  'src/lib/addressQlPostalSetAdapter.test.ts',
  'src/lib/addressQlRuntimeConfig.ts',
  'src/lib/addressQlRuntimeConfig.test.ts',
  'src/lib/addressQlRuntimeAttestationWorkflow.ts',
  'src/lib/addressQlRuntimeAttestationWorkflow.test.ts',
  'src/lib/addressQlTrustPolicy.ts',
  'src/lib/addressQlRuntimeReleaseLedger.ts',
  'src/lib/addressQlRuntimeReleaseLedger.test.ts',
  'src/lib/addressQlDeliveryPointDecision.ts',
  'src/lib/addressQlDeliveryPointDecision.test.ts',
  'src/lib/addressQlPostalOperations.ts',
  'src/lib/addressQlPostalOperations.test.ts',
  'src/lib/addressQlPublicPostalData.ts',
  'src/lib/addressQlPublicPostalData.test.ts',
  'src/lib/addressQlOfficialPostalData.ts',
  'src/lib/addressQlOfficialPostalData.test.ts',
  'src/lib/officialPostalSourceCatalog.ts',
  'src/data/address_formats',
  'data/postal_country_packs',
  'scripts/run-addressql-api.ts',
  'scripts/run-addressql-api.test.ts',
  'src/lib/addressQlZkProofHooks.ts',
  'src/lib/addressQlOssReadiness.ts',
];

const REQUIRED_PACKAGE_SCRIPTS = [
  'verify:addressql',
  'verify:addressql-oss',
  'verify:addressql-postgres',
  'verify:addressql-duckdb',
  'verify:addressql-duckdb:cli',
  'verify:addressql-postal-negative-claims',
  'verify:addressql-sdk',
  'verify:addressql-global-preload',
  'verify:addressql-global-coverage',
  'verify:addressql-country-data-promotion',
  'verify:addressql-multilingual-quality',
  'verify:addressql-place-names',
  'verify:addressql-api',
  'verify:addressql-runtime-config',
  'verify:addressql-runtime-release',
  'verify:addressql-delivery-point',
  'monitor:addressql-postal-operations',
  'verify:addressql-postal-operations',
  'sync:addressql-public-postal-data',
  'sync:addressql-official-postal-data',
  'register:addressql-trusted-public-key',
  'prepare:addressql-runtime-attestation',
  'finalize:addressql-runtime-attestation',
  'verify:addressql-zk',
  'verify:addressql-calcite',
  'verify:addressql-export',
  'export:addressql-repository',
];

const DISALLOWED_PUBLIC_FIXTURE_PATTERNS = [
  /東京都千代田区千代田1-1/i,
  /1 Market St/i,
  /raw recipient/i,
  /private key material/i,
  /proof secret material/i,
];

const FIXTURE_PATHS = [
  'extensions/addressql-postgres/fixtures/synthetic_addressql_seed.sql',
  'extensions/addressql-duckdb/fixtures/synthetic_addresses.csv',
  'extensions/addressql-duckdb/fixtures/synthetic_country_profiles.csv',
  'extensions/addressql-duckdb/fixtures/synthetic_postal_areas.csv',
  'native/addressql-core/src/fixtures.rs',
  'sdk/addressql-js-ts/test/sdk.test.ts',
  'sdk/addressql-py/tests/test_sdk.py',
  'sdk/addressql-rs/tests/sdk.rs',
];

function readText(root: string, relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(readText(root, relativePath)) as T;
}

function addOnce(items: string[], item: string) {
  if (!items.includes(item)) items.push(item);
}

function pathExists(root: string, relativePath: string): boolean {
  return existsSync(join(root, relativePath));
}

export function loadAddressQlRepositoryManifest(root = process.cwd()): AddressQlRepositoryManifest {
  return readJson<AddressQlRepositoryManifest>(root, MANIFEST_PATH);
}

export function buildAddressQlOssReadinessReport(root = process.cwd()): AddressQlOssReadinessReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const verifiedPaths: string[] = [];

  let manifest: AddressQlRepositoryManifest | null = null;
  try {
    manifest = loadAddressQlRepositoryManifest(root);
  } catch (error) {
    addOnce(errors, `manifest-unreadable:${(error as Error).message}`);
  }

  const requiredPaths = [
    ...REQUIRED_PUBLIC_DOCS,
    ...REQUIRED_PUBLIC_ARTIFACTS,
  ];

  for (const relativePath of requiredPaths) {
    if (!pathExists(root, relativePath)) addOnce(errors, `missing-path:${relativePath}`);
    else verifiedPaths.push(relativePath);
  }

  if (manifest) {
    if (manifest.owner !== 'dawnportinfo-design') addOnce(errors, 'manifest-owner-must-be-dawnportinfo-design');
    if (manifest.repository !== 'addressql') addOnce(errors, 'manifest-repository-must-be-addressql');
    if (manifest.visibility !== 'public') addOnce(errors, 'manifest-visibility-must-be-public');
    if (manifest.license_policy.code !== 'Apache-2.0') addOnce(errors, 'manifest-code-license-must-be-apache-2.0');
    if (manifest.license_policy.papers_and_specs !== 'CC-BY-4.0') addOnce(errors, 'manifest-spec-license-must-be-cc-by-4.0');
    if (manifest.public_packages.length < 8) addOnce(errors, 'manifest-needs-public-package-map');

    for (const publicPackage of manifest.public_packages) {
      if (!publicPackage.name.trim()) addOnce(errors, 'manifest-public-package-missing-name');
      if (!publicPackage.path.trim()) addOnce(errors, `manifest-public-package-missing-path:${publicPackage.name}`);
      if (!publicPackage.readiness.trim()) addOnce(errors, `manifest-public-package-missing-readiness:${publicPackage.name}`);
      if (!publicPackage.verification.trim()) addOnce(errors, `manifest-public-package-missing-verification:${publicPackage.name}`);
      if (publicPackage.path.trim()) {
        if (!pathExists(root, publicPackage.path)) addOnce(errors, `manifest-public-package-path-missing:${publicPackage.name}:${publicPackage.path}`);
        else verifiedPaths.push(publicPackage.path);
      }
    }

    for (const required of REQUIRED_PUBLIC_DOCS) {
      if (!manifest.required_documents.includes(required)) addOnce(errors, `manifest-missing-required-doc:${required}`);
    }
    for (const requiredCommand of REQUIRED_PACKAGE_SCRIPTS.map(script => `npm run ${script}`)) {
      if (!manifest.verification_commands.includes(requiredCommand)) addOnce(errors, `manifest-missing-command:${requiredCommand}`);
    }
    for (const phrase of ['not a new database engine', 'not proof of residence', 'not audited circuit']) {
      if (!manifest.non_claims.join(' ').toLowerCase().includes(phrase)) addOnce(errors, `manifest-missing-non-claim:${phrase}`);
    }
  }

  const readme = pathExists(root, 'docs/addressql/README.md') ? readText(root, 'docs/addressql/README.md') : '';
  for (const phrase of ['Quick Start', 'dawnportinfo-design/addressql', 'Apache-2.0', 'CC-BY-4.0', 'verify:addressql-oss']) {
    if (!readme.includes(phrase)) addOnce(errors, `readme-missing:${phrase}`);
  }

  const readinessDoc = pathExists(root, 'docs/addressql/open-source-release-readiness.md')
    ? readText(root, 'docs/addressql/open-source-release-readiness.md')
    : '';
  for (const phrase of [
    'Required GitHub Files',
    'Manifest-Owned Spec Assets',
    'docs/specs/fixtures/',
    'docs/specs/schemas/',
    'verify:addressql-export',
    'Non-Negotiable Release Gates',
    'Remaining Before Remote Push',
    'repository-files',
  ]) {
    if (!readinessDoc.includes(phrase)) addOnce(errors, `readiness-doc-missing:${phrase}`);
  }

  const license = pathExists(root, 'docs/addressql/repository-files/LICENSE') ? readText(root, 'docs/addressql/repository-files/LICENSE') : '';
  if (!license.includes('Apache License')) addOnce(errors, 'repository-license-missing-apache-license');
  if (!license.includes('CC-BY-4.0')) addOnce(errors, 'repository-license-missing-split-license-note');

  const dataLicense = pathExists(root, 'docs/addressql/repository-files/LICENSES-DATA.md') ? readText(root, 'docs/addressql/repository-files/LICENSES-DATA.md') : '';
  if (!dataLicense.includes('synthetic fixtures only')) addOnce(errors, 'data-license-missing-synthetic-fixture-rule');
  if (!dataLicense.includes('CC-BY-4.0')) addOnce(errors, 'data-license-missing-doc-license');

  const contributing = pathExists(root, 'docs/addressql/repository-files/CONTRIBUTING.md') ? readText(root, 'docs/addressql/repository-files/CONTRIBUTING.md') : '';
  if (!contributing.includes('Do not contribute raw private address')) addOnce(errors, 'contributing-missing-raw-address-rule');

  const security = pathExists(root, 'docs/addressql/repository-files/SECURITY.md') ? readText(root, 'docs/addressql/repository-files/SECURITY.md') : '';
  if (!security.includes('Do not commit raw private address material')) addOnce(errors, 'security-missing-raw-address-rule');
  if (!security.includes('audited ZK circuits')) addOnce(errors, 'security-missing-zk-non-claim');

  const packageJson = pathExists(root, 'package.json') ? readJson<{ scripts?: Record<string, string> }>(root, 'package.json') : { scripts: {} };
  const scripts = packageJson.scripts ?? {};
  for (const script of REQUIRED_PACKAGE_SCRIPTS) {
    if (!scripts[script]) addOnce(errors, `package-script-missing:${script}`);
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlOssReadiness.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-oss-readiness-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlGlobalCountryPreload.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-global-country-preload-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlGlobalCountryCoverage.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-global-country-coverage-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlCountryDataPromotion.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-country-data-promotion-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlPostalOperations.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-postal-operations-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlMultilingualQuality.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-multilingual-quality-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlOfficialPlaceNames.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-official-place-name-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlAddressMorphismCompatibility.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-address-morphism-compatibility-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlPracticalApi.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-practical-api-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlRuntimeAdapter.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-runtime-adapter-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlPostalSetAdapter.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-postal-set-adapter-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('addressQlRuntimeConfig.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-runtime-config-test');
  }
  if (scripts['verify:addressql'] && !scripts['verify:addressql'].includes('run-addressql-api.test.ts')) {
    addOnce(errors, 'addressql-full-verification-must-include-http-api-test');
  }
  if (!scripts['serve:addressql-api']?.includes('scripts/run-addressql-api.ts')) {
    addOnce(errors, 'addressql-practical-api-serve-script-missing');
  }

  for (const relativePath of FIXTURE_PATHS) {
    if (!pathExists(root, relativePath)) {
      addOnce(warnings, `fixture-path-not-found:${relativePath}`);
      continue;
    }
    const text = readText(root, relativePath);
    if (!/synthetic/i.test(text)) addOnce(errors, `fixture-missing-synthetic-marker:${relativePath}`);
    for (const pattern of DISALLOWED_PUBLIC_FIXTURE_PATTERNS) {
      if (pattern.test(text)) addOnce(errors, `fixture-contains-disallowed-public-pattern:${relativePath}:${pattern}`);
    }
  }

  const zkDoc = pathExists(root, 'docs/addressql/zk-proof-hooks-v0.6.md') ? readText(root, 'docs/addressql/zk-proof-hooks-v0.6.md') : '';
  if (!/does not add real ZK circuits/i.test(zkDoc)) addOnce(errors, 'zk-doc-must-defer-real-circuits');

  const calciteDoc = pathExists(root, 'docs/addressql/calcite-v0.5.md') ? readText(root, 'docs/addressql/calcite-v0.5.md') : '';
  if (!/Do not add Maven, Gradle, or Calcite runtime dependency/i.test(calciteDoc)) {
    addOnce(errors, 'calcite-doc-must-defer-runtime-dependency');
  }

  const globalPreloadDoc = pathExists(root, 'docs/addressql/global-country-preload-v0.7.md')
    ? readText(root, 'docs/addressql/global-country-preload-v0.7.md')
    : '';
  for (const phrase of ['not proof of global address completeness', 'POSTAL_EQUIVALENT', 'Do not invent an official postal code']) {
    if (!globalPreloadDoc.includes(phrase)) addOnce(errors, `global-preload-doc-missing:${phrase}`);
  }

  const globalCoverageDoc = pathExists(root, 'docs/addressql/global-country-coverage-v0.1.md')
    ? readText(root, 'docs/addressql/global-country-coverage-v0.1.md')
    : '';
  for (const phrase of [
    'L0 country profile resolution',
    'L5 delivery-point validation',
    'Postal existence lookup remains blocked',
  ]) {
    if (!globalCoverageDoc.includes(phrase)) addOnce(errors, `global-coverage-doc-missing:${phrase}`);
  }

  const practicalApiDoc = pathExists(root, 'docs/addressql/practical-api-v1.md')
    ? readText(root, 'docs/addressql/practical-api-v1.md')
    : '';
  for (const phrase of [
    'POST /v1/postal/validate',
    'POST /v1/postal/validate/batch',
    'does not repeat the submitted postal code',
    'HTTP `200` means the request was evaluated',
  ]) {
    if (!practicalApiDoc.includes(phrase)) addOnce(errors, `practical-api-doc-missing:${phrase}`);
  }

  const multilingualQualityDoc = pathExists(root, 'docs/addressql/multilingual-quality-v0.1.md')
    ? readText(root, 'docs/addressql/multilingual-quality-v0.1.md')
    : '';
  for (const phrase of [
    'M0',
    'M4',
    'zero profiles enable automatic place-name translation',
    'POST /v1/multilingual/assess',
    'Official-name ranking',
    'independently signed report',
  ]) {
    if (!multilingualQualityDoc.includes(phrase)) {
      addOnce(errors, `multilingual-quality-doc-missing:${phrase}`);
    }
  }

  const countryDataPromotionDoc = pathExists(root, 'docs/addressql/country-data-promotion-v0.1.md')
    ? readText(root, 'docs/addressql/country-data-promotion-v0.1.md')
    : '';
  for (const phrase of [
    'AU, GT, NZ, and PA',
    'review_candidate',
    'independent-signature',
    'runtime-adapter',
    'No L2, L3, L4, or L5 country capability is enabled',
  ]) {
    if (!countryDataPromotionDoc.includes(phrase)) {
      addOnce(errors, `country-data-promotion-doc-missing:${phrase}`);
    }
  }

  const practicalOpenApi = pathExists(root, 'docs/specs/openapi/addressql-practical-api-v1.openapi.json')
    ? readText(root, 'docs/specs/openapi/addressql-practical-api-v1.openapi.json')
    : '';
  for (const phrase of [
    '"/v1/health"',
    '"/v1/countries/{countryCode}/capabilities"',
    '"/v1/countries/{countryCode}/promotions"',
    '"/v1/promotions"',
    '"/v1/multilingual"',
    '"/v1/countries/{countryCode}/languages"',
    '"/v1/multilingual/assess"',
    '"/v1/place-names/rank"',
    '"/v1/postal/validate"',
    '"/v1/postal/validate/batch"',
    '"additionalProperties": false',
    '"maxItems": 100',
  ]) {
    if (!practicalOpenApi.includes(phrase)) addOnce(errors, `practical-openapi-missing:${phrase}`);
  }

  const scoreBase = requiredPaths.length + REQUIRED_PACKAGE_SCRIPTS.length + 8;
  const penalty = errors.length * 3 + warnings.length;
  const score = Math.max(0, Math.min(100, Math.round(((scoreBase - penalty) / scoreBase) * 100)));

  return {
    version: ADDRESSQL_OSS_READINESS_VERSION,
    target: 'dawnportinfo-design/addressql',
    ready: errors.length === 0,
    score,
    errors,
    warnings,
    verifiedPaths,
    verificationCommands: REQUIRED_PACKAGE_SCRIPTS.map(script => `npm run ${script}`),
  };
}

export function validateAddressQlOssReadiness(root = process.cwd()): string[] {
  return buildAddressQlOssReadinessReport(root).errors;
}
