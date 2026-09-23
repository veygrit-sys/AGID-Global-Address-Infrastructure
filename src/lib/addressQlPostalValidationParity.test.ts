import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_POSTAL_VALIDATION_PARITY_VERSION,
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE,
  POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA,
  POSTAL_VALIDATION_PARITY_ADAPTERS,
  POSTAL_VALIDATION_RUNTIME_SLO_NON_CLAIM,
  POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS,
  POSTAL_VALIDATION_RESULT_RECOMMENDED_FIELDS,
  POSTAL_VALIDATION_RESULT_REQUIRED_FIELDS,
  POSTAL_VALIDATION_RESULT_SCHEMA,
  type PostalValidationNegativeClaimsFixture,
  validatePostalValidationParityRegistry,
  validatePostalValidationNegativeClaimsFixture,
} from './addressQlPostalValidationParity';

type NegativeClaimCase = {
  id: string;
  blocked_claim: string;
  required_boundary: (typeof POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS)[number];
  safe_replacement: string;
  expected_status: 'blocked';
};

type NegativeClaimsSchema = {
  $id: string;
  required: string[];
  properties: {
    fixture_id: { const: string };
    status: { const: string };
    privacy: {
      required: string[];
      properties: {
        contains_raw_address: { const: false };
        synthetic_only: { const: true };
        production_traffic: { const: false };
      };
    };
    cases: {
      minItems: number;
      items: {
        additionalProperties: false;
        required: string[];
        properties: {
          required_boundary: { enum: string[] };
          expected_status: { const: 'blocked' };
          safe_replacement: { pattern: string };
        };
      };
    };
  };
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('PostalValidationResult parity registry validates required adapter coverage', () => {
  assert.equal(ADDRESSQL_POSTAL_VALIDATION_PARITY_VERSION, 'addressql-postal-validation-parity-v0.1');
  assert.deepEqual(validatePostalValidationParityRegistry(), []);
  assert.deepEqual(
    POSTAL_VALIDATION_PARITY_ADAPTERS.map(adapter => adapter.adapter),
    ['postgres-jsonb', 'duckdb-struct', 'sql-fixture-json'],
  );
});

test('parity required fields match AddressValidationResult v0.1 schema required fields', () => {
  const schema = JSON.parse(readFileSync(POSTAL_VALIDATION_RESULT_SCHEMA, 'utf8')) as { required: string[] };

  assert.deepEqual(schema.required, [...POSTAL_VALIDATION_RESULT_REQUIRED_FIELDS]);
  assert.ok(POSTAL_VALIDATION_RESULT_RECOMMENDED_FIELDS.includes('field_results'));
  assert.ok(POSTAL_VALIDATION_RESULT_RECOMMENDED_FIELDS.includes('valid'));
});

test('PostgreSQL, DuckDB, and SQL fixture artifacts expose the required parity fields', () => {
  for (const adapter of POSTAL_VALIDATION_PARITY_ADAPTERS) {
    assert.ok(existsSync(adapter.artifact), `${adapter.artifact} missing`);
    const artifact = readFileSync(adapter.artifact, 'utf8');

    for (const field of POSTAL_VALIDATION_RESULT_REQUIRED_FIELDS) {
      assert.match(artifact, adapter.requiredFieldPattern(field), `${adapter.adapter} missing ${field}`);
    }
    for (const boundary of POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS) {
      assert.match(artifact, adapter.boundaryPattern(boundary), `${adapter.adapter} missing ${boundary}`);
    }
    assert.match(artifact, adapter.privacyPattern, `${adapter.adapter} missing contains_raw_address=false boundary`);
    assert.match(artifact, adapter.nonClaimPattern, `${adapter.adapter} missing postal non-claim`);
    assert.match(artifact, adapter.runtimeSloNonClaimPattern, `${adapter.adapter} missing runtime SLO non-claim`);
  }
});

test('parity artifacts keep validation purpose separate from delivery and identity claims', () => {
  const postgres = readFileSync('extensions/addressql-postgres/sql/addressql--0.1.0.sql', 'utf8');
  const duckdb = readFileSync('extensions/addressql-duckdb/sql/addressql_duckdb_v0_3.sql', 'utf8');
  const fixtureSql = readFileSync('docs/specs/fixtures/addressql-return-shapes-v0.1.sql', 'utf8');

  assert.match(postgres, /postal_validation_does_not_evaluate_identity/);
  assert.match(duckdb, /postal_validation_does_not_evaluate_identity/);
  assert.match(duckdb, /addressql_postal_validate_json/);
  assert.match(duckdb, /to_json\(struct_pack/);
  assert.match(fixtureSql, /format_check_does_not_evaluate_identity/);
  assert.match(postgres, /does not prove delivery availability, residence, or recipient authorization/);
  assert.match(duckdb, /not proof of residence or carrier SLA/);
  assert.match(fixtureSql, /does not claim that the address exists/);
  assert.equal(
    POSTAL_VALIDATION_RUNTIME_SLO_NON_CLAIM,
    'Postal validation does not guarantee latency, availability, or a runtime service-level objective.',
  );
});

test('negative claim fixture maps unsafe validation claims to required boundaries', () => {
  const fixture = JSON.parse(readFileSync(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE, 'utf8')) as {
    fixture_id: string;
    status: string;
    privacy: {
      contains_raw_address: boolean;
      synthetic_only: boolean;
      production_traffic: boolean;
    };
    cases: NegativeClaimCase[];
  };

  assert.deepEqual(validatePostalValidationNegativeClaimsFixture(fixture), []);
  assert.equal(fixture.fixture_id, 'addressql-postal-validation-negative-claims-v0.1');
  assert.equal(fixture.status, 'synthetic-negative-fixture');
  assert.equal(fixture.privacy.contains_raw_address, false);
  assert.equal(fixture.privacy.synthetic_only, true);
  assert.equal(fixture.privacy.production_traffic, false);
  assert.deepEqual(
    fixture.cases.map(testCase => testCase.required_boundary),
    [...POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS],
  );

  for (const testCase of fixture.cases) {
    assert.equal(testCase.expected_status, 'blocked');
    assert.ok(testCase.blocked_claim.length > 12);
    assert.ok(testCase.safe_replacement.length > 12);
    assert.match(testCase.safe_replacement, /does not|must not/i);
  }
});

test('negative claim fixture validator rejects stale boundaries and live flags', () => {
  const fixture = JSON.parse(
    readFileSync(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE, 'utf8'),
  ) as PostalValidationNegativeClaimsFixture;
  const staleFixture: PostalValidationNegativeClaimsFixture = {
    ...fixture,
    privacy: {
      ...fixture.privacy,
      production_traffic: true,
    },
    cases: fixture.cases.map((testCase, index) => index === 0
      ? {
        ...testCase,
        required_boundary: 'format_pass_claims_existence' as typeof testCase.required_boundary,
        safe_replacement: 'A passing format check proves existence.',
      }
      : testCase),
  };

  const errors = validatePostalValidationNegativeClaimsFixture(staleFixture);

  assert.ok(errors.includes('privacy-production-traffic-must-be-false'));
  assert.ok(errors.includes('case-0:unknown-required-boundary:format_pass_claims_existence'));
  assert.ok(errors.includes('case-0:safe-replacement-missing-non-claim'));
  assert.ok(errors.includes('missing-boundary-case:format_pass_does_not_imply_existence'));
});

test('negative claim fixture is paired with an exportable JSON Schema', () => {
  const fixture = JSON.parse(readFileSync(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE, 'utf8')) as {
    fixture_id: string;
    status: string;
    privacy: {
      contains_raw_address: boolean;
      synthetic_only: boolean;
      production_traffic: boolean;
    };
    cases: NegativeClaimCase[];
  };
  const schema = JSON.parse(readFileSync(POSTAL_VALIDATION_NEGATIVE_CLAIMS_SCHEMA, 'utf8')) as NegativeClaimsSchema;

  assert.match(schema.$id, /addressql-postal-validation-negative-claims-v0\.1\.schema\.json$/);
  assert.deepEqual(schema.required, ['fixture_id', 'status', 'purpose', 'privacy', 'cases']);
  assert.equal(schema.properties.fixture_id.const, fixture.fixture_id);
  assert.equal(schema.properties.status.const, fixture.status);
  assert.deepEqual(schema.properties.privacy.required, [
    'contains_raw_address',
    'synthetic_only',
    'production_traffic',
  ]);
  assert.equal(schema.properties.privacy.properties.contains_raw_address.const, fixture.privacy.contains_raw_address);
  assert.equal(schema.properties.privacy.properties.synthetic_only.const, fixture.privacy.synthetic_only);
  assert.equal(schema.properties.privacy.properties.production_traffic.const, fixture.privacy.production_traffic);
  assert.equal(schema.properties.cases.items.additionalProperties, false);
  assert.deepEqual(schema.properties.cases.items.required, [
    'id',
    'blocked_claim',
    'required_boundary',
    'safe_replacement',
    'expected_status',
  ]);
  assert.deepEqual(schema.properties.cases.items.properties.required_boundary.enum, [
    ...POSTAL_VALIDATION_RESULT_BOUNDARY_FLAGS,
  ]);
  assert.equal(schema.properties.cases.items.properties.expected_status.const, 'blocked');
  assert.ok(fixture.cases.length >= schema.properties.cases.minItems);
});

test('parity adapters do not include blocked negative claim text', () => {
  const fixture = JSON.parse(readFileSync(POSTAL_VALIDATION_NEGATIVE_CLAIMS_FIXTURE, 'utf8')) as {
    cases: NegativeClaimCase[];
  };
  const adapterArtifacts = POSTAL_VALIDATION_PARITY_ADAPTERS
    .map(adapter => readFileSync(adapter.artifact, 'utf8'))
    .join('\n');

  for (const testCase of fixture.cases) {
    assert.doesNotMatch(
      adapterArtifacts,
      new RegExp(escapeRegExp(testCase.blocked_claim), 'i'),
      `${testCase.id} unsafe wording leaked into adapter artifacts`,
    );
  }
});

test('parity documentation names the adapters and residual representation boundary', () => {
  const doc = readFileSync('docs/addressql/postal-validation-parity-v0.1.md', 'utf8');

  assert.match(doc, /PostgreSQL JSONB/);
  assert.match(doc, /DuckDB STRUCT/);
  assert.match(doc, /SQL fixture JSON/);
  assert.match(doc, /AddressValidationResult v0\.1/);
  assert.match(doc, /STRUCT と区切り文字列/);
  assert.match(doc, /addressql_postal_validate_json/);
  assert.match(doc, /not a full JSON Schema validation target/);
  assert.match(doc, /delivery_pass_does_not_imply_identity/);
  assert.match(doc, /addressql-postal-validation-negative-claims-v0\.1\.json/);
  assert.match(doc, /addressql-postal-validation-negative-claims-v0\.1\.schema\.json/);
  assert.match(doc, /format-pass-claims-existence/);
  assert.match(doc, /Postal validation does not guarantee latency, availability, or a runtime service-level objective\./);
});
