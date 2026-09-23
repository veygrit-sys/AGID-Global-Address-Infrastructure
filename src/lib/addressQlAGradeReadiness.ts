import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ADDRESSQL_SDK_ARTIFACTS,
  ADDRESSQL_SDK_FUNCTIONS,
  validateAddressQlApiSdkPlan,
} from './addressQlApiSdk';
import {
  ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS,
  ADDRESSQL_POSTAL_STATUS_POLICIES,
  validateAddressQlCountryPostalModel,
} from './addressQlCountryPostal';
import {
  ADDRESSQL_DUCKDB_ARTIFACTS,
  ADDRESSQL_DUCKDB_FUNCTIONS,
  ADDRESSQL_DUCKDB_VIEWS,
  validateAddressQlDuckDbAdapterPlan,
} from './addressQlDuckDbAdapter';
import {
  summarizeAddressQlGlobalCountryPreload,
  validateAddressQlGlobalCountryPreload,
} from './addressQlGlobalCountryPreload';
import { buildAddressQlOssReadinessReport } from './addressQlOssReadiness';
import {
  ADDRESSQL_POSTGRES_EXTENSION_ARTIFACTS,
  ADDRESSQL_POSTGRES_FUNCTIONS,
  validateAddressQlPostgresExtensionPlan,
} from './addressQlPostgresExtension';
import {
  ADDRESSQL_RUST_CORE_ADAPTER_CONTRACTS,
  ADDRESSQL_RUST_CORE_FUNCTIONS,
  ADDRESSQL_RUST_CORE_MODULES,
  validateAddressQlRustCorePlan,
} from './addressQlRustCore';
import {
  ADDRESSQL_PROOF_INPUT_SCHEMA,
  ADDRESSQL_VERIFIER_HOOKS,
  validateAddressQlZkProofHookPlan,
} from './addressQlZkProofHooks';

export const ADDRESSQL_A_GRADE_READINESS_VERSION = 'addressql-a-grade-readiness-v0.8';

export type AddressQlAGradeCriterionId =
  | 'postgres_real_function_surface'
  | 'rust_core_portable_kernel'
  | 'duckdb_research_and_cli_gate'
  | 'sdk_fixture_parity'
  | 'zk_hook_boundary'
  | 'global_country_postal_preload'
  | 'oss_publication_boundary'
  | 'release_verification_commands';

export type AddressQlAGrade = 'A' | 'B' | 'C' | 'D';

export type AddressQlAGradeCriterion = {
  id: AddressQlAGradeCriterionId;
  title: string;
  weight: number;
  score: number;
  passed: boolean;
  evidence: string[];
  errors: string[];
  warnings: string[];
  nextFix: string;
};

export type AddressQlAGradeReadinessReport = {
  version: typeof ADDRESSQL_A_GRADE_READINESS_VERSION;
  target: 'AddressQL A-grade implementation readiness';
  grade: AddressQlAGrade;
  score: number;
  readyForAGrade: boolean;
  criteria: AddressQlAGradeCriterion[];
  blockingGates: string[];
  recommendedCommands: string[];
  nonClaims: string[];
};

type PackageJson = {
  scripts?: Record<string, string>;
};

function readPackageScripts(root: string): Record<string, string> {
  const packagePath = join(root, 'package.json');
  if (!existsSync(packagePath)) return {};
  return (JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJson).scripts ?? {};
}

function pathExists(root: string, relativePath: string): boolean {
  return existsSync(join(root, relativePath));
}

function criterion(
  id: AddressQlAGradeCriterionId,
  title: string,
  weight: number,
  errors: string[],
  evidence: string[],
  nextFix: string,
  warnings: string[] = [],
): AddressQlAGradeCriterion {
  const passed = errors.length === 0;
  return {
    id,
    title,
    weight,
    score: passed ? weight : 0,
    passed,
    evidence,
    errors,
    warnings,
    nextFix,
  };
}

