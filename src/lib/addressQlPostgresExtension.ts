import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';

export const ADDRESSQL_POSTGRES_EXTENSION_VERSION = 'addressql-postgres-v0.1';

export type AddressQlPostgresFunctionGroup =
  | 'structure'
  | 'country'
  | 'postal'
  | 'spatial_postgis'
  | 'delivery'
  | 'helper';

export type AddressQlPostgresFunction = {
  canonicalName: string;
  sqlName: string;
  group: AddressQlPostgresFunctionGroup;
  returns: 'jsonb' | 'boolean';
  requiresPostgis: boolean;
  fixtureCovered: boolean;
};

export type AddressQlPostgresArtifact = {
  path: string;
  purpose: string;
  required: boolean;
};

export const ADDRESSQL_POSTGRES_EXTENSION_ARTIFACTS: AddressQlPostgresArtifact[] = [
  {
    path: 'extensions/addressql-postgres/addressql.control',
    purpose: 'PostgreSQL extension control file',
    required: true,
  },
  {
    path: 'extensions/addressql-postgres/sql/addressql--0.1.0.sql',
    purpose: 'SQL/PLpgSQL JSONB function implementation',
    required: true,
  },
  {
    path: 'extensions/addressql-postgres/fixtures/synthetic_addressql_seed.sql',
    purpose: 'Synthetic country, postal, region, and address fixture data',
    required: true,
  },
  {
    path: 'extensions/addressql-postgres/test/addressql_smoke.sql',
    purpose: 'psql smoke tests for v0.1 function behavior',
    required: true,
  },
  {
    path: 'extensions/addressql-postgres/README.md',
    purpose: 'Install, scope, non-claims, and PostGIS notes',
    required: true,
  },
];

export const ADDRESSQL_POSTGRES_FUNCTIONS: AddressQlPostgresFunction[] = [
  { canonicalName: 'ADDRESS_PARSE', sqlName: 'addressql.address_parse', group: 'structure', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'ADDRESS_NORMALIZE', sqlName: 'addressql.address_normalize', group: 'structure', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'ADDRESS_MATCH', sqlName: 'addressql.address_match', group: 'structure', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'COUNTRY_RESOLVE', sqlName: 'addressql.country_resolve', group: 'country', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'COUNTRY_ADDRESS_PROFILE', sqlName: 'addressql.country_address_profile', group: 'country', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'COUNTRY_POSTAL_STATUS', sqlName: 'addressql.country_postal_status', group: 'country', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_STATUS', sqlName: 'addressql.postal_status', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_FORMAT', sqlName: 'addressql.postal_format', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_FORMAT_VALIDATE', sqlName: 'addressql.postal_format_validate', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_NORMALIZE', sqlName: 'addressql.postal_normalize', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_EXISTS', sqlName: 'addressql.postal_exists', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_REQUIRED', sqlName: 'addressql.postal_required', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_VALIDATE', sqlName: 'addressql.postal_validate', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_LOOKUP', sqlName: 'addressql.postal_lookup', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTAL_EQUIVALENT', sqlName: 'addressql.postal_equivalent', group: 'postal', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'ADDRESS_WITHIN', sqlName: 'addressql.address_within', group: 'spatial_postgis', returns: 'jsonb', requiresPostgis: true, fixtureCovered: true },
  { canonicalName: 'ADDRESS_DISTANCE', sqlName: 'addressql.address_distance', group: 'spatial_postgis', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'DELIVERY_AVAILABLE', sqlName: 'addressql.delivery_available', group: 'delivery', returns: 'jsonb', requiresPostgis: false, fixtureCovered: true },
  { canonicalName: 'POSTGIS_AVAILABLE', sqlName: 'addressql.postgis_available', group: 'helper', returns: 'boolean', requiresPostgis: false, fixtureCovered: true },
];

export function buildAddressQlPostgresCoverageByGroup(): Record<AddressQlPostgresFunctionGroup, number> {
  return ADDRESSQL_POSTGRES_FUNCTIONS.reduce(
    (coverage, item) => {
      coverage[item.group] += 1;
      return coverage;
    },
    {
      structure: 0,
      country: 0,
      postal: 0,
      spatial_postgis: 0,
      delivery: 0,
      helper: 0,
    } satisfies Record<AddressQlPostgresFunctionGroup, number>,
  );
}

export function validateAddressQlPostgresExtensionPlan(): string[] {
  const errors: string[] = [];
  const canonicalNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  const sqlNames = new Set<string>();
  const coverage = buildAddressQlPostgresCoverageByGroup();

  for (const artifact of ADDRESSQL_POSTGRES_EXTENSION_ARTIFACTS) {
    if (artifact.required && !artifact.path.startsWith('extensions/addressql-postgres/')) {
      errors.push(`${artifact.path}: artifact must stay under extensions/addressql-postgres`);
    }
  }

  for (const fn of ADDRESSQL_POSTGRES_FUNCTIONS) {
    if (sqlNames.has(fn.sqlName)) errors.push(`duplicate SQL function: ${fn.sqlName}`);
    sqlNames.add(fn.sqlName);
    const extensionOnlyPostalNames = new Set(['POSTAL_FORMAT_VALIDATE', 'POSTAL_EXISTS']);
    if (fn.canonicalName !== 'POSTGIS_AVAILABLE' && !extensionOnlyPostalNames.has(fn.canonicalName) && !canonicalNames.has(fn.canonicalName)) {
      errors.push(`${fn.canonicalName}: missing canonical AddressQL registry function`);
    }
    if (fn.returns !== 'jsonb' && fn.group !== 'helper') {
      errors.push(`${fn.sqlName}: non-helper functions must return jsonb`);
    }
    if (!fn.fixtureCovered) errors.push(`${fn.sqlName}: missing fixture coverage`);
  }

  if (coverage.structure < 3) errors.push('PostgreSQL v0.1 needs parse/normalize/match structure functions');
  if (coverage.country < 3) errors.push('PostgreSQL v0.1 needs country metadata functions');
  if (coverage.postal < 6) errors.push('PostgreSQL v0.1 needs postal function coverage');
  if (coverage.spatial_postgis < 2) errors.push('PostgreSQL v0.1 needs optional PostGIS functions');
  if (coverage.delivery < 1) errors.push('PostgreSQL v0.1 needs delivery availability');

  return errors;
}
