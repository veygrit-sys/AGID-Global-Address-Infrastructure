import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';

export const ADDRESSQL_DUCKDB_ADAPTER_VERSION = 'addressql-duckdb-v0.3';

export type AddressQlDuckDbUseCase =
  | 'analytics'
  | 'local_validation'
  | 'research'
  | 'benchmarking'
  | 'fixture_audit';

export type AddressQlDuckDbOutputShape = 'scalar' | 'struct' | 'table' | 'view';

export type AddressQlDuckDbArtifact = {
  path: string;
  purpose: string;
  required: boolean;
};

export type AddressQlDuckDbFunction = {
  canonicalName: string;
  duckDbName: string;
  outputShape: AddressQlDuckDbOutputShape;
  useCases: AddressQlDuckDbUseCase[];
  fixtureCovered: boolean;
};

export type AddressQlDuckDbView = {
  name: string;
  purpose: string;
  useCases: AddressQlDuckDbUseCase[];
};

export const ADDRESSQL_DUCKDB_ARTIFACTS: AddressQlDuckDbArtifact[] = [
  {
    path: 'extensions/addressql-duckdb/README.md',
    purpose: 'DuckDB v0.3 scope, local-first run notes, and non-claims',
    required: true,
  },
  {
    path: 'extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql',
    purpose: 'DuckDB SQL macros, fixture views, and local validation reports',
    required: true,
  },
  {
    path: 'extensions/addressql-duckdb/fixtures/synthetic_country_profiles.csv',
    purpose: 'Synthetic country, language, and postal-status profiles',
    required: true,
  },
  {
    path: 'extensions/addressql-duckdb/fixtures/synthetic_postal_areas.csv',
    purpose: 'Synthetic postal-area centroids and AGID region references',
    required: true,
  },
  {
    path: 'extensions/addressql-duckdb/fixtures/synthetic_addresses.csv',
    purpose: 'Synthetic address validation fixture rows without private recipient data',
    required: true,
  },
  {
    path: 'extensions/addressql-duckdb/test/addressql_duckdb_smoke.sql',
    purpose: 'DuckDB smoke test for fixture loading and macro calls',
    required: true,
  },
];

export const ADDRESSQL_DUCKDB_FUNCTIONS: AddressQlDuckDbFunction[] = [
  { canonicalName: 'COUNTRY_RESOLVE', duckDbName: 'addressql_country_resolve', outputShape: 'table', useCases: ['analytics', 'local_validation', 'research'], fixtureCovered: true },
  { canonicalName: 'COUNTRY_ADDRESS_PROFILE', duckDbName: 'addressql_country_address_profile', outputShape: 'table', useCases: ['analytics', 'fixture_audit'], fixtureCovered: true },
  { canonicalName: 'POSTAL_STATUS', duckDbName: 'addressql_postal_status', outputShape: 'table', useCases: ['analytics', 'local_validation'], fixtureCovered: true },
  { canonicalName: 'POSTAL_NORMALIZE', duckDbName: 'addressql_postal_normalize', outputShape: 'scalar', useCases: ['local_validation'], fixtureCovered: true },
  { canonicalName: 'POSTAL_VALIDATE', duckDbName: 'addressql_postal_validate', outputShape: 'table', useCases: ['local_validation', 'fixture_audit'], fixtureCovered: true },
  { canonicalName: 'POSTAL_VALIDATE', duckDbName: 'addressql_postal_validate_json', outputShape: 'table', useCases: ['local_validation', 'fixture_audit'], fixtureCovered: true },
  { canonicalName: 'POSTAL_LOOKUP', duckDbName: 'addressql_postal_lookup', outputShape: 'table', useCases: ['analytics', 'fixture_audit'], fixtureCovered: true },
  { canonicalName: 'POSTAL_EQUIVALENT', duckDbName: 'addressql_postal_equivalent', outputShape: 'table', useCases: ['research', 'local_validation'], fixtureCovered: true },
  { canonicalName: 'ADDRESS_NORMALIZE', duckDbName: 'addressql_address_normalize', outputShape: 'struct', useCases: ['local_validation', 'benchmarking'], fixtureCovered: true },
  { canonicalName: 'ADDRESS_MATCH', duckDbName: 'addressql_address_match', outputShape: 'struct', useCases: ['benchmarking'], fixtureCovered: true },
  { canonicalName: 'ADDRESS_DISTANCE', duckDbName: 'addressql_distance_km', outputShape: 'scalar', useCases: ['analytics', 'research'], fixtureCovered: true },
  { canonicalName: 'DELIVERY_AVAILABLE', duckDbName: 'addressql_delivery_available', outputShape: 'table', useCases: ['local_validation', 'research'], fixtureCovered: true },
];