function gradeFor(score: number): AddressQlAGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 65) return 'C';
  return 'D';
}

function requireScripts(
  scripts: Record<string, string>,
  required: string[],
): string[] {
  return required
    .filter(script => !scripts[script])
    .map(script => `missing-package-script:${script}`);
}

export function buildAddressQlAGradeReadinessReport(root = process.cwd()): AddressQlAGradeReadinessReport {
  const scripts = readPackageScripts(root);
  const oss = buildAddressQlOssReadinessReport(root);
  const globalSummary = summarizeAddressQlGlobalCountryPreload(root);

  const postgresErrors = [
    ...validateAddressQlPostgresExtensionPlan(),
    ...ADDRESSQL_POSTGRES_EXTENSION_ARTIFACTS
      .filter(artifact => artifact.required && !pathExists(root, artifact.path))
      .map(artifact => `missing-postgres-artifact:${artifact.path}`),
  ];
  if (!ADDRESSQL_POSTGRES_FUNCTIONS.some(fn => fn.canonicalName === 'POSTAL_FORMAT_VALIDATE')) {
    postgresErrors.push('postgres-must-separate-postal-format-validation');
  }
  if (!ADDRESSQL_POSTGRES_FUNCTIONS.some(fn => fn.canonicalName === 'POSTAL_EXISTS')) {
    postgresErrors.push('postgres-must-separate-postal-existence-validation');
  }

  const rustCoreErrors = [
    ...validateAddressQlRustCorePlan(),
    ...ADDRESSQL_RUST_CORE_MODULES
      .filter(module => !pathExists(root, module.path))
      .map(module => `missing-rust-core-module:${module.path}`),
  ];
  for (const required of ['country_profile', 'postal_validate', 'postal_equivalent']) {
    if (!ADDRESSQL_RUST_CORE_FUNCTIONS.some(fn => fn.rustName === required)) {
      rustCoreErrors.push(`rust-core-missing:${required}`);
    }
  }
  if (!ADDRESSQL_RUST_CORE_ADAPTER_CONTRACTS.some(contract => contract.target === 'postgres_pgrx')) {
    rustCoreErrors.push('rust-core-missing-postgres-pgrx-contract');
  }

  const duckDbErrors = [
    ...validateAddressQlDuckDbAdapterPlan(),
    ...ADDRESSQL_DUCKDB_ARTIFACTS
      .filter(artifact => artifact.required && !pathExists(root, artifact.path))
      .map(artifact => `missing-duckdb-artifact:${artifact.path}`),
    ...requireScripts(scripts, ['verify:addressql-duckdb:cli']),
  ];
  if (!pathExists(root, '.github/workflows/addressql-duckdb-cli.yml')) {
    duckDbErrors.push('missing-duckdb-cli-ci-workflow');
  }
  if (!ADDRESSQL_DUCKDB_VIEWS.some(view => view.name === 'addressql_postal_gap_report')) {
    duckDbErrors.push('duckdb-missing-postal-gap-report');
  }

  const sdkErrors = [
    ...validateAddressQlApiSdkPlan(),
    ...ADDRESSQL_SDK_ARTIFACTS
      .filter(artifact => !pathExists(root, artifact.path))
      .map(artifact => `missing-sdk-artifact:${artifact.path}`),
    ...requireScripts(scripts, ['verify:addressql-sdk']),
  ];
  if (ADDRESSQL_SDK_FUNCTIONS.filter(fn => fn.nonClaimRequired).length < 7) {
    sdkErrors.push('sdk-needs-non-claim-covered-primary-functions');
  }

  const zkErrors = [
    ...validateAddressQlZkProofHookPlan(),
    ...requireScripts(scripts, ['verify:addressql-zk']),
  ];
  if (ADDRESSQL_VERIFIER_HOOKS.length < 2) zkErrors.push('zk-needs-schema-and-external-verifier-hooks');
  if (ADDRESSQL_PROOF_INPUT_SCHEMA.length < 15) zkErrors.push('zk-proof-input-schema-too-thin');

  const globalErrors = [
    ...validateAddressQlCountryPostalModel(),
    ...validateAddressQlGlobalCountryPreload(root),
  ];
  if (globalSummary.totalProfiles < 249) globalErrors.push('global-preload-too-small');
  if (globalSummary.noPostalCodeProfiles < 10) globalErrors.push('global-preload-needs-no-postal-code-coverage');
  if (ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS.length < 7) globalErrors.push('country-postal-workflows-too-thin');
  if (ADDRESSQL_POSTAL_STATUS_POLICIES.length < 5) globalErrors.push('postal-status-policy-coverage-too-thin');

  const ossErrors = [
    ...oss.errors,
    ...requireScripts(scripts, ['verify:addressql-oss', 'verify:addressql-export', 'export:addressql-repository']),
  ];
  if (oss.score < 95) ossErrors.push(`oss-readiness-score-too-low:${oss.score}`);
  if (!oss.verificationCommands.includes('npm run verify:addressql-export')) {
    ossErrors.push('oss-readiness-missing-export-check-command');
  }

  const releaseErrors = requireScripts(scripts, [
    'verify:addressql',
    'verify:addressql-postgres',
    'verify:addressql-core',
    'verify:addressql-core:cargo',
    'verify:addressql-duckdb',
    'verify:addressql-duckdb:cli',
    'verify:addressql-sdk',
    'verify:addressql-global-preload',
    'verify:addressql-runtime-config',
    'verify:addressql-zk',
    'verify:addressql-calcite',
    'verify:addressql-oss',
    'verify:addressql-export',
  ]);
  const fullVerify = scripts['verify:addressql'] ?? '';
  if (!fullVerify.includes('addressQlAGradeReadiness.test.ts')) {
    releaseErrors.push('full-addressql-verification-must-include-a-grade-readiness-test');
  }
  if (!pathExists(root, 'docs/addressql/a-grade-readiness-v0.8.md')) {
    releaseErrors.push('missing-a-grade-readiness-doc');
  }

  const criteria = [
    criterion(
      'postgres_real_function_surface',
      'PostgreSQL extension has real JSONB/PostGIS function surface',
      16,
      postgresErrors,
      [
        `${ADDRESSQL_POSTGRES_FUNCTIONS.length} PostgreSQL functions`,
        `${ADDRESSQL_POSTGRES_EXTENSION_ARTIFACTS.length} extension artifacts`,
        'postal format validation and existence validation are split',
      ],
      'Run npm run verify:addressql-postgres and add missing SQL, fixture, or smoke coverage.',
    ),
    criterion(
      'rust_core_portable_kernel',
      'Rust core is portable across DB, SDK, CLI, and WASM adapters',
      15,
      rustCoreErrors,
      [
        `${ADDRESSQL_RUST_CORE_FUNCTIONS.length} Rust core functions`,
        `${ADDRESSQL_RUST_CORE_ADAPTER_CONTRACTS.length} adapter contracts`,
        'country_profile, postal_validate, and postal_equivalent are explicit core functions',
      ],
      'Install cargo, run npm run verify:addressql-core:cargo, then move duplicated adapter logic into addressql-core.',
    ),
    criterion(
      'duckdb_research_and_cli_gate',
      'DuckDB research adapter has local fixtures, reports, and CLI CI gate',
      12,
      duckDbErrors,
      [
        `${ADDRESSQL_DUCKDB_FUNCTIONS.length} DuckDB macros/functions`,
        `${ADDRESSQL_DUCKDB_VIEWS.length} DuckDB report views`,
        'optional CLI workflow is tracked as a real release gate',
      ],
      'Install DuckDB CLI, run npm run verify:addressql-duckdb:cli -- --require-cli, and keep fixture reports deterministic.',
    ),
    criterion(
      'sdk_fixture_parity',
      'TypeScript, Python, and Rust SDK facades preserve fixture parity and non-claims',
      12,
      sdkErrors,
      [
        `${ADDRESSQL_SDK_ARTIFACTS.length} SDK packages`,
        `${ADDRESSQL_SDK_FUNCTIONS.length} SDK-bound functions`,
        'hosted API dependency is forbidden in OSS SDK plan',
      ],
      'Add fixture parity checks for every public SDK binding before adding hosted-service integrations.',
    ),
    criterion(
      'zk_hook_boundary',
      'ZK layer is proof-input/verifier-hook ready without claiming audited circuits',
      12,
      zkErrors,
      [
        `${ADDRESSQL_PROOF_INPUT_SCHEMA.length} proof input schema fields`,
        `${ADDRESSQL_VERIFIER_HOOKS.length} verifier hooks`,
        'schema acceptance remains separate from cryptographic verification',
      ],
      'Keep real circuits behind explicit external verifier hooks and add non-claim tests before any circuit work.',
    ),
    criterion(
      'global_country_postal_preload',
      'Global country/postal preload supports official, weak, and no-postal-code regimes',
      13,
      globalErrors,
      [
        `${globalSummary.totalProfiles} country/region profiles`,
        `${globalSummary.noPostalCodeProfiles} no-postal-code profiles`,
        `${globalSummary.weakPostalProfiles} weak/partial postal profiles`,
      ],
      'Replace generic fallback countries with official postal/government/open bulk sources while preserving postal-equivalent non-claims.',
    ),
    criterion(
      'oss_publication_boundary',
      'OSS publication boundary is ready for dawnportinfo-design/addressql',
      10,
      ossErrors,
      [
        `OSS readiness score ${oss.score}`,
        `${oss.verifiedPaths.length} verified public paths`,
        'export check exists before destructive dist export',
      ],
      'Run npm run verify:addressql-oss and npm run verify:addressql-export before creating the standalone repository.',
    ),
    criterion(
      'release_verification_commands',
      'Release verification commands cover adapters, SDK, ZK, export, and hard local gates',
      10,
      releaseErrors,
      [
        'verify:addressql aggregates the A-grade readiness test',
        'cargo and DuckDB CLI commands are declared as explicit hard gates',
        'signed runtime data configuration has a deterministic verification command',
        'AddressQL export has a write-free check mode',
        'A-grade readiness has a public documentation contract',
      ],
      'Keep verify:addressql as the lightweight umbrella and run cargo/DuckDB hard gates in environments with those tools installed.',
    ),
  ];

  const score = criteria.reduce((total, item) => total + item.score, 0);
  const blockingGates = criteria.flatMap(item => item.errors.map(error => `${item.id}:${error}`));

  return {
    version: ADDRESSQL_A_GRADE_READINESS_VERSION,
    target: 'AddressQL A-grade implementation readiness',
    grade: gradeFor(score),
    score,
    readyForAGrade: score >= 90 && blockingGates.length === 0,
    criteria,
    blockingGates,
    recommendedCommands: [
      'npm run verify:addressql',
      'npm run verify:addressql-a-grade',
      'npm run verify:addressql-runtime-config',
      'npm run verify:addressql-export',
      'npm run verify:addressql-core:cargo',
      'npm run verify:addressql-duckdb:cli -- --require-cli',
    ],
    nonClaims: [
      'A-grade readiness is an implementation and release-gate score, not proof of global address completeness.',
      'Postal validation remains separate from residence, identity, and carrier SLA claims.',
      'ZK readiness remains proof-input/verifier-hook readiness until real circuits are implemented and audited.',
      'Local cargo and DuckDB CLI hard gates require those tools to be installed in the execution environment.',
    ],
  };
}

export function validateAddressQlAGradeReadiness(root = process.cwd()): string[] {
  return buildAddressQlAGradeReadinessReport(root).blockingGates;
}
