import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildAddressQlOssReadinessReport,
  type AddressQlOssReadinessReport,
} from '../src/lib/addressQlOssReadiness';

export type ExportItem = {
  from: string;
  to: string;
  required: boolean;
};

type AddressQlRepositoryExportFailure =
  | {
    status: 'failed';
    missing: ExportItem[];
  }
  | {
    status: 'failed';
    reason: 'addressql-oss-readiness-failed';
    score: number;
    errors: string[];
    warnings: string[];
  };

type AddressQlRepositoryExportGate =
  | {
    ok: true;
    outDir: string;
    readiness: AddressQlOssReadinessReport;
  }
  | {
    ok: false;
    failure: AddressQlRepositoryExportFailure;
  };

export type AddressQlRepositoryExportCheckSnapshot = {
  status: 'ok';
  mode: 'check';
  outDir: string;
  files: number;
  readiness: {
    version: AddressQlOssReadinessReport['version'];
    score: number;
    target: AddressQlOssReadinessReport['target'];
    verifiedPaths: string[];
  };
  included: string[];
};

export const ADDRESSQL_EXPORT_ITEMS: ExportItem[] = [
  { from: 'docs/addressql/repository-files/README.md', to: 'README.md', required: true },
  { from: 'docs/addressql/repository-files/LICENSE', to: 'LICENSE', required: true },
  { from: 'docs/addressql/repository-files/LICENSES-DATA.md', to: 'LICENSES-DATA.md', required: true },
  { from: 'docs/addressql/repository-files/CONTRIBUTING.md', to: 'CONTRIBUTING.md', required: true },
  { from: 'docs/addressql/repository-files/SECURITY.md', to: 'SECURITY.md', required: true },
  { from: 'docs/addressql/repository-files/CODE_OF_CONDUCT.md', to: 'CODE_OF_CONDUCT.md', required: true },
  { from: 'docs/addressql/repository-files/package.json', to: 'package.json', required: true },
  { from: 'docs/addressql', to: 'docs', required: true },
  {
    from: 'docs/specs/fixtures/addressql-postal-validation-negative-claims-v0.1.json',
    to: 'docs/specs/fixtures/addressql-postal-validation-negative-claims-v0.1.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-postal-validation-negative-claims-v0.1.schema.json',
    to: 'docs/specs/schemas/addressql-postal-validation-negative-claims-v0.1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/openapi/addressql-practical-api-v1.openapi.json',
    to: 'docs/specs/openapi/addressql-practical-api-v1.openapi.json',
    required: true,
  },
  {
    from: 'docs/specs/fixtures/addressql-runtime-config-conformance-v1.json',
    to: 'docs/specs/fixtures/addressql-runtime-config-conformance-v1.json',
    required: true,
  },
  {
    from: 'docs/specs/fixtures/addressql-runtime-config-conformance-v1.postcodes.txt',
    to: 'docs/specs/fixtures/addressql-runtime-config-conformance-v1.postcodes.txt',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-runtime-config-v1.schema.json',
    to: 'docs/specs/schemas/addressql-runtime-config-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-trust-store-v1.schema.json',
    to: 'docs/specs/schemas/addressql-trust-store-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-trust-store-v2.schema.json',
    to: 'docs/specs/schemas/addressql-trust-store-v2.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-runtime-release-ledger-v1.schema.json',
    to: 'docs/specs/schemas/addressql-runtime-release-ledger-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-runtime-release-state-v1.schema.json',
    to: 'docs/specs/schemas/addressql-runtime-release-state-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-carrier-trust-store-v1.schema.json',
    to: 'docs/specs/schemas/addressql-carrier-trust-store-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-l5-carrier-assertion-v1.schema.json',
    to: 'docs/specs/schemas/addressql-l5-carrier-assertion-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-l5-delivery-point-request-v1.schema.json',
    to: 'docs/specs/schemas/addressql-l5-delivery-point-request-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-l5-delivery-point-decision-v1.schema.json',
    to: 'docs/specs/schemas/addressql-l5-delivery-point-decision-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/fixtures/addressql-postal-operations-input-v1.json',
    to: 'docs/specs/fixtures/addressql-postal-operations-input-v1.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-postal-operations-input-v1.schema.json',
    to: 'docs/specs/schemas/addressql-postal-operations-input-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-postal-operations-report-v1.schema.json',
    to: 'docs/specs/schemas/addressql-postal-operations-report-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/fixtures/addressql-official-place-name-conformance-v1.json',
    to: 'docs/specs/fixtures/addressql-official-place-name-conformance-v1.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-official-place-name-conformance-v1.schema.json',
    to: 'docs/specs/schemas/addressql-official-place-name-conformance-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/specs/schemas/addressql-place-name-holdout-report-v1.schema.json',
    to: 'docs/specs/schemas/addressql-place-name-holdout-report-v1.schema.json',
    required: true,
  },
  {
    from: 'docs/addressql/sources/jp-public-postal-sources-v1.json',
    to: 'docs/sources/jp-public-postal-sources-v1.json',
    required: true,
  },
  { from: 'extensions/addressql-postgres', to: 'extensions/addressql-postgres', required: true },
  { from: 'extensions/addressql-duckdb', to: 'extensions/addressql-duckdb', required: true },
  { from: 'native/addressql-core', to: 'native/addressql-core', required: true },
  { from: 'sdk/addressql-js-ts', to: 'sdk/addressql-js-ts', required: true },
  { from: 'sdk/addressql-py', to: 'sdk/addressql-py', required: true },
  { from: 'sdk/addressql-rs', to: 'sdk/addressql-rs', required: true },
  { from: 'integrations/addressql-calcite', to: 'integrations/addressql-calcite', required: true },
  { from: 'src/lib/addressQlGlobalCountryPreload.ts', to: 'src/lib/addressQlGlobalCountryPreload.ts', required: true },
  { from: 'src/lib/addressQlGlobalCountryPreload.test.ts', to: 'src/lib/addressQlGlobalCountryPreload.test.ts', required: true },
  { from: 'src/lib/addressQlGlobalCountryCoverage.ts', to: 'src/lib/addressQlGlobalCountryCoverage.ts', required: true },
  { from: 'src/lib/addressQlGlobalCountryCoverage.test.ts', to: 'src/lib/addressQlGlobalCountryCoverage.test.ts', required: true },
  { from: 'src/lib/addressQlCountryDataPromotion.ts', to: 'src/lib/addressQlCountryDataPromotion.ts', required: true },
  { from: 'src/lib/addressQlCountryDataPromotion.test.ts', to: 'src/lib/addressQlCountryDataPromotion.test.ts', required: true },
  { from: 'src/lib/addressQlMultilingualQuality.ts', to: 'src/lib/addressQlMultilingualQuality.ts', required: true },
  { from: 'src/lib/addressQlMultilingualQuality.test.ts', to: 'src/lib/addressQlMultilingualQuality.test.ts', required: true },
  { from: 'src/lib/addressQlOfficialPlaceNames.ts', to: 'src/lib/addressQlOfficialPlaceNames.ts', required: true },
  { from: 'src/lib/addressQlOfficialPlaceNames.test.ts', to: 'src/lib/addressQlOfficialPlaceNames.test.ts', required: true },
  { from: 'src/lib/addressQlAddressMorphismCompatibility.ts', to: 'src/lib/addressQlAddressMorphismCompatibility.ts', required: true },
  { from: 'src/lib/addressQlAddressMorphismCompatibility.test.ts', to: 'src/lib/addressQlAddressMorphismCompatibility.test.ts', required: true },
  { from: 'src/lib/countryGeographicMetadataEvaluationCatalog.ts', to: 'src/lib/countryGeographicMetadataEvaluationCatalog.ts', required: true },
  { from: 'src/lib/countryGeographicMetadataEvaluationIndex.ts', to: 'src/lib/countryGeographicMetadataEvaluationIndex.ts', required: true },
  { from: 'src/lib/countryValidationQualityGate.ts', to: 'src/lib/countryValidationQualityGate.ts', required: true },
  { from: 'src/lib/sha256.ts', to: 'src/lib/sha256.ts', required: true },
  { from: 'src/lib/addressQlPracticalApi.ts', to: 'src/lib/addressQlPracticalApi.ts', required: true },
  { from: 'src/lib/addressQlPracticalApi.test.ts', to: 'src/lib/addressQlPracticalApi.test.ts', required: true },
  { from: 'src/lib/addressQlRuntimeAdapter.ts', to: 'src/lib/addressQlRuntimeAdapter.ts', required: true },
  { from: 'src/lib/addressQlRuntimeAdapter.test.ts', to: 'src/lib/addressQlRuntimeAdapter.test.ts', required: true },
  { from: 'src/lib/addressQlPostalSetAdapter.ts', to: 'src/lib/addressQlPostalSetAdapter.ts', required: true },
  { from: 'src/lib/addressQlPostalSetAdapter.test.ts', to: 'src/lib/addressQlPostalSetAdapter.test.ts', required: true },
  { from: 'src/lib/addressQlRuntimeConfig.ts', to: 'src/lib/addressQlRuntimeConfig.ts', required: true },
  { from: 'src/lib/addressQlRuntimeConfig.test.ts', to: 'src/lib/addressQlRuntimeConfig.test.ts', required: true },
  { from: 'src/lib/addressQlRuntimeAttestationWorkflow.ts', to: 'src/lib/addressQlRuntimeAttestationWorkflow.ts', required: true },
  { from: 'src/lib/addressQlRuntimeAttestationWorkflow.test.ts', to: 'src/lib/addressQlRuntimeAttestationWorkflow.test.ts', required: true },
  { from: 'src/lib/addressQlTrustPolicy.ts', to: 'src/lib/addressQlTrustPolicy.ts', required: true },
  { from: 'src/lib/addressQlRuntimeReleaseLedger.ts', to: 'src/lib/addressQlRuntimeReleaseLedger.ts', required: true },
  { from: 'src/lib/addressQlRuntimeReleaseLedger.test.ts', to: 'src/lib/addressQlRuntimeReleaseLedger.test.ts', required: true },
  { from: 'src/lib/addressQlDeliveryPointDecision.ts', to: 'src/lib/addressQlDeliveryPointDecision.ts', required: true },
  { from: 'src/lib/addressQlDeliveryPointDecision.test.ts', to: 'src/lib/addressQlDeliveryPointDecision.test.ts', required: true },
  { from: 'src/lib/addressQlPostalOperations.ts', to: 'src/lib/addressQlPostalOperations.ts', required: true },
  { from: 'src/lib/addressQlPostalOperations.test.ts', to: 'src/lib/addressQlPostalOperations.test.ts', required: true },
  { from: 'src/lib/addressQlPublicPostalData.ts', to: 'src/lib/addressQlPublicPostalData.ts', required: true },
  { from: 'src/lib/addressQlPublicPostalData.test.ts', to: 'src/lib/addressQlPublicPostalData.test.ts', required: true },
  { from: 'src/lib/addressQlOfficialPostalData.ts', to: 'src/lib/addressQlOfficialPostalData.ts', required: true },
  { from: 'src/lib/addressQlOfficialPostalData.test.ts', to: 'src/lib/addressQlOfficialPostalData.test.ts', required: true },
  { from: 'src/lib/officialPostalSourceCatalog.ts', to: 'src/lib/officialPostalSourceCatalog.ts', required: true },
  { from: 'src/data/address_formats', to: 'src/data/address_formats', required: true },
  { from: 'data/postal_country_packs', to: 'data/postal_country_packs', required: true },
  { from: 'scripts/verify-addressql-postal-negative-claims.ts', to: 'scripts/verify-addressql-postal-negative-claims.ts', required: true },
  { from: 'scripts/verify-addressql-duckdb-cli.ts', to: 'scripts/verify-addressql-duckdb-cli.ts', required: true },
  { from: 'scripts/verify-addressql-oss-readiness.ts', to: 'scripts/verify-addressql-oss-readiness.ts', required: true },
  { from: 'scripts/verify-addressql-runtime-config.ts', to: 'scripts/verify-addressql-runtime-config.ts', required: true },
  { from: 'scripts/sync-addressql-public-postal-data.ts', to: 'scripts/sync-addressql-public-postal-data.ts', required: true },
  { from: 'scripts/sync-addressql-official-postal-data.ts', to: 'scripts/sync-addressql-official-postal-data.ts', required: true },
  { from: 'scripts/register-addressql-trusted-public-key.ts', to: 'scripts/register-addressql-trusted-public-key.ts', required: true },
  { from: 'scripts/register-addressql-trusted-public-key.test.ts', to: 'scripts/register-addressql-trusted-public-key.test.ts', required: true },
  { from: 'scripts/prepare-addressql-runtime-attestation.ts', to: 'scripts/prepare-addressql-runtime-attestation.ts', required: true },
  { from: 'scripts/finalize-addressql-runtime-attestation.ts', to: 'scripts/finalize-addressql-runtime-attestation.ts', required: true },
  { from: 'scripts/register-addressql-reviewer-key.ts', to: 'scripts/register-addressql-reviewer-key.ts', required: true },
  { from: 'scripts/revoke-addressql-reviewer-key.ts', to: 'scripts/revoke-addressql-reviewer-key.ts', required: true },
  { from: 'scripts/prepare-addressql-runtime-release.ts', to: 'scripts/prepare-addressql-runtime-release.ts', required: true },
  { from: 'scripts/finalize-addressql-runtime-release.ts', to: 'scripts/finalize-addressql-runtime-release.ts', required: true },
  { from: 'scripts/verify-addressql-runtime-release.ts', to: 'scripts/verify-addressql-runtime-release.ts', required: true },
  { from: 'scripts/prepare-addressql-l5-carrier-assertion.ts', to: 'scripts/prepare-addressql-l5-carrier-assertion.ts', required: true },
  { from: 'scripts/finalize-addressql-l5-carrier-assertion.ts', to: 'scripts/finalize-addressql-l5-carrier-assertion.ts', required: true },
  { from: 'scripts/verify-addressql-l5-delivery-point.ts', to: 'scripts/verify-addressql-l5-delivery-point.ts', required: true },
  { from: 'scripts/monitor-addressql-postal-operations.ts', to: 'scripts/monitor-addressql-postal-operations.ts', required: true },
  { from: 'scripts/monitor-addressql-postal-operations.test.ts', to: 'scripts/monitor-addressql-postal-operations.test.ts', required: true },
  { from: 'scripts/run-addressql-api.ts', to: 'scripts/run-addressql-api.ts', required: true },
  { from: 'scripts/run-addressql-api.test.ts', to: 'scripts/run-addressql-api.test.ts', required: true },
  { from: '.github/workflows/addressql-duckdb-cli.yml', to: '.github/workflows/addressql-duckdb-cli.yml', required: true },
];

