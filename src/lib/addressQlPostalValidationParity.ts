export const ADDRESSQL_POSTAL_VALIDATION_PARITY_VERSION =
  'addressql-postal-validation-parity-v0.1';

export const POSTAL_VALIDATION_RESULT_SCHEMA =
  'docs/specs/schemas/address-validation-result-v0.1.schema.json';

export const POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE =
  'docs/specs/fixtures/addressql-postal-validation-negative-claims-v0.1.json';

export const POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA =
  'docs/specs/schemas/addressql-postal-validation-negative-claims-v0.1.schema.json';

export const POSTAL_VALIDATION_RUNTIME_SLO_NON_CLAIM =
  'Postal validation does not guarantee latency, availability, or a runtime service-level objective.';

export const POSTAL_VALIDATION_RESULT_REQUIRED_FIELDS = [
  'version',
  'purpose',
  'status',
  'confidence',
  'source_refs',
  'result_boundaries',
  'privacy',
  'non_claims',
] as const;

export const POSTAL_VALIDATION_RESULT_RECOMMENDED_FIELDS = [
  'field_results',
  'warnings',
  'valid',
] as const;

export const POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS = [
  'format_pass_does_not_imply_existence',
  'existence_pass_does_not_imply_delivery',
  'delivery_pass_does_not_imply_identity',
  'identity_pass_does_not_disclose_full_address',
] as const;

export type PostalValidationNegativeClaimCase = {
  id: string;
  blocked_claim: string;
  required_boundary: (typeof POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS)[number];
  safe_replacement: string;
  expected_status: 'blocked';
};

export type PostalValidationNegativeClaimsFixture = {
  fixture_id: string;
  status: string;
  purpose: string;
  privacy: {
    contains_raw_address: boolean;
    synthetic_only: boolean;
    production_traffic: boolean;
  };
  cases: PostalValidationNegativeClaimCase[];
};

export type PostalValidationParityAdapter = {
  adapter: 'postgres-jsonb' | 'duckdb-struct' | 'sql-fixture-json';
  artifact: string;
  representation: string;
  requiredFieldPattern: (field: string) => RegExp;
  boundaryPattern: (boundary: string) => RegExp;
  privacyPattern: RegExp;
  nonClaimPattern: RegExp;
  runtimeSloNonClaimPattern: RegExp;
};

export const POSTAL_VALIDATION_PARITY_ADAPTERS: PostalValidationParityAdapter[] = [
  {
    adapter: 'postgres-jsonb',
    artifact: 'extensions/addressql-postgres/sql/addressql--0.1.0.sql',
    representation: 'jsonb_build_object',
    requiredFieldPattern: field => new RegExp(`'${field}'\\s*,`, 'm'),
    boundaryPattern: boundary => new RegExp(`'${boundary}'\\s*,\\s*true`, 'm'),
    privacyPattern: /'contains_raw_address'\s*,\s*false/,
    nonClaimPattern: /Postal validity is not full address identity/,
    runtimeSloNonClaimPattern: /Postal validation does not guarantee latency, availability, or a runtime service-level objective\./,
  },
  {
    adapter: 'duckdb-struct',
    artifact: 'extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql',
    representation: 'struct_pack',
    requiredFieldPattern: field => new RegExp(`${field}\\s*:=`, 'm'),
    boundaryPattern: boundary => new RegExp(`${boundary}=true`, 'm'),
    privacyPattern: /contains_raw_address=false/,
    nonClaimPattern: /postal validity is not full address identity/,
    runtimeSloNonClaimPattern: /Postal validation does not guarantee latency, availability, or a runtime service-level objective\./,
  },
  {
    adapter: 'sql-fixture-json',
    artifact: 'docs/specs/fixtures/addressql-return-shapes-v0.1.sql',
    representation: 'JSON literal in SQL fixture',
    requiredFieldPattern: field => new RegExp(`"${field}"\\s*:`, 'm'),
    boundaryPattern: boundary => new RegExp(`"${boundary}"\\s*:\\s*true`, 'm'),
    privacyPattern: /"contains_raw_address"\s*:\s*false/,
    nonClaimPattern: /does not claim that the address exists|not full address identity/i,
    runtimeSloNonClaimPattern: /Postal validation does not guarantee latency, availability, or a runtime service-level objective\./,
  },
];