export const ADDRESSQL_DUCKDB_VIEWS: AddressQlDuckDbView[] = [
  {
    name: 'addressql_country_postal_summary',
    purpose: 'Summarizes postal status and fixture postal-area counts by country.',
    useCases: ['analytics', 'fixture_audit'],
  },
  {
    name: 'addressql_fixture_validation_report',
    purpose: 'Flags country and postal-area coverage in synthetic validation rows.',
    useCases: ['local_validation', 'fixture_audit'],
  },
  {
    name: 'addressql_postal_gap_report',
    purpose: 'Classifies no-postal, weak-postal, and missing-fixture gaps for research planning.',
    useCases: ['analytics', 'research'],
  },
];

export function buildAddressQlDuckDbUseCaseCoverage(): Record<AddressQlDuckDbUseCase, number> {
  const coverage: Record<AddressQlDuckDbUseCase, number> = {
    analytics: 0,
    local_validation: 0,
    research: 0,
    benchmarking: 0,
    fixture_audit: 0,
  };

  for (const fn of ADDRESSQL_DUCKDB_FUNCTIONS) {
    for (const useCase of fn.useCases) coverage[useCase] += 1;
  }
  for (const view of ADDRESSQL_DUCKDB_VIEWS) {
    for (const useCase of view.useCases) coverage[useCase] += 1;
  }

  return coverage;
}

export function validateAddressQlDuckDbAdapterPlan(): string[] {
  const errors: string[] = [];
  const canonicalNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  const duckDbNames = new Set<string>();
  const coverage = buildAddressQlDuckDbUseCaseCoverage();

  for (const artifact of ADDRESSQL_DUCKDB_ARTIFACTS) {
    if (artifact.required && !artifact.path.startsWith('extensions/addressql-duckdb/')) {
      errors.push(`${artifact.path}: DuckDB artifacts must stay under extensions/addressql-duckdb`);
    }
  }

  for (const fn of ADDRESSQL_DUCKDB_FUNCTIONS) {
    if (!canonicalNames.has(fn.canonicalName)) {
      errors.push(`${fn.canonicalName}: missing canonical AddressQL registry function`);
    }
    if (duckDbNames.has(fn.duckDbName)) errors.push(`duplicate DuckDB function: ${fn.duckDbName}`);
    duckDbNames.add(fn.duckDbName);
    if (!fn.duckDbName.startsWith('addressql_')) errors.push(`${fn.duckDbName}: DuckDB functions must use addressql_ prefix`);
    if (!fn.fixtureCovered) errors.push(`${fn.duckDbName}: missing synthetic fixture coverage`);
  }

  for (const requiredUseCase of ['analytics', 'local_validation', 'research', 'fixture_audit'] as const) {
    if (coverage[requiredUseCase] < 2) errors.push(`DuckDB v0.3 needs stronger ${requiredUseCase} coverage`);
  }
  if (!ADDRESSQL_DUCKDB_VIEWS.some(view => view.name === 'addressql_postal_gap_report')) {
    errors.push('DuckDB v0.3 needs a postal gap report view');
  }

  return errors;
}