export function evaluateAddressQlRepositoryExportGate(root = process.cwd()): AddressQlRepositoryExportGate {
  const outDir = join(root, 'dist', 'addressql-repository');
  const missing = ADDRESSQL_EXPORT_ITEMS.filter(item => item.required && !existsSync(join(root, item.from)));
  if (missing.length) return { ok: false, failure: { status: 'failed', missing } };

  const readiness = buildAddressQlOssReadinessReport(root);
  if (!readiness.ready) {
    return {
      ok: false,
      failure: {
        status: 'failed',
        reason: 'addressql-oss-readiness-failed',
        score: readiness.score,
        errors: readiness.errors,
        warnings: readiness.warnings,
      },
    };
  }

  return { ok: true, outDir, readiness };
}

export function buildAddressQlRepositoryExportCheckSnapshot(root = process.cwd()): AddressQlRepositoryExportCheckSnapshot {
  const gate = evaluateAddressQlRepositoryExportGate(root);
  if (gate.ok === false) throw new Error(JSON.stringify(gate.failure));

  return {
    status: 'ok',
    mode: 'check',
    outDir: gate.outDir,
    files: ADDRESSQL_EXPORT_ITEMS.length + 1,
    readiness: {
      version: gate.readiness.version,
      score: gate.readiness.score,
      target: gate.readiness.target,
      verifiedPaths: gate.readiness.verifiedPaths,
    },
    included: ADDRESSQL_EXPORT_ITEMS.map(item => item.to),
  };
}