export function validatePostalValidationParityRegistry(): string[] {
  const errors: string[] = [];
  const adapterIds = new Set(POSTAL_VALIDATION_PARITY_ADAPTERS.map(adapter => adapter.adapter));

  for (const required of ['postgres-jsonb', 'duckdb-struct', 'sql-fixture-json']) {
    if (!adapterIds.has(required as PostalValidationParityAdapter['adapter'])) {
      errors.push(`missing adapter parity entry: ${required}`);
    }
  }
  for (const adapter of POSTAL_VALIDATION_PARITY_ADAPTERS) {
    if (!adapter.artifact) errors.push(`${adapter.adapter}: missing artifact`);
    if (!adapter.representation) errors.push(`${adapter.adapter}: missing representation`);
    if (!adapter.runtimeSloNonClaimPattern) errors.push(`${adapter.adapter}: missing runtime SLO non-claim pattern`);
  }
  if (POSTAL_VALIDATION_RESULT_REQUIRED_FIELDS.length < 8) {
    errors.push('AddressValidationResult parity must keep the full v0.1 required field set');
  }
  if (!POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS.includes('delivery_pass_does_not_imply_identity')) {
    errors.push('identity/delivery non-claim boundary is required');
  }

  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validatePostalValidationNegativeClaimsFixture(input: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(input)) return ['negative-claims-fixture-must-be-object'];

  if (input.fixture_id !== 'addressql-postal-validation-negative-claims-v0.1') {
    errors.push('fixture-id-mismatch');
  }
  if (input.status !== 'synthetic-negative-fixture') errors.push('fixture-status-mismatch');
  if (typeof input.purpose !== 'string' || input.purpose.length === 0) errors.push('fixture-purpose-missing');

  const privacy = input.privacy;
  if (!isRecord(privacy)) {
    errors.push('privacy-missing');
  } else {
    if (privacy.contains_raw_address !== false) errors.push('privacy-contains-raw-address-must-be-false');
    if (privacy.synthetic_only !== true) errors.push('privacy-synthetic-only-must-be-true');
    if (privacy.production_traffic !== false) errors.push('privacy-production-traffic-must-be-false');
  }

  const cases = input.cases;
  if (!Array.isArray(cases)) {
    errors.push('cases-missing-array');
    return errors;
  }

  if (cases.length < POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS.length) {
    errors.push('cases-missing-required-boundary-count');
  }

  const expectedBoundaries = new Set<string>(POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS);
  const seenBoundaries = new Set<string>();
  cases.forEach((testCase, index) => {
    const prefix = `case-${index}`;
    if (!isRecord(testCase)) {
      errors.push(`${prefix}:must-be-object`);
      return;
    }

    if (typeof testCase.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(testCase.id)) {
      errors.push(`${prefix}:invalid-id`);
    }
    if (typeof testCase.blocked_claim !== 'string' || testCase.blocked_claim.length < 12) {
      errors.push(`${prefix}:blocked-claim-too-short`);
    }
    if (typeof testCase.required_boundary !== 'string' || !expectedBoundaries.has(testCase.required_boundary)) {
      errors.push(`${prefix}:unknown-required-boundary:${String(testCase.required_boundary)}`);
    } else {
      seenBoundaries.add(testCase.required_boundary);
    }
    if (typeof testCase.safe_replacement !== 'string' || !/(does not|must not)/i.test(testCase.safe_replacement)) {
      errors.push(`${prefix}:safe-replacement-missing-non-claim`);
    }
    if (testCase.expected_status !== 'blocked') errors.push(`${prefix}:expected-status-mismatch`);
  });

  for (const boundary of POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS) {
    if (!seenBoundaries.has(boundary)) errors.push(`missing-boundary-case:${boundary}`);
  }

  return errors;
}