export function writeAddressQlRepositoryExport(root = process.cwd()) {
  const gate = evaluateAddressQlRepositoryExportGate(root);
  if (gate.ok === false) throw new Error(JSON.stringify(gate.failure));

  rmSync(gate.outDir, { recursive: true, force: true });
  mkdirSync(gate.outDir, { recursive: true });

  for (const item of ADDRESSQL_EXPORT_ITEMS) {
    const from = join(root, item.from);
    if (!existsSync(from)) continue;
    const to = join(gate.outDir, item.to);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  }

  writeFileSync(join(gate.outDir, 'repository-manifest.json'), JSON.stringify({
    repository: 'addressql',
    owner: 'dawnportinfo-design',
    generatedAt: new Date().toISOString(),
    sourceWorkspace: 'Address-Grid-ID',
    exportBoundary: 'Open-source AddressQL only; no commercial hosted registry, managed proof service, production credentials, or private address data.',
    readiness: {
      version: gate.readiness.version,
      score: gate.readiness.score,
      target: gate.readiness.target,
      verifiedPaths: gate.readiness.verifiedPaths,
    },
    included: ADDRESSQL_EXPORT_ITEMS.map(item => item.to),
    verification: [
      'npm run verify:addressql',
      'npm run verify:addressql-oss',
      'npm run verify:addressql-export',
      'npm run verify:addressql-duckdb:cli -- --require-cli',
      'npm run verify:addressql-core:cargo',
      'npm run verify:addressql-postal-operations',
    ],
    nonClaims: [
      'This export contains synthetic fixtures and source metadata, not complete global postal data.',
      'Postal validation is separate from address identity, carrier deliverability, and ZK proof soundness.',
    ],
  }, null, 2));

  return {
    status: 'ok' as const,
    outDir: gate.outDir,
    files: ADDRESSQL_EXPORT_ITEMS.length + 1,
  };
}

export function runAddressQlRepositoryExportCli(argv = process.argv.slice(2), root = process.cwd()): number {
  const args = new Set(argv);
  const checkOnly = args.has('--check') || args.has('--dry-run');

  const gate = evaluateAddressQlRepositoryExportGate(root);
  if (gate.ok === false) {
    console.error(JSON.stringify(gate.failure, null, 2));
    return 1;
  }

  const output = checkOnly
    ? buildAddressQlRepositoryExportCheckSnapshot(root)
    : writeAddressQlRepositoryExport(root);
  console.log(JSON.stringify(output, null, 2));
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = runAddressQlRepositoryExportCli();
}
